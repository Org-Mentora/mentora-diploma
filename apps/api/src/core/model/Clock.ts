/** Time source abstraction so the Model stays deterministic in tests. */
export abstract class Clock {
  abstract now(): Date;
}

export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}
