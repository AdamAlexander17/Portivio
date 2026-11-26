import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { api, getToken } from '../api/client'
import { EDIT_SELECT, SiteProvider, useEditMode, useShown, useSiteNav, useSiteState } from '../context/SiteContext'
import E from './Editable'
import { layoutAttrs } from '../layout'
import { loadTextFonts, loadThemeFonts, TEXT_SCALES, themeStyle } from '../theme'

// `text` is the key of the label in the site's editable texts;
// `page` is the visibility key that lets the owner switch the page off.
const LINKS = [
  { to: '', text: 'nav_home', end: true },
  { to: '/projects', text: 'nav_projects', page: 'page.projects' },
  { to: '/services', text: 'nav_services', page: 'page.services' },
  { to: '/about', text: 'nav_about', page: 'page.about' },
  { to: '/contact', text: 'nav_contact', page: 'page.contact' },
]

function Navbar({ logo, texts }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { base } = useSiteNav()
  const shown = useShown()
  const links = LINKS.filter((link) => !link.page || shown(link.page))
  // The button leads to the contact page, so it goes when that page is off.
  const showButton = shown('nav.button') && shown('page.contact')

  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="nav">
      <div className="container nav__inner">
        <E k="logo_text" as={Link} to={base || '/'} className="logo" aria-label="Home" />

        <nav className={`nav__links ${open ? 'is-open' : ''}`} id="site-menu" aria-label="Main">
          {links.map((link) => (
            <E key={link.text} k={link.text} as={NavLink} to={`${base}${link.to}` || '/'} end={link.end} className="nav__link" />
          ))}
          {showButton && (
            <E k="nav_button" as={Link} to={`${base}/contact`} className="btn btn--primary nav__cta-mobile" />
          )}
        </nav>

        {showButton && (
          <E k="nav_button" as={Link} to={`${base}/contact`} className="btn btn--primary nav__cta" />
        )}

        <button
          type="button"
          className={`nav__toggle ${open ? 'is-open' : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}

function Footer({ profile, texts }) {
  const { base } = useSiteNav()
  const shown = useShown()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <E k="logo_text" as={Link} to={base || '/'} className="logo logo--light" />
            <E k="footer_tagline" as="p" className="footer__tagline" />
          </div>
          <div hidden={!shown('footer.pages')}>
            <h2 className="footer__label">Pages</h2>
            {LINKS.filter((link) => link.page && shown(link.page)).map((link) => (
              <Link key={link.text} to={`${base}${link.to}`}>
                {texts[link.text]}
              </Link>
            ))}
          </div>
          <div hidden={!shown('footer.social') || !(profile.linkedin_url || profile.behance_url || profile.email)}>
            <h2 className="footer__label">Elsewhere</h2>
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            )}
            {profile.behance_url && (
              <a href={profile.behance_url} target="_blank" rel="noreferrer">
                Behance
              </a>
            )}
            {profile.email && <a href={`mailto:${profile.email}`}>Email</a>}
          </div>
          {shown('footer.location') && (profile.location || texts.location_note) && (
            <div>
              <h2 className="footer__label">Based in</h2>
              <p>{profile.location}</p>
              <p>{texts.location_note}</p>
            </div>
          )}
        </div>
        <div className="footer__bottom">
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <E k="footer_note" />
        </div>
      </div>
    </footer>
  )
}

function Shell() {
  const { site, error, reload } = useSiteState()
  const { username } = useSiteNav()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    // Count the visit for the owner's analytics, except inside the Studio preview
    // and for someone signed in to the panel (that is the owner or an admin).
    if (window.parent === window && !getToken()) api.track({ kind: 'view', path: pathname }, username)
  }, [pathname, username])

  const tokens = site?.theme?.tokens
  const typography = site?.typography
  useEffect(() => {
    if (!tokens) return undefined
    loadThemeFonts(tokens, typography)
    // Match the page behind the site (visible when over-scrolling) to the theme.
    document.body.style.background = tokens.colors.bg
    // Sizes are in rem, so the root font size scales all text on the public site.
    document.documentElement.style.fontSize = (TEXT_SCALES[typography?.text_scale] || TEXT_SCALES.normal)[1]
    return () => {
      document.body.style.background = ''
      document.documentElement.style.fontSize = ''
    }
  }, [tokens, typography])

  const textStyles = site?.text_styles
  useEffect(() => loadTextFonts(textStyles), [textStyles])

  // In the Visual editor a click chooses a text; it must not follow links or send forms.
  const editing = Boolean(useEditMode())
  useEffect(() => {
    if (!editing) return undefined
    const onClick = (event) => {
      if (event.target.closest('a')) event.preventDefault()
      if (!event.target.closest('[data-edit]')) window.parent.postMessage({ type: EDIT_SELECT, key: null }, window.location.origin)
    }
    const onSubmit = (event) => event.preventDefault()
    document.addEventListener('click', onClick, true)
    document.addEventListener('submit', onSubmit, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('submit', onSubmit, true)
    }
  }, [editing])

  if (!site) {
    return (
      <div className="page-state">
        {error ? (
          <>
            <p>{error}</p>
            <button type="button" className="btn btn--outline" onClick={reload}>
              Try again
            </button>
          </>
        ) : (
          <div className="spinner" role="status" aria-label="Loading" />
        )}
      </div>
    )
  }

  // The whole public site sits inside .site, which carries the theme's CSS variables
  // and the layout's choices (as data attributes).
  return (
    <div className={`site ${editing ? 'site--editing' : ''}`} style={themeStyle(tokens, typography)} {...layoutAttrs(site.layout_options || site.layout?.options)}>
      <Navbar logo={site.texts.logo_text} texts={site.texts} />
      <main>
        <Outlet />
      </main>
      <Footer profile={site.profile} texts={site.texts} />
    </div>
  )
}

// Wraps the public pages of one portfolio: the primary site, or /u/<username>.
export default function Layout() {
  const { username = '' } = useParams()
  const load = useCallback(() => api.site(username), [username])
  return (
    <SiteProvider key={username} load={load} username={username} previewable>
      <Shell />
    </SiteProvider>
  )
}
