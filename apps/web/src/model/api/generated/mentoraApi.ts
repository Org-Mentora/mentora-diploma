import { baseApi as api } from "../baseApi";
export const addTagTypes = [
  "Health",
  "Auth",
  "Patients",
  "Diagnoses",
  "ClinicalRecords",
  "Appointments",
] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      getHealth: build.query<GetHealthApiResponse, GetHealthApiArg>({
        query: () => ({ url: `/health` }),
        providesTags: ["Health"],
      }),
      registerProfessional: build.mutation<
        RegisterProfessionalApiResponse,
        RegisterProfessionalApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/register`,
          method: "POST",
          body: queryArg.registerProfessionalRequestDto,
        }),
        invalidatesTags: ["Auth"],
      }),
      login: build.mutation<LoginApiResponse, LoginApiArg>({
        query: (queryArg) => ({
          url: `/auth/login`,
          method: "POST",
          body: queryArg.loginRequestDto,
        }),
        invalidatesTags: ["Auth"],
      }),
      logout: build.mutation<LogoutApiResponse, LogoutApiArg>({
        query: () => ({ url: `/auth/logout`, method: "POST" }),
        invalidatesTags: ["Auth"],
      }),
      getCurrentProfessional: build.query<
        GetCurrentProfessionalApiResponse,
        GetCurrentProfessionalApiArg
      >({
        query: () => ({ url: `/auth/me` }),
        providesTags: ["Auth"],
      }),
      createPatient: build.mutation<
        CreatePatientApiResponse,
        CreatePatientApiArg
      >({
        query: (queryArg) => ({
          url: `/patients`,
          method: "POST",
          body: queryArg.patientInputDto,
        }),
        invalidatesTags: ["Patients"],
      }),
      searchPatients: build.query<
        SearchPatientsApiResponse,
        SearchPatientsApiArg
      >({
        query: (queryArg) => ({
          url: `/patients`,
          params: {
            q: queryArg.q,
          },
        }),
        providesTags: ["Patients"],
      }),
      getPatient: build.query<GetPatientApiResponse, GetPatientApiArg>({
        query: (queryArg) => ({ url: `/patients/${queryArg.id}` }),
        providesTags: ["Patients"],
      }),
      updatePatient: build.mutation<
        UpdatePatientApiResponse,
        UpdatePatientApiArg
      >({
        query: (queryArg) => ({
          url: `/patients/${queryArg.id}`,
          method: "PUT",
          body: queryArg.patientInputDto,
        }),
        invalidatesTags: ["Patients"],
      }),
      changePatientStatus: build.mutation<
        ChangePatientStatusApiResponse,
        ChangePatientStatusApiArg
      >({
        query: (queryArg) => ({
          url: `/patients/${queryArg.id}/status`,
          method: "PATCH",
          body: queryArg.changePatientStatusRequestDto,
        }),
        invalidatesTags: ["Patients"],
      }),
      searchDiagnoses: build.query<
        SearchDiagnosesApiResponse,
        SearchDiagnosesApiArg
      >({
        query: (queryArg) => ({
          url: `/diagnoses`,
          params: {
            q: queryArg.q,
            category: queryArg.category,
          },
        }),
        providesTags: ["Diagnoses"],
      }),
      getClinicalRecord: build.query<
        GetClinicalRecordApiResponse,
        GetClinicalRecordApiArg
      >({
        query: (queryArg) => ({
          url: `/patients/${queryArg.patientId}/clinical-record`,
        }),
        providesTags: ["ClinicalRecords"],
      }),
      registerConsultation: build.mutation<
        RegisterConsultationApiResponse,
        RegisterConsultationApiArg
      >({
        query: (queryArg) => ({
          url: `/patients/${queryArg.patientId}/clinical-record/consultations`,
          method: "POST",
          body: queryArg.registerConsultationRequestDto,
        }),
        invalidatesTags: ["ClinicalRecords"],
      }),
      getConsultation: build.query<
        GetConsultationApiResponse,
        GetConsultationApiArg
      >({
        query: (queryArg) => ({
          url: `/patients/${queryArg.patientId}/clinical-record/consultations/${queryArg.consultationId}`,
        }),
        providesTags: ["ClinicalRecords"],
      }),
      getDiagnosisHistory: build.query<
        GetDiagnosisHistoryApiResponse,
        GetDiagnosisHistoryApiArg
      >({
        query: (queryArg) => ({
          url: `/patients/${queryArg.patientId}/clinical-record/diagnoses`,
        }),
        providesTags: ["ClinicalRecords"],
      }),
      listAppointments: build.query<
        ListAppointmentsApiResponse,
        ListAppointmentsApiArg
      >({
        query: (queryArg) => ({
          url: `/appointments`,
          params: {
            from: queryArg["from"],
            to: queryArg.to,
          },
        }),
        providesTags: ["Appointments"],
      }),
      scheduleAppointment: build.mutation<
        ScheduleAppointmentApiResponse,
        ScheduleAppointmentApiArg
      >({
        query: (queryArg) => ({
          url: `/appointments`,
          method: "POST",
          body: queryArg.scheduleAppointmentRequestDto,
        }),
        invalidatesTags: ["Appointments"],
      }),
      getAppointment: build.query<
        GetAppointmentApiResponse,
        GetAppointmentApiArg
      >({
        query: (queryArg) => ({ url: `/appointments/${queryArg.id}` }),
        providesTags: ["Appointments"],
      }),
      rescheduleAppointment: build.mutation<
        RescheduleAppointmentApiResponse,
        RescheduleAppointmentApiArg
      >({
        query: (queryArg) => ({
          url: `/appointments/${queryArg.id}`,
          method: "PUT",
          body: queryArg.rescheduleAppointmentRequestDto,
        }),
        invalidatesTags: ["Appointments"],
      }),
      cancelAppointment: build.mutation<
        CancelAppointmentApiResponse,
        CancelAppointmentApiArg
      >({
        query: (queryArg) => ({
          url: `/appointments/${queryArg.id}/cancel`,
          method: "POST",
        }),
        invalidatesTags: ["Appointments"],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as mentoraApi };
export type GetHealthApiResponse = /** status 200 Health report */ HealthDto;
export type GetHealthApiArg = void;
export type RegisterProfessionalApiResponse =
  /** status 201 Account created and logged in */ SessionDto;
export type RegisterProfessionalApiArg = {
  registerProfessionalRequestDto: RegisterProfessionalRequestDto;
};
export type LoginApiResponse = /** status 200 Logged in */ SessionDto;
export type LoginApiArg = {
  loginRequestDto: LoginRequestDto;
};
export type LogoutApiResponse = unknown;
export type LogoutApiArg = void;
export type GetCurrentProfessionalApiResponse =
  /** status 200 Current session */ SessionDto;
export type GetCurrentProfessionalApiArg = void;
export type CreatePatientApiResponse =
  /** status 201 Patient registered */ PatientDto;
export type CreatePatientApiArg = {
  patientInputDto: PatientInputDto;
};
export type SearchPatientsApiResponse =
  /** status 200 Matching patients */ PatientSummaryDto[];
export type SearchPatientsApiArg = {
  /** Name, surname or DNI */
  q?: string;
};
export type GetPatientApiResponse = /** status 200 Patient */ PatientDto;
export type GetPatientApiArg = {
  id: string;
};
export type UpdatePatientApiResponse =
  /** status 200 Patient updated */ PatientDto;
export type UpdatePatientApiArg = {
  id: string;
  patientInputDto: PatientInputDto;
};
export type ChangePatientStatusApiResponse =
  /** status 200 Status changed */ PatientDto;
export type ChangePatientStatusApiArg = {
  id: string;
  changePatientStatusRequestDto: ChangePatientStatusRequestDto;
};
export type SearchDiagnosesApiResponse =
  /** status 200 Matching diagnoses */ DiagnosisCatalogEntryDto[];
export type SearchDiagnosesApiArg = {
  /** Name or code fragment */
  q?: string;
  category?: string;
};
export type GetClinicalRecordApiResponse =
  /** status 200 Clinical record */ ClinicalRecordDto;
export type GetClinicalRecordApiArg = {
  patientId: string;
};
export type RegisterConsultationApiResponse =
  /** status 201 Consultation registered */ ConsultationDto;
export type RegisterConsultationApiArg = {
  patientId: string;
  registerConsultationRequestDto: RegisterConsultationRequestDto;
};
export type GetConsultationApiResponse =
  /** status 200 Consultation */ ConsultationDto;
export type GetConsultationApiArg = {
  patientId: string;
  consultationId: string;
};
export type GetDiagnosisHistoryApiResponse =
  /** status 200 Diagnosis history */ DiagnosisHistoryEntryDto[];
export type GetDiagnosisHistoryApiArg = {
  patientId: string;
};
export type ListAppointmentsApiResponse =
  /** status 200 Appointments ordered by start */ AppointmentDto[];
export type ListAppointmentsApiArg = {
  /** Inclusive start of the range */
  from: string;
  /** Exclusive end of the range (max 62 days) */
  to: string;
};
export type ScheduleAppointmentApiResponse =
  /** status 201 Appointment scheduled */ AppointmentDto;
export type ScheduleAppointmentApiArg = {
  scheduleAppointmentRequestDto: ScheduleAppointmentRequestDto;
};
export type GetAppointmentApiResponse =
  /** status 200 Appointment */ AppointmentDto;
export type GetAppointmentApiArg = {
  id: string;
};
export type RescheduleAppointmentApiResponse =
  /** status 200 Appointment updated */ AppointmentDto;
export type RescheduleAppointmentApiArg = {
  id: string;
  rescheduleAppointmentRequestDto: RescheduleAppointmentRequestDto;
};
export type CancelAppointmentApiResponse =
  /** status 200 Appointment cancelled */ AppointmentDto;
export type CancelAppointmentApiArg = {
  id: string;
};
export type ComponentHealthDto = {
  name: string;
  status: "up" | "down";
  latencyMs: number | null;
  error: string | null;
};
export type HealthDto = {
  status: "ok" | "degraded";
  uptimeSeconds: number;
  checkedAt: string;
  components: ComponentHealthDto[];
};
export type ErrorResponseDto = {
  error: {
    code: string;
    message: string;
    details?: any;
  };
};
export type ProfessionalDto = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
};
export type SubscriptionDto = {
  status: "trial" | "active" | "expired";
  accessEndsAt: string | null;
  daysLeft: number | null;
};
export type SessionDto = {
  professional: ProfessionalDto;
  subscription: SubscriptionDto;
};
export type RegisterProfessionalRequestDto = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  password: string;
};
export type LoginRequestDto = {
  email: string;
  password: string;
};
export type FamilyContactDto = {
  name: string;
  phone: string;
};
export type PatientDto = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dni: string;
  birthDate: string | null;
  age: number | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  healthInsurance: string | null;
  memberNumber: string | null;
  familyContact: FamilyContactDto | null;
  debt: number;
  allergies: string[];
  observations: string | null;
  status: "active" | "discharged" | "inactive";
  statusChangedAt: string;
  statusOrigin: "manual" | "automatic";
  registeredAt: string;
};
export type PatientInputDto = {
  firstName: string;
  lastName: string;
  dni: string;
  birthDate?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  healthInsurance?: string | null;
  memberNumber?: string | null;
  familyContact?: FamilyContactDto | null;
  debt?: number;
  allergies?: string[];
  observations?: string | null;
};
export type PatientSummaryDto = {
  id: string;
  fullName: string;
  dni: string;
  age: number | null;
  phone: string | null;
  healthInsurance: string | null;
  status: "active" | "discharged" | "inactive";
};
export type ChangePatientStatusRequestDto = {
  status: "active" | "discharged";
};
export type DiagnosisCatalogEntryDto = {
  code: string;
  name: string;
  category: string;
};
export type AssignedDiagnosisDto = {
  code: string;
  name: string;
  assignedAt: string;
};
export type ConsultationSummaryDto = {
  id: string;
  date: string;
  type: "in_person" | "virtual";
  reason: string;
  diagnosis: AssignedDiagnosisDto | null;
  medicationCount: number;
};
export type ClinicalRecordDto = {
  patientId: string;
  openedAt: string;
  updatedAt: string;
  consultations: ConsultationSummaryDto[];
};
export type MedicationDto = {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  indications: string | null;
  prescribedAt: string;
};
export type ConsultationDto = {
  id: string;
  date: string;
  type: "in_person" | "virtual";
  reason: string;
  observations: string | null;
  evolution: string | null;
  diagnosis: AssignedDiagnosisDto | null;
  medications: MedicationDto[];
  recordedAt: string;
};
export type MedicationInputDto = {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  indications?: string | null;
};
export type RegisterConsultationRequestDto = {
  date: string;
  type: "in_person" | "virtual";
  reason: string;
  observations?: string | null;
  evolution?: string | null;
  diagnosisCode?: string | null;
  medications?: MedicationInputDto[];
};
export type DiagnosisHistoryEntryDto = {
  consultationId: string;
  consultationDate: string;
  diagnosis: AssignedDiagnosisDto;
};
export type AppointmentDto = {
  id: string;
  patientId: string;
  patientName: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  type: "first_visit" | "control" | "follow_up" | "medication" | "other";
  modality: "in_person" | "virtual";
  status: "scheduled" | "cancelled";
  notes: string | null;
  cancelledAt: string | null;
};
export type ScheduleAppointmentRequestDto = {
  patientId: string;
  startsAt: string;
  durationMinutes: number;
  type: "first_visit" | "control" | "follow_up" | "medication" | "other";
  modality: "in_person" | "virtual";
  notes?: string | null;
};
export type RescheduleAppointmentRequestDto = {
  startsAt: string;
  durationMinutes: number;
  type: "first_visit" | "control" | "follow_up" | "medication" | "other";
  modality: "in_person" | "virtual";
  notes?: string | null;
};
export const {
  useGetHealthQuery,
  useRegisterProfessionalMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentProfessionalQuery,
  useCreatePatientMutation,
  useSearchPatientsQuery,
  useGetPatientQuery,
  useUpdatePatientMutation,
  useChangePatientStatusMutation,
  useSearchDiagnosesQuery,
  useGetClinicalRecordQuery,
  useRegisterConsultationMutation,
  useGetConsultationQuery,
  useGetDiagnosisHistoryQuery,
  useListAppointmentsQuery,
  useScheduleAppointmentMutation,
  useGetAppointmentQuery,
  useRescheduleAppointmentMutation,
  useCancelAppointmentMutation,
} = injectedRtkApi;
