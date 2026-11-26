import { useEffect, useMemo, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { PRODUCT_NAME } from '../brand'
import { useAuth } from '../context/AuthContext'
import { publicBase, SiteProvider, useSiteState } from '../context/SiteContext'
import { ConfirmProvider, TitleProvider } from './adminUi'
import { SECTIONS } from './sections'

// Simple line icons (24px grid), one per module.
const ICONS = {
  dashboard: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 8h6V4h-6z',
  projects: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  messages: 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm0 1l8 6 8-6',
  analytics: 'M4 20V10M10 20V4M16 20v-7M21 20H3',
  design: 'M12 3a9 9 0 1 0 0 18c1.400 0 2-.900 2-1.800 0-1.700-1.300-1.700-1.300-3 0-1 .800-1.700 1.800-1.700H17a4 4 0 0 0 4-4c0-4.100-4-7.500-9-7.500zM7.500 12h.010M9.500 8h.010M14.500 8h.010',
  content: 'M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm7 0v5h5M9 13h6M9 17h6',
  home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
  services: 'M4 8h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zm5 0V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18',
  about: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0',
  users: 'M9 11a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7zm-6 9a6 6 0 0 1 12 0M16 4.500a3.500 3.500 0 0 1 0 6.500M18 14.500a6 6 0 0 1 3 5.500',
  account: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.400-3a7.400 7.400 0 0 0-.100-1.300l2-1.500-2-3.400-2.300.900a7.400 7.400 0 0 0-2.200-1.300L14.500 3h-5l-.300 2.400a7.400 7.400 0 0 0-2.200 1.300l-2.300-.900-2 3.400 2 1.500a7.400 7.400 0 0 0 0 2.600l-2 1.500 2 3.400 2.300-.900a7.400 7.400 0 0 0 2.200 1.300l.300 2.400h5l.300-2.400a7.400 7.400 0 0 0 2.200-1.300l2.300.900 2-3.400-2-1.500c.100-.400.100-.900.100-1.300z',
}

function Icon({ name }) {
  return (
    <svg className="adm-nav__icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.600" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

const sectionLinks = (page) =>
  Object.entries(SECTIONS)
    .filter(([, config]) => config.page === page)
    .map(([key, config]) => ({ to: `/admin/sections/${key}`, label: config.label }))

// The sidebar: a module is either one page (`to`) or a group that opens to show its pages (`children`).
function buildModules(isAdmin) {
  return [
    { key: 'dashboard', label: 'Dashboard', to: '/admin', end: true },
    { key: 'projects', label: 'Projects', to: '/admin/projects' },
    { key: 'messages', label: 'Messages', to: '/admin/messages' },
    { key: 'analytics', label: 'Analytics', to: '/admin/analytics' },
    {
      key: 'design',
      label: 'Design',
      children: [
        { to: '/admin/studio', label: 'Design Studio' },
        { to: '/admin/themes', label: 'Themes' },
        { to: '/admin/layouts', label: 'Layouts' },
        { to: '/admin/fonts', label: 'Fonts' },
      ],
    },
    {
      key: 'content',
      label: 'Site content',
      children: [
        { to: '/admin/profile', label: 'Profile, photos and resume' },
        { to: '/admin/texts', label: 'Text, menus and options' },
      ],
    },
    { key: 'home', label: 'Home page', children: [...sectionLinks('Home'), { to: '/admin/custom-sections', label: 'Custom sections' }] },
    { key: 'services', label: 'Services page', children: sectionLinks('Services') },
    { key: 'about', label: 'About page', children: sectionLinks('About') },
    ...(isAdmin ? [{ key: 'users', label: 'Users', to: '/admin/users' }] : []),
    { key: 'account', label: 'Account', to: '/admin/account' },
  ]
}

const isUnder = (pathname, to) => pathname === to || pathname.startsWith(`${to}/`)

function Sidebar({ modules, pathname }) {
  const activeGroup = modules.find((module) => module.children?.some((child) => isUnder(pathname, child.to)))?.key
  const [open, setOpen] = useState(() => new Set(activeGroup ? [activeGroup] : []))

  // Moving to a page inside a closed group opens that group.
  useEffect(() => {
    if (activeGroup) setOpen((current) => (current.has(activeGroup) ? current : new Set(current).add(activeGroup)))
  }, [activeGroup])

  const toggle = (key) =>
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <nav className="adm-nav" aria-label="Panel">
      {modules.map((module) =>
        module.children ? (
          <div className="adm-nav__group" key={module.key}>
            <button
              type="button"
              className={`adm-nav__item ${activeGroup === module.key ? 'has-active' : ''}`}
              aria-expanded={open.has(module.key)}
              aria-controls={`nav-${module.key}`}
              onClick={() => toggle(module.key)}
            >
              <Icon name={module.key} />
              <span>{module.label}</span>
              <svg className="adm-nav__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
            <div className="adm-nav__sub" id={`nav-${module.key}`} hidden={!open.has(module.key)}>
              {module.children.map((child) => (
                <NavLink key={child.to} to={child.to}>
                  {child.label}
                </NavLink>
              ))}
            </div>
          </div>
        ) : (
          <NavLink key={module.key} to={module.to} end={module.end} className="adm-nav__item">
            <Icon name={module.key} />
            <span>{module.label}</span>
          </NavLink>
        ),
      )}
    </nav>
  )
}

function Panel() {
  const { user, isAdmin, logout, managing, setManaging } = useAuth()
  const { site } = useSiteState()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  // The open page fills these in (see usePageTitle and HeaderActions in adminUi).
  const [header, setHeader] = useState({ title: '', intro: '' })
  const [actionsNode, setActionsNode] = useState(null)
  const headerValue = useMemo(() => ({ setHeader, actionsNode }), [actionsNode])
  const pageTitle = header.title
  const modules = useMemo(() => buildModules(isAdmin), [isAdmin])

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} · ${PRODUCT_NAME}` : PRODUCT_NAME
  }, [pageTitle])

  // Back goes to the previous screen; if this is the first screen opened, to the dashboard.
  const onDashboard = pathname === '/admin'
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/admin'))

  // The public address of the portfolio being edited.
  const siteLink = `${publicBase(site?.owner)}/`

  // "Design › Themes": the module and page that are open, for the header bar.
  const crumbs = useMemo(() => {
    for (const module of modules) {
      const child = module.children?.find((item) => isUnder(pathname, item.to))
      if (child) return [module.label, child.label]
      if (module.to && (module.end ? pathname === module.to : isUnder(pathname, module.to))) return [module.label]
    }
    return [PRODUCT_NAME]
  }, [modules, pathname])

  return (
    <div className="adm">
      {/* On phones the sidebar slides in over the page; this dims the page behind it. */}
      {menuOpen && <button type="button" className="adm-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <aside className={`adm-side ${menuOpen ? 'is-open' : ''}`} id="admin-menu">
        <div className="adm-side__brand">
          <span className="adm-side__mark" aria-hidden="true">
            {PRODUCT_NAME.charAt(0)}
          </span>
          <span>
            <strong>{PRODUCT_NAME}</strong>
            <small>{isAdmin ? 'Admin' : 'My panel'}</small>
          </span>
        </div>

        <Sidebar modules={modules} pathname={pathname} />

        <div className="adm-side__foot">
          <div className="adm-side__user">
            <span className="adm-side__avatar" aria-hidden="true">
              {user.username.slice(0, 2).toUpperCase()}
            </span>
            <span className="adm-side__who">
              <strong>{user.username}</strong>
              <small>{isAdmin ? 'Administrator' : 'Member'}</small>
            </span>
            <button type="button" className="adm-side__out" aria-label="Sign out" title="Sign out" onClick={logout}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M4 12h11M11 8l4 4-4 4" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <div className="adm-body">
        {/* Header bar: where you are, and the way out to the live site. */}
        <header className="adm-top">
          <button
            type="button"
            className="adm-top__menu"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="admin-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          {!onDashboard && (
            <button type="button" className="adm-top__back" aria-label="Go back" title="Go back" onClick={goBack}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
            </button>
          )}
          <div className="adm-top__heading">
            <h1 className="adm-top__title">{pageTitle || crumbs[crumbs.length - 1]}</h1>
            {header.intro && <p>{header.intro}</p>}
          </div>
          <div className="adm-top__actions">
            <a href={siteLink} target="_blank" rel="noreferrer" className="adm-btn">
              <svg className="adm-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
              </svg>
              View site
            </a>
            {/* The open page's own buttons are placed here (HeaderActions). */}
            <div className="adm-top__slot" ref={setActionsNode} />
          </div>
        </header>

        <main className="adm-main">
          {managing && (
            <div className="adm-managing" role="status">
              <span>
                You are managing <strong>{managing.name || managing.username}</strong>'s site ({managing.username}).
              </span>
              <button type="button" className="adm-btn adm-btn--small" onClick={() => setManaging(null)}>
                Back to my own site
              </button>
            </div>
          )}
          <TitleProvider value={headerValue}>
            <Outlet />
          </TitleProvider>
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { user, checking, managing } = useAuth()

  if (checking) {
    return (
      <div className="page-state">
        <div className="spinner" role="status" aria-label="Loading" />
      </div>
    )
  }
  if (!user) return <Navigate to="/admin/login" replace />

  // The key reloads every panel screen when an admin switches whose site is being managed.
  return (
    <SiteProvider key={managing?.id ?? 'own'} load={api.panelSite}>
      <ConfirmProvider>
        <Panel />
      </ConfirmProvider>
    </SiteProvider>
  )
}
