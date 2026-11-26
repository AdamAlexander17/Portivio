"""Account management. The router is mounted with the admin-only dependency."""
from fastapi import APIRouter, status

from app.api.deps import CurrentAdmin, DbSession
from app.schemas.user import UserCreate, UserRow, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["admin: users"])


@router.get("", response_model=list[UserRow])
def list_users(db: DbSession):
    return UserService(db).list()


@router.post("", response_model=UserRow, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, db: DbSession):
    return UserService(db).create(data)


@router.patch("/{user_id}", response_model=UserRow)
def update_user(user_id: int, data: UserUpdate, admin: CurrentAdmin, db: DbSession):
    return UserService(db).update(user_id, data, admin)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, admin: CurrentAdmin, db: DbSession):
    UserService(db).delete(user_id, admin)
