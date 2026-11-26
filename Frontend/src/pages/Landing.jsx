// The product's landing page: what a visitor sees first, before signing up or logging in.
// Every claim on it is something the product really does; the themes shown come from the database.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../admin/adminUi'
import { ThemePreview } from '../admin/Themes'
import { api } from '../api/client'
import { PRODUCT_NAME } from '../brand'
import { useAuth } from '../context/AuthContext'
import { useFetch } from '../hooks'
import { BLANK_TOKENS } from '../theme'
import '../styles/landing.css'

const NAV = [
  ['#themes', 'Themes'],
  ['#how', 'How it works'],
  ['#features', 'Features'],
  ['#faq', 'FAQ'],
]

// [icon, title, one line, the longer explanation shown by "Read more"]
const STEPS = [
  [
    'enter',
    'Create your account',
    'Sign up with your name and email, then tell us what kind of work you do.',
    [
      'Signing up takes about a minute. You only need a name, a username, an email and a password.',
      'Your username becomes your site link, for example /u/ayesha.',
      'Next you choose your work: designer, developer, photographer, writer and so on. You can choose more than one.',
      'We use that choice to fill your new site with ready headings, services and questions, so you never start from an empty page.',
    ],
  ],
  [
    'pen',
    'Add your own details',
    'Fill in simple forms: your photo, bio, projects, services, experience and skills.',
    [
      'Everything is a normal form: type in a box, upload a picture, press save. No code.',
      'Add projects with a cover image, a short summary and a full case study page.',
      'Upload your resume so visitors can download it, and add your LinkedIn or other links.',
      'You can come back and change anything later. Nothing is locked.',
    ],
  ],
  [
    'layout',
    'Choose how it looks',
    'Pick a theme, a layout and fonts, and see each one on your real site before you decide.',
    [
      'A theme sets the colours and the mood. A layout sets where things sit on the page. Fonts set the style of the letters.',
      'You can mix them freely: any theme with any layout and any font.',
      'The Design Studio shows your real site as you try things, on desktop, tablet and phone sizes.',
      'Changing the look never deletes your content. Your text and photos stay exactly as they are.',
    ],
  ],
  [
    'globe',
    'Publish and share',
    'Press publish and your site is updated. Share your link with clients and employers.',
    [
      'Your site has its own link from the first day, so you can share it as soon as you are happy with it.',
      'Visitors only see what you have published. Changes you are still trying stay private until you press publish.',
      'People can read about your work, open your projects, download your resume and send you a message.',
      'Messages from your contact form arrive in your panel, where only you can read them.',
    ],
  ],
]

const FEATURES = [
  [
    'undo',
    'Switch themes anytime',
    'Try a new look in one click. Your projects, bio and links stay exactly where they are.',
    [
      'Your content and your design are stored separately.',
      'That means you can change the whole look of your site as often as you like and never type anything twice.',
      'Do not like the new look? Switch back the same way.',
    ],
  ],
  [
    'sliders',
    'Live Design Studio',
    'Change theme, layout, fonts and sections and watch your real site update as you go.',
    [
      'The Design Studio is one screen with your settings on the left and your real site on the right.',
      'Every change shows up at once, so you can see what works before anyone else does.',
      'Check how it looks on a desktop, a tablet and a phone with one click.',
      'Nothing changes for your visitors until you press publish. Press discard and it all goes back.',
    ],
  ],
  [
    'edit',
    'Edit right on the page',
    'Click any text on your site to retype it or change its font, size, colour and alignment.',
    [
      'Click a heading, a paragraph or a button and a toolbar lets you style it.',
      'Click it again to type new words straight onto the page.',
      'You can even style just one word: make it bigger, bold, or give it any colour you like.',
      'Great for small fixes, because you see the result exactly where it will appear.',
    ],
  ],
  [
    'layout',
    'Move and resize things',
    'Drag a photo, a text, a button or a card to a new place, and pull its corners to resize it.',
    [
      'Pick something up with the mouse and drop it where you want it.',
      'Pull any corner to make it bigger or smaller.',
      'On the home page you can drag whole sections up or down to change their order.',
      'One button puts anything back in its original place, so it is safe to experiment.',
      'Moved things are shown on larger screens. On phones the page keeps its simple one-column order so it stays easy to read.',
    ],
  ],
  [
    'sliders',
    'Build your own home page',
    'Choose which sections appear, put them in your order, hide what you do not need and add your own.',
    [
      'Sections are the blocks of your home page: your work, services, process, testimonials, numbers, questions, contact and more.',
      'Switch any section, page or small part on or off. Hidden things are not deleted and come back when you switch them on.',
      'Need something special? Add your own section with a heading, text, a picture and a button.',
    ],
  ],
  [
    'pen',
    'Projects and case studies',
    'Show your work with pictures, and tell the full story of a project on its own page.',
    [
      'Each project has a cover image, a category and a short summary on your work page.',
      'Open a project and visitors see its own page: the client, your role, the tools you used and the results.',
      'Build the story with headings, text, images, quotes and video.',
      'Mark your best project as featured to show it larger than the rest.',
    ],
  ],
  [
    'mail',
    'Contact form and messages',
    'Visitors write to you from your site, and every message lands in your panel.',
    [
      'Your site comes with a contact form. You decide the topics people can choose from.',
      'Messages are saved in your panel, where only you can read them.',
      'The form has protection against spam robots built in.',
    ],
  ],
  [
    'chart',
    'Visitor analytics',
    'See how many people visit, which projects they open and how often your resume is downloaded.',
    [
      'Simple numbers and charts for the last 7, 30 or 90 days.',
      'Find out which pages and projects get the most attention.',
      'It works without cookies and does not store visitor IP addresses, so you need no cookie banner for it.',
    ],
  ],
  [
    'briefcase',
    'Made for any profession',
    'Start with content written for designers, developers, accountants, photographers and more.',
    [
      'When you sign up you say what you do, and your site starts with words that fit that work.',
      'Do more than one thing? Choose several, and their services and skills are combined.',
      'It is only a starting point: every heading, service and question can be changed.',
    ],
  ],
]

const FAQS = [
  ['Do I need design or coding skills?', 'No. You fill in simple forms and pick a theme. Every theme is designed for you and works on phones, tablets and desktops.'],
  ['Can I change my theme later?', 'Yes, as often as you like. Your content is kept separate from the look, so nothing has to be typed again.'],
  ['What can I put on my site?', 'Projects with image galleries and case studies, services, experience, skills, testimonials, an FAQ, your resume and a contact form.'],
  ['Will it work for my kind of work?', 'Yes. When you sign up you choose what you do, and your site starts with headings, services and options that fit it. You can edit all of it.'],
  ['Is my visitors’ data private?', 'Analytics are counted without cookies and without storing IP addresses, and messages from your contact form are only visible to you.'],
]

function Brand() {
  return (
    <span className="land-brand">
      <span className="land-brand__mark" aria-hidden="true">
        {PRODUCT_NAME.charAt(0)}
      </span>
      {PRODUCT_NAME}
    </span>
  )
}

// The longer explanation of a step or feature, opened with "Read more".
function More({ title, points }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="land-more">
      {open && (
        <ul>
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      )}
      <button type="button" aria-expanded={open} aria-label={`${open ? 'Show less' : 'Read more'} about: ${title}`} onClick={() => setOpen(!open)}>
        {open ? 'Show less' : 'Read more'}
        <Icon name={open ? 'up' : 'down'} size={14} />
      </button>
    </div>
  )
}

// The picture in the hero: a finished portfolio in a browser window, the same product on a phone
// in another theme, and two cards for what the panel does. Drawn with plain elements, so it
// stays sharp at any size; every measure inside is relative to the picture's own width.
// [icon, title, one line] shown under the buttons of the hero
const HERO_POINTS = [
  ['edit', 'Edit right on the page', 'Click any text to retype it or change its font, size and colour.'],
  ['layout', 'Your layout, your way', 'Drag, resize and reorder sections until it looks right.'],
  ['briefcase', 'Projects and case studies', 'Show your work with pictures and tell the story behind it.'],
  ['chart', 'Messages and visitors', 'A contact form, an inbox and simple visitor numbers built in.'],
]

const HERO_LOOKS = [
  ['light', 'Light theme'],
  ['dark', 'Dark theme'],
  ['cream', 'Warm theme'],
]

function HeroPicture() {
  const address = `${PRODUCT_NAME.toLowerCase()}/u/ayesha`
  // "Switch theme" works: the site in the window is redrawn in the chosen look.
  const [look, setLook] = useState('light')
  return (
    <div className="hm">
      <div className="hm__scale">
        <div className={`hm-browser hm-look--${look}`} aria-hidden="true">
          <div className="hm-browser__bar">
            <i />
            <i />
            <i />
            <span>
              <Icon name="lock" size={10} />
              {address}
            </span>
          </div>
          <div className="hm-site">
            <div className="hm-site__nav">
              <b>ayesha.</b>
              <span>Work</span>
              <span>About</span>
              <span>Experience</span>
              <span>Contact</span>
              <em>Hire me</em>
            </div>
            <div className="hm-site__hero">
              <div>
                <p className="hm-badge">
                  <i /> Available for new projects
                </p>
                <p className="hm-site__title">Hi, I&apos;m Ayesha Khan.</p>
                <p className="hm-site__role">Product Designer &amp; Frontend Developer · Dubai, UAE</p>
                <p className="hm-site__text">
                  I design and build calm, useful digital products. For 6 years I have helped startups turn messy ideas into apps people actually enjoy using.
                </p>
                <p className="hm-site__buttons">
                  <em>View my work</em>
                  <span>Download CV</span>
                </p>
              </div>
              <div className="hm-site__blob">A</div>
            </div>
            <div className="hm-site__work">
              <p>Portfolio</p>
              <b>Selected work</b>
              <div>
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
        </div>

        <div className="hm-phone" aria-hidden="true">
          <div className="hm-phone__screen">
            <div className="hm-phone__nav">
              <b>hira saleem</b>
              <span />
            </div>
            <p className="hm-badge">
              <i /> Available for new projects
            </p>
            <p className="hm-phone__title">Designing products people love to use.</p>
            <p className="hm-phone__text">Product designer helping startups turn messy ideas into apps people love. Currently leading design at Kite Labs.</p>
            <em>View my work</em>
            <span className="hm-phone__ghost">Get in touch</span>
            <div className="hm-phone__card">
              <div>
                <i />
                <u />
                <u />
                <s />
              </div>
            </div>
          </div>
        </div>

        <div className="hm-card hm-live" aria-hidden="true">
          <span>
            <Icon name="check" size={14} />
          </span>
          <p>
            <b>Your site is live</b>
            {address}
          </p>
        </div>

        <div className="hm-card hm-switch">
          <b>Switch theme</b>
          <div role="group" aria-label="Try a theme on the example site">
            {HERO_LOOKS.map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={`hm-thumb hm-thumb--${key} ${look === key ? 'is-active' : ''}`}
                aria-label={label}
                aria-pressed={look === key}
                title={label}
                onClick={() => setLook(key)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// A portfolio drawn in a browser window, for the picture in the hero.
function Frame({ tokens }) {
  return (
    <div className="land-mock__browser">
      <div className="land-mock__bar">
        <i />
        <i />
        <i />
        <span>{PRODUCT_NAME.toLowerCase()}/u/ayesha</span>
      </div>
      <ThemePreview tokens={tokens} name="Ayesha Khan" />
    </div>
  )
}

function Faq({ question, answer, open, onToggle }) {
  return (
    <div className={`land-faq__item ${open ? 'is-open' : ''}`}>
      <h3>
        <button type="button" aria-expanded={open} onClick={onToggle}>
          <span>{question}</span>
          <Icon name={open ? 'close' : 'plus'} />
        </button>
      </h3>
      {open && <p>{answer}</p>}
    </div>
  )
}

export default function Landing() {
  const { user } = useAuth()
  const { data, error } = useFetch(api.showcase)
  const [openFaq, setOpenFaq] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.title = `${PRODUCT_NAME} | Your portfolio website, live in minutes`
  }, [])

  const themes = data?.themes || []
  const heroTokens = themes[0]?.tokens || BLANK_TOKENS
  // Signed-in people go straight to their panel instead of signing up again.
  const start = user ? { to: '/admin', label: 'Go to my panel' } : { to: '/signup', label: 'Get started free' }

  return (
    <div className="land">
      <header className="land-nav">
        <div className="land-wrap land-nav__inner">
          <Link to="/" aria-label={`${PRODUCT_NAME} home`}>
            <Brand />
          </Link>
          <nav className={`land-nav__links ${menuOpen ? 'is-open' : ''}`} aria-label="Main">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
          <div className="land-nav__actions">
            {/* Both lead on to the panel for someone who is already signed in. */}
            <Link to="/admin/login" className="land-btn land-btn--small">
              Sign in
            </Link>
            <Link to="/signup" className="land-btn land-btn--primary land-btn--small">
              Sign up
            </Link>
            <button type="button" className="land-nav__toggle" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="land-hero">
          <div className="land-wrap land-hero__grid">
            <div>
              {data && (
                <p className="land-pill">
                  <b>New</b> {data.theme_count} themes and {data.layout_count} layouts to mix
                </p>
              )}
              <h1>
                Your portfolio website, <span>live in minutes.</span>
              </h1>
              <p className="land-lead">
                {PRODUCT_NAME} turns your work into a professional website, with no code and no designer. Fill in your details once, pick a look you
                love and publish. Switch designs anytime: your content stays put.
              </p>
              <div className="land-actions">
                <Link to={start.to} className="land-btn land-btn--primary">
                  {user ? start.label : 'Start for free'}
                </Link>
                <a href="#themes" className="land-btn">
                  Browse themes
                </a>
              </div>
              <ul className="land-checks">
                <li>
                  <Icon name="check" size={14} /> Free to start
                </li>
                <li>
                  <Icon name="check" size={14} /> Your own site link
                </li>
                <li>
                  <Icon name="check" size={14} /> Switch themes anytime
                </li>
              </ul>
              {/* What you get, in four short points. */}
              <ul className="land-points">
                {HERO_POINTS.map(([icon, title, text]) => (
                  <li key={title}>
                    <span>
                      <Icon name={icon} size={16} />
                    </span>
                    <p>
                      <b>{title}</b>
                      {text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <HeroPicture />
          </div>
        </section>

        {data && (
          <section className="land-strip" aria-label="Who it is for">
            <div className="land-wrap">
              <p>Starter content for every kind of work</p>
              <ul>
                {data.professions
                  .filter((profession) => profession.key !== 'other')
                  .map((profession) => (
                    <li key={profession.key}>{profession.label.split(' (')[0].split(' / ')[0]}</li>
                  ))}
              </ul>
            </div>
          </section>
        )}

        <section className="land-section" id="how">
          <div className="land-wrap">
            <p className="land-tag">How it works</p>
            <h2>From sign up to live site in four simple steps</h2>
            <p className="land-sub">No code and no design skills needed. Press “Read more” on any step to see exactly what happens.</p>
            <ol className="land-steps">
              {STEPS.map(([icon, title, text, points], index) => (
                <li key={title}>
                  <span className="land-icon">
                    <Icon name={icon} size={18} />
                  </span>
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <More title={title} points={points} />
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Always on the page, so the "Themes" link in the menu has somewhere to go. */}
        <section className="land-section land-section--tint" id="themes">
            <div className="land-wrap">
              <p className="land-tag">Themes</p>
              <h2>A look for every kind of portfolio</h2>
              <p className="land-sub">Hand-made themes that work on every screen. Your content moves with you when you switch.</p>
              <ul className="land-themes">
                {themes.map((theme) => (
                  <li key={theme.id}>
                    <ThemePreview tokens={theme.tokens} name="Ayesha Khan" />
                    <div>
                      <strong>{theme.name}</strong>
                      <span>{theme.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
              {themes.length === 0 && (
                <p className="land-empty">{error ? 'The themes could not be loaded right now. Please try again in a moment.' : 'Loading themes…'}</p>
              )}
            </div>
          </section>

        <section className="land-section" id="features">
          <div className="land-wrap">
            <p className="land-tag">Features</p>
            <h2>Everything you need to look professional online</h2>
            <p className="land-sub">Each feature in plain words. Press “Read more” for the details.</p>
            <ul className="land-features">
              {FEATURES.map(([icon, title, text, points]) => (
                <li key={title}>
                  <span className="land-icon land-icon--soft">
                    <Icon name={icon} size={18} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <More title={title} points={points} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="land-dark">
          <div className="land-wrap land-dark__grid">
            <div>
              <p className="land-tag land-tag--dark">Design Studio</p>
              <h2>See every change before anyone else does</h2>
              <p>
                Try themes, layouts, fonts and sections on your real site, on desktop, tablet and phone. Visitors keep seeing the old version until you press publish.
              </p>
              <ul>
                <li>
                  <Icon name="check" size={14} /> Live preview of your own content
                </li>
                <li>
                  <Icon name="check" size={14} /> Hide any page or part you do not need
                </li>
                <li>
                  <Icon name="check" size={14} /> Nothing is ever deleted when you switch
                </li>
              </ul>
            </div>
            <div className="land-studio" aria-hidden="true">
              <div className="land-studio__panel">
                <p>Theme</p>
                {themes.slice(0, 4).map((theme, index) => (
                  <span key={theme.id} className={index === 1 ? 'is-active' : ''}>
                    {[theme.tokens.colors.bg, theme.tokens.colors.accent, theme.tokens.colors.dark].map((colour) => (
                      <i key={colour} style={{ background: colour }} />
                    ))}
                    {theme.name}
                  </span>
                ))}
              </div>
              <div className="land-studio__preview">
                <ThemePreview tokens={(themes[1] || themes[0])?.tokens || BLANK_TOKENS} name="Ayesha Khan" />
              </div>
            </div>
          </div>
        </section>

        <section className="land-section land-section--tint" id="faq">
          <div className="land-wrap land-wrap--narrow">
            <p className="land-tag">FAQ</p>
            <h2>Questions? We have answers.</h2>
            <div className="land-faq">
              {FAQS.map(([question, answer], index) => (
                <Faq key={question} question={question} answer={answer} open={openFaq === index} onToggle={() => setOpenFaq(openFaq === index ? -1 : index)} />
              ))}
            </div>
          </div>
        </section>

        <section className="land-section">
          <div className="land-wrap">
            <div className="land-cta">
              <h2>Your next client is looking for you.</h2>
              <p>Give them something great to find. Create your portfolio in a few minutes.</p>
              <Link to={start.to} className="land-btn land-btn--light">
                {user ? start.label : 'Create my portfolio'}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="land-footer">
        <div className="land-wrap land-footer__grid">
          <div>
            <Brand />
            <p>Portfolio websites for people who would rather do their work than build a website.</p>
          </div>
          <div>
            <h2>Product</h2>
            {NAV.map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </div>
          <div>
            <h2>Account</h2>
            <Link to="/admin/login">Sign in</Link>
            <Link to="/signup">Sign up</Link>
            <Link to="/forgot-password">Forgot password</Link>
          </div>
        </div>
        <div className="land-wrap land-footer__bottom">
          © {new Date().getFullYear()} {PRODUCT_NAME}
        </div>
      </footer>
    </div>
  )
}
