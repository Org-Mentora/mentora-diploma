import type { View } from '#core/view/View';
import type { PatientDto, PatientSummaryDto } from '../contracts/patients.contracts';
import type { ChangePatientStatusPresenter } from './ChangePatientStatusPresenter';
import type { CreatePatientPresenter } from './CreatePatientPresenter';
import type { GetPatientPresenter } from './GetPatientPresenter';
import type { SearchPatientsPresenter } from './SearchPatientsPresenter';
import type { UpdatePatientPresenter } from './UpdatePatientPresenter';

export interface PatientPresenterFactory {
  createPatient(view: View<PatientDto>): CreatePatientPresenter;
  searchPatients(view: View<PatientSummaryDto[]>): SearchPatientsPresenter;
  getPatient(view: View<PatientDto>): GetPatientPresenter;
  updatePatient(view: View<PatientDto>): UpdatePatientPresenter;
  changePatientStatus(view: View<PatientDto>): ChangePatientStatusPresenter;
}
