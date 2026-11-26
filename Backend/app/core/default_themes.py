"""The ready-made themes added to a new database. Admins can edit them or add more.

Each theme is seven base colours plus fonts and a shape; the site derives the
in-between shades (soft text, borders, hover colours) from these.

  bg         page background            surface    cards and inputs
  text       main text                  accent     buttons, links, highlights
  on_accent  text on top of the accent  tint       soft section background
  dark       footer and dark band
"""


def _theme(name, description, visibility, scheme, shape, heading, body, logo, colors, default=False):
    keys = ("bg", "surface", "text", "accent", "on_accent", "tint", "dark")
    return {
        "name": name,
        "description": description,
        "visibility": visibility,
        "is_default": default,
        "tokens": {
            "scheme": scheme,
            "shape": shape,
            "heading_font": heading,
            "body_font": body,
            "logo_font": logo,
            "colors": dict(zip(keys, colors)),
        },
    }


DEFAULT_THEMES = [
    _theme(
        "Lavender Studio", "Soft purple with an editorial serif. The original design.",
        "public", "light", "rounded", "newsreader", "dm-sans", "script",
        ("#ffffff", "#ffffff", "#1f1826", "#6d3aa6", "#ffffff", "#f5f0fb", "#261a33"), default=True,
    ),
    _theme(
        "Midnight Neon", "Dark canvas with a sharp lime accent. Bold and modern.",
        "public", "dark", "soft", "space-grotesk", "inter", "heading",
        ("#0e0f14", "#181a23", "#f2f3f7", "#b6f24a", "#10140a", "#14161d", "#07080b"),
    ),
    _theme(
        "Editorial Mono", "Black, white and sharp corners. Lets the work speak.",
        "public", "light", "sharp", "playfair", "inter", "heading",
        ("#fafaf8", "#ffffff", "#111111", "#111111", "#ffffff", "#efeee9", "#111111"),
    ),
    _theme(
        "Ocean Breeze", "Clean blue and white with a friendly geometric font.",
        "public", "light", "rounded", "sora", "inter", "heading",
        ("#ffffff", "#ffffff", "#0f2233", "#0b6bcb", "#ffffff", "#eef6fd", "#0b2540"),
    ),
    _theme(
        "Terracotta Clay", "Warm paper tones with a burnt orange accent.",
        "public", "light", "soft", "fraunces", "work-sans", "heading",
        ("#fbf6f0", "#fffdf9", "#2b1d16", "#b3471f", "#ffffff", "#f3e7da", "#2e1c14"),
    ),
    _theme(
        "Forest Sage", "Calm greens on an off-white page.",
        "private", "light", "rounded", "dm-serif", "dm-sans", "heading",
        ("#f7f8f3", "#ffffff", "#1b2a20", "#2f6b4a", "#ffffff", "#e8eee1", "#16261c"),
    ),
    _theme(
        "Rose Quartz", "Elegant pink with a classic serif and a script logo.",
        "private", "light", "rounded", "playfair", "dm-sans", "script",
        ("#ffffff", "#ffffff", "#2a1620", "#b82f66", "#ffffff", "#fdf0f5", "#2b1420"),
    ),
    _theme(
        "Graphite Gold", "Near-black with a gold accent. Premium and quiet.",
        "private", "dark", "sharp", "playfair", "manrope", "heading",
        ("#131210", "#1d1b18", "#f4efe6", "#d4a84f", "#1a1408", "#191714", "#0b0a09"),
    ),
]
