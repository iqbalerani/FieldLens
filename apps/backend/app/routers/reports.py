from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from fpdf import FPDF
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Inspection
from app.schemas.auth import CurrentUserResponse

router = APIRouter(prefix="/reports", tags=["reports"])


def _pdf_safe(value: str | None, *, default: str = "N/A") -> str:
    text = (value or "").strip() or default
    text = text.translate(
        str.maketrans(
            {
                "\u2013": "-",
                "\u2014": "-",
                "\u2018": "'",
                "\u2019": "'",
                "\u201c": '"',
                "\u201d": '"',
                "\u2022": "-",
                "\u2026": "...",
            }
        )
    )
    return text.encode("latin-1", "replace").decode("latin-1")


def _build_pdf(inspection: Inspection) -> bytes:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_margins(20, 20, 20)

    # Header
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(20, 20, 20)
    pdf.cell(0, 10, "FieldLens Inspection Report", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(4)

    # Divider
    pdf.set_draw_color(200, 200, 200)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(6)

    # Metadata block
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(80, 80, 80)

    def kv(label: str, value: str) -> None:
        start_x = pdf.get_x()
        start_y = pdf.get_y()
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(45, 7, label + ":", new_x="RIGHT", new_y="TOP")
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(20, 20, 20)
        pdf.set_xy(start_x + 45, start_y)
        value_width = max(pdf.w - pdf.r_margin - pdf.get_x(), 40)
        pdf.multi_cell(value_width, 7, _pdf_safe(value), new_x="LMARGIN", new_y="NEXT")

    kv("Site", inspection.site_name)
    kv("Type", inspection.inspection_type)
    kv("Inspector", inspection.inspector_name)
    kv("Status", str(inspection.status.value).capitalize())
    kv("Created", inspection.created_at.strftime("%Y-%m-%d %H:%M UTC") if inspection.created_at else "N/A")
    if inspection.processed_at:
        kv("Processed", inspection.processed_at.strftime("%Y-%m-%d %H:%M UTC"))
    if inspection.latitude and inspection.longitude:
        kv("GPS", f"{inspection.latitude:.5f}, {inspection.longitude:.5f}")

    pdf.ln(6)
    pdf.set_draw_color(200, 200, 200)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(6)

    # AI Report
    report = inspection.report
    if report:
        overall = report.get("overall_status", "UNKNOWN")
        color = (220, 53, 69) if overall == "FAIL" else (255, 193, 7) if overall == "WARN" else (40, 167, 69)

        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*color)
        pdf.cell(0, 8, f"Overall Status: {overall}", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

        confidence = report.get("confidence_score", 0)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(0, 6, f"AI Confidence: {int(confidence * 100)}%", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

        summary = report.get("summary", "")
        if summary:
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(20, 20, 20)
            pdf.cell(0, 7, "Summary", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(60, 60, 60)
            pdf.multi_cell(0, 6, _pdf_safe(summary))
            pdf.ln(4)

        issues = report.get("issues", [])
        if issues:
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(20, 20, 20)
            pdf.cell(0, 7, f"Issues ({len(issues)})", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(2)
            severity_colors = {
                "CRITICAL": (220, 53, 69),
                "WARNING": (255, 140, 0),
                "INFO": (0, 123, 255),
            }
            for issue in issues:
                sev = issue.get("severity", "INFO")
                sc = severity_colors.get(sev, (60, 60, 60))
                pdf.set_font("Helvetica", "B", 10)
                pdf.set_text_color(*sc)
                pdf.cell(0, 7, _pdf_safe(f"[{sev}] {issue.get('title', '')}"), new_x="LMARGIN", new_y="NEXT")
                pdf.set_font("Helvetica", "", 9)
                pdf.set_text_color(60, 60, 60)
                pdf.multi_cell(0, 5, _pdf_safe(issue.get("description", "")))
                area = issue.get("affected_area", "")
                action = issue.get("suggested_action", "")
                if area:
                    pdf.set_font("Helvetica", "I", 9)
                    pdf.cell(0, 5, _pdf_safe(f"Area: {area}"), new_x="LMARGIN", new_y="NEXT")
                if action:
                    pdf.cell(0, 5, _pdf_safe(f"Action: {action}"), new_x="LMARGIN", new_y="NEXT")
                pdf.ln(3)

        recommendations = report.get("recommendations", [])
        if recommendations:
            pdf.ln(2)
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(20, 20, 20)
            pdf.cell(0, 7, "Recommendations", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(60, 60, 60)
            for rec in recommendations:
                pdf.multi_cell(0, 6, _pdf_safe(f"- {rec}"))
            pdf.ln(2)

        comparison = report.get("comparison_with_prior", "")
        if comparison:
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(20, 20, 20)
            pdf.cell(0, 7, "Comparison with Prior Inspections", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(60, 60, 60)
            pdf.multi_cell(0, 6, _pdf_safe(comparison))
            pdf.ln(2)
    else:
        pdf.set_font("Helvetica", "I", 10)
        pdf.set_text_color(120, 120, 120)
        pdf.cell(0, 8, "Report not yet generated. Submit the inspection to trigger AI processing.", new_x="LMARGIN", new_y="NEXT")

    # Voice transcript
    transcript = inspection.transcript
    if transcript and transcript.transcript_text:
        pdf.ln(4)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(20, 20, 20)
        pdf.cell(0, 7, "Voice Transcript", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(60, 60, 60)
        pdf.multi_cell(0, 6, _pdf_safe(transcript.transcript_text))

    # Footer
    pdf.ln(8)
    pdf.set_draw_color(200, 200, 200)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(0, 5, f"Generated by FieldLens AI  |  Inspection ID: {inspection.id}", align="C")

    buffer = BytesIO()
    pdf.output(buffer)
    return buffer.getvalue()


@router.get("/{inspection_id}/pdf")
async def export_pdf(
    inspection_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> StreamingResponse:
    result = await session.execute(
        select(Inspection)
        .options(
            selectinload(Inspection.media),
            selectinload(Inspection.issues),
            selectinload(Inspection.transcript),
        )
        .where(Inspection.id == inspection_id, Inspection.org_id == current_user.org_id)
    )
    inspection = result.scalar_one_or_none()
    if inspection is None:
        raise HTTPException(status_code=404, detail="Inspection not found")

    pdf_bytes = _build_pdf(inspection)
    filename = f"fieldlens-report-{inspection_id[:8]}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
