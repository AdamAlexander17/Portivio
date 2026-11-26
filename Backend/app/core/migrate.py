"""Small, repeatable upgrades for a database created by an earlier version of the app.

`Base.metadata.create_all` only creates missing tables; it never changes existing ones.
These steps bring an older database up to the current shape without losing data.
Each step checks first, so running them again does nothing.
"""
from sqlalchemy import Engine, text


def _tables(conn) -> set[str]:
    rows = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"))
    return {row[0].lower() for row in rows}


def _columns(conn, table: str) -> set[str]:
    rows = conn.execute(
        text("SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :t"),
        {"t": table},
    )
    return {row[0].lower() for row in rows}


def before_create_all(engine: Engine) -> None:
    """The single-admin version kept accounts in `admin_users`; it is now `users`."""
    with engine.connect() as conn:
        tables = _tables(conn)
        if "admin_users" in tables and "users" not in tables:
            conn.execute(text("RENAME TABLE admin_users TO users"))


def after_create_all(engine: Engine) -> None:
    """Add the multi-user columns and hand all existing content to the first admin."""
    with engine.connect() as conn:
        user_columns = _columns(conn, "users")
        if "role" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'"))
            conn.execute(text("UPDATE users SET role = 'admin'"))  # every old account was the admin
        if "is_active" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1"))

        if "email" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL"))
            conn.execute(text("CREATE UNIQUE INDEX ix_users_email ON users (email)"))
        if "google_sub" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN google_sub VARCHAR(64) NULL UNIQUE"))
        if "facebook_id" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN facebook_id VARCHAR(64) NULL UNIQUE"))
        if "token_version" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0"))
        if "content" not in _columns(conn, "projects"):
            conn.execute(text("ALTER TABLE projects ADD COLUMN content JSON NULL"))

        first_admin = conn.execute(text("SELECT MIN(id) FROM users WHERE role = 'admin'")).scalar()

        for table in ("profile", "content_items", "projects", "messages"):
            if "user_id" in _columns(conn, table):
                continue
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN user_id INT NULL"))
            if first_admin is not None:
                conn.execute(text(f"UPDATE {table} SET user_id = :uid"), {"uid": first_admin})
            unique = "UNIQUE " if table == "profile" else ""
            conn.execute(text(f"CREATE {unique}INDEX ix_{table}_user_id ON {table} (user_id)"))

        # Themes were added later: each profile remembers which theme it uses.
        if "theme_id" not in _columns(conn, "profile"):
            conn.execute(text("ALTER TABLE profile ADD COLUMN theme_id INT NULL"))
        # Layouts work the same way.
        if "layout_id" not in _columns(conn, "profile"):
            conn.execute(text("ALTER TABLE profile ADD COLUMN layout_id INT NULL"))
        # Per-site style of single parts, on top of the layout preset.
        if "layout_custom" not in _columns(conn, "profile"):
            conn.execute(text("ALTER TABLE profile ADD COLUMN layout_custom JSON NULL"))
        # Styles of single texts (visual editor).
        if "text_styles" not in _columns(conn, "profile"):
            conn.execute(text("ALTER TABLE profile ADD COLUMN text_styles JSON NULL"))
        # Per-site font choices.
        if "typography" not in _columns(conn, "profile"):
            conn.execute(text("ALTER TABLE profile ADD COLUMN typography JSON NULL"))
        # Per-site arrangement of the home page blocks.
        if "home_sections" not in _columns(conn, "profile"):
            conn.execute(text("ALTER TABLE profile ADD COLUMN home_sections JSON NULL"))
        # Per-site options (profession, filter categories, contact topics).
        if "settings" not in _columns(conn, "profile"):
            conn.execute(text("ALTER TABLE profile ADD COLUMN settings JSON NULL"))

        conn.commit()
