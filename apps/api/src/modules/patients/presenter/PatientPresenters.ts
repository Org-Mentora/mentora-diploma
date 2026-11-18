import type { View } from '#core/view/View';
import type { PatientDto, PatientSummaryPageDto } from '../contracts/patients.contracts';
import type { PatientService } from '../model/PatientService';
import { ChangePatientStatusPresenter } from './ChangePatientStatusPresenter';
import { CreatePatientPresenter } from './CreatePatientPresenter';
import { GetPatientPresenter } from './GetPatientPresenter';
import { SearchPatientsPresenter } from './SearchPatientsPresenter';
import { UpdatePatientPresenter } from './UpdatePatientPresenter';

// Abstract Factory
export class PatientPresenters {
  constructor(private readonly patientService: PatientService) {}

  createPatient(view: View<PatientDto>) {
    return new CreatePatientPresenter(view, this.patientService);
  }

  searchPatients(view: View<PatientSummaryPageDto>) {
    return new SearchPatientsPresenter(view, this.patientService);
  }

  getPatient(view: View<PatientDto>) {
    return new GetPatientPresenter(view, this.patientService);
  }

  updatePatient(view: View<PatientDto>) {
    return new UpdatePatientPresenter(view, this.patientService);
  }

  changePatientStatus(view: View<PatientDto>) {
    return new ChangePatientStatusPresenter(view, this.patientService);
  }
}
