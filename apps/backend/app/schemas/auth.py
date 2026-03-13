from pydantic import BaseModel, ConfigDict

from app.models.entities import UserRole


class CurrentUserResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str
    email: str
    name: str
    role: UserRole
