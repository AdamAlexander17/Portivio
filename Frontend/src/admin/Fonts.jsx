import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useSiteState } from '../context/SiteContext'
import {
  BLANK_TOKENS, BLANK_TYPOGRAPHY, BODY_FONTS, FONT_PAIRINGS, HEADING_FONTS, HEADING_SCALES,
  loadThemeFonts, LOGO_FONTS, TEXT_SCALES, themeStyle, withTypography,
} from '../theme'
import { Feedback, Field, Icon, PageHeader, useAction } from './adminUi'

// A sample of the site's text, drawn with the theme plus the font choices being edited.
function FontPreview({ tokens, typography, name }) {
  useEffect(() => loadThemeFonts(tokens, typography), [tokens, typography])
  return (
    <div className="site theme-preview font-preview" style={themeStyle(tokens, typography)} aria-hidden="true">
      <span className="logo">{name}</span>
      <p className="eyebrow">Selected work</p>
      <p className="h2">
        Making complex <span className="accent">feel simple.</span>
      </p>
      <p className="font-preview__text">
        I design mobile apps, web apps and dashboards, from research and user flows to polished, developer-ready UI.
      </p>
      <span className="theme-preview__btn theme-preview__btn--primary">Explore my work</span>
    </div>
  )
}

// A small "Aa" card for one heading + text combination.
function PairingCard({ pairing, tokens, active, onPick }) {
  const sample = { ...BLANK_TYPOGRAPHY, heading_font: pairing.heading_font, body_font: pairing.body_font }
  useEffect(() => loadThemeFonts(tokens, sample), [tokens, pairing]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <button type="button" className={`font-pair ${active ? 'is-active' : ''}`} aria-pressed={active} onClick={onPick}>
      <span className="site font-pair__sample" style={themeStyle(tokens, sample)}>
        <b>Aa</b>
        <i>The quick brown fox</i>
      </span>
      <strong>{pairing.name}</strong>
      <small>
        {HEADING_FONTS[pairing.heading_font].label.split(' (')[0]} + {BODY_FONTS[pairing.body_font].label}
      </small>
    </button>
  )
}

function FontsForm({ site, onSaved }) {
  const { busy, error, notice, run } = useAction()
  const tokens = site.theme?.tokens || BLANK_TOKENS
  const [form, setForm] = useState({ ...BLANK_TYPOGRAPHY, ...site.typography })

  // In the selects an empty value means "use the theme's font".
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value || null })
  const effective = withTypography(tokens, form)
  const themeFonts = !form.heading_font && !form.body_font && !form.logo_font

  async function submit(event) {
    event.preventDefault()
    const done = await run(() => api.updateTypography(form), 'Fonts saved. The site is updated.')
    if (done) onSaved()
  }

  return (
    <form onSubmit={submit}>
      <div className="adm-card">
        <h2>Font pairings</h2>
        <p className="adm-muted">Pick a ready-made combination, or choose each font yourself below. Nothing changes on the site until you save.</p>
        <div className="font-pairs">
          <button
            type="button"
            className={`font-pair ${themeFonts ? 'is-active' : ''}`}
            aria-pressed={themeFonts}
            onClick={() => setForm({ ...form, heading_font: null, body_font: null, logo_font: null })}
          >
            <span className="site font-pair__sample" style={themeStyle(tokens)}>
              <b>Aa</b>
              <i>The quick brown fox</i>
            </span>
            <strong>Theme fonts</strong>
            <small>Whatever the selected theme uses</small>
          </button>
          {FONT_PAIRINGS.map((pairing) => (
            <PairingCard
              key={pairing.name}
              pairing={pairing}
              tokens={tokens}
              active={form.heading_font === pairing.heading_font && form.body_font === pairing.body_font}
              onPick={() => setForm({ ...form, heading_font: pairing.heading_font, body_font: pairing.body_font })}
            />
          ))}
        </div>
      </div>

      <div className="adm-card adm-form">
        <h2>Fine tune</h2>
        <div className="theme-editor">
          <div className="adm-grid">
            <Field label="Heading font">
              <select value={form.heading_font || ''} onChange={set('heading_font')}>
                <option value="">Theme font ({HEADING_FONTS[tokens.heading_font]?.label.split(' (')[0]})</option>
                {Object.entries(HEADING_FONTS).map(([key, font]) => (
                  <option value={key} key={key}>
                    {font.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Text font">
              <select value={form.body_font || ''} onChange={set('body_font')}>
                <option value="">Theme font ({BODY_FONTS[tokens.body_font]?.label})</option>
                {Object.entries(BODY_FONTS).map(([key, font]) => (
                  <option value={key} key={key}>
                    {font.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Logo style">
              <select value={form.logo_font || ''} onChange={set('logo_font')}>
                <option value="">Theme style ({LOGO_FONTS[tokens.logo_font]})</option>
                {Object.entries(LOGO_FONTS).map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Heading size">
              <select value={form.heading_scale} onChange={set('heading_scale')}>
                {Object.entries(HEADING_SCALES).map(([key, [label]]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Heading letters">
              <select value={form.heading_case} onChange={set('heading_case')}>
                <option value="normal">Normal</option>
                <option value="uppercase">ALL CAPITALS</option>
              </select>
            </Field>
            <Field label="Text size" hint="Makes all text on the site slightly smaller or larger.">
              <select value={form.text_scale} onChange={set('text_scale')}>
                {Object.entries(TEXT_SCALES).map(([key, [label]]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="theme-editor__preview">
            <p className="adm-field__label">Live preview</p>
            <FontPreview tokens={tokens} typography={form} name={site.texts.logo_text || site.profile.name} />
            <p className="adm-muted">
              {HEADING_FONTS[effective.heading_font]?.label.split(' (')[0]} headings, {BODY_FONTS[effective.body_font]?.label} text
            </p>
          </div>
        </div>
      </div>

      <div className="adm-savebar">
        <Feedback error={error} notice={notice} />
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          <Icon name="check" /> {busy ? 'Saving…' : 'Save fonts'}
        </button>
      </div>
    </form>
  )
}

export default function Fonts() {
  const { site, error, reload } = useSiteState()
  return (
    <>
      <PageHeader
        title="Fonts"
        intro="Choose the fonts and text sizes of the site. They work with any theme and any layout."
      />
      {site ? (
        // The key resets the form when the theme (and so the "theme font" defaults) changes.
        <FontsForm key={site.theme?.id} site={site} onSaved={reload} />
      ) : (
        <Feedback error={error} notice={error ? '' : 'Loading…'} />
      )}
    </>
  )
}
