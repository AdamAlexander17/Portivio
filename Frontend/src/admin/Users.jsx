import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Feedback, Field, Icon, Modal, PageHeader, useAction, useConfirm } from './adminUi'

const EMPTY = { full_name: '', username: '', email: '', password: '' }

function CreateForm({ busy, onCreate, onCancel }) {
  const [form, setForm] = useState(EMPTY)
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  return (
    <form
      className="adm-form"
      onSubmit={(event) => {
        event.preventDefault()
        onCreate({ ...form, username: form.username.trim().toLowerCase(), full_name: form.full_name.trim(), email: form.email.trim() || null })
      }}
    >
      <p className="adm-muted">The user gets their own portfolio site and their own panel to manage it.</p>
      <div className="adm-grid">
        <Field label="Full name" hint="Shown on their site. They can change it later.">
          <input type="text" required maxLength={120} autoFocus value={form.full_name} onChange={set('full_name')} />
        </Field>
        <Field label="Username" hint="3 to 30 letters, numbers, - or _. Used to sign in and in their site link.">
          <input
            type="text"
            required
            minLength={3}
            maxLength={30}
            pattern="[A-Za-z0-9][A-Za-z0-9_\-]{2,29}"
            autoCapitalize="none"
            autoComplete="off"
            value={form.username}
            onChange={set('username')}
          />
        </Field>
        <Field label="Email (optional)" hint="Lets the user reset a forgotten password.">
          <input type="email" maxLength={255} autoComplete="off" value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Password" hint="At least 8 characters. Share it with the user; they can change it after signing in.">
          <input type="text" required minLength={8} maxLength={72} autoComplete="off" value={form.password} onChange={set('password')} />
        </Field>
      </div>
      <div className="adm-row">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          <Icon name="check" /> {busy ? 'Creating…' : 'Create user'}
        </button>
        <button type="button" className="adm-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function Users() {
  const navigate = useNavigate()
  const { user: me, isAdmin, setManaging } = useAuth()
  const { busy, error, notice, run } = useAction()
  const confirm = useConfirm()
  const [users, setUsers] = useState(null)
  const [creating, setCreating] = useState(false)
  const [resetting, setResetting] = useState(null) // the user whose password is being set
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (isAdmin) run(() => api.users()).then((list) => list && setUsers(list))
  }, [isAdmin, run])

  if (!isAdmin) return <Navigate to="/admin" replace />

  const replace = (updated) => setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)))

  async function create(data) {
    const created = await run(() => api.createUser(data), `User "${data.username}" created.`)
    if (created) {
      setUsers((list) => [...list, created])
      setCreating(false)
    }
  }

  async function toggleActive(target) {
    const question = target.is_active
      ? `Block ${target.username}? They will not be able to sign in and their site will be hidden.`
      : `Unblock ${target.username}?`
    if (!(await confirm(question))) return
    const updated = await run(
      () => api.updateUser(target.id, { is_active: !target.is_active }),
      target.is_active ? 'User blocked.' : 'User unblocked.',
    )
    if (updated) replace(updated)
  }

  function resetPassword(target) {
    setNewPassword('')
    setResetting(target)
  }

  async function submitPassword(event) {
    event.preventDefault()
    const done = await run(() => api.updateUser(resetting.id, { password: newPassword }), `Password changed for ${resetting.username}.`)
    if (done) setResetting(null)
  }

  async function remove(target) {
    if (!(await confirm(`Delete ${target.username} and their whole site (projects, images, messages)? This cannot be undone.`))) return
    run(async () => {
      await api.deleteUser(target.id)
      setUsers((list) => list.filter((u) => u.id !== target.id))
    }, 'User deleted.')
  }

  function manage(target) {
    setManaging(target.id === me.id ? null : { id: target.id, username: target.username, name: target.name })
    navigate('/admin')
  }

  return (
    <>
      <PageHeader title="Users" intro="Create accounts, open any user's panel, block or delete them. Only admins see this page.">
        {!creating && (
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setCreating(true)}>
            <Icon name="plus" /> Add user
          </button>
        )}
      </PageHeader>
      <Feedback error={error} notice={notice} />

      {creating && (
        <Modal title="New user" size="large" error={error} onClose={() => setCreating(false)}>
          <CreateForm busy={busy} onCreate={create} onCancel={() => setCreating(false)} />
        </Modal>
      )}

      {resetting && (
        <Modal title={`New password for ${resetting.username}`} size="small" error={error} onClose={() => setResetting(null)}>
          <form className="adm-form" onSubmit={submitPassword}>
            <Field label="New password" hint="At least 8 characters. The user is signed out everywhere and must use this one.">
              <input type="text" required minLength={8} maxLength={72} autoFocus autoComplete="off" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </Field>
            <div className="adm-row">
              <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
                <Icon name="check" /> {busy ? 'Saving…' : 'Set password'}
              </button>
              <button type="button" className="adm-btn" onClick={() => setResetting(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {users && (
        <ul className="adm-list adm-list--wide">
          {users.map((target) => {
            const isMe = target.id === me.id
            const link = `/u/${target.username}`
            return (
              <li className="adm-card adm-list__item" key={target.id}>
                <div className="adm-list__text">
                  <strong>{target.name || target.username}</strong>
                  <p className="adm-muted">
                    {target.username} · {target.email || 'no email'} · site: {link}
                  </p>
                  <p>
                    <span className={`adm-badge ${target.role === 'admin' ? 'adm-badge--purple' : ''}`}>
                      {target.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                    {isMe && <span className="adm-badge">You</span>}
                    {!target.is_active && <span className="adm-badge adm-badge--warn">Blocked</span>}
                  </p>
                </div>
                <div className="adm-row">
                  {!isMe && (
                    <button type="button" className="adm-btn adm-btn--primary" onClick={() => manage(target)}>
                      <Icon name="enter" /> Open panel
                    </button>
                  )}
                  {target.is_active && (
                    <a href={link} target="_blank" rel="noreferrer" className="adm-btn">
                      <Icon name="external" /> View site
                    </a>
                  )}
                  {!isMe && (
                    <>
                      <button type="button" className="adm-btn" disabled={busy} onClick={() => resetPassword(target)}>
                        <Icon name="key" /> Reset password
                      </button>
                      <button type="button" className="adm-btn" disabled={busy} onClick={() => toggleActive(target)}>
                        <Icon name="ban" /> {target.is_active ? 'Block' : 'Unblock'}
                      </button>
                      {target.role !== 'admin' && (
                        <button type="button" className="adm-btn adm-btn--danger" disabled={busy} onClick={() => remove(target)}>
                          <Icon name="trash" /> Delete
                        </button>
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
