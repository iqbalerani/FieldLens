import os
from pathlib import Path
import sys

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_fieldlens.db"
os.environ["AUTH_MODE"] = "demo"
os.environ["AI_MODE"] = "mock"
sys.path.append(str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app.main import app


def auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer demo-inspector"}


# ──────────────────────────────────────────────
# Health
# ──────────────────────────────────────────────

def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


# ──────────────────────────────────────────────
# Auth
# ──────────────────────────────────────────────

def test_auth_me() -> None:
    with TestClient(app) as client:
        response = client.get("/auth/me", headers=auth_headers())
        assert response.status_code == 200
        body = response.json()
        assert "id" in body
        assert "orgId" in body
        assert body["role"] == "INSPECTOR"


def test_auth_me_unauthenticated() -> None:
    with TestClient(app) as client:
        response = client.get("/auth/me")
        assert response.status_code == 401


# ──────────────────────────────────────────────
# Inspection lifecycle
# ──────────────────────────────────────────────

def test_inspection_lifecycle() -> None:
    with TestClient(app) as client:
        create_response = client.post(
            "/inspections",
            headers=auth_headers(),
            json={
                "siteName": "Warehouse North",
                "inspectionType": "Warehouse",
                "inspectorName": "Indigo Inspector",
                "textNotes": "Missing signage near bay 3.",
                "requestedMedia": [],
            },
        )
        assert create_response.status_code == 200
        inspection_id = create_response.json()["inspectionId"]

        complete_response = client.post(
            f"/inspections/{inspection_id}/media/complete",
            headers=auth_headers(),
            json={
                "media": [],
                "voiceTranscript": "There are visible cracks and missing signage near the loading area.",
            },
        )
        assert complete_response.status_code == 200
        assert complete_response.json()["status"] == "submitted"

        submit_response = client.post(f"/inspections/{inspection_id}/submit", headers=auth_headers())
        assert submit_response.status_code == 200

        detail_response = client.get(f"/inspections/{inspection_id}", headers=auth_headers())
        assert detail_response.status_code == 200
        payload = detail_response.json()
        assert payload["siteName"] == "Warehouse North"
        assert payload["voiceTranscript"]


def test_list_inspections_pagination() -> None:
    with TestClient(app) as client:
        response = client.get("/inspections?limit=5&offset=0", headers=auth_headers())
        assert response.status_code == 200
        assert isinstance(response.json(), list)


def test_list_inspections_status_filter() -> None:
    with TestClient(app) as client:
        response = client.get("/inspections?status=complete", headers=auth_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for item in data:
            assert item["status"] == "complete"


def test_inspection_not_found() -> None:
    with TestClient(app) as client:
        response = client.get("/inspections/nonexistent-id-000", headers=auth_headers())
        assert response.status_code == 404


# ──────────────────────────────────────────────
# Search
# ──────────────────────────────────────────────

def test_search() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/search",
            headers=auth_headers(),
            json={"query": "warehouse cracks signage"},
        )
        assert response.status_code == 200
        results = response.json()
        assert isinstance(results, list)
        for result in results:
            assert "inspection" in result
            assert "similarityScore" in result


def test_search_empty_query() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/search",
            headers=auth_headers(),
            json={"query": ""},
        )
        assert response.status_code == 200


# ──────────────────────────────────────────────
# Analytics
# ──────────────────────────────────────────────

def test_analytics_trends() -> None:
    with TestClient(app) as client:
        response = client.get("/analytics/trends", headers=auth_headers())
        assert response.status_code == 200
        trends = response.json()
        assert isinstance(trends, list)
        for point in trends:
            assert "date" in point
            assert "totalInspections" in point
            assert "criticalIssues" in point
            assert "warningIssues" in point


# ──────────────────────────────────────────────
# PDF report
# ──────────────────────────────────────────────

def test_pdf_report_not_found() -> None:
    with TestClient(app) as client:
        response = client.get("/reports/nonexistent-id/pdf", headers=auth_headers())
        assert response.status_code == 404


def test_pdf_report_generates() -> None:
    with TestClient(app) as client:
        # Create + submit a complete inspection first
        create = client.post(
            "/inspections",
            headers=auth_headers(),
            json={
                "siteName": "PDF Test Site",
                "inspectionType": "Construction",
                "inspectorName": "PDF Inspector",
                "textNotes": "Test notes for PDF.",
                "requestedMedia": [],
            },
        )
        assert create.status_code == 200
        iid = create.json()["inspectionId"]

        client.post(f"/inspections/{iid}/media/complete", headers=auth_headers(), json={"media": [], "voiceTranscript": "all clear"})
        client.post(f"/inspections/{iid}/submit", headers=auth_headers())

        pdf_response = client.get(f"/reports/{iid}/pdf", headers=auth_headers())
        assert pdf_response.status_code == 200
        assert pdf_response.headers["content-type"] == "application/pdf"
        assert len(pdf_response.content) > 1000  # non-empty PDF


# ──────────────────────────────────────────────
# Voice WebSocket
# ──────────────────────────────────────────────

def test_voice_websocket_echo() -> None:
    with TestClient(app) as client:
        with client.websocket_connect("/ws/voice/test-session-1") as ws:
            ws.send_json({"text": "hello", "final": False})
            msg = ws.receive_json()
            assert msg["type"] == "partial_transcript"
            assert "hello" in msg["text"]

            ws.send_json({"text": "world", "final": True})
            # drain partial
            ws.receive_json()
            final_msg = ws.receive_json()
            assert final_msg["type"] == "final_transcript"
            assert "hello" in final_msg["text"]
            assert "world" in final_msg["text"]


# ──────────────────────────────────────────────
# SSE stream
# ──────────────────────────────────────────────

def test_sse_stream_connects() -> None:
    with TestClient(app) as client:
        # Fetch the org_id from /auth/me first
        me = client.get("/auth/me", headers=auth_headers()).json()
        org_id = me["orgId"]
        with client.stream("GET", f"/stream/inspections/{org_id}", headers=auth_headers()) as response:
            assert response.status_code == 200
            assert "text/event-stream" in response.headers.get("content-type", "")
