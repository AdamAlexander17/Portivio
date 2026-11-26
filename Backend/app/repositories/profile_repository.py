from sqlalchemy import select

from app.models import Profile
from app.repositories.base import BaseRepository


class ProfileRepository(BaseRepository[Profile]):
    model = Profile

    def for_user(self, user_id: int) -> Profile | None:
        return self.db.scalar(select(Profile).where(Profile.user_id == user_id))

    def names_by_user(self) -> dict[int, str]:
        return dict(self.db.execute(select(Profile.user_id, Profile.name)).all())
