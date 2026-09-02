import { NextResponse } from 'next/server'

export class HttpError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) {
    super(message)
    this.name = 'HttpError'
  }
}

export function httpError(message: string, status: number, code: string): HttpError {
  return new HttpError(message, status, code)
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status })
}

/**
 * A short, human-safe message from an upstream error body, if there is one.
 * The Namespace SDK sits on axios, so `response.data` is whatever the registry
 * returned — usually JSON with a `message`, sometimes a raw HTML error page.
 * Only a bounded, plain-text snippet is surfaced; bodies are capped so a
 * stack-trace-shaped payload cannot ride through.
 */
function upstreamMessage(data: unknown): string | null {
  const cap = 300
  if (typeof data === 'string') {
    const text = data.trim()
    if (!text || text.startsWith('<') || text.length > cap) return null
    return text
  }
  if (typeof data === 'object' && data !== null) {
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string') {
      const text = message.trim()
      if (text && text.length <= cap) return text
    }
  }
  return null
}

/**
 * Client-safe error mapping. 4xx keeps its message because it tells the user
 * something actionable; 5xx is redacted to a request id so an internal failure
 * never leaks a stack, a URL, or the shape of the registry.
 */
export function fail(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { ok: false, error: error.message, code: error.code },
      { status: error.status },
    )
  }
  // Axios errors carry the status on `response.status`, not on the error
  // itself, so a legitimate upstream 4xx (name taken, bad input) used to fall
  // through to the generic 500.
  const upstream = error as {
    status?: unknown
    response?: { status?: unknown; data?: unknown }
  }
  const status =
    typeof upstream.status === 'number'
      ? upstream.status
      : typeof upstream.response?.status === 'number'
        ? upstream.response.status
        : undefined
  if (typeof status === 'number' && status >= 400 && status < 500) {
    const detail = upstreamMessage(upstream.response?.data)
    const message = detail
      ? `Registry request failed (${status}): ${detail}`
      : `Registry request failed with status ${status}`
    return NextResponse.json({ ok: false, error: message, code: 'UPSTREAM' }, { status })
  }
  const requestId = Math.random().toString(36).slice(2, 10)
  console.error(`[${requestId}]`, error)
  return NextResponse.json(
    { ok: false, error: 'Something went wrong. Try again.', code: 'INTERNAL', requestId },
    { status: 500 },
  )
}

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn()
  } catch (error) {
    return fail(error)
  }
}
