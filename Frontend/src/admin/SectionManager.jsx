import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useSiteState } from '../context/SiteContext'
import { Feedback, Field, Icon, linesToList, listToLines, Modal, MoveButtons, moved, PageHeader, useAction, useConfirm } from './adminUi'
import { SECTIONS } from './sections'

const blank = { title: '', body: '', meta: '', items: '' }

function ItemForm({ config, item, busy, onSave, onCancel }) {
  const [form, setForm] = useState(
    item ? { title: item.title, body: item.body, meta: item.meta, items: listToLines(item.items) } : blank,
  )
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  const submit = (event) => {
    event.preventDefault()
    onSave({ title: form.title.trim(), body: form.body.trim(), meta: form.meta.trim(), items: linesToList(form.items) })
  }

  return (
    <form className="adm-form" onSubmit={submit}>
      <Field label={config.title}>
        <input type="text" required maxLength={255} autoFocus value={form.title} onChange={set('title')} />
      </Field>
      {config.body && (
        <Field label={config.body}>
          <textarea rows={4} maxLength={5000} value={form.body} onChange={set('body')} />
        </Field>
      )}
      {config.items && (
        <Field label={config.items} hint="One per line.">
          <textarea rows={5} value={form.items} onChange={set('items')} />
        </Field>
      )}
      {config.meta && (
        <Field label={config.meta}>
          <input type="text" maxLength={255} value={form.meta} onChange={set('meta')} />
        </Field>
      )}
      <div className="adm-row">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          <Icon name="check" /> {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="adm-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function Manager({ section, config }) {
  const { reload } = useSiteState()
  const { busy, error, notice, run } = useAction()
  const confirm = useConfirm()
  const [items, setItems] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | item

  useEffect(() => {
    run(() => api.items(section)).then((list) => list && setItems(list))
  }, [section, run])

  // Reloads this list and the shared site data the public pages read from.
  const refresh = async () => {
    setItems(await api.items(section))
    reload()
  }

  async function save(data) {
    const done = await run(async () => {
      if (editing === 'new') await api.createItem({ ...data, section })
      else await api.updateItem(editing.id, data)
      await refresh()
      return true
    }, 'Saved.')
    if (done) setEditing(null)
  }

  async function remove(item) {
    if (!(await confirm(`Delete "${item.title}"?`))) return
    run(async () => {
      await api.deleteItem(item.id)
      await refresh()
    }, 'Deleted.')
  }

  function move(index, step) {
    const next = moved(items, index, step)
    if (next === items) return
    setItems(next)
    run(async () => {
      await api.reorderItems(section, next.map((item) => item.id))
      reload()
    })
  }

  return (
    <>
      <PageHeader title={config.label} intro={`${config.page} page. ${config.intro}`}>
        {editing === null && (
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setEditing('new')}>
            <Icon name="plus" /> Add entry
          </button>
        )}
      </PageHeader>
      <Feedback error={error} notice={notice} />

      {editing !== null && (
        <Modal title={editing === 'new' ? `Add to ${config.label}` : 'Edit entry'} error={error} onClose={() => setEditing(null)}>
          <ItemForm
            key={editing === 'new' ? 'new' : editing.id}
            config={config}
            item={editing === 'new' ? null : editing}
            busy={busy}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {items && items.length === 0 && <p className="adm-card adm-muted">Nothing here yet. This part of the page stays hidden until you add an entry.</p>}

      {items && items.length > 0 && (
        <ul className="adm-list">
          {items.map((item, index) => (
            <li className="adm-card adm-list__item" key={item.id}>
              <MoveButtons index={index} count={items.length} disabled={busy} onMove={(step) => move(index, step)} />
              <div className="adm-list__text">
                <strong>{item.title}</strong>
                {item.body && <p>{item.body}</p>}
                {item.items.length > 0 && <p className="adm-muted">{item.items.join(' · ')}</p>}
                {item.meta && <p className="adm-muted">{item.meta}</p>}
              </div>
              <div className="adm-row">
                <button type="button" className="adm-btn" onClick={() => setEditing(item)}>
                  <Icon name="edit" /> Edit
                </button>
                <button type="button" className="adm-btn adm-btn--danger" disabled={busy} onClick={() => remove(item)}>
                  <Icon name="trash" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default function SectionManager() {
  const { section } = useParams()
  const config = SECTIONS[section]
  if (!config) return <Navigate to="/admin" replace />
  // The key resets all state when switching between sections.
  return <Manager key={section} section={section} config={config} />
}
