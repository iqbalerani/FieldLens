import uuid
from pathlib import Path

import boto3
from fastapi import UploadFile

from app.core.config import get_settings


class StorageService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.uploads_dir = self.settings.data_dir / "uploads"
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self._s3 = None

    @property
    def s3(self):
        if self._s3 is None:
            self._s3 = boto3.client("s3", region_name=self.settings.bucket_region)
        return self._s3

    def build_media_key(self, inspection_id: str, file_name: str) -> str:
        return f"inspections/{inspection_id}/{uuid.uuid4()}-{file_name}"

    def create_upload_url(self, inspection_id: str, media_id: str, key: str, mime_type: str) -> str:
        if self.settings.s3_enabled:
            return self.s3.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": self.settings.s3_bucket_name,
                    "Key": key,
                    "ContentType": mime_type,
                },
                ExpiresIn=self.settings.s3_presign_expiry_seconds,
            )
        return self.build_local_upload_url(inspection_id, media_id)

    def build_local_upload_url(self, inspection_id: str, media_id: str) -> str:
        return f"http://localhost:8000/inspections/{inspection_id}/media/{media_id}/upload"

    async def save_upload(self, key: str, upload: UploadFile) -> str:
        content = await upload.read()
        return self.write_bytes(key, content, upload.content_type or "application/octet-stream")

    def write_bytes(self, key: str, content: bytes, content_type: str) -> str:
        if self.settings.s3_enabled:
            self.s3.put_object(
                Bucket=self.settings.s3_bucket_name,
                Key=key,
                Body=content,
                ContentType=content_type,
            )
            return key

        destination = self.uploads_dir / key.replace("/", "__")
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)
        return str(destination)

    def read_bytes(self, key: str) -> bytes:
        if self.settings.s3_enabled:
            response = self.s3.get_object(Bucket=self.settings.s3_bucket_name, Key=key)
            return response["Body"].read()

        file_path = self.uploads_dir / key.replace("/", "__")
        return file_path.read_bytes()

    def preview_url(self, key: str) -> str | None:
        if not key:
            return None
        if self.settings.s3_enabled:
            return self.s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.settings.s3_bucket_name, "Key": key},
                ExpiresIn=self.settings.s3_presign_expiry_seconds,
            )
        file_path = Path(self.uploads_dir / key.replace("/", "__")).resolve()
        return file_path.as_uri()

    def check_health(self) -> None:
        if not self.settings.s3_enabled:
            self.uploads_dir.mkdir(parents=True, exist_ok=True)
            return
        self.s3.head_bucket(Bucket=self.settings.s3_bucket_name)


storage_service = StorageService()
