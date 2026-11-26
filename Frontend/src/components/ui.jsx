import { Fragment } from 'react'

// Headings from the admin panel: *stars* become purple text, a line break starts a new line.
export function RichText({ text = '' }) {
  return text.split('\n').map((line, lineIndex) => (
    <Fragment key={lineIndex}>
      {lineIndex > 0 && <br />}
      {line.split(/(\*[^*]+\*)/g).map((part, index) =>
        part.length > 2 && part.startsWith('*') && part.endsWith('*') ? (
          <span className="accent" key={index}>
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        ),
      )}
    </Fragment>
  ))
}

// Long text from the admin panel: a blank line starts a new paragraph.
export function Paragraphs({ text = '', className }) {
  const blocks = text.split(/\n\s*\n/).filter((block) => block.trim())
  return blocks.map((block, index) => (
    <p className={className} key={index}>
      {block.trim()}
    </p>
  ))
}

export function Arrow() {
  return (
    <svg className="arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const twoDigits = (number) => String(number).padStart(2, '0')

// "Dashboards" and "dashboard" count as the same category.
const plain = (label) => String(label).trim().toLowerCase().replace(/s$/, '')
export const sameLabel = (a, b) => plain(a) === plain(b)
