import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { EDIT_SECTIONS, EDIT_SELECT, EDIT_STYLE, EDIT_TEXT, PREVIEW_MESSAGE, PREVIEW_READY, publicBase, useSiteState } from '../context/SiteContext'
import { BLANK_OPTIONS, cleanCustom, LAYOUT_GROUPS, LAYOUT_PART } from '../layout'
import { HOME_SECTION_INFO } from '../sectionCatalog'
import { VISIBILITY_GROUPS } from '../visibility'
import { BLANK_TYPOGRAPHY, BODY_FONTS, FONT_PAIRINGS, HEADING_FONTS, HEADING_SCALES, TEXT_SCALES } from '../theme'
import { Feedback, Field, HeaderActions, MoveButtons, moved, useAction, usePageTitle } from './adminUi'
import TextToolbar, { tidy } from './TextToolbar'

// The preview is rendered at the device's real width, then scaled down to fit the panel,
// so "Desktop" shows the true desktop layout even on a small screen.
const DEVICES = {
  desktop: { label: 'Desktop', width: 1320 },
  tablet: { label: 'Tablet', width: 820 },
  mobile: { label: 'Mobile', width: 390 },
}
const TABS = ['Theme', 'Layout', 'Fonts', 'Sections', 'Show / hide']
// [path, label, visibility key that can switch the page off]
const PAGES = [
  ['', 'Home'],
  ['/projects', 'Projects', 'page.projects'],
  ['/services', 'Services', 'page.services'],
  ['/about', 'About', 'page.about'],
  ['/contact', 'Contact', 'page.contact'],
]
// Compares two values whatever order their settings were added in.
const ordered = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).sort().map((key) => [key, ordered(value[key])]) : Array.isArray(value) ? value.map(ordered) : value
const same = (a, b) => JSON.stringify(ordered(a)) === JSON.stringify(ordered(b))

// The design settings as they are saved on the site right now.
const savedDesign = (site) => ({
  themeId: site.theme?.id ?? null,
  layoutId: site.layout?.id ?? null,
  layoutCustom: cleanCustom(site.layout_custom), // parts the site styled itself, on top of the preset
  typography: { ...BLANK_TYPOGRAPHY, ...site.typography },
  sections: site.home_sections,
  hidden: site.settings.hidden || [],
  // Changes made by hand on the preview: retyped page texts and list entries, and the style
  // (font, size, colour, position…) of single texts and blocks.
  texts: {}, // { hero_title: '…' }
  items: {}, // { 42: { title: '…' } }
  textStyles: Object.fromEntries(Object.entries(site.text_styles || {}).map(([key, value]) => [key, tidy(value)])),
})

function ThemePanel({ themes, value, isAdmin, onPick }) {
  return (
    <div className="studio-list">
      {themes.map((theme) => {
        const c = theme.tokens.colors
        const locked = theme.visibility === 'private' && !isAdmin
        return (
          <button
            type="button"
            key={theme.id}
            className={`studio-option ${theme.id === value ? 'is-active' : ''}`}
            aria-pressed={theme.id === value}
            onClick={() => onPick(theme.id)}
          >
            <span className="studio-swatches" aria-hidden="true">
              {[c.bg, c.accent, c.tint, c.dark].map((colour, index) => (
                <i key={index} style={{ background: colour }} />
              ))}
            </span>
            <span className="studio-option__text">
              <strong>{theme.name}</strong>
              <small>{theme.description}</small>
            </span>
            {locked && <span className="adm-badge adm-badge--warn">Preview only</span>}
          </button>
        )
      })}
    </div>
  )
}

// Top: presets that set every part at once. Below: the style of each part, one by one.
function LayoutPanel({ layouts, value, isAdmin, onPick, preset, custom, onCustom }) {
  const presetOptions = { ...BLANK_OPTIONS, ...(preset?.options || {}) }
  const changed = Object.keys(custom).length

  // Choosing the preset's own style for a part removes the site's choice for it.
  const choose = (key, style) => {
    const next = { ...custom }
    if (style === presetOptions[key]) delete next[key]
    else next[key] = style
    onCustom(next)
  }

  return (
    <>
      <p className="studio-heading">1. Start from a preset</p>
      <LayoutPresets layouts={layouts} value={value} isAdmin={isAdmin} onPick={onPick} />

      <p className="studio-heading">
        2. Customise each part
        {changed > 0 && (
          <button type="button" className="adm-link" onClick={() => onCustom({})}>
            Reset {changed} change{changed > 1 ? 's' : ''}
          </button>
        )}
      </p>
      <p className="adm-muted studio-hint">Pick a style for any part. Parts you leave alone follow the preset.</p>
      {LAYOUT_GROUPS.map((group) => (
        <fieldset className="studio-group studio-group--parts" key={group.title}>
          <legend>{group.title}</legend>
          {group.keys.map((key) => {
            const part = LAYOUT_PART(key)
            return (
              <label className="studio-part" key={key}>
                <span>
                  {part.label}
                  {key in custom && <i className="studio-part__dot" title="Changed from the preset" />}
                </span>
                <select value={custom[key] || presetOptions[key]} onChange={(event) => choose(key, event.target.value)}>
                  {Object.entries(part.choices).map(([style, text]) => (
                    <option value={style} key={style}>
                      {text}
                    </option>
                  ))}
                </select>
              </label>
            )
          })}
        </fieldset>
      ))}
    </>
  )
}

function LayoutPresets({ layouts, value, isAdmin, onPick }) {
  return (
    <div className="studio-list">
      {layouts.map((layout) => {
        const locked = layout.visibility === 'private' && !isAdmin
        return (
          <button
            type="button"
            key={layout.id}
            className={`studio-option ${layout.id === value ? 'is-active' : ''}`}
            aria-pressed={layout.id === value}
            onClick={() => onPick(layout.id)}
          >
            <span className="studio-option__text">
              <strong>{layout.name}</strong>
              <small>{layout.description}</small>
            </span>
            {locked && <span className="adm-badge adm-badge--warn">Preview only</span>}
          </button>
        )
      })}
    </div>
  )
}

function FontsPanel({ value, onChange }) {
  const set = (field) => (event) => onChange({ ...value, [field]: event.target.value })
  const usingTheme = !value.heading_font && !value.body_font
  return (
    <>
      <div className="studio-list">
        <button
          type="button"
          className={`studio-option ${usingTheme ? 'is-active' : ''}`}
          aria-pressed={usingTheme}
          onClick={() => onChange({ ...value, heading_font: null, body_font: null, logo_font: null })}
        >
          <span className="studio-option__text">
            <strong>Theme fonts</strong>
            <small>Whatever the selected theme uses</small>
          </span>
        </button>
        {FONT_PAIRINGS.map((pairing) => {
          const active = value.heading_font === pairing.heading_font && value.body_font === pairing.body_font
          return (
            <button
              type="button"
              key={pairing.name}
              className={`studio-option ${active ? 'is-active' : ''}`}
              aria-pressed={active}
              onClick={() => onChange({ ...value, heading_font: pairing.heading_font, body_font: pairing.body_font })}
            >
              <span className="studio-option__text">
                <strong>{pairing.name}</strong>
                <small>
                  {HEADING_FONTS[pairing.heading_font].label.split(' (')[0]} + {BODY_FONTS[pairing.body_font].label}
                </small>
              </span>
            </button>
          )
        })}
      </div>
      <div className="adm-form studio-fields">
        <Field label="Heading size">
          <select value={value.heading_scale} onChange={set('heading_scale')}>
            {Object.entries(HEADING_SCALES).map(([key, [label]]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Heading letters">
          <select value={value.heading_case} onChange={set('heading_case')}>
            <option value="normal">Normal</option>
            <option value="uppercase">ALL CAPITALS</option>
          </select>
        </Field>
        <Field label="Text size">
          <select value={value.text_scale} onChange={set('text_scale')}>
            {Object.entries(TEXT_SCALES).map(([key, [label]]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <p className="adm-muted">
          More choices (each font separately, logo style) are on the <Link className="adm-link" to="/admin/fonts">Fonts page</Link>.
        </p>
      </div>
    </>
  )
}

function SectionsPanel({ value, customSections, onChange }) {
  const toggle = (key) => onChange(value.map((row) => (row.key === key ? { ...row, visible: !row.visible } : row)))
  return (
    <>
      <p className="adm-muted studio-hint">
        The hero is always first. Tick a block to show it and use the arrows to change the order. A block with no content stays hidden on the site.
      </p>
      <ul className="studio-sections">
        {value.map((row, index) => {
          const custom = row.key.startsWith('custom:') && customSections.find((item) => `custom:${item.id}` === row.key)
          const info = custom
            ? { label: `Custom: ${custom.title || 'Untitled'}`, manage: '/admin/custom-sections' }
            : HOME_SECTION_INFO[row.key] || { label: row.key }
          return (
            <li key={row.key} className={row.visible ? '' : 'is-off'}>
              <MoveButtons index={index} count={value.length} onMove={(step) => onChange(moved(value, index, step))} />
              <label className="adm-check">
                <input type="checkbox" checked={row.visible} onChange={() => toggle(row.key)} />
                {info.label}
              </label>
              {info.manage && (
                <Link className="adm-link" to={info.manage}>
                  Edit
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}

// One switch per page and page part. Off means hidden on the site.
function VisibilityPanel({ value, onChange }) {
  const toggle = (key) => onChange(value.includes(key) ? value.filter((item) => item !== key) : [...value, key])
  return (
    <>
      <p className="adm-muted studio-hint">
        Switch off anything you do not want on your site. Nothing is deleted: switch it back on and it returns as it was.
      </p>
      {VISIBILITY_GROUPS.map((group) => (
        <fieldset className="studio-group" key={group.title}>
          <legend>{group.title}</legend>
          {group.note && <p className="adm-muted">{group.note}</p>}
          {group.items.map(([key, label]) => (
            <label className="adm-switch" key={key}>
              <span>{label}</span>
              <input type="checkbox" role="switch" checked={!value.includes(key)} onChange={() => toggle(key)} />
              <i aria-hidden="true" />
            </label>
          ))}
        </fieldset>
      ))}
    </>
  )
}

// The styles with `patch` applied to one entry (null clears the entry).
function withStyle(styles, key, patch) {
  const next = { ...styles }
  const cleaned = patch ? tidy({ ...next[key], ...patch }) : {}
  if (Object.keys(cleaned).length) next[key] = cleaned
  else delete next[key]
  return next
}

function StudioEditor({ site, onPublished }) {
  const { isAdmin } = useAuth()
  const { busy, error, notice, run } = useAction()
  usePageTitle('Design Studio', 'Design your real site: click a text to style or retype it, drag things to move them. Nothing changes for visitors until you publish.')
  const saved = useMemo(() => savedDesign(site), [site])
  const [draft, setDraft] = useState(saved)
  const [themes, setThemes] = useState([])
  const [layouts, setLayouts] = useState([])
  const [tab, setTab] = useState(TABS[0])
  const [device, setDevice] = useState('desktop')
  const [page, setPage] = useState('')
  const [selected, setSelected] = useState(null) // the text or block clicked on the preview: { key, rich }
  const [version, setVersion] = useState(0) // a new number reloads the preview
  const frame = useRef(null)
  const viewport = useRef(null)
  const [viewportWidth, setViewportWidth] = useState(0)

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setViewportWidth(entry.contentRect.width))
    observer.observe(viewport.current)
    return () => observer.disconnect()
  }, [])

  const deviceWidth = DEVICES[device].width
  const scale = viewportWidth ? Math.min(1, viewportWidth / deviceWidth) : 1

  useEffect(() => {
    api.themes().then(setThemes).catch(() => {})
    api.layouts().then(setLayouts).catch(() => {})
  }, [])

  const theme = themes.find((entry) => entry.id === draft.themeId) || site.theme
  const layout = layouts.find((entry) => entry.id === draft.layoutId) || site.layout

  // What the preview frame should draw: the full theme and layout, not just their ids.
  const payload = useMemo(
    () => ({
      theme,
      layout,
      typography: draft.typography,
      home_sections: draft.sections,
      settings: { ...site.settings, hidden: draft.hidden },
      // what the site is drawn with: the preset's style for every part, then the site's own choices
      layout_options: { ...BLANK_OPTIONS, ...(layout?.options || {}), ...draft.layoutCustom },
      // editing by hand on the preview
      edit: true,
      selected: selected?.key || null,
      texts: draft.texts,
      items: draft.items,
      text_styles: draft.textStyles,
    }),
    [theme, layout, draft, selected, site.settings],
  )
  const latest = useRef(payload)
  latest.current = payload

  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, draft: latest.current }, window.location.origin)
  }, [])

  // Push every change to the preview, and again whenever the frame (re)loads a page.
  useEffect(send, [payload, send])
  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return
      const { type, key, value, rich, patch, sections } = event.data || {}
      if (type === PREVIEW_READY) send()
      if (type === EDIT_SELECT) setSelected(key ? { key, rich } : null)
      if (type === EDIT_TEXT && typeof key === 'string' && typeof value === 'string') {
        const [kind, id, field] = key.split(':')
        // A list entry cannot lose its title; the old one simply comes back.
        if (kind === 'i' && field === 'title' && !value) return
        setDraft((current) =>
          kind === 't'
            ? { ...current, texts: { ...current.texts, [id]: value } }
            : { ...current, items: { ...current.items, [id]: { ...current.items[id], [field]: value } } },
        )
      }
      // Something was dragged to a new place, or resized by its corner.
      if (type === EDIT_STYLE && typeof key === 'string' && patch) {
        setSelected((current) => (current?.key === key ? current : { key }))
        setDraft((current) => ({ ...current, textStyles: withStyle(current.textStyles, key, 'size' in patch ? { size: patch.size } : { x: patch.x, y: patch.y }) }))
      }
      // A home section was dragged to a new position.
      if (type === EDIT_SECTIONS && Array.isArray(sections)) {
        setDraft((current) =>
          sections.length === current.sections.length && sections.every((row) => current.sections.some((mine) => mine.key === row.key))
            ? { ...current, sections: sections.map((row) => current.sections.find((mine) => mine.key === row.key)) }
            : current,
        )
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [send])

  const style = (selected && draft.textStyles[selected.key]) || {}
  // `patch` changes some settings of the selected text; null clears all of them.
  const setStyle = (patch) => setDraft((current) => ({ ...current, textStyles: withStyle(current.textStyles, selected.key, patch) }))
  const c = theme?.tokens?.colors
  const colours = c ? [...new Set([c.text, c.accent, c.dark, '#ffffff'])] : ['#1f1826', '#ffffff']
  const pages = PAGES.filter(([, , key]) => !key || !draft.hidden.includes(key))

  const dirty = !same(draft, saved)
  const lockedPick =
    !isAdmin &&
    ((draft.themeId !== saved.themeId && theme?.visibility === 'private') ||
      (draft.layoutId !== saved.layoutId && layout?.visibility === 'private'))

  function publish() {
    run(async () => {
      if (draft.themeId !== saved.themeId) await api.selectTheme(draft.themeId)
      // Picking a preset clears the site's own part styles on the server, so they are saved again after it.
      const presetChanged = draft.layoutId !== saved.layoutId
      if (presetChanged) await api.selectLayout(draft.layoutId)
      if (presetChanged || !same(draft.layoutCustom, saved.layoutCustom)) await api.customiseLayout(draft.layoutCustom)
      if (!same(draft.typography, saved.typography)) await api.updateTypography(draft.typography)
      if (!same(draft.sections, saved.sections)) await api.updateHomeSections(draft.sections)
      if (!same(draft.hidden, saved.hidden)) await api.updateSettings({ ...site.settings, hidden: draft.hidden })
      if (Object.keys(draft.texts).length) await api.updateTexts(draft.texts)
      const rows = Object.values(site.sections).flat()
      for (const [id, fields] of Object.entries(draft.items)) {
        const row = rows.find((entry) => entry.id === Number(id))
        if (row) await api.updateItem(row.id, { title: row.title, body: row.body, meta: row.meta, items: row.items, ...fields })
      }
      if (!same(draft.textStyles, saved.textStyles)) await api.updateTextStyles(draft.textStyles)
      await onPublished()
      // The new wording is saved now; the preview loads it afresh.
      setDraft((current) => ({ ...current, texts: {}, items: {} }))
      setSelected(null)
      setVersion((number) => number + 1)
    }, 'Published. Your site is updated.')
  }

  const siteLink = `${publicBase(site.owner)}/`

  return (
    <div className="studio">
      <HeaderActions>
        {dirty && (
          <button type="button" className="adm-btn" disabled={busy} onClick={() => { setDraft(saved); setSelected(null) }}>
            Discard
          </button>
        )}
        <button type="button" className="adm-btn adm-btn--primary" disabled={busy || !dirty || lockedPick} onClick={publish}>
          {busy ? 'Publishing…' : dirty ? 'Publish changes' : 'Published'}
        </button>
      </HeaderActions>

      <Feedback error={error} notice={dirty ? '' : notice} />
      {lockedPick && (
        <p className="adm-alert adm-alert--error">
          You are previewing a private theme or layout. You can look, but it cannot be published. Ask the admin to unlock it, or pick another one.
        </p>
      )}

      <div className="studio__body">
        <aside className="adm-card studio__panel">
          <div className="studio-tabs" role="tablist">
            {TABS.map((name) => (
              <button type="button" role="tab" key={name} aria-selected={tab === name} className={tab === name ? 'is-active' : ''} onClick={() => setTab(name)}>
                {name}
              </button>
            ))}
          </div>
          <div className="studio__scroll">
            {tab === 'Theme' && <ThemePanel themes={themes} value={draft.themeId} isAdmin={isAdmin} onPick={(themeId) => setDraft({ ...draft, themeId })} />}
            {tab === 'Layout' && (
              <LayoutPanel
                layouts={layouts}
                value={draft.layoutId}
                isAdmin={isAdmin}
                preset={layout}
                custom={draft.layoutCustom}
                // a new preset starts clean: its own style for every part
                onPick={(layoutId) => setDraft({ ...draft, layoutId, layoutCustom: {} })}
                onCustom={(layoutCustom) => setDraft({ ...draft, layoutCustom })}
              />
            )}
            {tab === 'Fonts' && <FontsPanel value={draft.typography} onChange={(typography) => setDraft({ ...draft, typography })} />}
            {tab === 'Show / hide' && <VisibilityPanel value={draft.hidden} onChange={(hidden) => setDraft({ ...draft, hidden })} />}
            {tab === 'Sections' && (
              <SectionsPanel value={draft.sections} customSections={site.custom_sections || []} onChange={(sections) => setDraft({ ...draft, sections })} />
            )}
          </div>
        </aside>

        <section className="studio__preview" aria-label="Live preview">
          <TextToolbar
            style={style}
            disabled={!selected}
            textual={!selected?.key.startsWith('b:')}
            colours={colours}
            onChange={setStyle}
            onReset={() => setStyle(null)}
          />
          <div className="studio__devices">
            <div className="studio-tabs" role="group" aria-label="Page">
              {pages.map(([path, label]) => (
                <button
                  type="button"
                  key={path}
                  aria-pressed={page === path}
                  className={page === path ? 'is-active' : ''}
                  onClick={() => {
                    setPage(path)
                    setSelected(null)
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="studio-tabs" role="group" aria-label="Preview size">
              {Object.entries(DEVICES).map(([key, info]) => (
                <button type="button" key={key} aria-pressed={device === key} className={device === key ? 'is-active' : ''} onClick={() => setDevice(key)}>
                  {info.label}
                </button>
              ))}
            </div>
            <a className="adm-link" href={siteLink} target="_blank" rel="noreferrer">
              Open live site ↗
            </a>
          </div>
          <p className="adm-muted studio-hint">
            {!selected
              ? 'Click a text or photo to select it. Drag it to move it. On the home page, hover a section and drag its handle to move the whole section.'
              : selected.key.startsWith('b:')
                ? 'Selected. Drag it to move it. Drag its corner handle, or use − and + above, to make it smaller or bigger.'
                : 'Selected. Click it again to type. A bar opens above it: click a word (or select a few) and change only their size, colour or style. Drag the text to move it.'}
          </p>
          <div className="studio__stage">
            <div className="studio__viewport" ref={viewport}>
              <iframe
                key={version}
                ref={frame}
                title="Site preview"
                src={`${publicBase(site.owner)}${page || '/'}`}
                onLoad={send}
                style={{ width: deviceWidth, height: `${100 / scale}%`, transform: `translateX(-50%) scale(${scale})` }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function Studio() {
  const { site, error, reload } = useSiteState()
  if (!site) return <Feedback error={error} notice={error ? '' : 'Loading…'} />
  // The key starts a fresh editor when an admin switches to another user's site.
  return <StudioEditor key={site.owner.username} site={site} onPublished={reload} />
}
