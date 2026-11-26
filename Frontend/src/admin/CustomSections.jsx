import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, fileUrl } from '../api/client'
import { useSiteState } from '../context/SiteContext'
import { Feedback, Field, Icon, Modal, PageHeader, useAction, useConfirm } from './adminUi'

const IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/gif'
const BLANK = { eyebrow: '', title: '', body: '', image_side: 'right', background: 'plain', button_label: '', button_url: '' }

function SectionForm({ section, busy, onSave, onCancel }) {
  const [form, setForm] = useState(section ? Object.fromEntries(Object.keys(BLANK).map((key) => [key, section[key]])) : BLANK)
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  return (
    <form
      className="adm-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(form)
      }}
    >
      <div className="adm-grid">
        <Field label="Heading" hint="Wrap words in *stars* to colour them.">
          <input type="text" maxLength={200} autoFocus value={form.title} onChange={set('title')} />
        </Field>
        <Field label="Small line above the heading (optional)">
          <input type="text" maxLength={80} value={form.eyebrow} onChange={set('eyebrow')} />
        </Field>
      </div>
      <Field label="Text" hint="Leave an empty line between paragraphs.">
        <textarea rows={5} maxLength={5000} value={form.body} onChange={set('body')} />
      </Field>
      <div className="adm-grid">
        <Field label="Button label (optional)">
          <input type="text" maxLength={60} value={form.button_label} onChange={set('button_label')} />
        </Field>
        <Field label="Button link" hint="A full link (https://…) or a page of this site such as /contact.">
          <input type="text" maxLength={500} value={form.button_url} onChange={set('button_url')} />
        </Field>
        <Field label="Background">
          <select value={form.background} onChange={set('background')}>
            <option value="plain">Plain</option>
            <option value="tint">Soft tint</option>
            <option value="dark">Dark</option>
          </select>
        </Field>
        <Field label="Image position" hint="Add the image after saving.">
          <select value={form.image_side} onChange={set('image_side')}>
            <option value="right">Image on the right</option>
            <option value="left">Image on the left</option>
          </select>
        </Field>
      </div>
      <div className="adm-row">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          <Icon name="check" /> {busy ? 'Saving…' : 'Save section'}
        </button>
        <button type="button" className="adm-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function SectionRow({ section, busy, onEdit, onDelete, onImage, onRemoveImage }) {
  const input = useRef(null)
  return (
    <li className="adm-card adm-list__item">
      <div className="adm-thumb">{section.image ? <img src={fileUrl(section.image)} alt="" /> : <span>No image</span>}</div>
      <div className="adm-list__text">
        <strong>{section.title || 'Untitled section'}</strong>
        {section.body && <p>{section.body}</p>}
        {section.button_label && <p className="adm-muted">Button: {section.button_label}</p>}
      </div>
      <div className="adm-row">
        <input
          ref={input}
          type="file"
          accept={IMAGE_TYPES}
          hidden
          onChange={(event) => {
            const file = event.target.files[0]
            event.target.value = ''
            if (file) onImage(file)
          }}
        />
        <button type="button" className="adm-btn" disabled={busy} onClick={() => input.current.click()}>
          <Icon name="upload" /> {section.image ? 'Replace image' : 'Add image'}
        </button>
        {section.image && (
          <button type="button" className="adm-btn" disabled={busy} onClick={onRemoveImage}>
            <Icon name="trash" /> Remove image
          </button>
        )}
        <button type="button" className="adm-btn" onClick={onEdit}>
          <Icon name="edit" /> Edit
        </button>
        <button type="button" className="adm-btn adm-btn--danger" disabled={busy} onClick={onDelete}>
          <Icon name="trash" /> Delete
        </button>
      </div>
    </li>
  )
}

export default function CustomSections() {
  const { reload } = useSiteState()
  const { busy, error, notice, run } = useAction()
  const confirm = useConfirm()
  const [sections, setSections] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | section

  useEffect(() => {
    run(() => api.customSections()).then((list) => list && setSections(list))
  }, [run])

  // After any change: refresh this list and the site data the Studio and preview read.
  const act = (action, message) =>
    run(async () => {
      await action()
      setSections(await api.customSections())
      reload()
      return true
    }, message)

  async function save(data) {
    const done = await act(() => (editing === 'new' ? api.createCustomSection(data) : api.updateCustomSection(editing.id, data)), 'Section saved.')
    if (done) setEditing(null)
  }

  return (
    <>
      <PageHeader
        title="Custom sections"
        intro="Build your own home page blocks: a heading, text, an optional image and a button. A new section appears just above the contact form."
      >
        {editing === null && (
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setEditing('new')}>
            <Icon name="plus" /> Add section
          </button>
        )}
      </PageHeader>
      <Feedback error={error} notice={notice} />

      {editing !== null && (
        <Modal title={editing === 'new' ? 'New section' : 'Edit section'} size="large" error={error} onClose={() => setEditing(null)}>
          <SectionForm
            key={editing === 'new' ? 'new' : editing.id}
            section={editing === 'new' ? null : editing}
            busy={busy}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {sections && sections.length === 0 && editing === null && <p className="adm-card adm-muted">No custom sections yet.</p>}

      {sections && sections.length > 0 && (
        <>
          <ul className="adm-list adm-list--wide">
            {sections.map((section) => (
              <SectionRow
                key={section.id}
                section={section}
                busy={busy}
                onEdit={() => setEditing(section)}
                onImage={(file) => act(() => api.uploadCustomSectionImage(section.id, file), 'Image updated.')}
                onRemoveImage={() => act(() => api.deleteCustomSectionImage(section.id), 'Image removed.')}
                onDelete={async () =>
                  (await confirm(`Delete the section "${section.title || 'Untitled section'}"?`)) &&
                  act(() => api.deleteCustomSection(section.id), 'Section deleted.')
                }
              />
            ))}
          </ul>
          <p className="adm-muted">
            To move a section or hide it, open the <Link className="adm-link" to="/admin/studio">Design Studio</Link> and use the Sections tab.
          </p>
        </>
      )}
    </>
  )
}
