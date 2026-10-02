// Set VITE_API_BASE_URL in frontend/.env to point at another backend
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(/\/+$/, '')

const ANONYMOUS_ID_KEY = 'tsundre-ride:anonymous-id'

let memoryAnonymousId: string | null = null

// The backend has no accounts: every browser gets a random UUID that is sent as X-Anonymous-ID.
// Whoever holds the ID that created a challenge/submission owns it.
export function getAnonymousId(): string {
  try {
    const stored = localStorage.getItem(ANONYMOUS_ID_KEY)
    if (stored) return stored
    const created = crypto.randomUUID()
    localStorage.setItem(ANONYMOUS_ID_KEY, created)
    return created
  } catch {
    // Storage blocked (private mode etc.): keep one ID for this tab
    memoryAnonymousId ??= crypto.randomUUID()
    return memoryAnonymousId
  }
}

const OWN_SUBMISSIONS_KEY = 'tsundre-ride:own-submissions'

// Submissions come back without owner_id, so the slugs this browser created are remembered here.
function readOwnSubmissions(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(OWN_SUBMISSIONS_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function rememberOwnSubmission(slug: string) {
  try {
    localStorage.setItem(OWN_SUBMISSIONS_KEY, JSON.stringify([...new Set([...readOwnSubmissions(), slug])]))
  } catch {
    // Not critical: only used to decide which edit buttons to show
  }
}

export function isRememberedOwnSubmission(slug: string) {
  return readOwnSubmissions().includes(slug)
}

export class ApiError extends Error {
  status: number
  code: string
  // Field errors from DRF serializers, e.g. { name: ['This field is required.'] }
  fieldErrors: Record<string, string[]>

  constructor(message: string, status: number, code: string, fieldErrors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }

  // "Invalid challenge data. name: This field is required."
  get details(): string {
    const fields = Object.entries(this.fieldErrors)
      .map(([field, errors]) => `${field}: ${[errors].flat().join(' ')}`)
      .join(' ')
    return fields ? `${this.message} ${fields}` : this.message
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.details
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}

interface Envelope<T> {
  message: string
  success: boolean
  code?: string
  content?: T
  error?: unknown
}

type Query = Record<string, string | number | undefined | null>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  query?: Query
  // Plain objects are sent as JSON, FormData as multipart
  body?: object | FormData
}

// Calls the API and returns `content` from the backend's { message, success, content } envelope.
export async function request<T>(path: string, { method = 'GET', query, body }: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_BASE_URL}/${path.replace(/^\/+/, '')}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = { 'X-Anonymous-ID': getAnonymousId() }
  let payload: BodyInit | undefined
  if (body instanceof FormData) {
    payload = body
  } else if (body) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(url, { method, headers, body: payload })
  } catch {
    throw new ApiError('Could not reach the server.', 0, 'network-error')
  }

  let data: Envelope<T> | null = null
  try {
    data = await response.json()
  } catch {
    // Non-JSON (e.g. Django's HTML 404/500 page)
  }

  if (!response.ok || !data?.success) {
    const fieldErrors =
      data?.error && typeof data.error === 'object' && !Array.isArray(data.error)
        ? (data.error as Record<string, string[]>)
        : {}
    throw new ApiError(
      data?.message ?? `Request failed (${response.status}).`,
      response.status,
      data?.code ?? 'error',
      fieldErrors,
    )
  }

  return data.content as T
}
