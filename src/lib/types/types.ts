interface OK<T> {
  data: T
  error: null
}

interface NotOK<TError> {
  data: null
  error: TError
}

type Maybe<T, TError = Error> = OK<T> | NotOK<TError>

type NextJSSearchParams = Promise<{
  [key: string]: string | string[] | undefined
}>

export type { Maybe, NextJSSearchParams, NotOK, OK }
