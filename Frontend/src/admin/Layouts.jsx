import { useState } from 'react'
import { api } from '../api/client'
import { useSiteState } from '../context/SiteContext'
import { BLANK_OPTIONS, LAYOUT_FIELDS } from '../layout'
import { BLANK_TOKENS, themeStyle } from '../theme'
import { Field, Icon } from './adminUi'
import LibraryPage from './LibraryPage'

const PROJECT_TILES = { grid: 2, compact: 3, list: 2, overlay: 2 }

// A wireframe of the page for a set of layout options, coloured with the site's current theme.
export function LayoutPreview({ options, tokens }) {
  const o = { ...BLANK_OPTIONS, ...options }
  return (
    <div className={`site theme-preview lp lp--${o.width}`} style={themeStyle(tokens || BLANK_TOKENS)} aria-hidden="true">
      <div className={`lp-nav lp-nav--${o.nav}`}>
        <div className="lp-nav__bar">
          <b />
          <span>
            <i />
            <i />
            <i />
          </span>
          <em />
        </div>
      </div>

      <div className={`lp-hero lp-hero--${o.hero}`}>
        <div className="lp-hero__text">
          <u />
          <u />
          <s />
          <em />
        </div>
        <div className="lp-hero__photo" />
      </div>

      <div className={`lp-work lp-work--${o.projects} lp-work--head-${o.headings}`}>
        <u />
        <div className="lp-work__tiles">
          {Array.from({ length: PROJECT_TILES[o.projects] }, (_, index) => (
            <div key={index}>
              <span />
              <s />
            </div>
          ))}
        </div>
      </div>

      <div className={`lp-footer lp-footer--${o.footer}`}>
        <i />
        <i />
        <i />
      </div>
    </div>
  )
}

function LayoutEditor({ entry, busy, onSave, onCancel }) {
  const { site } = useSiteState()
  const [form, setForm] = useState(
    entry
      ? { name: entry.name, description: entry.description, visibility: entry.visibility, options: { ...BLANK_OPTIONS, ...entry.options } }
      : { name: '', description: '', visibility: 'public', options: BLANK_OPTIONS },
  )
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })
  const setOption = (key) => (event) => setForm({ ...form, options: { ...form.options, [key]: event.target.value } })

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
            <Field label="Layout name">
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
          <div className="adm-grid">
            {LAYOUT_FIELDS.map(([key, label, choices]) => (
              <Field label={label} key={key}>
                <select value={form.options[key]} onChange={setOption(key)}>
                  {Object.entries(choices).map(([value, text]) => (
                    <option value={value} key={value}>
                      {text}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
          </div>
        </div>

        <div className="theme-editor__preview">
          <p className="adm-field__label">Live preview</p>
          <LayoutPreview options={form.options} tokens={site?.theme?.tokens} />
        </div>
      </div>

      <div className="adm-row">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          <Icon name="check" /> {busy ? 'Saving…' : entry ? 'Save layout' : 'Create layout'}
        </button>
        <button type="button" className="adm-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

const ACTIONS = {
  list: api.layouts,
  select: api.selectLayout,
  create: api.createLayout,
  update: api.updateLayout,
  remove: api.deleteLayout,
}

export default function Layouts() {
  const { site } = useSiteState()
  const tokens = site?.theme?.tokens
  return (
    <LibraryPage
      title="Layouts"
      noun="layout"
      dataKey="options"
      currentId={site?.layout?.id}
      actions={ACTIONS}
      Preview={({ entry }) => <LayoutPreview options={entry.options} tokens={tokens} />}
      Editor={LayoutEditor}
    />
  )
}
