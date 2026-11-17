// Entity
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

  snapshot(): Readonly<TProps> {
    return Object.freeze({ ...this.props });
  }
}
