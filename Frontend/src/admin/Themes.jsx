import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useSiteState } from '../context/SiteContext'
import { BLANK_TOKENS, BODY_FONTS, COLOR_FIELDS, HEADING_FONTS, loadThemeFonts, LOGO_FONTS, SHAPES, themeStyle } from '../theme'
import { Field, Icon } from './adminUi'
import LibraryPage from './LibraryPage'

const isHex = (value) => /^#[0-9a-fA-F]{6}$/.test(value)

// A miniature of the public site drawn with a theme's own colours, fonts and shape.
export function ThemePreview({ tokens, name = 'Your Name' }) {
  useEffect(() => loadThemeFonts(tokens), [tokens])
  return (
    <div className="site theme-preview" style={themeStyle(tokens)} aria-hidden="true">
      <div className="theme-preview__nav">
        <span className="logo">{name}</span>
        <span className="theme-preview__dots">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="theme-preview__hero">
        <p className="eyebrow">Designer</p>
        <p className="theme-preview__title">
          Making complex <span className="accent">feel simple.</span>
        </p>
        <span className="theme-preview__btn theme-preview__btn--primary">Explore</span>
        <span className="theme-preview__btn">Let's talk</span>
      </div>
      <div className="theme-preview__tint">
        <span />
        <span />
        <span />
      </div>
      <div className="theme-preview__dark" />
    </div>
  )
}

function ThemeEditor({ entry, busy, onSave, onCancel }) {
  const [form, setForm] = useState(
    entry
      ? { name: entry.name, description: entry.description, visibility: entry.visibility, tokens: entry.tokens }
      : { name: '', description: '', visibility: 'public', tokens: BLANK_TOKENS },
  )
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })
  const setToken = (field) => (event) => setForm({ ...form, tokens: { ...form.tokens, [field]: event.target.value } })
  const setColor = (key, value) =>
    setForm({ ...form, tokens: { ...form.tokens, colors: { ...form.tokens.colors, [key]: value } } })

  const colorsValid = COLOR_FIELDS.every(([key]) => isHex(form.tokens.colors[key]))

  return (
    <form
      className="adm-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({ ...form, name: form.name.trim(), description: form.description.trim() })
      }}
    >

      <div className="theme-editor">
        <div className="adm-form">
          <div className="adm-grid">
            <Field label="Theme name">
              <input type="text" required maxLength={80} autoFocus value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Who can use it">
              <select value={form.visibility} onChange={set('visibility')} disabled={entry?.is_default}>
                <option value="public">Public (all users)</option>
                <option value="private">Private (locked for users)</option>
              </select>
            </Field>
          </div>
          <Field label="Short description">
            <input type="text" maxLength={255} value={form.description} onChange={set('description')} />
          </Field>

          <fieldset className="adm-field">
            <legend className="adm-field__label">Colours</legend>
            <div className="theme-colors">
              {COLOR_FIELDS.map(([key, label]) => (
                <label className="theme-color" key={key}>
                  <input
                    type="color"
                    aria-label={`${label} colour picker`}
                    value={isHex(form.tokens.colors[key]) ? form.tokens.colors[key] : '#000000'}
                    onChange={(event) => setColor(key, event.target.value)}
                  />
                  <span>
                    {label}
                    <input
                      type="text"
                      maxLength={7}
                      spellCheck={false}
                      aria-label={`${label} hex code`}
                      value={form.tokens.colors[key]}
                      onChange={(event) => setColor(key, event.target.value.trim())}
                    />
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="adm-grid">
            <Field label="Heading font">
              <select value={form.tokens.heading_font} onChange={setToken('heading_font')}>
                {Object.entries(HEADING_FONTS).map(([key, font]) => (
                  <option value={key} key={key}>
                    {font.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Text font">
              <select value={form.tokens.body_font} onChange={setToken('body_font')}>
                {Object.entries(BODY_FONTS).map(([key, font]) => (
                  <option value={key} key={key}>
                    {font.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Logo style">
              <select value={form.tokens.logo_font} onChange={setToken('logo_font')}>
                {Object.entries(LOGO_FONTS).map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Corners and buttons">
              <select value={form.tokens.shape} onChange={setToken('shape')}>
                {Object.entries(SHAPES).map(([key, shape]) => (
                  <option value={key} key={key}>
                    {shape.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Brightness" hint="Pick Dark when the page background is dark.">
              <select value={form.tokens.scheme} onChange={setToken('scheme')}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="theme-editor__preview">
          <p className="adm-field__label">Live preview</p>
          {colorsValid ? (
            <ThemePreview tokens={form.tokens} name={form.name || 'Your Name'} />
          ) : (
            <p className="adm-alert adm-alert--error">Each colour must be a hex code like #6d3aa6.</p>
          )}
        </div>
      </div>

      <div className="adm-row">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy || !colorsValid}>
          <Icon name="check" /> {busy ? 'Saving…' : entry ? 'Save theme' : 'Create theme'}
        </button>
        <button type="button" className="adm-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

const ACTIONS = {
  list: api.themes,
  select: api.selectTheme,
  create: api.createTheme,
  update: api.updateTheme,
  remove: api.deleteTheme,
}

export default function Themes() {
  const { site } = useSiteState()
  const name = site?.profile?.name || 'Your Name'
  return (
    <LibraryPage
      title="Themes"
      noun="theme"
      dataKey="tokens"
      currentId={site?.theme?.id}
      actions={ACTIONS}
      Preview={({ entry }) => <ThemePreview tokens={entry.tokens} name={name} />}
      Editor={ThemeEditor}
    />
  )
}
