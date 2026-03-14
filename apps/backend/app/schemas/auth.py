from pydantic import BaseModel, ConfigDict, Field

from app.models.entities import UserRole


class CurrentUserResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(alias="orgId")
    email: str
    name: str
    role: UserRole


class LoginRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: str
    password: str


class LoginResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    access_token: str = Field(alias="accessToken")
    token_type: str = Field(default="bearer", alias="tokenType")
    user: CurrentUserResponse
