"""A small per-IP request limiter for the endpoints that attackers hammer:
sign in, sign up, password reset, the contact form and analytics.

Counts are kept in this process's memory, which is right for one server. Behind
several servers (or a proxy that hides the visitor's address) use a shared store
such as Redis and the proxy's forwarded address instead.
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import Depends, HTTPException, Request, status

_hits: dict[tuple[str, str], deque[float]] = defaultdict(deque)
_lock = threading.Lock()
_MAX_KEYS = 20_000


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def rate_limit(name: str, limit: int, seconds: int):
    """Dependency: allow at most `limit` calls per `seconds` from one address."""

    def check(request: Request) -> None:
        key = (name, client_ip(request))
        now = time.monotonic()
        with _lock:
            if len(_hits) > _MAX_KEYS:  # forget idle addresses so memory cannot grow without end
                for stale in [k for k, q in _hits.items() if not q or now - q[-1] > 3600]:
                    del _hits[stale]
            recent = _hits[key]
            while recent and now - recent[0] > seconds:
                recent.popleft()
            if len(recent) >= limit:
                raise HTTPException(
                    status.HTTP_429_TOO_MANY_REQUESTS,
                    "Too many attempts. Please wait a few minutes and try again.",
                    headers={"Retry-After": str(seconds)},
                )
            recent.append(now)

    return Depends(check)
