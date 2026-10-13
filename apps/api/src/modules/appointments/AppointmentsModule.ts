import type { Router } from 'express';
import type { AppLogger } from '#core/logging/AppLogger';
import type { Clock } from '#core/model/Clock';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { View } from '#core/view/View';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { PatientDirectory } from '#modules/patients';
import {
  type AppointmentDto,
  registerAppointmentContracts,
} from './contracts/appointments.contracts';
import { LoggingAppointmentNotifier } from './infrastructure/LoggingAppointmentNotifier';
import { MongooseAppointmentRepository } from './infrastructure/MongooseAppointmentRepository';
import { PatientDirectoryNames } from './infrastructure/PatientDirectoryNames';
import { AppointmentService } from './model/AppointmentService';
import type { AppointmentPresenterFactory } from './presenter/AppointmentPresenterFactory';
import { CancelAppointmentPresenter } from './presenter/CancelAppointmentPresenter';
import { GetAppointmentPresenter } from './presenter/GetAppointmentPresenter';
import { ListAppointmentsPresenter } from './presenter/ListAppointmentsPresenter';
import { RescheduleAppointmentPresenter } from './presenter/RescheduleAppointmentPresenter';
import { ScheduleAppointmentPresenter } from './presenter/ScheduleAppointmentPresenter';
import { AppointmentRoutes } from './view/AppointmentRoutes';

export interface AppointmentsModuleDependencies {
  guard: AuthGuard;
  clock: Clock;
  patients: PatientDirectory;
  logger: AppLogger;
}

/** Composition root of the agenda module (CU-10). */
export class AppointmentsModule implements AppModule, AppointmentPresenterFactory {
  readonly basePath = '/appointments';
  readonly #service: AppointmentService;

  constructor(private readonly deps: AppointmentsModuleDependencies) {
    this.#service = new AppointmentService(
      new MongooseAppointmentRepository(),
      new PatientDirectoryNames(deps.patients),
      new LoggingAppointmentNotifier(deps.logger.child({ module: 'appointments' })),
      deps.clock,
    );
  }

  registerContracts(registry: ContractRegistry): void {
    registerAppointmentContracts(registry);
  }

  createRouter(): Router {
    return new AppointmentRoutes(this, this.deps.guard).build();
  }

  listAppointments(view: View<AppointmentDto[]>): ListAppointmentsPresenter {
    return new ListAppointmentsPresenter(view, this.#service);
  }

  getAppointment(view: View<AppointmentDto>): GetAppointmentPresenter {
    return new GetAppointmentPresenter(view, this.#service);
  }

  scheduleAppointment(view: View<AppointmentDto>): ScheduleAppointmentPresenter {
    return new ScheduleAppointmentPresenter(view, this.#service);
  }

  rescheduleAppointment(view: View<AppointmentDto>): RescheduleAppointmentPresenter {
    return new RescheduleAppointmentPresenter(view, this.#service);
  }

  cancelAppointment(view: View<AppointmentDto>): CancelAppointmentPresenter {
    return new CancelAppointmentPresenter(view, this.#service);
  }
}
