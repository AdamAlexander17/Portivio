import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getToken, setManagedUserId, setToken } from '../api/client'

const AuthContext = createContext(null)
const MANAGING_KEY = 'pf_managing'

function savedManaging() {
  try {
    return JSON.parse(sessionStorage.getItem(MANAGING_KEY)) || null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // { id, username, email, role }
  const [checking, setChecking] = useState(Boolean(getToken()))
  // An admin can open another user's panel: { id, username, name }, or null for their own.
  const [managing, setManagingState] = useState(() => {
    const saved = savedManaging()
    setManagedUserId(saved?.id)
    return saved
  })

  const setManaging = useCallback((target) => {
    setManagedUserId(target?.id)
    setManagingState(target || null)
    try {
      if (target) sessionStorage.setItem(MANAGING_KEY, JSON.stringify(target))
      else sessionStorage.removeItem(MANAGING_KEY)
    } catch {
      /* storage unavailable */
    }
  }, [])

  useEffect(() => {
    if (getToken()) {
      api
        .me()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setChecking(false))
    }
    // The API client fires this when the server rejects the saved token.
    const onSignedOut = () => {
      setUser(null)
      setManaging(null)
    }
    window.addEventListener('pf:signed-out', onSignedOut)
    return () => window.removeEventListener('pf:signed-out', onSignedOut)
  }, [setManaging])

  // Start (or replace) the session from a server answer of the form { access_token, user }.
  const startSession = useCallback(
    (result, { keepManaging = false } = {}) => {
      if (!keepManaging) setManaging(null)
      setToken(result.access_token)
      setUser(result.user)
    },
    [setManaging],
  )

  const login = useCallback(async (username, password) => startSession(await api.login(username, password)), [startSession])
  const register = useCallback(
    async (data) => {
      startSession(await api.register(data))
      return true
    },
    [startSession],
  )

  const logout = useCallback(() => {
    setToken(null)
    setManaging(null)
    setUser(null)
  }, [setManaging])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{ user, setUser, isAdmin, checking, login, register, logout, startSession, managing, setManaging }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
