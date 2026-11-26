"""Starter content for different kinds of work, so a new site reads right for its owner
whether they are a developer, a designer, an accountant or something else.

Each profession gives: page copy (texts), list content (items), the project filter
categories and the contact form topics. Everything can be edited in the panel afterwards.
"""

# What a site falls back to when its owner has not chosen their own options.
DEFAULT_PROJECT_FILTERS = ["Mobile", "Web", "Dashboards"]
DEFAULT_CONTACT_TOPICS = ["Project", "Job opportunity", "Freelance work", "Something else"]
DEFAULT_BUDGET_OPTIONS = ["Prefer not to say", "Under $1,000", "$1,000 to $5,000", "$5,000 to $10,000", "Above $10,000"]


def _p(label, role, headline, intro, work_word, filters, topics, highlights, process, services, skills, faqs):
    return {
        "label": label, "role": role, "headline": headline, "intro": intro, "work_word": work_word,
        "filters": filters, "topics": topics, "highlights": highlights, "process": process,
        "services": services, "skills": skills, "faqs": faqs,
    }


# services: (title, description, [what's included]); skills: (group, [skills]); faqs: (question, answer)
PROFESSIONS = {
    "designer": _p(
        "Designer (UI/UX, product, graphic)", "Product & UI/UX Designer", "Making complex\n*feel simple.*",
        "I design apps, websites and dashboards, from research and user flows to polished, developer-ready UI.",
        "Projects", ["Mobile", "Web", "Branding"], ["Design project", "Job opportunity", "Freelance work", "Something else"],
        ["Product thinking", "UI/UX design", "Design systems", "Prototyping"],
        [("Discover", "Interviews and audits to frame the real problem."), ("Design", "Flows, wireframes and high-fidelity screens."),
         ("Prototype", "Clickable prototypes to test before building."), ("Hand off", "Documented components for developers.")],
        [("UI/UX design", "Screens people understand on first use.", ["User flows", "Wireframes", "High-fidelity UI"]),
         ("Design systems", "Consistent components your team can reuse.", ["Tokens and components", "Documentation"]),
         ("UX research", "Clarity on what to build before you build it.", ["Interviews", "Journey maps"])],
        [("Design", ["UX research", "Wireframing", "Visual design", "Prototyping"]), ("Tools", ["Figma", "Adobe XD", "Illustrator"])],
        [("Do you also build the product?", "I focus on design and work closely with your developers during the build.")],
    ),
    "developer": _p(
        "Software developer", "Software Developer", "I build software\n*that ships.*",
        "I build fast, reliable web and mobile applications, from the first prototype to production and beyond.",
        "Projects", ["Web", "Mobile", "Backend", "Open source"], ["Project", "Job opportunity", "Freelance work", "Bug or support", "Something else"],
        ["Clean code", "Scalable architecture", "Testing", "Fast delivery"],
        [("Plan", "Requirements, scope and the right technical approach."), ("Build", "Small, reviewed releases you can try as we go."),
         ("Test", "Automated tests and real-device checks."), ("Launch & support", "Deployment, monitoring and improvements.")],
        [("Web applications", "Modern, responsive web apps built to last.", ["Frontend and backend", "APIs", "Database design"]),
         ("Mobile apps", "Apps for iOS and Android from one codebase.", ["App development", "Store release"]),
         ("Maintenance", "Keeping existing software healthy and fast.", ["Bug fixes", "Performance", "Upgrades"])],
        [("Languages", ["JavaScript", "TypeScript", "Python", "SQL"]), ("Frameworks", ["React", "Node.js", "FastAPI"]),
         ("Tools", ["Git", "Docker", "AWS"])],
        [("Can you work with an existing codebase?", "Yes. I start with a short review and then agree the first improvements with you.")],
    ),
    "accountant": _p(
        "Accountant / finance", "Chartered Accountant", "Clear numbers.\n*Confident decisions.*",
        "I help businesses and individuals keep accurate books, stay compliant and understand what their numbers mean.",
        "Client work", ["Bookkeeping", "Tax", "Audit", "Advisory"], ["Bookkeeping", "Tax filing", "Audit", "Advisory", "Something else"],
        ["Accuracy", "Compliance", "On-time filing", "Plain-language advice"],
        [("Review", "A look at your current books and obligations."), ("Organise", "Clean records and a simple monthly routine."),
         ("Report", "Statements you can actually read."), ("Advise", "Practical steps to save tax and plan ahead.")],
        [("Bookkeeping", "Accurate, up-to-date records every month.", ["Bank reconciliation", "Invoices and bills", "Monthly reports"]),
         ("Tax filing", "Returns prepared and filed on time.", ["Income tax", "Sales tax / VAT", "Tax planning"]),
         ("Audit & advisory", "Independent review and guidance for growth.", ["Financial statements", "Budgeting and forecasts"])],
        [("Expertise", ["Financial reporting", "Taxation", "Auditing", "Budgeting"]), ("Software", ["QuickBooks", "Xero", "Excel"])],
        [("Do you work with small businesses?", "Yes. Most of my clients are small and medium businesses and freelancers.")],
    ),
    "marketer": _p(
        "Marketing / digital marketing", "Digital Marketer", "Marketing that\n*brings customers.*",
        "I plan and run campaigns that reach the right people and turn attention into measurable results.",
        "Campaigns", ["Social media", "SEO", "Ads", "Email"], ["Campaign", "Monthly retainer", "Audit", "Something else"],
        ["Strategy", "Content", "Paid ads", "Analytics"],
        [("Audit", "Where you stand today and where the gaps are."), ("Plan", "Clear goals, channels and budget."),
         ("Run", "Content and campaigns, tested and improved weekly."), ("Report", "Simple reports on what worked.")],
        [("Social media", "A consistent presence that grows your audience.", ["Content calendar", "Community management"]),
         ("SEO", "More of the right visitors from search.", ["Keyword research", "On-page SEO", "Content plan"]),
         ("Paid advertising", "Ads managed around cost per result.", ["Meta and Google ads", "Landing pages"])],
        [("Skills", ["Content strategy", "SEO", "Copywriting", "Paid media"]), ("Tools", ["Google Analytics", "Meta Ads", "Mailchimp"])],
        [("How soon will I see results?", "Paid campaigns show results in weeks; SEO and content usually take a few months.")],
    ),
    "photographer": _p(
        "Photographer / videographer", "Photographer", "Moments,\n*kept beautifully.*",
        "I photograph people, products and events with a natural style and careful attention to light.",
        "Portfolio", ["Weddings", "Portraits", "Products", "Events"], ["Booking", "Pricing", "Availability", "Something else"],
        ["Natural light", "Careful editing", "Fast delivery", "Relaxed sessions"],
        [("Talk", "Your ideas, the date and the look you want."), ("Shoot", "A relaxed session, directed where needed."),
         ("Edit", "Colour, retouching and a consistent style."), ("Deliver", "A private online gallery and prints.")],
        [("Weddings", "Full-day coverage of your celebration.", ["Two photographers", "Online gallery", "Album design"]),
         ("Portraits", "Individual, family and corporate portraits.", ["Studio or location", "Retouched images"]),
         ("Product photography", "Clean images that help products sell.", ["White background", "Lifestyle shots"])],
        [("Style", ["Portrait", "Documentary", "Product", "Editorial"]), ("Tools", ["Lightroom", "Photoshop", "Capture One"])],
        [("How long until I get my photos?", "Portraits within a week; weddings within three to four weeks.")],
    ),
    "writer": _p(
        "Writer / content creator", "Writer & Content Creator", "Words that\n*people finish reading.*",
        "I write clear, engaging content for websites, blogs and brands, in a voice that sounds like you.",
        "Writing", ["Articles", "Web copy", "Scripts", "Social"], ["Writing project", "Editing", "Monthly content", "Something else"],
        ["Clear writing", "Research", "On-brand voice", "On-time delivery"],
        [("Brief", "Audience, goal and tone of voice."), ("Research", "Facts, examples and an outline."),
         ("Write", "A draft that says it simply."), ("Edit", "Revisions until it reads right.")],
        [("Website copy", "Pages that explain what you do, fast.", ["Home and about pages", "Product descriptions"]),
         ("Articles and blogs", "Useful, well-researched long-form writing.", ["Topic research", "SEO structure"]),
         ("Editing", "Sharper, clearer versions of your own text.", ["Line editing", "Proofreading"])],
        [("Writing", ["Copywriting", "Long-form", "Editing", "SEO writing"]), ("Tools", ["Google Docs", "Grammarly", "WordPress"])],
        [("Do you offer revisions?", "Yes. Two rounds of revisions are included in every project.")],
    ),
    "consultant": _p(
        "Consultant / business professional", "Business Consultant", "Clear thinking for\n*better decisions.*",
        "I help teams solve hard problems, improve how they work and deliver results they can measure.",
        "Case studies", ["Strategy", "Operations", "Training"], ["Consulting", "Workshop", "Speaking", "Something else"],
        ["Strategy", "Problem solving", "Clear communication", "Measurable results"],
        [("Understand", "Interviews and data to find the real issue."), ("Analyse", "Options, costs and risks laid out clearly."),
         ("Plan", "A practical roadmap your team owns."), ("Deliver", "Support through implementation.")],
        [("Strategy", "Direction and priorities you can act on.", ["Market review", "Roadmap"]),
         ("Operations", "Simpler processes and less waste.", ["Process mapping", "KPIs"]),
         ("Workshops", "Hands-on sessions for your team.", ["Facilitation", "Training material"])],
        [("Expertise", ["Strategy", "Project management", "Analysis", "Facilitation"]), ("Tools", ["Excel", "PowerPoint", "Notion"])],
        [("How do engagements start?", "With a short discovery call, followed by a written proposal and scope.")],
    ),
    "teacher": _p(
        "Teacher / trainer / coach", "Teacher & Trainer", "Learning that\n*actually sticks.*",
        "I teach in clear, practical steps so learners understand the why and can use what they learn.",
        "Courses", ["Courses", "Workshops", "One-to-one"], ["Course", "Workshop", "Private lessons", "Something else"],
        ["Clear explanations", "Practical exercises", "Patience", "Real results"],
        [("Assess", "Where the learner is today and where they want to be."), ("Plan", "A course shaped around their goals."),
         ("Teach", "Short lessons with practice in between."), ("Review", "Feedback and next steps.")],
        [("Courses", "Structured programmes for groups.", ["Lesson plans", "Assignments", "Certificates"]),
         ("Workshops", "Focused sessions on one skill.", ["Half or full day", "Hands-on exercises"]),
         ("One-to-one", "Personal coaching at your own pace.", ["Custom plan", "Regular feedback"])],
        [("Teaching", ["Curriculum design", "Mentoring", "Public speaking"]), ("Tools", ["Zoom", "Google Classroom", "Canva"])],
        [("Do you teach online?", "Yes. Lessons are available online and in person.")],
    ),
    "other": _p(
        "Something else", "Your role", "Hello, I'm\n*{first_name}.*",
        "Write a short introduction here: what you do, who you work with and what makes your work different.",
        "Work", ["Recent", "Featured"], list(DEFAULT_CONTACT_TOPICS), [], [], [], [], [],
    ),
}

DEFAULT_PROFESSION = "other"


def profession_options() -> list[dict]:
    return [{"key": key, "label": data["label"]} for key, data in PROFESSIONS.items()]


def _merged(first: list, *more: list, key=lambda row: row, limit: int = 12) -> list:
    """`first` followed by the rows of `more` it does not have yet, up to `limit` rows."""
    out, seen = [], set()
    for rows in (first, *more):
        for row in rows:
            mark = str(key(row)).strip().lower()
            if mark not in seen and len(out) < limit:
                seen.add(mark)
                out.append(row)
    return out


def starter_content(profession: str, name: str, also: list[str] | tuple = ()) -> dict:
    """The page copy, list content and options a new site of this profession starts with.

    `also` names further kinds of work the person does. The first profession stays the main one
    (headline, intro, process); the others add their role, services, skills, highlights,
    questions, project categories and contact topics.
    """
    data = PROFESSIONS.get(profession) or PROFESSIONS[DEFAULT_PROFESSION]
    extra = [PROFESSIONS[key] for key in dict.fromkeys(also) if key in PROFESSIONS and key != profession and key != DEFAULT_PROFESSION]
    if extra:
        first = lambda row: row[0]
        data = {
            **data,
            "role": " · ".join(_merged([data["role"]], [other["role"] for other in extra], limit=3)),
            "highlights": _merged(data["highlights"], *(other["highlights"] for other in extra), limit=6),
            "services": _merged(data["services"], *(other["services"] for other in extra), key=first),
            "skills": _merged(data["skills"], *(other["skills"] for other in extra), key=first, limit=8),
            "faqs": _merged(data["faqs"], *(other["faqs"] for other in extra), key=first, limit=8),
            "filters": _merged(data["filters"], *(other["filters"] for other in extra), limit=8),
            "topics": _merged(data["topics"], *(other["topics"] for other in extra), limit=8),
        }
        # the catch-all topic stays last
        if "Something else" in data["topics"]:
            data["topics"] = [topic for topic in data["topics"] if topic != "Something else"] + ["Something else"]
    first_name = name.split()[0] if name.split() else name
    work = data["work_word"]
    texts = {
        "logo_text": name,
        "hero_eyebrow": data["role"],
        "hero_title": data["headline"].replace("{first_name}", first_name),
        "hero_intro": data["intro"],
        "hero_caption": data["role"][:255] if data["role"] != "Your role" else "",
        "nav_projects": work,
        "hero_primary_button": f"See my {work.lower()}",
        "project_link_label": "View details",
        "work_eyebrow": f"Selected {work.lower()}",
        "work_title": f"Recent *{work.lower()}.*",
        "projects_eyebrow": work,
        "projects_title": f"{work},\nin detail.",
        "projects_intro": f"A closer look at my recent {work.lower()}.",
        "about_title": f"About *{first_name}.*",
        "about_intro": data["intro"],
    }
    items = {
        "highlights": [(title, "", "", []) for title in data["highlights"]],
        "process": [(title, body, "", []) for title, body in data["process"]],
        "services": [(title, body, "Get in touch", included) for title, body, included in data["services"]],
        "skills": [(group, "", "", skills) for group, skills in data["skills"]],
        "faqs": [(question, answer, "", []) for question, answer in data["faqs"]],
    }
    settings = {
        "profession": profession if profession in PROFESSIONS else DEFAULT_PROFESSION,
        "project_filters": list(data["filters"]),
        "contact_topics": list(data["topics"]),
        "budget_options": list(DEFAULT_BUDGET_OPTIONS),
    }
    return {"texts": texts, "items": items, "settings": settings}
