// The parts of the site its owner can change by hand in the panel's Design Studio.
//
//   <E k="hero_title" as="h1" className="hero__title" rich />        a page text (site.texts.hero_title)
//   <E item={step} field="title" as="h3" className="step__title" />  one field of a list entry
//   <E k="nav_button" as={Link} to="…" className="btn"><Arrow /></E>   a whole button: its label is the text
//   <M k="hero_photo" as="figure" className="portrait">…</M>          a block that can only be moved
//   <SectionMover id="process" sections={…}>…</SectionMover>          a home section that can be dragged up or down
//
// On the live site these simply draw the content with the style saved for it (site.text_styles).
// Inside the Studio's frame: a click selects, a second click on a text lets you type
// (and selecting some of the words opens a small bar to colour or resize just those),
// and dragging moves the thing. Every change is sent to the Studio, which keeps the draft.
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EDIT_SECTIONS, EDIT_SELECT, EDIT_STYLE, EDIT_TEXT, useEditMode, useSite } from '../context/SiteContext'
import { FONTS } from '../theme'
import { fill, offsetOf, parse, read, restyle, runCss, selectChars, toMarkup, writeStyle } from './markup'

// Moved things keep their place on small screens, where the layout is a single column.
const WIDE = 900
const MOVE_LIMIT = 1500
const SIZE_MIN = 50
const SIZE_MAX = 300

// The saved style of a text or block as inline CSS. Size is a percentage of the normal size.
// A block (a photo) is resized as a whole, so its size is drawn as a scale instead.
export function textStyleCss(style, block = false) {
  if (!style) return undefined
  const css = {}
  if (style.font && FONTS[style.font]) css.fontFamily = FONTS[style.font].family
  if (style.size && style.size !== 100) {
    if (block) css['--ms'] = style.size / 100
    else css.zoom = style.size / 100
  }
  if (style.bold) css.fontWeight = 700
  if (style.italic) css.fontStyle = 'italic'
  if (style.underline) css.textDecoration = 'underline'
  if (style.color) css.color = style.color
  if (style.align) {
    css.textAlign = style.align
    // a block narrower than its row moves with its text
    if (style.align === 'center') css.marginInline = 'auto'
    if (style.align === 'right') css.marginLeft = 'auto'
  }
  // How far it was dragged from its own place (drawn by the [data-moved] rule in global.css).
  if (style.x || style.y) {
    css['--mx'] = `${style.x || 0}px`
    css['--my'] = `${style.y || 0}px`
  }
  return css
}

// Markers for the rules in global.css: moved or resized as a block, and given its own colour.
function movedAttr(style, block = false) {
  if (!style) return null
  const attrs = {}
  if (style.x || style.y || (block && style.size && style.size !== 100)) attrs['data-moved'] = ''
  if (style.color) attrs['data-colored'] = ''
  return attrs
}
const tell = (message) => window.parent.postMessage(message, window.location.origin)
const clamp = (number) => Math.max(-MOVE_LIMIT, Math.min(MOVE_LIMIT, Math.round(number)))

// Press and drag to move; press and release without moving is a "tap".
function pressHandler(key, style, onTap) {
  return (event) => {
    if (event.button !== 0) return
    event.preventDefault() // no text selection while dragging
    event.stopPropagation() // a text inside a movable block is handled on its own
    const element = event.currentTarget
    const start = { x: event.clientX, y: event.clientY }
    const from = { x: style?.x || 0, y: style?.y || 0 }
    const canMove = window.innerWidth >= WIDE
    let at = null

    const move = (moveEvent) => {
      const dx = moveEvent.clientX - start.x
      const dy = moveEvent.clientY - start.y
      if (!canMove || (!at && Math.hypot(dx, dy) < 5)) return
      at = { x: clamp(from.x + dx), y: clamp(from.y + dy) }
      element.setAttribute('data-moved', '')
      element.style.setProperty('--mx', `${at.x}px`)
      element.style.setProperty('--my', `${at.y}px`)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (at) tell({ type: EDIT_STYLE, key, patch: at })
      else onTap()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
}

// The four corner handles of a selected thing: drag a corner outwards to grow it, inwards to shrink it.
// A block (photo, card, form…) is scaled around its centre; a text or button grows in its own place.
const CORNERS = ['nw', 'ne', 'sw', 'se']

function resizeHandler(key, style, corner, block) {
  return (event) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation() // not a move of the thing itself
    const element = event.currentTarget.parentElement
    const startX = event.clientX
    const width = element.getBoundingClientRect().width || 1
    const from = style?.size || 100
    const outwards = corner.endsWith('e') ? 1 : -1 // on the left corners, dragging left grows
    const reach = block ? 2 : 1 // scaled around the centre, a corner travels half of the change
    let size = null

    const move = (moveEvent) => {
      const grown = from * (1 + (reach * outwards * (moveEvent.clientX - startX)) / width)
      size = Math.max(SIZE_MIN, Math.min(SIZE_MAX, Math.round(grown)))
      if (block) {
        element.setAttribute('data-moved', '')
        element.style.setProperty('--ms', size / 100)
      } else element.style.zoom = size / 100
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (size) tell({ type: EDIT_STYLE, key, patch: { size } })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
}

function Handles({ id, style, block = false }) {
  return CORNERS.map((corner) => (
    <span key={corner} className={`edit-resize edit-resize--${corner}`} title="Drag to resize" onPointerDown={resizeHandler(id, style, corner, block)} />
  ))
}

// Puts the caret at the end of a text that has just become typeable.
function focusAtEnd(element) {
  element.focus()
  const range = document.createRange()
  range.selectNodeContents(element)
  range.collapse(false)
  const selection = window.getSelection()
  selection.removeAllRanges()
  selection.addRange(range)
}

// A text as it is shown: plain words, accent words, and parts with their own colour or size.
function Marked({ text, rich }) {
  return parse(text, rich).map((run, index) => {
    const body = run.t.split('\n').flatMap((line, row) => (row ? [<br key={row} />, line] : [line]))
    if (!writeStyle(run.st)) return <Fragment key={index}>{body}</Fragment>
    return (
      <span key={index} className={run.st.a ? 'accent' : undefined} style={runCss(run.st)}>
        {body}
      </span>
    )
  })
}

// Ready-made colours of the colour panel: greys, then eight hues in three strengths.
const PALETTE = [
  '#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6', '#ffffff', '#7c2d12',
  '#b91c1c', '#c2410c', '#b45309', '#15803d', '#0f766e', '#1d4ed8', '#6d28d9', '#be185d',
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#5eead4', '#93c5fd', '#c4b5fd', '#f9a8d4',
]
const HEX = /^#[0-9a-fA-F]{6}$/
const BAR_WIDTH = 540

// A strong colour for a position on the rainbow slider (0 to 359).
function hueHex(hue) {
  const part = (n) => {
    const k = (n + hue / 30) % 12
    const value = 0.5 - 0.5 * Math.max(-1, Math.min(k - 3, 9 - k, 1)) * 0.9
    return Math.round(255 * value).toString(16).padStart(2, '0')
  }
  return `#${part(0)}${part(8)}${part(4)}`
}

// The text while it is being typed, with a bar above it that formats PART of the text:
// the words that are selected, or simply the word the caret is in.
function Typing({ value, rich, onDone }) {
  const site = useSite()
  const box = useRef(null)
  const barRef = useRef(null)
  const target = useRef(null) // the characters the bar works on: { from, to }
  const [view, setView] = useState(null) // where the bar is and what it shows
  const [picker, setPicker] = useState(false)
  const [hex, setHex] = useState('')

  const refresh = () => {
    const element = box.current
    if (!element) return
    const text = element.textContent
    const selection = window.getSelection()
    // While a control of the bar has the focus the selection is elsewhere: the last target stays.
    if (selection.rangeCount && element.contains(selection.anchorNode) && element.contains(selection.focusNode)) {
      const range = selection.getRangeAt(0)
      let from = offsetOf(element, range.startContainer, range.startOffset)
      let to = offsetOf(element, range.endContainer, range.endOffset)
      if (from === to) {
        // nothing selected: the word the caret is in
        while (from > 0 && /\S/.test(text[from - 1])) from -= 1
        while (to < text.length && /\S/.test(text[to])) to += 1
      }
      target.current = to > from ? { from, to } : null
    }
    const chosen = target.current
    let st = {}
    if (chosen) {
      let position = 0
      for (const run of read(element)) {
        if (chosen.from < position + run.t.length) {
          st = run.st
          break
        }
        position += run.t.length
      }
    }
    const rect = element.parentElement.getBoundingClientRect()
    setView({
      around: { top: rect.top, bottom: rect.bottom },
      left: Math.max(8, Math.min(rect.left, window.innerWidth - BAR_WIDTH - 8)),
      label: chosen ? text.slice(chosen.from, chosen.to) : '',
      st,
    })
  }

  useEffect(() => {
    const element = box.current
    fill(element, parse(value, rich))
    focusAtEnd(element)
    refresh()
    document.addEventListener('selectionchange', refresh)
    window.addEventListener('scroll', refresh, true)
    return () => {
      document.removeEventListener('selectionchange', refresh)
      window.removeEventListener('scroll', refresh, true)
    }
    // only when typing starts: from then on the element holds the text
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The bar sits above the text when there is room for it, otherwise below: never on top of the text.
  useLayoutEffect(() => {
    const barElement = barRef.current
    if (!barElement || !view) return
    const height = barElement.offsetHeight
    const above = view.around.top - height - 14
    const below = Math.min(view.around.bottom + 14, window.innerHeight - height - 8)
    barElement.style.top = `${above >= 8 ? above : Math.max(8, below)}px`
  }, [view, picker])

  // Back into the text, with the target selected again so it stays visible.
  const back = () => {
    const element = box.current
    element.focus()
    if (target.current) selectChars(element, target.current.from, target.current.to)
  }

  // `stay` is for sliders and the hex field, which keep the focus while they are used.
  const apply = (change, stay = false) => {
    const element = box.current
    const chosen = target.current
    if (!chosen) return
    fill(element, restyle(read(element), chosen.from, chosen.to, change))
    if (!stay) back()
    refresh()
  }
  const press = (change) => (event) => {
    event.preventDefault() // the focus stays in the text
    apply(change)
  }
  const selectAll = (event) => {
    event.preventDefault()
    box.current.focus()
    selectChars(box.current, 0, box.current.textContent.length)
  }

  // Typing ends when the focus leaves both the text and its bar.
  const leave = (event) => {
    const next = event.relatedTarget
    if (next && (next === box.current || barRef.current?.contains(next))) return
    onDone(toMarkup(read(box.current), rich).replace(/\u00a0/g, ' ').trim())
  }

  const onKeyDown = (event) => {
    if (event.key === 'Escape' || (event.key === 'Enter' && !rich)) {
      event.preventDefault()
      event.currentTarget.blur()
    }
    // Inside a button the space key would press the button instead of typing a space.
    if (event.key === ' ' && event.currentTarget.closest('button')) {
      event.preventDefault()
      document.execCommand('insertText', false, ' ')
    }
  }

  const theme = site.theme?.tokens?.colors
  const colours = [...new Set([...(theme ? [theme.text, theme.accent, theme.dark] : []), ...PALETTE])]
  const st = view?.st || {}
  const size = st.s || 100
  const label = view?.label || ''
  const off = !label

  return (
    <>
      <span
        ref={box}
        className="edit-text"
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        spellCheck={false}
        onBlur={leave}
        onKeyDown={onKeyDown}
        onKeyUp={(event) => event.key === ' ' && event.preventDefault()}
      />
      {view &&
        createPortal(
          <div className="edit-bar" data-edit="bar" ref={barRef} style={{ left: view.left }} role="toolbar" aria-label="Format part of the text" onBlur={leave}>
            <div className="edit-bar__head">
              <span className="edit-bar__target">
                {label ? (
                  <>
                    Changing <b>{label.length > 34 ? `${label.slice(0, 32)}…` : label}</b>
                  </>
                ) : (
                  'Click a word, or select some words'
                )}
              </span>
              <button type="button" className="edit-bar__chip" onPointerDown={selectAll}>
                Select all
              </button>
            </div>

            <div className="edit-bar__row">
              <button type="button" title="Smaller" aria-label="Part smaller" disabled={off} onPointerDown={press({ grow: -10 })}>
                A−
              </button>
              <input
                type="range"
                className="edit-bar__size"
                aria-label="Part size"
                min={50}
                max={300}
                step={5}
                disabled={off}
                value={size}
                onChange={(event) => apply({ size: Number(event.target.value) }, true)}
                onPointerUp={back}
              />
              <button type="button" title="Bigger" aria-label="Part bigger" disabled={off} onPointerDown={press({ grow: 10 })}>
                A+
              </button>
              <output className="edit-bar__value">{size}%</output>
              <i />
              <button type="button" title="Bold" aria-label="Part bold" className={st.b ? 'is-on' : ''} style={{ fontWeight: 800 }} disabled={off} onPointerDown={press({ toggle: 'b' })}>
                B
              </button>
              <button type="button" title="Italic" aria-label="Part italic" className={st.i ? 'is-on' : ''} style={{ fontStyle: 'italic' }} disabled={off} onPointerDown={press({ toggle: 'i' })}>
                I
              </button>
              <button type="button" title="Underline" aria-label="Part underline" className={st.u ? 'is-on' : ''} style={{ textDecoration: 'underline' }} disabled={off} onPointerDown={press({ toggle: 'u' })}>
                U
              </button>
              <i />
              <button
                type="button"
                className={`edit-bar__chip ${picker ? 'is-on' : ''}`}
                aria-label="Part colour"
                aria-expanded={picker}
                disabled={off}
                // The panel opens on the finished click, not on the press: opening it can move the bar,
                // and the rest of the click would then land on the page behind it and close everything.
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => setPicker(!picker)}
              >
                <span className="edit-bar__dot" style={st.c ? { background: st.c } : undefined} />
                Colour
              </button>
              <button type="button" className="edit-bar__chip" title="Remove the formatting of this part" aria-label="Part clear" disabled={off} onPointerDown={press({ clear: true })}>
                Clear
              </button>
            </div>

            {picker && !off && (
              <div className="edit-bar__picker">
                <div className="edit-bar__grid">
                  {colours.map((colour) => (
                    <button type="button" key={colour} className={st.c === colour ? 'is-on' : ''} style={{ background: colour }} title={colour} aria-label={`Part colour ${colour}`} onPointerDown={press({ color: colour })} />
                  ))}
                </div>
                <label className="edit-bar__field">
                  <span>Any colour</span>
                  <input type="range" className="edit-bar__hue" aria-label="Part colour from the rainbow" min={0} max={359} defaultValue={0} onChange={(event) => apply({ color: hueHex(Number(event.target.value)) }, true)} onPointerUp={back} />
                </label>
                <label className="edit-bar__field">
                  <span>Colour code</span>
                  <input
                    type="text"
                    aria-label="Part colour code"
                    placeholder={st.c || '#1a2b3c'}
                    maxLength={7}
                    value={hex}
                    onChange={(event) => {
                      const typed = event.target.value.trim()
                      setHex(typed)
                      if (HEX.test(typed)) apply({ color: typed.toLowerCase() }, true)
                    }}
                    onKeyDown={(event) => event.key === 'Enter' && back()}
                  />
                </label>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}

export default function E({ k, item, field = 'title', as: Tag = 'span', rich = false, className, children, ...rest }) {
  const site = useSite()
  const edit = useEditMode()
  const [typing, setTyping] = useState(false)

  const key = k ? `t:${k}` : `i:${item.id}:${field}`
  const value = (k ? site.texts[k] : item[field]) || ''
  const saved = site.text_styles?.[key]
  const style = textStyleCss(saved)

  if (!edit) {
    if (!value) return null
    return (
      <Tag className={className} style={style} {...movedAttr(saved)} {...rest}>
        <Marked text={value} rich={rich} />
        {children}
      </Tag>
    )
  }

  const selected = edit.selected === key

  if (!(selected && typing)) {
    const onTap = () => (selected ? setTyping(true) : tell({ type: EDIT_SELECT, key, rich }))
    return (
      <Tag className={className} style={style} {...movedAttr(saved)} {...rest} data-edit={selected ? 'selected' : ''} onPointerDown={pressHandler(key, saved, onTap)}>
        {value ? <Marked text={value} rich={rich} /> : '…'}
        {children}
        {selected && <Handles id={key} style={saved} />}
      </Tag>
    )
  }

  const done = (typed) => {
    if (typed !== value) tell({ type: EDIT_TEXT, key, value: typed })
    setTyping(false)
  }

  // Typing happens in an element React does not draw into; leaving this mode draws the text afresh.
  return (
    <Tag key="typing" className={className} style={style} {...movedAttr(saved)} {...rest} data-edit="typing">
      <Typing value={value} rich={rich} onDone={done} />
      {children}
    </Tag>
  )
}

// A block (a photo, for example) that can be dragged to another place.
export function M({ k, as: Tag = 'div', className, children, ...rest }) {
  const site = useSite()
  const edit = useEditMode()
  const key = `b:${k}`
  const saved = site.text_styles?.[key]
  const shared = { className, style: textStyleCss(saved, true), ...movedAttr(saved, true), ...rest }
  if (!edit) return <Tag {...shared}>{children}</Tag>
  const selected = edit.selected === key
  return (
    <Tag {...shared} data-edit={selected ? 'selected' : ''} onPointerDown={pressHandler(key, saved, () => tell({ type: EDIT_SELECT, key }))}>
      {children}
      {selected && <Handles id={key} style={saved} block />}
    </Tag>
  )
}

// Wraps one home section in the Studio: its handle drags the section above or below the others.
export function SectionMover({ id, sections, children }) {
  const startDrag = (event) => {
    event.preventDefault()
    const own = event.currentTarget.closest('.edit-section')
    // only sections that are actually drawn (a block with no content draws nothing)
    const others = () => [...document.querySelectorAll('.edit-section')].filter((node) => node !== own && node.querySelector(':scope > section'))
    const clear = () => document.querySelectorAll('.is-drop-before, .is-drop-after').forEach((node) => node.classList.remove('is-drop-before', 'is-drop-after'))
    let drop = null // { key, after }
    own.classList.add('is-dragging')

    const move = (moveEvent) => {
      const y = moveEvent.clientY
      if (y < 70) window.scrollBy(0, -24)
      else if (y > window.innerHeight - 70) window.scrollBy(0, 24)
      clear()
      const rows = others()
      if (!rows.length) return
      const below = rows.find((node) => {
        const box = node.getBoundingClientRect()
        return y < box.top + box.height / 2
      })
      const target = below || rows[rows.length - 1]
      target.classList.add(below ? 'is-drop-before' : 'is-drop-after')
      drop = { key: target.dataset.section, after: !below }
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      clear()
      own.classList.remove('is-dragging')
      if (!drop) return
      const mine = sections.find((row) => row.key === id)
      const rest = sections.filter((row) => row.key !== id)
      const index = rest.findIndex((row) => row.key === drop.key) + (drop.after ? 1 : 0)
      const next = [...rest.slice(0, index), mine, ...rest.slice(index)]
      if (next.some((row, position) => row.key !== sections[position].key)) tell({ type: EDIT_SECTIONS, sections: next })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div className="edit-section" data-section={id}>
      <button type="button" className="edit-section__handle" onPointerDown={startDrag}>
        ⠿ Drag to move this section
      </button>
      {children}
    </div>
  )
}
