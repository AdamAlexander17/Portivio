"""The ready-made layouts added to a new database. Admins can edit them or add more.

A layout picks one style for each part of the page; see app/schemas/layout.py
for every allowed value and Frontend/src/layout.js for what each one looks like.
"""


def _layout(name, description, visibility, nav, hero, projects, headings, footer, width, default=False):
    return {
        "name": name,
        "description": description,
        "visibility": visibility,
        "is_default": default,
        "options": {
            "nav": nav, "hero": hero, "projects": projects,
            "headings": headings, "footer": footer, "width": width,
        },
    }


DEFAULT_LAYOUTS = [
    _layout(
        "Classic", "Text beside a photo, two-column project cards. The original design.",
        "public", "classic", "split", "grid", "left", "columns", "standard", default=True,
    ),
    _layout(
        "Centered Minimal", "Everything centred around a round photo. Calm and focused.",
        "public", "centered", "centered", "grid", "center", "simple", "narrow",
    ),
    _layout(
        "Bold Statement", "A huge headline with no photo and projects as wide rows.",
        "public", "minimal", "statement", "list", "left", "columns", "wide",
    ),
    _layout(
        "Floating Pill", "A floating navbar, photo on the left and image-led project tiles.",
        "public", "pill", "reverse", "overlay", "left", "columns", "standard",
    ),
    _layout(
        "Showcase Grid", "A wide page with three projects per row and centred headings.",
        "public", "classic", "split", "compact", "center", "simple", "wide",
    ),
    _layout(
        "Magazine", "Centred navbar, statement headline and image-led project tiles.",
        "private", "centered", "statement", "overlay", "center", "columns", "wide",
    ),
]
