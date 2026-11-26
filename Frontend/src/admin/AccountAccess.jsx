// The screens people use before they are signed in: sign up, forgot password, reset password.
import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useFetch } from '../hooks'
import { Feedback, Field, useAction } from './adminUi'
import AuthShell from './AuthShell'
import SocialButtons from './SocialButtons'

export function Signup() {
  const { user, register, startSession } = useAuth()
  const { busy, error, run } = useAction()
  const { data: config, loading } = useFetch(api.authConfig)
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '' })
  const justCreated = useRef(false) // a brand new account goes to the welcome screen first
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  if (user) return <Navigate to={justCreated.current ? '/welcome' : '/admin'} replace />

  const submit = (event) => {
    event.preventDefault()
    justCreated.current = true
    run(() => register({ ...form, full_name: form.full_name.trim(), username: form.username.trim(), email: form.email.trim() })).then(
      (created) => created === undefined && (justCreated.current = false),
    )
  }
  const closed = !loading && config && !config.allow_signup
  const link = form.username.trim().toLowerCase() || 'your-name'

  return (
    <AuthShell>
      <form className="adm-card adm-login__card" onSubmit={submit}>
        <h1>Create your portfolio</h1>
        <p>It takes a minute. You can change everything later.</p>
        {closed ? (
          <Feedback error="Sign up is closed right now. Ask the admin for an account." />
        ) : (
          <>
            <Feedback error={error} />
            <Field label="Full name">
              <input type="text" required maxLength={120} autoComplete="name" value={form.full_name} onChange={set('full_name')} />
            </Field>
            <Field label="Username" hint={`Your site will be at /u/${link}. Letters, numbers, - and _ only.`}>
              <input
                type="text"
                required
                minLength={3}
                maxLength={30}
                pattern="[A-Za-z0-9][A-Za-z0-9_\-]{2,29}"
                autoComplete="username"
                autoCapitalize="none"
                value={form.username}
                onChange={set('username')}
              />
            </Field>
            <Field label="Email" hint="Used to reset your password. It is not shown on your site.">
              <input type="email" required maxLength={255} autoComplete="email" value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Password" hint="At least 8 characters.">
              <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={form.password} onChange={set('password')} />
            </Field>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </button>
            <SocialButtons
              config={config}
              onSession={(result) => {
                justCreated.current = result.created
                startSession(result)
              }}
            />
          </>
        )}
        <Link to="/admin/login" className="adm-link">
          Already have an account? Sign in
        </Link>
      </form>
    </AuthShell>
  )
}

export function ForgotPassword() {
  const { busy, error, run } = useAction()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState('')

  async function submit(event) {
    event.preventDefault()
    setSent('')
    const result = await run(() => api.forgotPassword(email.trim()))
    if (result) {
      // The server says the same thing whether or not the email has an account.
      setSent(result.detail)
      setEmail('')
    }
  }

  return (
    <AuthShell>
      <form className="adm-card adm-login__card" onSubmit={submit}>
        <h1>Forgot password</h1>
        <p>Enter the email of your account and we will send a link to choose a new password.</p>
        <Feedback error={error} notice={sent} />
        <Field label="Email">
          <input type="email" required maxLength={255} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
        <Link to="/admin/login" className="adm-link">
          ‹ Back to sign in
        </Link>
      </form>
    </AuthShell>
  )
}

export function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const { busy, error, run } = useAction()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [mismatch, setMismatch] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (password !== confirm) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    const done = await run(() => api.resetPassword(token, password))
    if (done) navigate('/admin/login', { replace: true, state: { notice: 'Password changed. Sign in with your new password.' } })
  }

  return (
    <AuthShell>
      <form className="adm-card adm-login__card" onSubmit={submit}>
        <h1>Choose a new password</h1>
        {token ? (
          <>
            <p>After this, every device signed in with the old password is signed out.</p>
            <Feedback error={mismatch ? 'The two passwords do not match.' : error} />
            <Field label="New password" hint="At least 8 characters.">
              <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Field label="Repeat new password">
              <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
              {busy ? 'Saving…' : 'Change password'}
            </button>
          </>
        ) : (
          <Feedback error="This link is not complete. Open the link from the email again, or ask for a new one." />
        )}
        <Link to="/forgot-password" className="adm-link">
          Ask for a new link
        </Link>
      </form>
    </AuthShell>
  )
}
