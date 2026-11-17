import type { Router } from 'express';
import type { AuditTrail } from '#core/model/AuditTrail';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { View } from '#core/view/View';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { AppointmentDirectory } from '#modules/appointments';
import type { NotificationCenter } from '#modules/notifications';
import type { PatientDirectory } from '#modules/patients';
import {
  registerVirtualConsultationContracts,
  type VirtualMeetingDto,
} from './contracts/virtual-consultations.contracts';
import {
  AppointmentDirectoryLookup,
  NotificationMeetingInvitations,
  PatientDirectoryContacts,
} from './infrastructure/collaborators';
import { MongooseVirtualMeetingRepository } from './infrastructure/MongooseVirtualMeetingRepository';
import type { MeetingLinkProvider, VirtualMeetingRepository } from './model/ports';
import { VirtualConsultationService } from './model/VirtualConsultationService';
import { ListVirtualMeetingsPresenter } from './presenter/ListVirtualMeetingsPresenter';
import { StartVirtualMeetingPresenter } from './presenter/StartVirtualMeetingPresenter';
import type { VirtualConsultationPresenterFactory } from './presenter/VirtualConsultationPresenterFactory';
import { VirtualMeetingRoutes } from './view/VirtualMeetingRoutes';

export interface VirtualConsultationsModuleDependencies {
  guard: AuthGuard;
  clock: Clock;
  ids: IdGenerator;
  transactions: TransactionManager;
  context: TransactionContext;
  links: MeetingLinkProvider;
  patients: PatientDirectory;
  appointments: AppointmentDirectory;
  notifications: NotificationCenter;
  audit: AuditTrail;
  repository?: VirtualMeetingRepository;
}

// Composition Root, Abstract Factory
export class VirtualConsultationsModule implements AppModule, VirtualConsultationPresenterFactory {
  readonly basePath = '/virtual-meetings';
  readonly #service: VirtualConsultationService;

  constructor(private readonly deps: VirtualConsultationsModuleDependencies) {
    this.#service = new VirtualConsultationService(
      deps.repository ?? new MongooseVirtualMeetingRepository(deps.context),
      deps.links,
      new PatientDirectoryContacts(deps.patients),
      new AppointmentDirectoryLookup(deps.appointments),
      new NotificationMeetingInvitations(deps.notifications),
      deps.transactions,
      deps.clock,
      deps.ids,
      deps.audit,
    );
  }

  registerContracts(registry: ContractRegistry): void {
    registerVirtualConsultationContracts(registry);
  }

  createRouter(): Router {
    return new VirtualMeetingRoutes(this, this.deps.guard).build();
  }

  startVirtualMeeting(view: View<VirtualMeetingDto>): StartVirtualMeetingPresenter {
    return new StartVirtualMeetingPresenter(view, this.#service);
  }

  listVirtualMeetings(view: View<VirtualMeetingDto[]>): ListVirtualMeetingsPresenter {
    return new ListVirtualMeetingsPresenter(view, this.#service);
  }
}
