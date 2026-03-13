from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Organisation, User, UserRole
from app.schemas.auth import CurrentUserResponse


DEMO_ORG_ID = "demo-org"
DEMO_USERS = {
    "demo-admin": ("Avery Admin", "admin@fieldlens.local", UserRole.ADMIN),
    "demo-supervisor": ("Sam Supervisor", "supervisor@fieldlens.local", UserRole.SUPERVISOR),
    "demo-inspector": ("Indigo Inspector", "inspector@fieldlens.local", UserRole.INSPECTOR),
}


async def ensure_demo_user(session: AsyncSession, token: str) -> User:
    name, email, role = DEMO_USERS.get(token, DEMO_USERS["demo-inspector"])

    organisation = await session.get(Organisation, DEMO_ORG_ID)
    if organisation is None:
        organisation = Organisation(id=DEMO_ORG_ID, name="FieldLens Demo Org", industry_type="construction")
        session.add(organisation)

    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(org_id=DEMO_ORG_ID, name=name, email=email, role=role)
        session.add(user)
        await session.flush()
    return user


def to_current_user(user: User) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user.id,
        org_id=user.org_id,
        email=user.email,
        name=user.name,
        role=user.role,
    )

