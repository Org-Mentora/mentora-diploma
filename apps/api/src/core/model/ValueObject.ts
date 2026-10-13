/** Immutable object compared by value instead of identity. */
export abstract class ValueObject<TProps extends object> {
  protected readonly props: Readonly<TProps>;

  protected constructor(props: TProps) {
    this.props = Object.freeze({ ...props });
  }

  equals(other?: ValueObject<TProps>): boolean {
    if (!other || other.constructor !== this.constructor) {
      return false;
    }
    return JSON.stringify(other.props) === JSON.stringify(this.props);
  }
}
