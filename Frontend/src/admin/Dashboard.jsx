import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { publicBase, useSiteState } from '../context/SiteContext'
import { useFetch } from '../hooks'
import { Feedback, Field, HeaderActions, Icon, useAction, useConfirm, usePageTitle } from './adminUi'
import { ThemePreview } from './Themes'

// The site's public address, with a way to copy it.
function SiteLinkCard({ site }) {
  const [copied, setCopied] = useState(false)
  const path = `${publicBase(site.owner)}/`
  const address = `${window.location.host}${path === '/' ? '' : path.replace(/\/$/, '')}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard not available: the address is on screen to copy by hand */
    }
  }

  return (
    <div className="adm-card dash-link">
      <span className="dash-link__icon">
        <Icon name="globe" size={20} />
      </span>
      <div className="dash-link__text">
        <p>
          <strong>{address}</strong>
          <span className="adm-badge adm-badge--good">Live</span>
        </p>
        <small>
          Theme: {site.theme?.name || 'Default'} · Layout: {site.layout?.name || 'Default'}
        </small>
      </div>
      <button type="button" className="adm-btn adm-btn--small" onClick={copy}>
        <Icon name={copied ? 'check' : 'copy'} /> {copied ? 'Copied' : 'Copy link'}
      </button>
      <a href={path} target="_blank" rel="noreferrer" className="adm-btn adm-btn--small">
        <Icon name="external" /> Open
      </a>
    </div>
  )
}

// What a new site still needs, worked out from the site itself.
function setupSteps(site, stats) {
  const { profile, sections, theme } = site
  const projects = stats?.projects ?? 0
  return [
    { title: 'Add your profile info', note: 'Name, email and location', done: Boolean(profile.email || profile.location), to: '/admin/profile' },
    { title: 'Add a profile photo', note: 'Shown at the top of your site', done: Boolean(profile.hero_image), to: '/admin/profile' },
    { title: 'Add projects', note: projects ? `${projects} added` : 'Show your best work', done: projects > 0, to: '/admin/projects?new=1' },
    { title: 'Pick a theme', note: theme?.name || 'Choose the look of your site', done: Boolean(theme && !theme.is_default), to: '/admin/studio' },
    { title: 'Upload your resume', note: 'Visitors get a download button', done: profile.has_resume, to: '/admin/profile' },
    {
      title: 'Add experience and skills',
      note: 'Show your career timeline',
      done: sections.experience.length > 0 || sections.skills.length > 0,
      to: '/admin/sections/experience',
    },
  ]
}

function SetupCard({ site, stats }) {
  const steps = setupSteps(site, stats)
  const done = steps.filter((step) => step.done).length
  return (
    <div className="adm-card dash-setup">
      <h2>{done === steps.length ? 'Your site is set up' : 'Finish setting up'}</h2>
      <p className="adm-muted">
        {done} of {steps.length} steps done.{done < steps.length ? ' Complete the rest to get the most out of your site.' : ''}
      </p>
      <div className="dash-progress" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label="Setup progress">
        <span style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ul className="dash-steps">
        {steps.map((step) => (
          <li key={step.title} className={step.done ? 'is-done' : ''}>
            <span className="dash-steps__mark" aria-hidden="true">
              {step.done && <Icon name="check" size={14} />}
            </span>
            <span className="dash-steps__text">
              <strong>{step.title}</strong>
              <small>{step.note}</small>
            </span>
            {!step.done && (
              <Link to={step.to} className="adm-btn adm-btn--small">
                Start
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Lets the owner (re)start the site with wording and lists written for their kind of work.
function StarterContent({ site, onApplied }) {
  const { busy, error, notice, run } = useAction()
  const confirm = useConfirm()
  const { data: config } = useFetch(api.authConfig)
  const [profession, setProfession] = useState(site.settings.profession)
  const options = config?.professions || []

  async function apply() {
    const label = options.find((option) => option.key === profession)?.label || profession
    const ok = await confirm(
      `Replace the site's wording, services, skills, process and FAQ with the starter content for "${label}"?\n\n` +
        'Your projects, photos, resume, messages and custom sections are kept.',
    )
    if (!ok) return
    const done = await run(() => api.applyStarter(profession), 'Starter content applied. Review it under Site content and the page lists.')
    if (done) onApplied()
  }

  return (
    <div className="adm-card adm-form">
      <div>
        <h2>Starter content for your profession</h2>
        <p className="adm-muted">
          Fill the site with headings, services, skills and form options written for your kind of work, then edit them to make them yours.
        </p>
      </div>
      <Feedback error={error} notice={notice} />
      <div className="adm-row">
        <Field label="I work as">
          <select value={profession} onChange={(event) => setProfession(event.target.value)}>
            {options.map((option) => (
              <option value={option.key} key={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <button type="button" className="adm-btn" disabled={busy || options.length === 0} onClick={apply}>
          <Icon name="check" /> {busy ? 'Applying…' : 'Use this starter content'}
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { site, reload } = useSiteState()
  const { data: stats, error } = useFetch(api.stats)
  const { data: traffic } = useFetch(() => api.analytics(30))

  const firstName = site?.profile.name.split(' ')[0] || user.username
  usePageTitle(`Welcome back, ${firstName}`, 'Here is how your portfolio is doing this month.')

  if (!site) return <Feedback error={error} notice={error ? '' : 'Loading…'} />

  const tiles = [
    { label: 'Site visits', value: traffic?.views, note: 'Last 30 days', to: '/admin/analytics' },
    { label: 'Unique visitors', value: traffic?.visitors, note: 'Last 30 days', to: '/admin/analytics' },
    { label: 'Resume downloads', value: traffic?.resume_downloads, note: 'Last 30 days', to: '/admin/analytics' },
    { label: 'Messages', value: stats?.messages, note: `${stats?.unread_messages ?? 0} unread`, to: '/admin/messages' },
  ]

  return (
    <>
      <HeaderActions>
        <Link to="/admin/studio" className="adm-btn adm-btn--primary">
          <Icon name="sliders" /> Open Design Studio
        </Link>
      </HeaderActions>
      <Feedback error={error} />

      <SiteLinkCard site={site} />

      <div className="adm-tiles dash-tiles">
        {tiles.map((tile) => (
          <Link to={tile.to} className="adm-card adm-tile" key={tile.label}>
            <span>{tile.label}</span>
            <strong>{tile.value?.toLocaleString() ?? '–'}</strong>
            <small>{tile.note}</small>
          </Link>
        ))}
      </div>

      <div className="dash-columns">
        <SetupCard site={site} stats={stats} />

        <div className="adm-card dash-theme">
          <h2>Current theme</h2>
          <p className="adm-muted">Switch anytime. Your content stays the same.</p>
          {site.theme && <ThemePreview tokens={site.theme.tokens} name={site.texts.logo_text || site.profile.name} />}
          <div className="adm-row adm-row--between">
            <span className="dash-theme__name">
              <strong>{site.theme?.name}</strong>
              <small>{site.layout?.name} layout</small>
            </span>
            <Link to="/admin/studio" className="adm-btn adm-btn--small">
              <Icon name="layout" /> Change
            </Link>
          </div>
        </div>
      </div>

      <StarterContent key={site.settings.profession} site={site} onApplied={reload} />
    </>
  )
}
