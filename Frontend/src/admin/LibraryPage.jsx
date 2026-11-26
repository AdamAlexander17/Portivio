import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSiteState } from '../context/SiteContext'
import { Feedback, Icon, Modal, PageHeader, useAction, useConfirm } from './adminUi'

// The shared screen behind Themes and Layouts: a grid of preview cards where
// everyone picks one entry for the site, and admins also manage the library.
//
//   noun        'theme' or 'layout' (used in labels and messages)
//   dataKey     the field holding the entry's settings: 'tokens' or 'options'
//   currentId   id of the entry the managed site uses now
//   actions     { list, select, create, update, remove } API calls
//   Preview     component drawing an entry: <Preview entry={entry} />
//   Editor      admin form: <Editor entry={entry|null} busy onSave onCancel />
export default function LibraryPage({ title, noun, dataKey, currentId, actions, Preview, Editor }) {
  const { isAdmin } = useAuth()
  const { reload } = useSiteState()
  const { busy, error, notice, run } = useAction()
  const confirm = useConfirm()
  const [entries, setEntries] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | entry

  useEffect(() => {
    run(() => actions.list()).then((list) => list && setEntries(list))
  }, [run, actions])

  const refresh = async () => setEntries(await actions.list())

  async function use(entry) {
    const done = await run(() => actions.select(entry.id), `"${entry.name}" is now the site's ${noun}.`)
    if (done) reload()
  }

  async function save(data) {
    const done = await run(async () => {
      if (editing === 'new') await actions.create(data)
      else await actions.update(editing.id, data)
      await refresh()
      reload() // the site may be using the entry that was just edited
      return true
    }, `${title.slice(0, -1)} saved.`)
    if (done) setEditing(null)
  }

  function toggleVisibility(entry) {
    const visibility = entry.visibility === 'public' ? 'private' : 'public'
    run(async () => {
      await actions.update(entry.id, {
        name: entry.name,
        description: entry.description,
        visibility,
        [dataKey]: entry[dataKey],
      })
      await refresh()
    }, `"${entry.name}" is now ${visibility}.`)
  }

  async function remove(entry) {
    if (!(await confirm(`Delete the ${noun} "${entry.name}"? Sites using it will switch to the default ${noun}.`))) return
    run(async () => {
      await actions.remove(entry.id)
      await refresh()
      reload()
    }, `${title.slice(0, -1)} deleted.`)
  }

  const intro = isAdmin
    ? `Pick the ${noun} of the site. As admin you can also create ${noun}s and decide which ones users can pick.`
    : `Pick the ${noun} of your site. It changes straight away. Locked ${noun}s are private and not available to you.`

  return (
    <>
      <PageHeader title={title} intro={intro}>
        {isAdmin && editing === null && (
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setEditing('new')}>
            <Icon name="plus" /> Create {noun}
          </button>
        )}
      </PageHeader>
      <Feedback error={error} notice={notice} />

      {editing !== null && (
        <Modal
          title={editing === 'new' ? `New ${noun}` : `Edit "${editing.name}"`}
          size="wide"
          error={error}
          onClose={() => setEditing(null)}
        >
          <Editor
            key={editing === 'new' ? 'new' : editing.id}
            entry={editing === 'new' ? null : editing}
            busy={busy}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {entries && (
        <ul className="theme-grid">
          {entries.map((entry) => {
            const isCurrent = entry.id === currentId
            const isPrivate = entry.visibility === 'private'
            const locked = isPrivate && !isAdmin
            return (
              <li className={`adm-card theme-card ${isCurrent ? 'is-current' : ''} ${locked ? 'is-locked' : ''}`} key={entry.id}>
                <div className="theme-card__preview">
                  <Preview entry={entry} />
                  {locked && <span className="theme-card__lock">Private</span>}
                </div>
                <div className="theme-card__body">
                  <h2>{entry.name}</h2>
                  <p className="adm-muted">{entry.description}</p>
                  <p>
                    {isCurrent && <span className="adm-badge adm-badge--purple">In use</span>}
                    {entry.is_default && <span className="adm-badge">Default</span>}
                    {isAdmin && <span className={`adm-badge ${isPrivate ? 'adm-badge--warn' : ''}`}>{isPrivate ? 'Private' : 'Public'}</span>}
                  </p>
                </div>
                <div className="adm-row">
                  {locked ? (
                    <span className="adm-muted">Not available. Ask the admin to unlock it.</span>
                  ) : (
                    <button type="button" className="adm-btn adm-btn--primary" disabled={busy || isCurrent} onClick={() => use(entry)}>
                      <Icon name="check" /> {isCurrent ? 'In use' : `Use this ${noun}`}
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      <button type="button" className="adm-btn" onClick={() => setEditing(entry)}>
                        <Icon name="edit" /> Edit
                      </button>
                      {!entry.is_default && (
                        <>
                          <button type="button" className="adm-btn" disabled={busy} onClick={() => toggleVisibility(entry)}>
                            <Icon name="lock" /> Make {isPrivate ? 'public' : 'private'}
                          </button>
                          <button type="button" className="adm-btn adm-btn--danger" disabled={busy} onClick={() => remove(entry)}>
                            <Icon name="trash" /> Delete
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
