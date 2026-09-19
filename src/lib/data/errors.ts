/**
 * Shared DAL error types.
 *
 * These exist so callers never have to match on an error *message*. Before this
 * module, the four collection Actions decided between 404 and 500 by comparing
 * `error.message` to strings like `'Paddle not found'` — a refactor of any DAL
 * message would silently turn every "not found" into a 500, with nothing failing
 * at compile time.
 */

/** A read-modify-write targeted a row that does not exist. */
export class RecordNotFoundError extends Error {
  /** Human-readable resource name, e.g. `'Paddle'`. */
  readonly resource: string;

  constructor(resource: string, id?: string) {
    super(id ? `${resource} ${id} not found` : `${resource} not found`);
    this.name = 'RecordNotFoundError';
    this.resource = resource;
  }
}

/** A write conflicts with the current state of the data. */
export class ConflictError extends Error {
  /** Human-readable resource name, e.g. `'Quilt'`. */
  readonly resource: string;

  constructor(resource: string, message: string) {
    super(message);
    this.name = 'ConflictError';
    this.resource = resource;
  }
}
