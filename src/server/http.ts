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
  const status = (error as { status?: number })?.status
  if (typeof status === 'number' && status >= 400 && status < 500) {
    const message = (error as Error)?.message ?? 'Request failed'
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
