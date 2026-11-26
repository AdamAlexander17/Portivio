"""Default page copy and first-run sample content, taken from the Figma design.

Everything here can be edited from the admin panel after the first start.
In headings, text wrapped in *stars* is shown in purple and a line break starts a new line.
"""

DEFAULT_PROFILE = {
    "name": "Rafia Rasool",
    "email": "rafiarasool64@gmail.com",
    "location": "Dubai, United Arab Emirates",
    "linkedin_url": "https://linkedin.com/in/rafia-rasool",
    "behance_url": "https://behance.net/rafiarasool",
}

DEFAULT_TEXTS = {
    # Shared
    "logo_text": "Rafia Rasool",
    "location_note": "Working with teams remotely.",
    "cta_title": "Have a product in mind?\nLet's talk it through.",
    "footer_tagline": "Turning complex ideas into simple, meaningful digital experiences.",
    "footer_note": "Product design, UI/UX and design teaching",
    # Home
    "hero_eyebrow": "Product Designer & UI/UX Designer - Dubai",
    "hero_title": "Making complex\n*feel simple.*",
    "hero_intro": (
        "I'm Rafia Rasool. I design mobile apps, web apps and dashboards for fitness, fintech, "
        "real estate, SaaS and more, from research and user flows to polished, developer-ready UI."
    ),
    "hero_stats": "4+ years designing digital products | 30+ Trusted Clients",
    "hero_caption": "Product Designer & UI/UX Designer",
    "work_eyebrow": "Selected work",
    "work_title": "Different products.\nThe same care for detail.",
    "process_eyebrow": "How a project runs",
    "process_title": "From research to *design systems.*",
    "teach_eyebrow": "Beyond the interface",
    "teach_title": "Good design should be\n*easy to explain.*",
    "teach_body": (
        "Teaching keeps my design thinking clear. I help learners connect the “why” behind "
        "a decision with the practical skills to make it happen."
    ),
    "teach_roles": "Instructor · Teacher · Product designer",
    "teach_button": "Book a workshop",
    # Contact
    "contact_eyebrow": "Let's work together",
    "contact_title": "Tell me what you're *working on.*",
    "contact_intro": (
        "A project, a role, freelance work or a workshop for your team. "
        "A few sentences are enough to start."
    ),
    "contact_connect": "Connect with me on LinkedIn or explore more of my work on Behance.",
    # Projects
    "projects_title": "Selected projects,\nfrom problem to interface.",
    "projects_intro": (
        "Explore my work across mobile apps, websites and complex product workflows. "
        "Each project includes its context, design scope and interface details."
    ),
    # Services
    "services_title": "Design work, from first question to developer handoff.",
    "services_intro": (
        "Pick the service closest to what you need. If you are not sure, describe the problem "
        "and we will work out the right scope together."
    ),
    "offer_title": "What I offer",
    "industries_title": "Industries I design for",
    "industries_intro": "Each sector has its own pressures. These are the ones I design around most often.",
    "faq_title": "Questions people ask first",
    # About
    "about_title": "Designer, instructor and teacher. *Same job, different rooms.*",
    "about_intro": (
        "I'm Rafia, a product designer and educator based in Dubai. I work across websites, "
        "mobile apps and dashboards, with a focus on making complex information and workflows "
        "easier to understand."
    ),
    "practices_title": "Two practices, one habit:\ncomplexity into clarity",
    "experience_title": "Experience",
    "principles_title": "How I work",
    "skills_title": "Skills and tools",
    # Optional home page sections
    "testimonials_title": "What clients *say.*",
    # Menu and button labels, so the wording fits any kind of work
    "nav_home": "Home",
    "nav_projects": "Projects",
    "nav_services": "Services",
    "nav_about": "About",
    "nav_contact": "Contact",
    "nav_button": "Let's talk",
    "hero_primary_button": "Explore my work",
    "hero_secondary_button": "Let's talk",
    "highlights_label": "What I bring",
    "projects_eyebrow": "Projects",
    "project_link_label": "Explore project",
    "services_eyebrow": "Services",
    "services_list_label": "Typical deliverables",
    "about_eyebrow": "About",
    "stats_title": "",
}

# The blocks a home page can be built from, in their default order. The hero always
# comes first and is not part of this list. A block with no content hides itself.
HOME_SECTION_KEYS = (
    "highlights",    # numbered strip
    "projects",
    "stats",         # big numbers
    "process",
    "services",
    "testimonials",
    "experience",
    "skills",
    "faq",
    "teach",         # dark highlight band
    "contact",
    "cta",           # accent banner
)
# Shown on a site that has not arranged its home page yet (the original design).
DEFAULT_VISIBLE_HOME_SECTIONS = {"highlights", "projects", "process", "teach", "contact", "cta"}


def normalise_home_sections(saved, custom_ids=()) -> list[dict]:
    """A complete, valid section list for a home page.

    Keeps the saved order, drops anything unknown (such as a deleted custom section),
    adds built-in blocks the saved list does not mention as hidden, and places the
    user's custom sections ("custom:<id>") that are not arranged yet just before the contact form.
    """
    custom_keys = [f"custom:{section_id}" for section_id in custom_ids]
    known = set(HOME_SECTION_KEYS) | set(custom_keys)
    result, seen = [], set()
    for row in saved or []:
        key = row.get("key") if isinstance(row, dict) else None
        if key in known and key not in seen:
            seen.add(key)
            result.append({"key": key, "visible": bool(row.get("visible", True))})
    if not result:
        result = [{"key": key, "visible": key in DEFAULT_VISIBLE_HOME_SECTIONS} for key in HOME_SECTION_KEYS]
        seen = set(HOME_SECTION_KEYS)
    result.extend({"key": key, "visible": False} for key in HOME_SECTION_KEYS if key not in seen)
    new_custom = [{"key": key, "visible": True} for key in custom_keys if key not in seen]
    if new_custom:
        position = next((i for i, row in enumerate(result) if row["key"] == "contact"), len(result))
        result[position:position] = new_custom
    return result

def new_user_texts(name: str) -> dict[str, str]:
    """Neutral starting copy for a newly created user, in place of the sample owner's wording.

    An empty value hides that piece of the page until the user writes their own.
    """
    first_name = name.split()[0] if name.split() else name
    return {
        "logo_text": name,
        "footer_tagline": "",
        "footer_note": "",
        "location_note": "",
        "hero_eyebrow": "Your role and city",
        "hero_title": f"Hello, I'm\n*{first_name}.*",
        "hero_intro": "Write a short introduction here: what you do, who you work with and what makes your work different.",
        "hero_stats": "",
        "hero_caption": "",
        "work_title": "Selected work.",
        "process_eyebrow": "How I work",
        "process_title": "My *process.*",
        "teach_eyebrow": "",
        "teach_title": "",
        "teach_body": "",
        "teach_roles": "",
        "services_list_label": "What's included",
        "contact_title": "Let's *work together.*",
        "contact_intro": "Tell me a little about your project. A few sentences are enough to start.",
        "contact_connect": "",
        "projects_title": "Selected projects.",
        "projects_intro": "A closer look at my recent work.",
        "services_title": "What I can help with.",
        "services_intro": "Pick the service closest to what you need.",
        "about_title": f"About *{first_name}.*",
        "about_intro": "Write a few lines about your background, experience and how you like to work.",
        "practices_title": "What I do",
    }


# section -> list of (title, body, meta, items)
DEFAULT_ITEMS = {
    "highlights": [
        ("Product thinking", "", "", []),
        ("UI/UX design", "", "", []),
        ("Design systems", "", "", []),
        ("Prototyping", "", "", []),
    ],
    "process": [
        ("Discover", "Stakeholder interviews, audits and competitor reviews to frame the real problem.", "", []),
        ("Structure", "Personas, user flows, information architecture and wireframes.", "", []),
        ("Design", "High-fidelity UI in light and dark mode, built on clear visual hierarchy.", "", []),
        ("Prototype", "Interactive Figma prototypes to test flows before anything gets built.", "", []),
        ("Systemise & hand off", "Reusable components, tokens and documented states for developers.", "", []),
    ],
    "services": [
        ("Mobile App UI/UX",
         "An app people understand on first open and come back to, because every screen has one clear job.",
         "Discuss an app",
         ["User flows", "Wireframes", "High-fidelity iOS and Android screens", "Clickable prototype"]),
        ("Website Design",
         "A site that explains what you do quickly and guides visitors to the next step without friction.",
         "Discuss a website",
         ["Sitemap", "Responsive page designs", "Content hierarchy", "Component library"]),
        ("Landing Page Design",
         "One focused page built around a single decision, so campaigns turn attention into action.",
         "Discuss a landing page",
         ["Message structure", "Desktop and mobile layouts", "CTA and form design"]),
        ("E-commerce UX",
         "Product discovery, product pages and checkout designed to remove doubt at each step.",
         "Discuss a store",
         ["Browse and filter patterns", "Product page design", "Cart and checkout flow"]),
        ("SaaS & Dashboard Design",
         "Dense data and multi-role workflows turned into dashboards people can read at a glance.",
         "Discuss a dashboard",
         ["Information architecture", "Role-based dashboards", "Tables, charts and empty states"]),
        ("UX Research & Product Discovery",
         "Clarity on what to build before you spend on building it.",
         "Discuss research",
         ["Stakeholder and user interviews", "Journey maps", "Prioritised problem statements"]),
        ("Prototyping & Interaction Design",
         "Test the experience with real people before development, and show developers exactly how it moves.",
         "Discuss a prototype",
         ["Interactive Figma prototypes", "Micro-interaction specs", "Usability test scripts"]),
        ("Design Systems & Developer Handoff",
         "Consistent screens and a smoother build, with organized files and every state documented.",
         "Discuss a design system",
         ["Tokens and components", "Documented screen states", "Handoff-ready Figma files"]),
    ],
    "industries": [
        ("Fintech & Trading", "Trust, clarity around money, and fast reading of changing numbers.", "", []),
        ("Healthcare & Telehealth", "Calm, accessible flows for people who may be stressed or unwell.", "", []),
        ("Education / EdTech", "Learning journeys shaped by real classroom and teaching experience.", "", []),
        ("Fitness & Wellness", "Habit-forming logging, scheduling and progress views.", "", []),
        ("E-commerce / Retail", "Discovery and checkout that reduce hesitation.", "", []),
        ("Enterprise / CRM", "Role-based tools that make complex operations manageable.", "", []),
    ],
    "faqs": [
        ("Do you also build the product?",
         "I focus on product and UI/UX design. I prepare handoff-ready files and work closely with your "
         "developers, but development itself is not part of my services.", "", []),
        ("What do you need from me to start?",
         "A short description of the product, who it is for and what is not working today. "
         "Existing screens, research or brand guidelines help, but are not required.", "", []),
        ("Which tools do you design in?",
         "Figma for design, prototyping and handoff, with Adobe XD, Photoshop and Illustrator when a "
         "project needs them.", "", []),
        ("Can you redesign an existing product?",
         "Yes. I start with an audit of the current experience, then redesign the flows and screens "
         "that matter most first.", "", []),
        ("Do you run design workshops or training?",
         "Yes. I teach UI/UX fundamentals and run practical workshops for teams and learners.", "", []),
    ],
    "practices": [
        ("In design",
         "I untangle flows for products with several user roles, such as the client and coach sides of "
         "the FTF fitness app, and I hand developers organized files with every screen state documented.",
         "", []),
        ("In teaching",
         "As an instructor and teacher, I break big ideas into steps people can actually take, one at a "
         "time, until the whole thing makes sense.", "", []),
    ],
    "experience": [
        ("UI/UX Designer - Agilvo",
         "Redesigned mobile and web interfaces, built flows and high-fidelity prototypes in Figma, "
         "and worked with developers on dev-ready components.", "Apr 2025 to Jul 2025", []),
        ("UI/UX Designer - 99Loop Technologies",
         "Designed a complete matchmaking app experience, from competitor analysis and journeys to "
         "final Figma screens.", "Dec 2024 to Feb 2025", []),
        ("UI/UX Designer - NUEXUS",
         "Designed web screens for an AI-based evaluation tool, planned user flows and built "
         "wireframes and prototypes.", "Jun 2024 to Oct 2024", []),
        ("BS Computer Science", "University of Gujrat, Pakistan.", "2020 to 2024", []),
    ],
    "principles": [
        ("Clarity over cleverness", "If a screen needs explaining, the screen changes, not the explanation.", "", []),
        ("Every role counts", "Products with several kinds of user get a view designed for each of them.", "", []),
        ("Show the thinking", "Decisions are shared and reasoned through, the way I would with a student.", "", []),
        ("Finish the handoff", "Organized files and documented states, so what gets built matches what was designed.", "", []),
    ],
    "skills": [
        ("Design", "", "", ["UX Research", "User Flows", "Wireframing", "Prototyping", "Visual Design",
                            "Responsive Design", "Interaction Design"]),
        ("Delivery", "", "", ["Design Systems", "Developer Handoff", "Information Architecture", "Case Studies"]),
        ("Tools", "", "", ["Figma", "Adobe XD", "Photoshop", "Illustrator", "Sketch", "Canva", "AI tools"]),
    ],
}

# title, category, platforms, summary, featured
DEFAULT_PROJECTS = [
    ("Matrimonial App", "Web & mobile · Matchmaking", ["web", "mobile"],
     "Designing privacy, profile discovery and onboarding for a matchmaking platform.", False),
    ("WorkWire Chat", "Web & mobile · Workplace", ["web", "mobile"],
     "Connecting everyday conversations with the controls different workplace roles need.", False),
    ("Telesales CRM", "Web app · Fintech", ["web", "dashboard"],
     "Making leads, saved filters and bulk imports easier to work through in a dense dashboard.", False),
    ("Real Estate Sales Platform", "Web app · Real estate", ["web", "dashboard"],
     "Inventory, unit types and payment-plan offers for a Dubai developer's sales team.", False),
    ("FTF App", "Mobile app · Fitness & wellness", ["mobile"],
     "Bringing scheduling, workouts and habit tracking together for clients and coaches.", True),
    ("Werkstatt Zeitschaltuhr", "Web app · IoT & automation", ["web", "dashboard"],
     "A German control panel for scheduling workshop and barn equipment on one screen.", False),
    ("Fashion Store Prototype", "Prototype · E-commerce", ["web"],
     "An interaction prototype for browsing clothing by category, from Casual to Trousers.", False),
]
