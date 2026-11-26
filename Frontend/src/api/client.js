// One place for every call to the FastAPI backend.
const BASE = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'pf_admin_token'

export const fileUrl = (path) => (path ? `${BASE}/uploads/${path}` : '')

// Public calls work on one portfolio: a username picks it, none means the primary site.
const forUser = (username) => (username ? `?user=${encodeURIComponent(username)}` : '')
export const resumeUrl = (username) => `${BASE}/api/resume${forUser(username)}`

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable: the session just will not survive a reload */
  }
}

// When an admin opens another user's panel, every panel request carries that user's id.
let managedUserId = null
export const setManagedUserId = (id) => {
  managedUserId = id || null
}

// Turns FastAPI's error body into one readable sentence.
function errorMessage(data, status) {
  const detail = data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0]
    const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : ''
    const text = String(first.msg || 'Invalid value').replace(/^Value error, /, '')
    return field && field !== 'body' ? `${field}: ${text}` : text
  }
  return `Request failed (${status})`
}

async function request(method, path, { json, form, auth = false } = {}) {
  const headers = {}
  if (json !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`
  if (auth && managedUserId) headers['X-Manage-User'] = String(managedUserId)

  let response
  try {
    response = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: form ?? (json !== undefined ? JSON.stringify(json) : undefined),
    })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }

  if (response.status === 204) return null
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && auth) {
      setToken(null)
      window.dispatchEvent(new Event('pf:signed-out'))
    }
    throw new Error(errorMessage(data, response.status))
  }
  return data
}

function upload(path, files, field = 'file') {
  const form = new FormData()
  for (const file of [].concat(files)) form.append(field, file)
  return request('POST', path, { form, auth: true })
}

const panel = (method, path, json) => request(method, `/admin${path}`, { json, auth: true })

export const api = {
  // Public
  showcase: () => request('GET', '/showcase'),
  site: (username) => request('GET', `/site${forUser(username)}`),
  projects: (username) => request('GET', `/projects${forUser(username)}`),
  project: (slug, username) => request('GET', `/projects/${encodeURIComponent(slug)}${forUser(username)}`),
  sendMessage: (data, username) => request('POST', `/messages${forUser(username)}`, { json: data }),
  // Analytics ping. A failure must never disturb the visitor, so it is swallowed.
  track: (event, username) => request('POST', `/track${forUser(username)}`, { json: event }).catch(() => null),

  // Auth
  authConfig: () => request('GET', '/auth/config'),
  login: (username, password) => request('POST', '/auth/login', { json: { username, password } }),
  register: (data) => request('POST', '/auth/register', { json: data }),
  googleSignIn: (credential) => request('POST', '/auth/google', { json: { credential } }),
  facebookSignIn: (accessToken) => request('POST', '/auth/facebook', { json: { access_token: accessToken } }),
  forgotPassword: (email) => request('POST', '/auth/forgot-password', { json: { email } }),
  resetPassword: (token, newPassword) => request('POST', '/auth/reset-password', { json: { token, new_password: newPassword } }),
  updateAccount: (email) => request('PUT', '/auth/account', { json: { email }, auth: true }),
  me: () => request('GET', '/auth/me', { auth: true }),
  changePassword: (data) => request('POST', '/auth/change-password', { json: data, auth: true }),

  // Panel: profile and page text
  panelSite: () => panel('GET', '/site'),
  stats: () => panel('GET', '/stats'),
  updateProfile: (data) => panel('PUT', '/profile', data),
  updateTexts: (texts) => panel('PUT', '/texts', { texts }),
  updateTypography: (data) => panel('PUT', '/typography', data),
  updateTextStyles: (styles) => panel('PUT', '/text-styles', { styles }),
  updateHomeSections: (sections) => panel('PUT', '/home-sections', { sections }),
  updateSettings: (settings) => panel('PUT', '/settings', settings),
  applyStarter: (profession, also = []) => panel('POST', '/starter', { profession, also }),
  uploadProfileImage: (field, file) => upload(`/admin/profile/images/${field}`, file),
  deleteProfileImage: (field) => panel('DELETE', `/profile/images/${field}`),
  uploadResume: (file) => upload('/admin/profile/resume', file),
  deleteResume: () => panel('DELETE', '/profile/resume'),

  // Panel: page sections
  items: (section) => panel('GET', `/items?section=${section}`),
  createItem: (data) => panel('POST', '/items', data),
  updateItem: (id, data) => panel('PUT', `/items/${id}`, data),
  deleteItem: (id) => panel('DELETE', `/items/${id}`),
  reorderItems: (section, ids) => panel('PUT', `/items/reorder/${section}`, { ids }),

  // Panel: projects
  adminProjects: () => panel('GET', '/projects'),
  adminProject: (id) => panel('GET', `/projects/${id}`),
  createProject: (data) => panel('POST', '/projects', data),
  updateProject: (id, data) => panel('PUT', `/projects/${id}`, data),
  deleteProject: (id) => panel('DELETE', `/projects/${id}`),
  reorderProjects: (ids) => panel('PUT', '/projects/reorder', { ids }),
  uploadThumbnail: (id, file) => upload(`/admin/projects/${id}/thumbnail`, file),
  deleteThumbnail: (id) => panel('DELETE', `/projects/${id}/thumbnail`),
  uploadProjectImages: (id, files) => upload(`/admin/projects/${id}/images`, files, 'files'),
  reorderProjectImages: (id, ids) => panel('PUT', `/projects/${id}/images/reorder`, { ids }),
  setImageCaption: (imageId, caption) => panel('PATCH', `/projects/images/${imageId}`, { caption }),
  deleteProjectImage: (imageId) => panel('DELETE', `/projects/images/${imageId}`),
  saveProjectContent: (id, blocks) => panel('PUT', `/projects/${id}/content`, { blocks }),
  uploadContentImage: (id, file) => upload(`/admin/projects/${id}/content-image`, file),

  // Panel: custom home page sections
  customSections: () => panel('GET', '/custom-sections'),
  createCustomSection: (data) => panel('POST', '/custom-sections', data),
  updateCustomSection: (id, data) => panel('PUT', `/custom-sections/${id}`, data),
  deleteCustomSection: (id) => panel('DELETE', `/custom-sections/${id}`),
  uploadCustomSectionImage: (id, file) => upload(`/admin/custom-sections/${id}/image`, file),
  deleteCustomSectionImage: (id) => panel('DELETE', `/custom-sections/${id}/image`),

  // Panel: analytics
  analytics: (days) => panel('GET', `/analytics?days=${days}`),

  // Panel: messages
  messages: () => panel('GET', '/messages'),
  markMessage: (id, isRead) => panel('PATCH', `/messages/${id}`, { is_read: isRead }),
  deleteMessage: (id) => panel('DELETE', `/messages/${id}`),

  // Panel: themes (everyone can list and pick; only admins can create, edit and delete)
  themes: () => panel('GET', '/themes'),
  selectTheme: (themeId) => panel('PUT', '/theme', { theme_id: themeId }),
  createTheme: (data) => panel('POST', '/themes', data),
  updateTheme: (id, data) => panel('PUT', `/themes/${id}`, data),
  deleteTheme: (id) => panel('DELETE', `/themes/${id}`),

  // Panel: layouts (same rules as themes)
  layouts: () => panel('GET', '/layouts'),
  selectLayout: (layoutId) => panel('PUT', '/layout', { layout_id: layoutId }),
  customiseLayout: (parts) => panel('PUT', '/layout-options', parts),
  createLayout: (data) => panel('POST', '/layouts', data),
  updateLayout: (id, data) => panel('PUT', `/layouts/${id}`, data),
  deleteLayout: (id) => panel('DELETE', `/layouts/${id}`),

  // Admin only: accounts
  users: () => panel('GET', '/users'),
  createUser: (data) => panel('POST', '/users', data),
  updateUser: (id, data) => panel('PATCH', `/users/${id}`, data),
  deleteUser: (id) => panel('DELETE', `/users/${id}`),
}
