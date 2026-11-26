// Formatting of PART of a text (a few words given their own colour or size in the Design Studio).
//
// It is stored inside the text itself:   Hello [[#ff0000,120,b|big red]] world
//   #rrggbb  colour        120  size in percent of the text around it
//   b i u    bold, italic, underline        a  the theme's accent colour
// In headings, *stars* remain the short way to write the accent colour.
//
// A text is handled as a list of runs: [{ t: 'Hello ', st: {} }, { t: 'big red', st: { c, s, b } }, …]

const SPAN = /\[\[([#0-9a-zA-Z,]{1,40})\|([\s\S]*?)\]\]/g
const HEX = /^#[0-9a-fA-F]{6}$/
const FLAGS = ['b', 'i', 'u', 'a']
export const SIZE_MIN = 50
export const SIZE_MAX = 300
const clampSize = (number) => Math.max(SIZE_MIN, Math.min(SIZE_MAX, Math.round(number)))

// "#ff0000,120,b"  ->  { c: '#ff0000', s: 120, b: true }   (anything not understood is ignored)
export function readStyle(attrs) {
  const st = {}
  for (const token of String(attrs || '').split(',')) {
    if (HEX.test(token)) st.c = token.toLowerCase()
    else if (/^\d{2,3}$/.test(token)) {
      const size = clampSize(Number(token))
      if (size !== 100) st.s = size
    } else if (FLAGS.includes(token)) st[token] = true
  }
  return st
}

export const writeStyle = (st) => [st.c, st.s, ...FLAGS.filter((flag) => st[flag])].filter(Boolean).join(',')

// The inline CSS of a run (the accent colour comes from the "accent" class instead).
export function runCss(st) {
  const css = {}
  if (st.c) css.color = st.c
  if (st.s) css.fontSize = `${st.s / 100}em`
  if (st.b) css.fontWeight = 700
  if (st.i) css.fontStyle = 'italic'
  if (st.u) css.textDecoration = 'underline'
  return css
}

export function parse(text, rich) {
  const runs = []
  const plain = (part) => {
    if (!part) return
    if (!rich) return runs.push({ t: part, st: {} })
    for (const piece of part.split(/(\*[^*\n]+\*)/g)) {
      if (!piece) continue
      const accent = piece.length > 2 && piece.startsWith('*') && piece.endsWith('*')
      runs.push(accent ? { t: piece.slice(1, -1), st: { a: true } } : { t: piece, st: {} })
    }
  }
  let last = 0
  for (const match of String(text || '').matchAll(SPAN)) {
    plain(text.slice(last, match.index))
    if (match[2]) runs.push({ t: match[2], st: readStyle(match[1]) })
    last = match.index + match[0].length
  }
  plain(String(text || '').slice(last))
  return runs
}

// Neighbouring runs with the same style become one.
function joined(runs) {
  const out = []
  for (const run of runs) {
    if (!run.t) continue
    const previous = out[out.length - 1]
    if (previous && writeStyle(previous.st) === writeStyle(run.st)) previous.t += run.t
    else out.push({ t: run.t, st: run.st })
  }
  return out
}

export function toMarkup(runs, rich) {
  return joined(runs)
    .map(({ t, st }) => {
      const attrs = writeStyle(st)
      if (!attrs || t.includes(']]')) return t
      if (attrs === 'a' && rich && !/[*\n]/.test(t)) return `*${t}*`
      return `[[${attrs}|${t}]]`
    })
    .join('')
}

// The text without any formatting marks, for places that need plain words.
export const plainText = (text, rich) => parse(text, rich).map((run) => run.t).join('')

// Changes the style of the characters from `from` to `to`.
//   { color: '#…' }  { grow: 10 | -10 }  { size: 120 }  { toggle: 'b' | 'i' | 'u' }  { clear: true }
export function restyle(runs, from, to, change) {
  const pieces = []
  let position = 0
  for (const run of runs) {
    const end = position + run.t.length
    const a = Math.max(from, position)
    const b = Math.min(to, end)
    if (a >= b) pieces.push({ ...run, inside: false })
    else {
      if (a > position) pieces.push({ t: run.t.slice(0, a - position), st: run.st, inside: false })
      pieces.push({ t: run.t.slice(a - position, b - position), st: run.st, inside: true })
      if (b < end) pieces.push({ t: run.t.slice(b - position), st: run.st, inside: false })
    }
    position = end
  }
  const first = pieces.find((piece) => piece.inside)
  if (!first) return runs
  // a toggle switches the whole selection the same way, judged by where it starts
  const turnOn = change.toggle ? !first.st[change.toggle] : false

  return joined(
    pieces.map((piece) => {
      if (!piece.inside) return piece
      let st = { ...piece.st }
      if (change.clear) st = {}
      if (change.color) {
        st.c = change.color
        delete st.a // its own colour replaces the accent colour
      }
      if (change.grow || change.size) {
        const size = clampSize(change.size || (st.s || 100) + change.grow)
        if (size === 100) delete st.s
        else st.s = size
      }
      if (change.toggle) {
        if (turnOn) st[change.toggle] = true
        else delete st[change.toggle]
      }
      return { t: piece.t, st }
    }),
  )
}

// ---- the same runs as real page elements, for the text while it is being typed ----

export function fill(element, runs) {
  element.textContent = ''
  for (const run of runs) {
    const attrs = writeStyle(run.st)
    if (!attrs) {
      element.appendChild(document.createTextNode(run.t))
      continue
    }
    const span = document.createElement('span')
    span.dataset.m = attrs
    if (run.st.a) span.className = 'accent'
    Object.assign(span.style, runCss(run.st))
    span.textContent = run.t
    element.appendChild(span)
  }
}

export function read(element) {
  const runs = []
  const walk = (node, st) => {
    if (node.nodeType === 3) return runs.push({ t: node.nodeValue, st })
    if (node.nodeType !== 1) return undefined
    if (node.tagName === 'BR') return runs.push({ t: '\n', st })
    const own = node.dataset.m !== undefined ? readStyle(node.dataset.m) : st
    node.childNodes.forEach((child) => walk(child, own))
    return undefined
  }
  element.childNodes.forEach((child) => walk(child, {}))
  return joined(runs)
}

// How many characters come before a point of the selection.
export function offsetOf(element, node, offset) {
  const range = document.createRange()
  range.selectNodeContents(element)
  range.setEnd(node, offset)
  return range.toString().length
}

// Selects the characters from `from` to `to` again after the elements were rebuilt.
export function selectChars(element, from, to) {
  const range = document.createRange()
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  let position = 0
  let started = false
  while (walker.nextNode()) {
    const node = walker.currentNode
    const end = position + node.nodeValue.length
    if (!started && from <= end) {
      range.setStart(node, from - position)
      started = true
    }
    if (started && to <= end) {
      range.setEnd(node, to - position)
      break
    }
    position = end
  }
  if (!started) return
  const selection = window.getSelection()
  selection.removeAllRanges()
  selection.addRange(range)
}
