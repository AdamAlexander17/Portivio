import { useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Feedback, Field, Icon, PageHeader, useAction } from './adminUi'

const EMPTY = { current_password: '', new_password: '', confirm: '' }

function EmailForm() {
  const { user, setUser } = useAuth()
  const { busy, error, notice, run } = useAction()
  const [email, setEmail] = useState(user.email || '')

  async function submit(event) {
    event.preventDefault()
    const updated = await run(() => api.updateAccount(email.trim()), 'Email saved.')
    if (updated) setUser(updated)
  }

  return (
    <form className="adm-card adm-form adm-form--narrow" onSubmit={submit}>
      <h2>Account email</h2>
      <p className="adm-muted">
        Used to sign in and to reset your password. It is private: the email shown on your site is set under Profile.
      </p>
      <Feedback error={error} notice={notice} />
      {!user.email && <Feedback error="No email is set. Without one you cannot reset a forgotten password." />}
      <Field label="Email">
        <input type="email" required maxLength={255} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <div className="adm-row">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          <Icon name="check" /> {busy ? 'Saving…' : 'Save email'}
        </button>
      </div>
    </form>
  )
}

function PasswordForm() {
  const { startSession } = useAuth()
  const { busy, error, notice, run } = useAction()
  const [form, setForm] = useState(EMPTY)
  const [mismatch, setMismatch] = useState(false)

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  async function submit(event) {
    event.preventDefault()
    if (form.new_password !== form.confirm) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    const result = await run(
      () => api.changePassword({ current_password: form.current_password, new_password: form.new_password }),
      'Password changed. Other devices have been signed out.',
    )
    if (result) {
      // The server ended every older session; it sent a fresh one for this device.
      startSession(result, { keepManaging: true })
      setForm(EMPTY)
    }
  }

  return (
    <form className="adm-card adm-form adm-form--narrow" onSubmit={submit}>
      <h2>Change password</h2>
      <p className="adm-muted">Use at least 8 characters. Changing it signs out every other device.</p>
      <Feedback error={mismatch ? 'The two new passwords do not match.' : error} notice={notice} />
      <Field label="Current password">
        <input type="password" required autoComplete="current-password" value={form.current_password} onChange={set('current_password')} />
      </Field>
      <Field label="New password">
        <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={form.new_password} onChange={set('new_password')} />
      </Field>
      <Field label="Repeat new password">
        <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
      </Field>
      <div className="adm-row">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          <Icon name="check" /> {busy ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </form>
  )
}

export default function Account() {
  return (
    <>
      <PageHeader title="Account" intro="Your sign-in details." />
      <EmailForm />
      <PasswordForm />
    </>
  )
}
