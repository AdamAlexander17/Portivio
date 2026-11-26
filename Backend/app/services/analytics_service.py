"""Visitor analytics for one site: recording events and summarising them.

Privacy: no cookies are set and no IP address is stored. A visitor is counted
through a hash of (secret, date, address, browser) that changes every day.
"""
import hashlib
import re
from datetime import date, datetime, timedelta, timezone

from fastapi import Request
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limit import client_ip
from app.models import Event, Message, Project
from app.models.event import KIND_PROJECT, KIND_RESUME, KIND_VIEW

_BOTS = re.compile(r"bot|crawl|spider|slurp|preview|monitor|headless|curl|wget|python-|httpclient", re.I)
_PATH = re.compile(r"^/[A-Za-z0-9/_\-.]{0,199}$")


def _today() -> date:
    return datetime.now(timezone.utc).date()


class AnalyticsService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    # ---- recording -----------------------------------------------------
    def record(self, kind: str, request: Request, path: str = "", project_id: int | None = None) -> None:
        agent = request.headers.get("user-agent", "")
        if not agent or _BOTS.search(agent):
            return  # search engines and link previews are not visitors
        today = _today()
        visitor = hashlib.sha256(
            f"{settings.SECRET_KEY}|{today}|{client_ip(request)}|{agent}".encode()
        ).hexdigest()[:32]
        clean_path = path.split("?")[0].split("#")[0]
        self.db.add(
            Event(
                user_id=self.user_id, kind=kind, project_id=project_id, day=today, visitor=visitor,
                path=clean_path if _PATH.match(clean_path) else "",
            )
        )
        self.db.commit()

    def record_project_view(self, slug: str, request: Request) -> None:
        project = self.db.scalar(
            select(Project).where(Project.user_id == self.user_id, Project.slug == slug, Project.is_published.is_(True))
        )
        if project:
            self.record(KIND_PROJECT, request, project_id=project.id)

    def delete_everything(self) -> None:
        self.db.execute(delete(Event).where(Event.user_id == self.user_id))
        self.db.commit()

    # ---- reporting -----------------------------------------------------
    def summary(self, days: int) -> dict:
        today = _today()
        since = today - timedelta(days=days - 1)
        mine = (Event.user_id == self.user_id, Event.day >= since)

        def count(*extra) -> int:
            return self.db.scalar(select(func.count()).select_from(Event).where(*mine, *extra)) or 0

        per_day = {
            day: (views, visitors)
            for day, views, visitors in self.db.execute(
                select(Event.day, func.count(), func.count(func.distinct(Event.visitor)))
                .where(*mine, Event.kind == KIND_VIEW)
                .group_by(Event.day)
            )
        }
        daily = []
        for offset in range(days):
            day = since + timedelta(days=offset)
            views, visitors = per_day.get(day, (0, 0))
            daily.append({"day": day, "views": views, "visitors": visitors})

        hits = func.count().label("hits")
        top_projects = self.db.execute(
            select(Project.title, Project.slug, hits)
            .select_from(Event)
            .join(Project, Project.id == Event.project_id)
            .where(*mine, Event.kind == KIND_PROJECT)
            .group_by(Project.id, Project.title, Project.slug)
            .order_by(hits.desc())
            .limit(5)
        ).all()
        top_pages = self.db.execute(
            select(Event.path, hits)
            .where(*mine, Event.kind == KIND_VIEW, Event.path != "")
            .group_by(Event.path)
            .order_by(hits.desc())
            .limit(6)
        ).all()

        since_time = datetime.combine(since, datetime.min.time())
        return {
            "days": days,
            "views": count(Event.kind == KIND_VIEW),
            "visitors": self.db.scalar(
                select(func.count(func.distinct(func.concat(Event.day, Event.visitor)))).where(*mine)
            ) or 0,
            "project_views": count(Event.kind == KIND_PROJECT),
            "resume_downloads": count(Event.kind == KIND_RESUME),
            "messages": self.db.scalar(
                select(func.count()).select_from(Message)
                .where(Message.user_id == self.user_id, Message.created_at >= since_time)
            ) or 0,
            "daily": daily,
            "top_projects": [{"title": title, "slug": slug, "views": views} for title, slug, views in top_projects],
            "top_pages": [{"path": path, "views": views} for path, views in top_pages],
        }
