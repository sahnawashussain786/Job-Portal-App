import axios from 'axios'

const TOKEN_KEY = 'jobnest.token'

/**
 * In production the SPA and the API share a Vercel domain, so a relative
 * `/api` base works with no configuration. `VITE_API_URL` is only needed when
 * the API lives somewhere else (e.g. running the frontend against a deployed
 * backend during local development).
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* storage disabled — the session simply won't persist */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the bearer token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Broadcast auth failures so the AuthContext can clear the session without
 * every call site having to handle 401s individually.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      tokenStore.clear()
      window.dispatchEvent(new CustomEvent('jobnest:unauthorized'))
    }

    // Normalise the message so components can just render `err.message`.
    const payload = error.response?.data
    const normalised = new Error(
      payload?.message ||
        (error.code === 'ECONNABORTED'
          ? 'The request timed out. Please try again.'
          : error.message) ||
        'Something went wrong',
    )
    normalised.status = status
    normalised.errors = payload?.errors
    normalised.isNetworkError = !error.response

    return Promise.reject(normalised)
  },
)

/** Small helper: unwrap `response.data` so callers don't repeat `.data`. */
const unwrap = (promise) => promise.then((res) => res.data)

export const authApi = {
  register: (payload) => unwrap(api.post('/auth/register', payload)),
  login: (payload) => unwrap(api.post('/auth/login', payload)),
  me: () => unwrap(api.get('/auth/me')),
  updateProfile: (payload) => unwrap(api.patch('/auth/me', payload)),
  changePassword: (payload) => unwrap(api.patch('/auth/password', payload)),
  deleteAccount: () => unwrap(api.delete('/auth/me')),
}

export const jobsApi = {
  list: (params) => unwrap(api.get('/jobs', { params })),
  featured: (limit = 6) => unwrap(api.get('/jobs/featured', { params: { limit } })),
  detail: (id) => unwrap(api.get(`/jobs/${id}`)),
  create: (payload) => unwrap(api.post('/jobs', payload)),
  update: (id, payload) => unwrap(api.patch(`/jobs/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/jobs/${id}`)),
  mine: (params) => unwrap(api.get('/jobs/employer/mine', { params })),
  employerStats: () => unwrap(api.get('/jobs/employer/stats')),
  filterMeta: () => unwrap(api.get('/jobs/meta/filters')),
  saved: (params) => unwrap(api.get('/jobs/saved', { params })),
  toggleSave: (id) => unwrap(api.post(`/jobs/${id}/save`)),
}

export const applicationsApi = {
  apply: (jobId, payload) => unwrap(api.post(`/applications/${jobId}`, payload)),
  mine: (params) => unwrap(api.get('/applications/mine', { params })),
  myStats: () => unwrap(api.get('/applications/stats')),
  detail: (id) => unwrap(api.get(`/applications/${id}`)),
  forJob: (jobId, params) => unwrap(api.get(`/applications/job/${jobId}`, { params })),
  updateStatus: (id, payload) => unwrap(api.patch(`/applications/${id}/status`, payload)),
  withdraw: (id) => unwrap(api.post(`/applications/${id}/withdraw`)),
  remove: (id) => unwrap(api.delete(`/applications/${id}`)),
}

export const companiesApi = {
  list: (params) => unwrap(api.get('/companies', { params })),
  detail: (idOrSlug) => unwrap(api.get(`/companies/${idOrSlug}`)),
  mine: () => unwrap(api.get('/companies/mine')),
  create: (payload) => unwrap(api.post('/companies', payload)),
  update: (payload) => unwrap(api.patch('/companies/mine', payload)),
  remove: () => unwrap(api.delete('/companies/mine')),
}

export const uploadsApi = {
  config: () => unwrap(api.get('/uploads/config')),
  /** Uploads must be multipart — override the JSON default header. */
  image: (file, target) => {
    const form = new FormData()
    form.append('file', file)
    if (target) form.append('target', target)
    return unwrap(api.post('/uploads/image', form, { headers: { 'Content-Type': 'multipart/form-data' } }))
  },
  resume: (file) => {
    const form = new FormData()
    form.append('file', file)
    return unwrap(api.post('/uploads/resume', form, { headers: { 'Content-Type': 'multipart/form-data' } }))
  },
  removeResume: () => unwrap(api.delete('/uploads/resume')),
}

export const adminApi = {
  stats: () => unwrap(api.get('/admin/stats')),
  users: (params) => unwrap(api.get('/admin/users', { params })),
  updateUser: (id, payload) => unwrap(api.patch(`/admin/users/${id}`, payload)),
  deleteUser: (id) => unwrap(api.delete(`/admin/users/${id}`)),
  jobs: (params) => unwrap(api.get('/admin/jobs', { params })),
  moderateJob: (id, payload) => unwrap(api.patch(`/admin/jobs/${id}`, payload)),
  deleteJob: (id) => unwrap(api.delete(`/admin/jobs/${id}`)),
}

export default api
