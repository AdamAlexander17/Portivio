# Portfolio website

A portfolio site with an admin panel. Everything visitors see (text, photos, resume, projects,
services, experience, skills) is stored in MySQL and edited from the admin panel.

- **Backend:** FastAPI + SQLAlchemy + MySQL (`Backend/`)
- **Frontend:** React + Vite (`Frontend/`)

## Run it

MySQL must be running. The database (`Profile_db`), its tables and the sample content are created
automatically the first time the backend starts.

**1. Backend** (first terminal)

```powershell
cd C:\PF_WEB\Backend
venv\Scripts\python -m uvicorn app.main:app --reload
```

**2. Frontend** (second terminal)

```powershell
cd C:\PF_WEB\Frontend
npm run dev
```

Then open:

| What | Address |
| --- | --- |
| Website | http://localhost:5173 |
| Admin panel | http://localhost:5173/admin |
| API docs | http://localhost:8000/docs |

The first admin account comes from `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `Backend/.env`.
Change the password from **Admin panel > Change password** after the first sign in.

## Users

Every account owns one portfolio site and signs in at `/admin` to manage it.

| Account | Site address | Can do |
| --- | --- | --- |
| Admin | `/` (the main site) | Manage their own site, plus **Admin > Users**: create users, open any user's panel, reset passwords, block and delete |
| User | `/u/<username>` | Manage only their own site |

- Users cannot register themselves; an admin creates each account.
- A blocked user cannot sign in and their site is hidden.
- Deleting a user removes their whole site, including uploaded files.

## Themes

A theme is the whole look of a site: seven base colours, heading and text fonts, logo style
and corner shape. Themes are stored in the `themes` table and each profile remembers its choice.

- **Panel > Themes:** every user picks a theme for their own site; it applies straight away.
- **Public** themes can be picked by any user. **Private** themes are shown to users faded and
  locked. An admin can use any theme, and can apply a private one to a user by opening that
  user's panel.
- **Admins** can create a theme (colour pickers, fonts, shape, live preview), edit, delete, and
  switch any theme between public and private.
- The **default** theme is used by sites that have not picked one. It cannot be deleted or made
  private. Deleting any other theme moves its sites back to the default.
- Eight themes are added on first start (`Backend/app/core/default_themes.py`). To add a font
  choice, add it in both `Frontend/src/theme.js` and `Backend/app/schemas/theme.py`.

## Layouts

A layout is the arrangement of a site, separate from its theme, so any theme works with any
layout. Layouts live in the `layouts` table and follow the same rules as themes (public or
private, a default that cannot be removed, admin-only create / edit / delete).

| Option | Choices |
| --- | --- |
| Navbar | classic, minimal, centred, floating rounded bar |
| Hero | text left / photo right, photo left, centred with round photo, huge headline without photo |
| Projects | two per row, three per row, wide rows, image tiles with the title on top |
| Section headings | left, centred |
| Footer | columns, simple centred |
| Page width | narrow, standard, wide |

- **Panel > Layouts** shows a wireframe thumbnail of each layout, drawn in the site's current theme.
- Six layouts are added on first start (`Backend/app/core/default_layouts.py`).
- To add a new choice to an option: add the value in `Backend/app/schemas/layout.py` and
  `Frontend/src/layout.js`, then write its CSS under "Layout variants" in
  `Frontend/src/styles/global.css` (the site wrapper carries a `data-<option>` attribute).

## Fonts

Each site can set its own typography on top of its theme (**Panel > Fonts**). The choice is saved
on the profile (`profile.typography`) and works with any theme and layout.

- Ready-made font pairings, or pick the heading font, text font and logo style separately.
- Heading size (compact / normal / large), headings in capitals, and overall text size.
- "Theme fonts" goes back to whatever the selected theme uses.
- To add a font: add it to `HEADING_FONTS` or `BODY_FONTS` in `Frontend/src/theme.js` (with its
  Google Fonts name) and to the matching list in `Backend/app/schemas/theme.py`.

## Home page sections

The home page is built from blocks that each site arranges for itself (`profile.home_sections`):
order them and turn each one on or off. The hero is always first.

Blocks: what-I-bring strip, projects, stats (big numbers), process, services, testimonials,
experience, skills, FAQ, dark highlight band, contact form, accent banner. A block with no
content hides itself. Stats and Testimonials are edited under **Home page** in the panel.

To add a new block: add its key to `HOME_SECTION_KEYS` in `Backend/app/core/defaults.py` and to
`HomeSection` in `Backend/app/schemas/profile.py`, write the component in
`Frontend/src/pages/homeSections.jsx`, and name it in `Frontend/src/sectionCatalog.js`.

## Design Studio

**Panel > Design Studio** is the live editor: theme, layout, fonts and sections on the left, the
real site on the right at desktop, tablet or mobile width. Changes are only drawn in the preview
until **Publish changes** is pressed. Private themes and layouts can be previewed but not published
by a normal user.

How the preview works: the Studio shows the public site in a frame and sends it the unsaved
settings with `postMessage`; the site accepts them only from a parent page on the same origin
(see `usePreviewDraft` in `Frontend/src/context/SiteContext.jsx`).

## Any profession

The product is not tied to one kind of work.

- **Starter content:** at sign up (and later from the Dashboard) the owner picks a profession and
  the site is filled with matching headings, services, skills, process steps, FAQ, work categories
  and contact topics. The list is in `Backend/app/core/professions.py`; add an entry there to offer
  a new profession.
- **Editable wording:** menu labels, buttons and page labels are texts (Site content > Text, menus
  and options), so "Projects" can be "Client work", "Portfolio" or "Courses".
- **Editable options:** work categories (the filter tabs), contact form topics and budget choices
  are per-site lists on the same page.

## The panel

The panel has its own neutral look (`Frontend/src/styles/admin.css`) and never follows a site
theme. Its name comes from `Frontend/src/brand.js`. The sidebar is defined in `buildModules` in
`Frontend/src/admin/AdminLayout.jsx`: a module is one page, or a group that opens to show its pages.

## Accounts and security

- **Sign up** at `/signup` (turn off with `ALLOW_SIGNUP=false` in `Backend/.env`). Sign in with a
  username or an email.
- **Forgot password** at `/forgot-password` emails a link that works once and expires after
  `RESET_TOKEN_MINUTES`. Only a hash of the token is stored. The answer is the same whether or not
  the email has an account.
- **Email:** set the `SMTP_*` values in `Backend/.env` to send real email. While `SMTP_HOST` is
  empty the reset link is printed in the backend terminal instead.
- **Sessions:** changing or resetting a password signs out every other device (`users.token_version`).
- **Rate limits** per address on sign in, sign up, password reset, the contact form and analytics
  (`Backend/app/core/rate_limit.py`). Counts live in memory: use a shared store behind several servers.
- **Uploads** are checked by extension, size and file signature, and are served with headers that
  stop them running scripts.
- **No raw HTML anywhere:** case studies and custom sections are stored as typed fields, links must
  be `http(s)` (or a page path), and videos are embedded only by a checked YouTube/Vimeo id.

Before going live: use HTTPS, a strong `SECRET_KEY` and admin password, real SMTP, and add email
verification for new accounts (not built yet).

## Case studies, custom sections and analytics

- **Case study** (Panel > Projects > a project): blocks of heading, text, image, quote and video,
  shown on the project page. Images live in `uploads/case/<project id>/` and unused ones are removed on save.
- **Custom sections** (Panel > Home page > Custom sections): your own home page blocks with a
  heading, text, image and button. Arrange them in the Design Studio's Sections tab.
- **Analytics** (Panel > Analytics): page views, visitors, project views, resume downloads and
  messages for 7, 30 or 90 days. No cookies and no stored IP addresses; bots, the Studio preview
  and signed-in visits are not counted.

## Setting up on another computer

```powershell
cd Backend
python -m venv venv
venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env      # then fill in the database password, SECRET_KEY and admin password

cd ..\Frontend
npm install
```

## Folder structure

```
Backend/
  .env                  settings: database, secret key, first admin, upload limits
  requirements.txt
  uploads/              uploaded photos, project images and the resume
  app/
    main.py             creates the app, tables and sample content
    core/               config, database connection, security, default content
    models/             database tables
    schemas/            request and response shapes (validation)
    repositories/       database queries
    services/           business logic (auth, files, projects, sections, messages)
    api/routes/         HTTP endpoints: public, auth and admin

Frontend/
  src/
    api/client.js       every call to the backend
    context/            shared site data and admin sign-in state
    components/         navbar, footer, project card, contact form, banner
    pages/              Home, Projects, Project detail, Services, About, Contact
    admin/              admin panel screens
    styles/             global.css (public site), admin.css (admin panel)
```

## Editing content

| To change | Go to |
| --- | --- |
| Name, email, links, photos, resume | Admin > Profile, photos and resume |
| Any heading or paragraph | Admin > Headings and text |
| Projects, thumbnails, gallery images | Admin > Projects |
| Services, industries, FAQ, experience, skills and other lists | Admin > the matching entry under Home / Services / About page |
| Contact form submissions | Admin > Messages |

In headings, wrap words in `*stars*` to colour them purple.


//  Backend : python -m uvicorn app.main:app --reload
//  Fronend : npm run dev 
## Showing and hiding parts of a site

**Design Studio > Show / hide** has a switch for every page (work, services, about, contact) and
for the parts of the hero, the Services page, the About page, the menu and the footer. Switching
something off never deletes it. The site stores the keys it hides in `settings.hidden`.

A hidden page leaves the menu and footer and its address shows "page not found"; buttons that lead
to a hidden page disappear with it. To make another part hideable, add its key to
`Frontend/src/visibility.js` and wrap the part in `shown('<key>') && ...` (see `useShown`).

## Landing page and addresses

| Address | What it is |
| --- | --- |
| `/` | The product's landing page (`Frontend/src/pages/Landing.jsx`, styles in `styles/landing.css`) |
| `/signup`, `/admin/login` | Create an account, sign in |
| `/welcome` | First screen after signing up: choose a profession and a theme |
| `/admin` | The panel (user or admin, depending on the account) |
| `/u/<username>` | A portfolio site. The admin's own site is at `/u/admin` |

The landing page reads its themes and counts from `GET /api/showcase`, so it only shows what a
new user can really pick. Any unknown address goes back to the landing page.

## Styling each part of a site separately

A layout preset sets the style of every part at once. On top of it, a site can choose its own
style for any single part in **Design Studio > Layout > Customise each part**; a part left alone
follows the preset. The choices are stored in `profile.layout_custom`, and picking a new preset
clears them.

Parts: navbar, footer, page width, section headings, hero, projects, process steps, stats,
testimonials, services list, About page header and contact section. They are listed in
`Frontend/src/layout.js` (with the styles each offers) and `Backend/app/schemas/layout.py`.
To add a style: add the value in both files, then write its CSS under "Layout variants" in
`Frontend/src/styles/global.css` (the site wrapper carries `data-<part>="<style>"`).

## Visual editor

It lives inside the Design Studio (Panel > Design > Design Studio): the preview is the real
site, with a formatting toolbar above it.

- Drag any text or the hero / about photo to move it (saved as an `x` / `y` offset in pixels,
  applied on screens 900px and wider; phones keep the normal single-column layout).
- On the home page, hover a section and drag its handle to move the whole section up or down.

- Click a text (heading, paragraph, button label, a service, step, FAQ, testimonial…) to select it.
- Toolbar: font, size (50% to 300% of the text's normal size), bold, italic, underline,
  left / centre / right, text colour, clear formatting.
- Click the selected text again to retype it. In headings, `*stars*` give words the accent colour.
- Nothing changes for visitors until "Publish changes".

Styles are saved per text in `profile.text_styles` (`PUT /api/admin/text-styles`), keyed
`t:<text key>` for page texts and `i:<entry id>:<field>` for list entries. On the site a text
is made editable by drawing it with `<E>` (`Frontend/src/components/Editable.jsx`).

## Continue with Google

The sign-in and sign-up screens show a "Continue with Google" button once a client ID is set.

1. Open https://console.cloud.google.com/ > APIs & Services > Credentials (create a project if asked,
   and fill in the OAuth consent screen: app name, your email).
2. Create credentials > OAuth client ID > Application type "Web application".
3. Under "Authorized JavaScript origins" add `http://localhost:5173` and `http://localhost`
   (later also the real address of the site, with https).
4. Copy the client ID (it ends in `.apps.googleusercontent.com`) into `Backend/.env`:
   `GOOGLE_CLIENT_ID=...` and restart the backend. No client secret is needed.

How it behaves:
- New Google email: an account is created (username from the email) and the person lands on onboarding.
- Known Google account: straight to the panel.
- Email already used by a password account: the two are joined, and the old password and open
  sessions of that account stop working (emails are not verified at sign up, so this protects
  the real owner of the address). A new password can be set with "Forgot password".

## Continue with Facebook

1. Open https://developers.facebook.com/ > My Apps > Create App (use case "Authenticate and request
   data from users with Facebook Login").
2. In the app: Use cases > Facebook Login > make sure the `email` permission is added.
3. Facebook Login > Settings: switch on "Login with the JavaScript SDK" and add `http://localhost:5173`
   (later the real https address) under "Allowed Domains for the JavaScript SDK".
4. App settings > Basic: copy the App ID and App secret into `Backend/.env`:
   `FACEBOOK_APP_ID=...` and `FACEBOOK_APP_SECRET=...`, then restart the backend.
5. While the app is in "Development" mode only you (and people you add as testers) can sign in.
   Switch it to "Live" for everyone; Facebook then asks for a privacy policy address.

It behaves like Google sign-in: a new email makes an account and goes to onboarding, a known one
goes to the panel, and the first join with a password account ends that account's old password.
Someone whose Facebook account shares no email address cannot sign in this way.

While a provider has no keys, its button is hidden on the built site. During development
(`npm run dev`) it is shown and tells you what is missing when clicked.
