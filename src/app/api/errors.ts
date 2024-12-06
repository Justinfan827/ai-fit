
import { ErrorBase, ErrorOptions } from '@/lib/error-base'
import { NextResponse } from 'next/server'
import { APIErrorResponse } from './types'

export const BadRequestRes = (apiError: APIError) =>
  NextResponse.json<APIErrorResponse>(
    { data: null, error: apiError },
    { status: 400 }
  )

export const InternalErrorRes= (apiError: APIError) =>
  NextResponse.json<APIErrorResponse>(
    { data: null, error: apiError },
    { status: 500 }
  )

export const UnauthorizedRes = (apiError: APIError) =>
  NextResponse.json<APIErrorResponse>(
    { data: null, error: apiError },
    { status: 401 }
  )

export const NotFoundErrorResponse = () =>
  new NextResponse('Not Found', {
    status: 404,
  })

type APIErrorClass =
  | 'AUTH_ERROR'
  | 'INTERNAL_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'BAD_REQUEST_ERROR'
  | 'AUTH_ERROR'
  | 'INVALID_BODY'
  | 'INVALID_QUERY'
  | 'INVALID_PHONE_NUMBER'
  | 'DUPLICATE_PROMO_CODE'
  | 'GENERIC_ANSA_REQUEST_ERROR'
  | 'INVALID_ANSA_RESPONSE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

/*
 * APIError is the base class for all errors related to external API calls.
 * Every error returned from an external API should be wrapped in an instance of APIError.
 * The options object contains:
 *   1. cause: the original error that caused this error
 *   2. annotations: extra data to be added to the error e.g. sent as unindexed data to sentry
 *   3. labels: structured indexed data to be added to the error e.g. sent as indexed data to sentry
 */
export class APIError extends ErrorBase<APIErrorClass> {
  httpCode?: number
  constructor({
    message,
    name,
    httpCode,
    options,
  }: {
    message: string
    name: APIErrorClass
    httpCode?: number
    options?: ErrorOptions
  }) {
    super({ message, name: name || 'AUTH_ERROR', ...options })
    this.httpCode = httpCode || undefined
  }
}

type APIErrorOptions = ErrorOptions & { httpCode?: number }

export class AuthError extends APIError {
  constructor(message: string, o?: APIErrorOptions) {
    const options = { ...o, httpCode: o?.httpCode }
    super({ message, name: 'AUTH_ERROR', options, httpCode: options.httpCode })
  }
}

export class InternalError extends APIError {
  constructor(message: string, o?: APIErrorOptions) {
    const options = { ...o, httpCode: o?.httpCode }
    super({
      message,
      name: 'INTERNAL_ERROR',
      options,
      httpCode: options.httpCode,
    })
  }
}

export class NotFoundError extends APIError {
  constructor(message: string, o?: APIErrorOptions) {
    const options = { ...o, httpCode: o?.httpCode }
    super({
      message,
      name: 'NOT_FOUND_ERROR',
      options,
      httpCode: options.httpCode,
    })
  }
}

export class BadRequestError extends APIError {
  constructor(message: string, o?: APIErrorOptions) {
    const options = { ...o, httpCode: o?.httpCode }
    super({
      message,
      name: 'BAD_REQUEST_ERROR',
      options,
      httpCode: options.httpCode,
    })
  }
}

/*
 * Utility function to check if an Error is an instance of APIError and matches the given APIErrorClass
 **/
export function matchesAPIErrorClass(error: Error, name: APIErrorClass) {
  if (error instanceof APIError) {
    return error.name === name
  }
  return false
}
