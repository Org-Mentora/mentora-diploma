/**
 * Base class for domain entities: objects with identity that outlive a single request.
 * Subclasses keep their state in `props` and expose behaviour through methods, never setters.
 */
export abstract class Entity<TProps extends object, TId = string> {
  protected constructor(
    readonly id: TId,
    protected props: TProps,
  ) {}

  equals(other?: Entity<TProps, TId>): boolean {
    if (!other || other.constructor !== this.constructor) {
      return false;
    }
    return other.id === this.id;
  }

  /** Read-only copy of the entity state, used by data mappers. */
  snapshot(): Readonly<TProps> {
    return Object.freeze({ ...this.props });
  }
}
