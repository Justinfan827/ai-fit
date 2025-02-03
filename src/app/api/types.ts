/*

These are the return types for API calls
from the client to the nextjs backend endpoints
that hit ANSA API's.


These are not the types of the responses from ANSA API's themselves.
We automatically generate those types from the OpenAPI spec.

*/

import { NextResponse } from 'next/server'
import { APIError, ErrorResponse } from './errors'

export interface APISuccessResponse<T> {
  data: T
  error: null
}

export interface APIErrorResponse {
  data: null
  error: APIError
}

export interface APIErrorResponseV2 {
  data: null
  error: ErrorResponse['error']
}

export type APIResponse<T> = APIErrorResponse | APISuccessResponse<T>

export type APIRouteHandlerResponse<T> = NextResponse<APIResponse<T>>
