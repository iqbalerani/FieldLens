import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import get_settings


class StorageService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.uploads_dir = self.settings.data_dir / "uploads"
        self.uploads_dir.mkdir(parents=True, exist_ok=True)

    def build_media_key(self, inspection_id: str, file_name: str) -> str:
        return f"inspections/{inspection_id}/{uuid.uuid4()}-{file_name}"

    def build_local_upload_url(self, inspection_id: str, media_id: str) -> str:
        return f"http://localhost:8000/inspections/{inspection_id}/media/{media_id}/upload"

    async def save_upload(self, key: str, upload: UploadFile) -> str:
        destination = self.uploads_dir / key.replace("/", "__")
        destination.parent.mkdir(parents=True, exist_ok=True)
        content = await upload.read()
        destination.write_bytes(content)
        return str(destination)

    def preview_url(self, key: str) -> str:
        file_path = Path(self.uploads_dir / key.replace("/", "__")).resolve()
        return file_path.as_uri()


storage_service = StorageService()

