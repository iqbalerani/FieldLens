import os
from pathlib import Path
import sys

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_fieldlens.db"
os.environ["AUTH_MODE"] = "jwt"
os.environ["AI_MODE"] = "mock"
os.environ["STORAGE_MODE"] = "local"
os.environ["JWT_SECRET_KEY"] = "test-secret"
os.environ["SEED_DEFAULT_USERS"] = "true"
os.environ["RUN_MIGRATIONS_ON_STARTUP"] = "true"
sys.path.append(str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app.main import app


def login(client: TestClient) -> str:
    response = client.post(
        "/auth/login",
        json={
            "email": "inspector@fieldlens.local",
            "password": "FieldLensInspector123!",
        },
    )
    assert response.status_code == 200
    return response.json()["accessToken"]


def auth_headers(client: TestClient) -> dict[str, str]:
    return {"Authorization": f"Bearer {login(client)}"}


def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        body = response.json()
        assert body["status"] in {"ok", "degraded"}
        assert "database" in body["dependencies"]
        assert "storage" in body["dependencies"]


def test_auth_login_and_me() -> None:
    with TestClient(app) as client:
        token = login(client)
        me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        body = me.json()
        assert "id" in body
        assert "orgId" in body
        assert body["role"] == "INSPECTOR"


def test_auth_me_unauthenticated() -> None:
    with TestClient(app) as client:
        response = client.get("/auth/me")
        assert response.status_code == 401


def test_inspection_lifecycle() -> None:
    with TestClient(app) as client:
        headers = auth_headers(client)
        create_response = client.post(
            "/inspections",
            headers=headers,
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
            headers=headers,
            json={
                "media": [],
                "voiceTranscript": "There are visible cracks and missing signage near the loading area.",
            },
        )
        assert complete_response.status_code == 200
        assert complete_response.json()["status"] == "submitted"

        submit_response = client.post(f"/inspections/{inspection_id}/submit", headers=headers)
        assert submit_response.status_code == 200

        detail_response = client.get(f"/inspections/{inspection_id}", headers=headers)
        assert detail_response.status_code == 200
        payload = detail_response.json()
        assert payload["siteName"] == "Warehouse North"
        assert payload["voiceTranscript"]


def test_list_inspections_pagination() -> None:
    with TestClient(app) as client:
        response = client.get("/inspections?limit=5&offset=0", headers=auth_headers(client))
        assert response.status_code == 200
        assert isinstance(response.json(), list)


def test_list_inspections_status_filter() -> None:
    with TestClient(app) as client:
        response = client.get("/inspections?status=complete", headers=auth_headers(client))
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for item in data:
            assert item["status"] == "complete"


def test_inspection_not_found() -> None:
    with TestClient(app) as client:
        response = client.get("/inspections/nonexistent-id-000", headers=auth_headers(client))
        assert response.status_code == 404


def test_search() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/search",
            headers=auth_headers(client),
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
            headers=auth_headers(client),
            json={"query": ""},
        )
        assert response.status_code == 200


def test_analytics_trends() -> None:
    with TestClient(app) as client:
        response = client.get("/analytics/trends", headers=auth_headers(client))
        assert response.status_code == 200
        trends = response.json()
        assert isinstance(trends, list)
        for point in trends:
            assert "date" in point
            assert "totalInspections" in point
            assert "criticalIssues" in point
            assert "warningIssues" in point


def test_pdf_report_not_found() -> None:
    with TestClient(app) as client:
        response = client.get("/reports/nonexistent-id/pdf", headers=auth_headers(client))
        assert response.status_code == 404


def test_pdf_report_generates() -> None:
    with TestClient(app) as client:
        headers = auth_headers(client)
        create = client.post(
            "/inspections",
            headers=headers,
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

        client.post(f"/inspections/{iid}/media/complete", headers=headers, json={"media": [], "voiceTranscript": "all clear"})
        client.post(f"/inspections/{iid}/submit", headers=headers)

        pdf_response = client.get(f"/reports/{iid}/pdf", headers=headers)
        assert pdf_response.status_code == 200
        assert pdf_response.headers["content-type"] == "application/pdf"
        assert len(pdf_response.content) > 1000


def test_voice_websocket_stream_completes() -> None:
    with TestClient(app) as client:
        with client.websocket_connect("/ws/voice/test-session-1") as ws:
            ws.send_json({"type": "start", "contentType": "audio/wav"})
            ready = ws.receive_json()
            assert ready["type"] == "ready"

            ws.send_json({"type": "audio_chunk", "content": "UklGRg=="})
            ws.send_json({"type": "end"})
            final_msg = ws.receive_json()
            assert final_msg["type"] in {"completed", "error"}


def test_sse_stream_connects() -> None:
    with TestClient(app) as client:
        token = login(client)
        me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"}).json()
        org_id = me["orgId"]
        with client.stream("GET", f"/stream/inspections/{org_id}?token={token}&once=true") as response:
            assert response.status_code == 200
            assert "text/event-stream" in response.headers.get("content-type", "")
            lines = response.iter_lines()
            assert next(lines) == "event: connected"
            assert '"type": "connected"' in next(lines)
