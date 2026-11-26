import { useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useFetch } from '../hooks'
import { Feedback, Field, useAction } from './adminUi'
import AuthShell from './AuthShell'
import SocialButtons from './SocialButtons'

export default function Login() {
  const { user, login, startSession } = useAuth()
  const justCreated = useRef(false) // a first Google sign-in makes a new account: that goes to the welcome screen
  const { state } = useLocation()
  const { busy, error, run } = useAction()
  const { data: config } = useFetch(api.authConfig)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  if (user) return <Navigate to={justCreated.current ? '/welcome' : '/admin'} replace />

  const submit = (event) => {
    event.preventDefault()
    run(() => login(username.trim(), password))
  }

  return (
    <AuthShell>
      <form className="adm-card adm-login__card" onSubmit={submit}>
        <h1>Sign in</h1>
        <p>Sign in to manage your portfolio.</p>
        <Feedback error={error} notice={error ? '' : state?.notice} />
        <Field label="Username or email">
          <input type="text" required autoComplete="username" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} />
        </Field>
        <Field label="Password">
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <SocialButtons
          config={config}
          onSession={(result) => {
            justCreated.current = result.created
            startSession(result)
          }}
        />
        <div className="adm-login__links">
          <Link to="/forgot-password" className="adm-link">
            Forgot password?
          </Link>
          {config?.allow_signup && (
            <Link to="/signup" className="adm-link">
              Create an account
            </Link>
          )}
        </div>
        <Link to="/" className="adm-link">
          ‹ Back to site
        </Link>
      </form>
    </AuthShell>
  )
}
