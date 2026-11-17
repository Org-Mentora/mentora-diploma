import { ValidationError } from '#core/errors/ApplicationError';
import { CalendarMonths } from '#core/model/CalendarMonths';
import { ValueObject } from '#core/model/ValueObject';

export type PlanId = 'monthly' | 'annual';

interface PlanProps {
  id: PlanId;
  name: string;
  description: string;
  months: number;
  price: number;
  currency: string;
}

// Value Object
export class Plan extends ValueObject<PlanProps> {
  static create(props: PlanProps): Plan {
    return new Plan(props);
  }

  get id(): PlanId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get months(): number {
    return this.props.months;
  }

  get price(): number {
    return this.props.price;
  }

  get currency(): string {
    return this.props.currency;
  }

  periodEndFrom(start: Date): Date {
    return CalendarMonths.add(start, this.props.months);
  }
}

export interface PlanPrices {
  monthly: number;
  annual: number;
}

export class PlanCatalog {
  readonly #plans: Map<PlanId, Plan>;

  constructor(prices: PlanPrices, currency = 'ARS') {
    this.#plans = new Map([
      [
        'monthly',
        Plan.create({
          id: 'monthly',
          name: 'Monthly',
          description: 'Full access, billed every month.',
          months: 1,
          price: prices.monthly,
          currency,
        }),
      ],
      [
        'annual',
        Plan.create({
          id: 'annual',
          name: 'Annual',
          description: 'Full access for twelve months, billed once a year.',
          months: 12,
          price: prices.annual,
          currency,
        }),
      ],
    ]);
  }

  all(): Plan[] {
    return [...this.#plans.values()];
  }

  get(planId: string): Plan {
    const plan = this.#plans.get(planId as PlanId);
    if (!plan) {
      throw new ValidationError(`Unknown plan '${planId}'`, { field: 'planId' });
    }
    return plan;
  }
}
