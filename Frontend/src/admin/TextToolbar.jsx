// The formatting toolbar of the Design Studio: it styles the text or block selected on the site.
import { FONTS } from '../theme'
import { Icon } from './adminUi'

const SIZE_STEP = 10
const SIZE_MIN = 50
const SIZE_MAX = 300
const FONT_OPTIONS = Object.entries(FONTS).sort((a, b) => a[1].label.localeCompare(b[1].label))
const ALIGNS = [
  ['left', 'alignLeft', 'Align left'],
  ['center', 'alignCenter', 'Centre'],
  ['right', 'alignRight', 'Align right'],
]

// A style without its empty settings; an untouched text has no entry at all.
export function tidy(style) {
  const kept = Object.entries(style || {}).filter(([name, value]) => value && !(name === 'size' && value === 100))
  return Object.fromEntries(kept)
}

// `textual` is false for a block that can only be moved (a photo).
export default function TextToolbar({ style, disabled, textual = true, colours, onChange, onReset }) {
  const size = style.size || 100
  const off = disabled || !textual
  const moved = Boolean(style.x || style.y)
  return (
    <div className="ve-bar" role="toolbar" aria-label="Formatting">
      <div className="ve-bar__group">
        <select aria-label="Font" disabled={off} value={style.font || ''} onChange={(event) => onChange({ font: event.target.value || null })}>
          <option value="">Theme font</option>
          {FONT_OPTIONS.map(([key, font]) => (
            <option value={key} key={key}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ve-bar__group">
        <button type="button" className="ve-btn" title="Smaller" aria-label="Smaller" disabled={disabled || size <= SIZE_MIN} onClick={() => onChange({ size: Math.max(SIZE_MIN, size - SIZE_STEP) })}>
          <Icon name="minus" />
        </button>
        <span className="ve-size" title="Size, compared with its normal size">
          {size}%
        </span>
        <button type="button" className="ve-btn" title="Bigger" aria-label="Bigger" disabled={disabled || size >= SIZE_MAX} onClick={() => onChange({ size: Math.min(SIZE_MAX, size + SIZE_STEP) })}>
          <Icon name="plus" />
        </button>
      </div>

      <div className="ve-bar__group">
        {['bold', 'italic', 'underline'].map((name) => (
          <button type="button" key={name} className={`ve-btn ${style[name] ? 'is-on' : ''}`} title={name[0].toUpperCase() + name.slice(1)} aria-label={name} aria-pressed={Boolean(style[name])} disabled={off} onClick={() => onChange({ [name]: !style[name] })}>
            <Icon name={name} />
          </button>
        ))}
      </div>

      <div className="ve-bar__group">
        {ALIGNS.map(([value, icon, label]) => (
          <button type="button" key={value} className={`ve-btn ${style.align === value ? 'is-on' : ''}`} title={label} aria-label={label} aria-pressed={style.align === value} disabled={off} onClick={() => onChange({ align: style.align === value ? null : value })}>
            <Icon name={icon} />
          </button>
        ))}
      </div>

      <div className="ve-bar__group">
        {colours.map((colour) => (
          <button type="button" key={colour} className={`ve-swatch ${style.color === colour ? 'is-on' : ''}`} style={{ background: colour }} title={`Text colour ${colour}`} aria-label={`Text colour ${colour}`} disabled={off} onClick={() => onChange({ color: style.color === colour ? null : colour })} />
        ))}
        <input type="color" className="ve-colour" title="Any colour" aria-label="Any text colour" disabled={off} value={style.color || colours[0]} onChange={(event) => onChange({ color: event.target.value })} />
      </div>

      <div className="ve-bar__group">
        <button type="button" className="ve-btn" title="Put back in its own place" aria-label="Put back in its own place" disabled={disabled || !moved} onClick={() => onChange({ x: null, y: null })}>
          <Icon name="undo" />
        </button>
        <button type="button" className="ve-btn" title="Clear all formatting" aria-label="Clear all formatting" disabled={disabled || !Object.keys(style).length} onClick={onReset}>
          <Icon name="eraser" />
        </button>
      </div>
    </div>
  )
}
