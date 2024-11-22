/*

These are the return types for API calls 

*/

import { NextResponse } from "next/server";

export interface APISuccessResponse<T> {
  data: T;
  error: null;
}

export interface APIErrorResponse {
  data: null;
  error: Error;
}

export type APIResponse<T> = APIErrorResponse | APISuccessResponse<T>;

export type APIRouteHandlerResponse<T> = NextResponse<APIResponse<T>>;
