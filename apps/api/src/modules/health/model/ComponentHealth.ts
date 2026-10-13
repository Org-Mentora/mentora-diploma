import { ValueObject } from '#core/model/ValueObject';

export type ComponentStatus = 'up' | 'down';

interface ComponentHealthProps {
  name: string;
  status: ComponentStatus;
  latencyMs: number | null;
  error: string | null;
}

/** Health of a single dependency (database, cache, external service...). */
export class ComponentHealth extends ValueObject<ComponentHealthProps> {
  static up(name: string, latencyMs: number): ComponentHealth {
    return new ComponentHealth({ name, status: 'up', latencyMs, error: null });
  }

  static down(name: string, error: string): ComponentHealth {
    return new ComponentHealth({ name, status: 'down', latencyMs: null, error });
  }

  get name(): string {
    return this.props.name;
  }

  get status(): ComponentStatus {
    return this.props.status;
  }

  get latencyMs(): number | null {
    return this.props.latencyMs;
  }

  get error(): string | null {
    return this.props.error;
  }

  get isUp(): boolean {
    return this.props.status === 'up';
  }
}
