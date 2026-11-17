import type { AuditTrail } from '#core/model/AuditTrail';
import type { Clock } from '#core/model/Clock';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { AppointmentRepository } from './AppointmentRepository';
import { ConsultationFees, type FeeTable } from './ConsultationFees';
import type { ConsultationFeesRepository } from './ConsultationFeesRepository';
import { EarningsCalculator, type EarningsReport, MonthRange } from './EarningsReport';

export class EarningsService {
  constructor(
    private readonly fees: ConsultationFeesRepository,
    private readonly appointments: AppointmentRepository,
    private readonly transactions: TransactionManager,
    private readonly clock: Clock,
    private readonly audit: AuditTrail,
  ) {}

  async getFees(professionalId: string): Promise<ConsultationFees> {
    return (
      (await this.fees.findById(professionalId)) ??
      ConsultationFees.empty(professionalId, this.clock.now())
    );
  }

  updateFees(professionalId: string, amounts: FeeTable): Promise<ConsultationFees> {
    return this.transactions.run(async () => {
      const fees = await this.getFees(professionalId);
      fees.update(amounts, this.clock.now());
      await this.fees.save(fees);
      await this.audit.record({
        professionalId,
        action: 'fees.updated',
        details: Object.fromEntries(Object.entries(amounts)),
      });
      return fees;
    });
  }

  async report(professionalId: string, from: string, to: string): Promise<EarningsReport> {
    const range = MonthRange.of(from, to);
    const window = range.window;
    const rows = await this.appointments.earnings(
      professionalId,
      window.from,
      window.to,
      this.clock.now(),
    );
    const fees = await this.getFees(professionalId);
    return EarningsCalculator.summarize(
      range,
      fees.currency,
      rows.filter((row) => range.includes(row.month)),
    );
  }
}
