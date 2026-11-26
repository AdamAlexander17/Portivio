import { useRef, useState } from 'react'
import { api, fileUrl } from '../api/client'
import { Feedback, Icon, MoveButtons, moved, useAction } from './adminUi'

const IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/gif'
const BLOCK_TYPES = [
  ['heading', 'Heading'],
  ['text', 'Text'],
  ['image', 'Image'],
  ['quote', 'Quote'],
  ['video', 'Video'],
]
const LABELS = Object.fromEntries(BLOCK_TYPES)
const MAX_BLOCKS = 60

// A fresh local id per block keeps React's list stable while blocks are moved around.
let nextKey = 1
const withKey = (block) => ({ ...block, key: nextKey++ })
const blank = (type) => withKey({ type, text: '', by: '', image: '', caption: '', url: '' })

// What the server expects for each block type (it rejects unknown fields' values anyway).
function toPayload(block) {
  switch (block.type) {
    case 'heading':
    case 'text':
      return { type: block.type, text: block.text.trim() }
    case 'quote':
      return { type: 'quote', text: block.text.trim(), by: (block.by || '').trim() }
    case 'image':
      return { type: 'image', image: block.image, caption: (block.caption || '').trim() }
    default:
      return { type: 'video', url: (block.url || '').trim() }
  }
}

const isEmpty = (block) =>
  block.type === 'image' ? !block.image : block.type === 'video' ? !(block.url || '').trim() : !(block.text || '').trim()

function BlockFields({ block, projectId, onChange, onError }) {
  const input = useRef(null)
  const [uploading, setUploading] = useState(false)
  const set = (field) => (event) => onChange({ ...block, [field]: event.target.value })

  async function chooseImage(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const { image } = await api.uploadContentImage(projectId, file)
      onChange({ ...block, image })
    } catch (err) {
      onError(err.message)
    } finally {
      setUploading(false)
    }
  }

  if (block.type === 'heading') {
    return <input type="text" maxLength={200} placeholder="Section heading" aria-label="Heading" value={block.text} onChange={set('text')} />
  }
  if (block.type === 'text') {
    return (
      <textarea rows={5} maxLength={6000} placeholder="Write here. Leave an empty line between paragraphs." aria-label="Text" value={block.text} onChange={set('text')} />
    )
  }
  if (block.type === 'quote') {
    return (
      <>
        <textarea rows={3} maxLength={1000} placeholder="The quote" aria-label="Quote" value={block.text} onChange={set('text')} />
        <input type="text" maxLength={150} placeholder="Who said it (optional)" aria-label="Quote author" value={block.by || ''} onChange={set('by')} />
      </>
    )
  }
  if (block.type === 'image') {
    return (
      <div className="case-edit__image">
        <div className="adm-thumb">{block.image ? <img src={fileUrl(block.image)} alt="" /> : <span>No image</span>}</div>
        <div className="adm-form">
          <input ref={input} type="file" accept={IMAGE_TYPES} hidden onChange={chooseImage} />
          <button type="button" className="adm-btn adm-btn--small" disabled={uploading} onClick={() => input.current.click()}>
            <Icon name="upload" /> {uploading ? 'Uploading…' : block.image ? 'Replace image' : 'Choose image'}
          </button>
          <input type="text" maxLength={255} placeholder="Caption (optional)" aria-label="Caption" value={block.caption || ''} onChange={set('caption')} />
        </div>
      </div>
    )
  }
  return <input type="url" maxLength={300} placeholder="YouTube or Vimeo link, for example https://youtu.be/…" aria-label="Video link" value={block.url || ''} onChange={set('url')} />
}

// Builds a project's case study from blocks: headings, text, images, quotes and videos.
export default function CaseStudyEditor({ project, onSaved }) {
  const { busy, error, notice, run } = useAction()
  const [blocks, setBlocks] = useState(() => (project.content || []).map(withKey))
  const [problem, setProblem] = useState('')
  const [dirty, setDirty] = useState(false)

  const change = (next) => {
    setBlocks(next)
    setDirty(true)
    setProblem('')
  }
  const update = (index, block) => change(blocks.map((current, i) => (i === index ? block : current)))

  async function save() {
    const filled = blocks.filter((block) => !isEmpty(block)) // empty blocks are simply left out
    const saved = await run(() => api.saveProjectContent(project.id, filled.map(toPayload)), 'Case study saved.')
    if (saved) {
      setBlocks((saved.content || []).map(withKey))
      setDirty(false)
      onSaved(saved)
    }
  }

  return (
    <div className="adm-card adm-form">
      <div>
        <h2>Case study</h2>
        <p className="adm-muted">
          Tell the full story of the project with blocks. They show on the project page under the gallery, in this order.
        </p>
      </div>

      {blocks.length === 0 && <p className="adm-muted">No blocks yet. Add the first one below.</p>}

      <ul className="case-edit">
        {blocks.map((block, index) => (
          <li key={block.key}>
            <div className="adm-row adm-row--between">
              <span className="adm-badge adm-badge--purple">{LABELS[block.type]}</span>
              <span className="adm-row">
                <MoveButtons index={index} count={blocks.length} onMove={(step) => change(moved(blocks, index, step))} />
                <button type="button" className="adm-btn adm-btn--danger adm-btn--small" onClick={() => change(blocks.filter((_, i) => i !== index))}>
                  <Icon name="trash" /> Remove
                </button>
              </span>
            </div>
            <BlockFields block={block} projectId={project.id} onChange={(next) => update(index, next)} onError={setProblem} />
          </li>
        ))}
      </ul>

      <div className="adm-row">
        <span className="adm-muted">Add:</span>
        {BLOCK_TYPES.map(([type, label]) => (
          <button type="button" key={type} className="adm-btn adm-btn--small" disabled={blocks.length >= MAX_BLOCKS} onClick={() => change([...blocks, blank(type)])}>
            + {label}
          </button>
        ))}
      </div>

      <Feedback error={problem || error} notice={dirty ? '' : notice} />
      <div className="adm-row">
        <button type="button" className="adm-btn adm-btn--primary" disabled={busy || !dirty} onClick={save}>
          <Icon name="check" /> {busy ? 'Saving…' : dirty ? 'Save case study' : 'Saved'}
        </button>
        {dirty && <span className="adm-muted">You have unsaved changes.</span>}
      </div>
    </div>
  )
}
