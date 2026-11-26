// "Continue with Google" and "Continue with Facebook" for the sign-in and sign-up screens.
//
// A button works once the server has that provider's keys (Backend/.env, see the README):
// the provider hands the browser a proof of who the person is, the server checks it and
// answers with a session. While a provider has no keys its button is hidden on the real site;
// during development it is shown and explains what is missing.
import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

const scripts = {}

// Loads an outside script once for the whole app.
function loadScript(src) {
  if (!scripts[src]) {
    scripts[src] = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onload = resolve
      script.onerror = () => {
        delete scripts[src]
        reject(new Error('The sign-in service could not be loaded. Check your connection and try again.'))
      }
      document.head.appendChild(script)
    })
  }
  return scripts[src]
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.600 1.200 9.100 3.600l6.800-6.800C35.800 2.400 30.300 0 24 0 14.600 0 6.500 5.400 2.600 13.200l7.900 6.100C12.400 13.600 17.700 9.500 24 9.500z" />
      <path fill="#4285F4" d="M46.500 24.500c0-1.600-.100-3.100-.400-4.500H24v9h12.700c-.600 3-2.200 5.500-4.700 7.200l7.300 5.700c4.300-4 6.800-9.900 6.800-17.400z" />
      <path fill="#FBBC05" d="M10.500 28.700a14.500 14.500 0 0 1 0-9.400l-7.900-6.100a24 24 0 0 0 0 21.600l7.900-6.100z" />
      <path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.300-5.700c-2.100 1.400-4.900 2.300-8.600 2.300-6.300 0-11.600-4.200-13.500-10l-7.900 6.100C6.500 42.600 14.600 48 24 48z" />
    </svg>
  )
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.900 11.900v-8.400H7.100V12h3V9.400c0-3 1.800-4.700 4.500-4.700 1.300 0 2.700.200 2.700.200v3h-1.500c-1.500 0-2 .900-2 1.900V12h3.400l-.500 3.500h-2.800v8.400A12 12 0 0 0 24 12z" />
    </svg>
  )
}

// Google draws its own button; ours sits underneath it only as the frame it is drawn into.
function Google({ clientId, onSession, onError }) {
  const holder = useRef(null)
  const handler = useRef(onSession)
  handler.current = onSession

  useEffect(() => {
    let active = true
    loadScript('https://accounts.google.com/gsi/client')
      .then(() => {
        if (!active || !holder.current) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            onError('')
            try {
              handler.current(await api.googleSignIn(response.credential))
            } catch (err) {
              onError(err.message)
            }
          },
        })
        window.google.accounts.id.renderButton(holder.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'center',
          width: Math.min(400, holder.current.offsetWidth || 320),
        })
      })
      .catch((err) => active && onError(err.message))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  return <div className="adm-social__google" ref={holder} />
}

function Facebook({ appId, onSession, onError }) {
  const [busy, setBusy] = useState(false)

  async function start() {
    onError('')
    setBusy(true)
    try {
      await loadScript('https://connect.facebook.net/en_US/sdk.js')
      window.FB.init({ appId, version: 'v19.0', cookie: false, xfbml: false })
      const token = await new Promise((resolve) =>
        window.FB.login((response) => resolve(response.authResponse?.accessToken || null), { scope: 'public_profile,email' }),
      )
      // closing Facebook's window without signing in is not an error
      if (token) onSession(await api.facebookSignIn(token))
    } catch (err) {
      onError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" className="adm-social__btn" disabled={busy} onClick={start}>
      <FacebookMark />
      {busy ? 'Waiting for Facebook…' : 'Continue with Facebook'}
    </button>
  )
}

//   config     the answer of /auth/config (google_client_id, facebook_app_id)
//   onSession  receives the server's answer { access_token, user, created }
export default function SocialButtons({ config, onSession }) {
  const [error, setError] = useState('')
  if (!config) return null
  const google = config.google_client_id
  const facebook = config.facebook_app_id
  // Buttons without keys are only shown while developing, as a reminder of what to set up.
  const reminders = import.meta.env.DEV
  if (!google && !facebook && !reminders) return null

  const missing = (name, key) => () =>
    setError(`${name} sign-in is not set up yet. Add ${key} to Backend/.env and restart the backend (steps are in the README). Visitors do not see this button until then.`)

  return (
    <div className="adm-social">
      <div className="adm-social__or">
        <span>or</span>
      </div>
      {google ? (
        <Google clientId={google} onSession={onSession} onError={setError} />
      ) : (
        reminders && (
          <button type="button" className="adm-social__btn" onClick={missing('Google', 'GOOGLE_CLIENT_ID')}>
            <GoogleMark />
            Continue with Google
          </button>
        )
      )}
      {facebook ? (
        <Facebook appId={facebook} onSession={onSession} onError={setError} />
      ) : (
        reminders && (
          <button type="button" className="adm-social__btn" onClick={missing('Facebook', 'FACEBOOK_APP_ID and FACEBOOK_APP_SECRET')}>
            <FacebookMark />
            Continue with Facebook
          </button>
        )
      )}
      {error && (
        <p className="adm-alert adm-alert--error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
