export type ErrorLabels = "userId" | "vendorStatusCode"

type Labels = Partial<Record<ErrorLabels, string | number>>
type Annotations = Record<string, object>

export type ErrorOptions = {
  // an original error that caused this error
  cause?: Error
  // extra data to be added to the error e.g. sent as unindexed data to sentry
  annotations?: Annotations // structured indexed data to be added to the error e.g. sent as indexed data to sentry
  labels?: Labels
}

// ErrorBase is a base class for all errors in the application.
// It provides a consistent way to handle errors.
export class ErrorBase<T extends string> extends Error {
  code: T
  message: string
  cause?: Error
  // added as unindexed annotations sentry
  annotations: Annotations
  // added as indexed searchable tags in sentry
  labels: Labels
  constructor({
    code,
    message,
    cause, // TODO: this is not serializable so we lose some details
    annotations,
    labels,
  }: {
    code: T
    message: string
    cause?: Error
    annotations?: Annotations
    labels?: Labels
  }) {
    super(message)
    this.code = code
    this.message = message
    this.cause = cause
    this.annotations = annotations || {}
    this.labels = labels || {}
  }

  // toJSON is used to serialize the error to be sent to the client
  toJSON() {
    return {
      name: this.code,
      message: this.message,
      annotations: this.annotations,
      labels: this.labels,
    }
  }
}
