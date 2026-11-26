import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { PRODUCT_NAME } from '../brand'
import { useAuth } from '../context/AuthContext'
import { useFetch } from '../hooks'
import { Feedback, Icon, useAction } from './adminUi'
import { ThemePreview } from './Themes'

// An icon and a one-line hint for each profession the server offers.
const PROFESSION_INFO = {
  designer: ['layout', 'UI/UX, product, graphic'],
  developer: ['code', 'Web, mobile, full-stack'],
  accountant: ['chart', 'Bookkeeping, tax, audit'],
  marketer: ['megaphone', 'Social, SEO, ads'],
  photographer: ['camera', 'Weddings, portraits, products'],
  writer: ['pen', 'Articles, copy, content'],
  consultant: ['briefcase', 'Strategy, operations'],
  teacher: ['book', 'Courses, workshops, coaching'],
  other: ['star', 'Anything else'],
}
const THEME_CHOICES = 3 // how many looks are recommended before "See all"

// The first screen after signing up: what do you do, and which look do you want to start with?
export default function Onboarding() {
  const navigate = useNavigate()
  const { user, checking } = useAuth()
  const { busy, error, run } = useAction()
  const { data: config } = useFetch(api.authConfig)
  const { data: site } = useFetch(() => (user ? api.panelSite() : Promise.resolve(null)), [user?.id])
  const { data: themes } = useFetch(() => (user ? api.themes() : Promise.resolve([])), [user?.id])
  // Everything the person does, in the order chosen; the first one is their main work.
  const [chosen, setChosen] = useState([])
  const profession = chosen[0] || ''
  const [themeId, setThemeId] = useState(null)
  const [showAll, setShowAll] = useState(false)

  if (checking) return null
  if (!user) return <Navigate to="/admin/login" replace />

  const options = config?.professions || []
  const publicThemes = (themes || []).filter((theme) => theme.visibility === 'public')
  // Each kind of work starts from a different place in the list, so the three recommended looks differ.
  const start = publicThemes.length ? Math.max(0, options.findIndex((option) => option.key === profession)) % publicThemes.length : 0
  const recommended = [...publicThemes.slice(start), ...publicThemes.slice(0, start)]
  const shownThemes = showAll ? recommended : recommended.slice(0, THEME_CHOICES)

  // Choosing what you do also picks the first recommended look; it can be changed below.
  function choose(key) {
    const next = chosen.includes(key) ? chosen.filter((item) => item !== key) : [...chosen, key]
    setChosen(next)
    // the recommended look follows the main work, until the person picks a look themselves
    if (!publicThemes.length || next[0] === chosen[0]) return
    if (!next.length) return setThemeId(null)
    const index = Math.max(0, options.findIndex((option) => option.key === next[0])) % publicThemes.length
    setThemeId(publicThemes[index].id)
  }
  const name = site?.profile?.name || user.username

  async function finish() {
    const done = await run(async () => {
      if (profession) await api.applyStarter(profession, chosen.slice(1))
      if (themeId) await api.selectTheme(themeId)
      return true
    })
    if (done) navigate('/admin', { replace: true })
  }

  return (
    <div className="onboard">
      <header className="onboard__top">
        <span className="auth__brand">
          <span className="adm-side__mark" aria-hidden="true">
            {PRODUCT_NAME.charAt(0)}
          </span>
          {PRODUCT_NAME}
        </span>
        <span className="onboard__step">
          Step 2 of 2
          <i className="is-done" />
          <i className="is-done" />
        </span>
      </header>

      <main className="adm-card onboard__card">
        <p className="onboard__wave" aria-hidden="true">
          👋
        </p>
        <h1>Welcome, {name.split(' ')[0]}! What do you do?</h1>
        <p className="adm-muted">Choose everything that fits, one or several. We will suggest templates and sections for your work. You can change everything later.</p>
        <Feedback error={error} />

        <div className="onboard__grid" role="group" aria-label="What do you do?">
          {options.map((option) => {
            const [icon, hint] = PROFESSION_INFO[option.key] || PROFESSION_INFO.other
            const selected = chosen.includes(option.key)
            return (
              <button
                type="button"
                aria-pressed={selected}
                key={option.key}
                className={`onboard__option ${selected ? 'is-active' : ''}`}
                onClick={() => choose(option.key)}
              >
                <span className="onboard__icon">
                  <Icon name={icon} size={18} />
                </span>
                <span className="onboard__label">
                  <strong>{option.label.split(' (')[0].split(' / ')[0]}</strong>
                  <small>{hint}</small>
                </span>
                {selected && (
                  <span className="onboard__tick">
                    <Icon name="check" size={12} />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {publicThemes.length > 0 && (
          <>
            <h2 className="onboard__sub">
              <span>
                {!profession ? 'Pick a look to start with' : chosen.length > 1 || profession === 'other' ? 'Recommended for you' : `Recommended for ${profession}s`}
                <span className="adm-badge adm-badge--purple">Pick one to start</span>
              </span>
              {publicThemes.length > THEME_CHOICES && (
                <button type="button" className="adm-link" onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Show fewer' : `See all ${publicThemes.length}`}
                </button>
              )}
            </h2>
            <div className="onboard__themes">
              {shownThemes.map((theme) => {
                const active = themeId === theme.id
                return (
                  <button type="button" key={theme.id} aria-pressed={active} className={`onboard__theme ${active ? 'is-active' : ''}`} onClick={() => setThemeId(theme.id)}>
                    <ThemePreview tokens={theme.tokens} name={name} />
                    <strong>{theme.name}</strong>
                    {active && (
                      <span className="onboard__tick">
                        <Icon name="check" size={12} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div className="onboard__actions">
          <button type="button" className="adm-link" disabled={busy} onClick={() => navigate('/admin', { replace: true })}>
            Skip for now
          </button>
          <button type="button" className="adm-btn adm-btn--primary" disabled={busy || !profession} onClick={finish}>
            {busy ? 'Setting up…' : 'Continue to my dashboard'}
          </button>
        </div>
      </main>
    </div>
  )
}
