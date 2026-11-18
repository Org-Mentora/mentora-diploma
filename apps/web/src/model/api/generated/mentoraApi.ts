import { baseApi as api } from "../baseApi";
export const addTagTypes = [
  "Health",
  "Auth",
  "Audit",
  "Subscription",
  "Patients",
  "Diagnoses",
  "ClinicalRecords",
  "Appointments",
  "Notifications",
  "VirtualConsultations",
  "Online booking",
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
      getLiveness: build.query<GetLivenessApiResponse, GetLivenessApiArg>({
        query: () => ({ url: `/health/live` }),
        providesTags: ["Health"],
      }),
      getReadiness: build.query<GetReadinessApiResponse, GetReadinessApiArg>({
        query: () => ({ url: `/health/ready` }),
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
      requestPasswordRecovery: build.mutation<
        RequestPasswordRecoveryApiResponse,
        RequestPasswordRecoveryApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/password-recovery`,
          method: "POST",
          body: queryArg.passwordRecoveryRequestDto,
        }),
        invalidatesTags: ["Auth"],
      }),
      verifyRecoveryCode: build.mutation<
        VerifyRecoveryCodeApiResponse,
        VerifyRecoveryCodeApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/password-recovery/verify`,
          method: "POST",
          body: queryArg.verifyRecoveryCodeRequestDto,
        }),
        invalidatesTags: ["Auth"],
      }),
      resetPassword: build.mutation<
        ResetPasswordApiResponse,
        ResetPasswordApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/password-recovery/reset`,
          method: "POST",
          body: queryArg.resetPasswordRequestDto,
        }),
        invalidatesTags: ["Auth"],
      }),
      changePassword: build.mutation<
        ChangePasswordApiResponse,
        ChangePasswordApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/password`,
          method: "PUT",
          body: queryArg.changePasswordRequestDto,
        }),
        invalidatesTags: ["Auth"],
      }),
      updateProfile: build.mutation<
        UpdateProfileApiResponse,
        UpdateProfileApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/profile`,
          method: "PUT",
          body: queryArg.updateProfileRequestDto,
        }),
        invalidatesTags: ["Auth"],
      }),
      getLogo: build.query<GetLogoApiResponse, GetLogoApiArg>({
        query: () => ({ url: `/auth/logo` }),
        providesTags: ["Auth"],
      }),
      uploadLogo: build.mutation<UploadLogoApiResponse, UploadLogoApiArg>({
        query: (queryArg) => ({
          url: `/auth/logo`,
          method: "PUT",
          body: queryArg.uploadLogoRequestDto,
        }),
        invalidatesTags: ["Auth"],
      }),
      removeLogo: build.mutation<RemoveLogoApiResponse, RemoveLogoApiArg>({
        query: () => ({ url: `/auth/logo`, method: "DELETE" }),
        invalidatesTags: ["Auth"],
      }),
      listAuditEvents: build.query<
        ListAuditEventsApiResponse,
        ListAuditEventsApiArg
      >({
        query: (queryArg) => ({
          url: `/audit/events`,
          params: {
            cursor: queryArg.cursor,
            limit: queryArg.limit,
            category: queryArg.category,
            from: queryArg["from"],
            to: queryArg.to,
          },
        }),
        providesTags: ["Audit"],
      }),
      getSubscription: build.query<
        GetSubscriptionApiResponse,
        GetSubscriptionApiArg
      >({
        query: () => ({ url: `/subscription` }),
        providesTags: ["Subscription"],
      }),
      choosePlan: build.mutation<ChoosePlanApiResponse, ChoosePlanApiArg>({
        query: (queryArg) => ({
          url: `/subscription/plan`,
          method: "PUT",
          body: queryArg.choosePlanRequestDto,
        }),
        invalidatesTags: ["Subscription", "Auth"],
      }),
      addPaymentMethod: build.mutation<
        AddPaymentMethodApiResponse,
        AddPaymentMethodApiArg
      >({
        query: (queryArg) => ({
          url: `/subscription/payment-methods`,
          method: "POST",
          body: queryArg.addPaymentMethodRequestDto,
        }),
        invalidatesTags: ["Subscription", "Auth"],
      }),
      updatePaymentMethod: build.mutation<
        UpdatePaymentMethodApiResponse,
        UpdatePaymentMethodApiArg
      >({
        query: (queryArg) => ({
          url: `/subscription/payment-methods/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.updatePaymentMethodRequestDto,
        }),
        invalidatesTags: ["Subscription", "Auth"],
      }),
      removePaymentMethod: build.mutation<
        RemovePaymentMethodApiResponse,
        RemovePaymentMethodApiArg
      >({
        query: (queryArg) => ({
          url: `/subscription/payment-methods/${queryArg.id}`,
          method: "DELETE",
          params: {
            confirm: queryArg.confirm,
          },
        }),
        invalidatesTags: ["Subscription", "Auth"],
      }),
      setAutoDebit: build.mutation<SetAutoDebitApiResponse, SetAutoDebitApiArg>(
        {
          query: (queryArg) => ({
            url: `/subscription/auto-debit`,
            method: "PUT",
            body: queryArg.autoDebitRequestDto,
          }),
          invalidatesTags: ["Subscription", "Auth"],
        },
      ),
      cancelSubscription: build.mutation<
        CancelSubscriptionApiResponse,
        CancelSubscriptionApiArg
      >({
        query: () => ({ url: `/subscription/cancel`, method: "POST" }),
        invalidatesTags: ["Subscription", "Auth"],
      }),
      listPayments: build.query<ListPaymentsApiResponse, ListPaymentsApiArg>({
        query: (queryArg) => ({
          url: `/subscription/payments`,
          params: {
            cursor: queryArg.cursor,
            limit: queryArg.limit,
          },
        }),
        providesTags: ["Subscription"],
      }),
      registerManualPayment: build.mutation<
        RegisterManualPaymentApiResponse,
        RegisterManualPaymentApiArg
      >({
        query: (queryArg) => ({
          url: `/subscription/payments`,
          method: "POST",
          body: queryArg.manualPaymentRequestDto,
        }),
        invalidatesTags: ["Subscription", "Auth"],
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
            cursor: queryArg.cursor,
            limit: queryArg.limit,
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
            cursor: queryArg.cursor,
            limit: queryArg.limit,
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
          params: {
            cursor: queryArg.cursor,
            limit: queryArg.limit,
          },
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
          params: {
            cursor: queryArg.cursor,
            limit: queryArg.limit,
          },
        }),
        providesTags: ["ClinicalRecords"],
      }),
      getRecordAccessLog: build.query<
        GetRecordAccessLogApiResponse,
        GetRecordAccessLogApiArg
      >({
        query: (queryArg) => ({
          url: `/patients/${queryArg.patientId}/clinical-record/access-log`,
          params: {
            cursor: queryArg.cursor,
            limit: queryArg.limit,
          },
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
            cursor: queryArg.cursor,
            limit: queryArg.limit,
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
      getConsultationFees: build.query<
        GetConsultationFeesApiResponse,
        GetConsultationFeesApiArg
      >({
        query: () => ({ url: `/appointments/fees` }),
        providesTags: ["Appointments"],
      }),
      updateConsultationFees: build.mutation<
        UpdateConsultationFeesApiResponse,
        UpdateConsultationFeesApiArg
      >({
        query: (queryArg) => ({
          url: `/appointments/fees`,
          method: "PUT",
          body: queryArg.updateConsultationFeesRequestDto,
        }),
        invalidatesTags: ["Appointments"],
      }),
      getEarningsReport: build.query<
        GetEarningsReportApiResponse,
        GetEarningsReportApiArg
      >({
        query: (queryArg) => ({
          url: `/appointments/earnings`,
          params: {
            from: queryArg["from"],
            to: queryArg.to,
          },
        }),
        providesTags: ["Appointments"],
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
      listNotifications: build.query<
        ListNotificationsApiResponse,
        ListNotificationsApiArg
      >({
        query: (queryArg) => ({
          url: `/notifications`,
          params: {
            cursor: queryArg.cursor,
            limit: queryArg.limit,
            patientId: queryArg.patientId,
          },
        }),
        providesTags: ["Notifications"],
      }),
      startVirtualMeeting: build.mutation<
        StartVirtualMeetingApiResponse,
        StartVirtualMeetingApiArg
      >({
        query: (queryArg) => ({
          url: `/virtual-meetings`,
          method: "POST",
          body: queryArg.startVirtualMeetingRequestDto,
        }),
        invalidatesTags: ["VirtualConsultations"],
      }),
      listVirtualMeetings: build.query<
        ListVirtualMeetingsApiResponse,
        ListVirtualMeetingsApiArg
      >({
        query: (queryArg) => ({
          url: `/virtual-meetings`,
          params: {
            cursor: queryArg.cursor,
            limit: queryArg.limit,
            patientId: queryArg.patientId,
            appointmentId: queryArg.appointmentId,
          },
        }),
        providesTags: ["VirtualConsultations"],
      }),
      getBookingSettings: build.query<
        GetBookingSettingsApiResponse,
        GetBookingSettingsApiArg
      >({
        query: () => ({ url: `/booking/settings` }),
        providesTags: ["Online booking"],
      }),
      updateBookingSettings: build.mutation<
        UpdateBookingSettingsApiResponse,
        UpdateBookingSettingsApiArg
      >({
        query: (queryArg) => ({
          url: `/booking/settings`,
          method: "PUT",
          body: queryArg.updateBookingSettingsRequestDto,
        }),
        invalidatesTags: ["Online booking"],
      }),
      listBookingRequests: build.query<
        ListBookingRequestsApiResponse,
        ListBookingRequestsApiArg
      >({
        query: (queryArg) => ({
          url: `/booking/requests`,
          params: {
            cursor: queryArg.cursor,
            limit: queryArg.limit,
            status: queryArg.status,
          },
        }),
        providesTags: ["Online booking"],
      }),
      acceptBookingRequest: build.mutation<
        AcceptBookingRequestApiResponse,
        AcceptBookingRequestApiArg
      >({
        query: (queryArg) => ({
          url: `/booking/requests/${queryArg.id}/accept`,
          method: "POST",
          body: queryArg.acceptBookingRequestDto,
        }),
        invalidatesTags: ["Online booking", "Appointments", "Patients"],
      }),
      rejectBookingRequest: build.mutation<
        RejectBookingRequestApiResponse,
        RejectBookingRequestApiArg
      >({
        query: (queryArg) => ({
          url: `/booking/requests/${queryArg.id}/reject`,
          method: "POST",
          body: queryArg.rejectBookingRequestDto,
        }),
        invalidatesTags: ["Online booking"],
      }),
      getPublicBookingPage: build.query<
        GetPublicBookingPageApiResponse,
        GetPublicBookingPageApiArg
      >({
        query: (queryArg) => ({ url: `/booking/public/${queryArg.slug}` }),
        providesTags: ["Online booking"],
      }),
      getAvailableSlots: build.query<
        GetAvailableSlotsApiResponse,
        GetAvailableSlotsApiArg
      >({
        query: (queryArg) => ({
          url: `/booking/public/${queryArg.slug}/slots`,
          params: {
            from: queryArg["from"],
            days: queryArg.days,
          },
        }),
        providesTags: ["Online booking"],
      }),
      createBookingRequest: build.mutation<
        CreateBookingRequestApiResponse,
        CreateBookingRequestApiArg
      >({
        query: (queryArg) => ({
          url: `/booking/public/${queryArg.slug}/requests`,
          method: "POST",
          body: queryArg.createBookingRequestDto,
        }),
        invalidatesTags: ["Online booking"],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as mentoraApi };
export type GetHealthApiResponse = /** status 200 Health report */ HealthDto;
export type GetHealthApiArg = void;
export type GetLivenessApiResponse =
  /** status 200 The process is alive */ HealthDto;
export type GetLivenessApiArg = void;
export type GetReadinessApiResponse =
  /** status 200 Ready to serve traffic */ HealthDto;
export type GetReadinessApiArg = void;
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
export type RequestPasswordRecoveryApiResponse =
  /** status 202 Code sent if the account exists */ RecoveryRequestedDto;
export type RequestPasswordRecoveryApiArg = {
  passwordRecoveryRequestDto: PasswordRecoveryRequestDto;
};
export type VerifyRecoveryCodeApiResponse = unknown;
export type VerifyRecoveryCodeApiArg = {
  verifyRecoveryCodeRequestDto: VerifyRecoveryCodeRequestDto;
};
export type ResetPasswordApiResponse = unknown;
export type ResetPasswordApiArg = {
  resetPasswordRequestDto: ResetPasswordRequestDto;
};
export type ChangePasswordApiResponse =
  /** status 200 Password changed; the session cookie is re-issued */ SessionDto;
export type ChangePasswordApiArg = {
  changePasswordRequestDto: ChangePasswordRequestDto;
};
export type UpdateProfileApiResponse =
  /** status 200 Profile updated */ SessionDto;
export type UpdateProfileApiArg = {
  updateProfileRequestDto: UpdateProfileRequestDto;
};
export type GetLogoApiResponse = /** status 200 Logo */ LogoDto;
export type GetLogoApiArg = void;
export type UploadLogoApiResponse = unknown;
export type UploadLogoApiArg = {
  uploadLogoRequestDto: UploadLogoRequestDto;
};
export type RemoveLogoApiResponse = unknown;
export type RemoveLogoApiArg = void;
export type ListAuditEventsApiResponse =
  /** status 200 One page of audit events */ AuditEventPageDto;
export type ListAuditEventsApiArg = {
  /** Opaque cursor: the `nextCursor` of the previous page */
  cursor?: string;
  /** Page size (default 20, max 100) */
  limit?: number;
  /** session, account, patient, consultation, appointment, booking, … */
  category?: string;
  from?: string;
  to?: string;
};
export type GetSubscriptionApiResponse =
  /** status 200 Subscription */ SubscriptionDetailDto;
export type GetSubscriptionApiArg = void;
export type ChoosePlanApiResponse =
  /** status 200 Plan applied */ SubscriptionDetailDto;
export type ChoosePlanApiArg = {
  choosePlanRequestDto: ChoosePlanRequestDto;
};
export type AddPaymentMethodApiResponse =
  /** status 201 Card registered */ SubscriptionDetailDto;
export type AddPaymentMethodApiArg = {
  addPaymentMethodRequestDto: AddPaymentMethodRequestDto;
};
export type UpdatePaymentMethodApiResponse =
  /** status 200 Card updated */ SubscriptionDetailDto;
export type UpdatePaymentMethodApiArg = {
  id: string;
  updatePaymentMethodRequestDto: UpdatePaymentMethodRequestDto;
};
export type RemovePaymentMethodApiResponse =
  /** status 200 Card removed */ SubscriptionDetailDto;
export type RemovePaymentMethodApiArg = {
  id: string;
  /** Required to remove the only card used for automatic debit */
  confirm?: "true" | "false";
};
export type SetAutoDebitApiResponse =
  /** status 200 Automatic debit updated */ SubscriptionDetailDto;
export type SetAutoDebitApiArg = {
  autoDebitRequestDto: AutoDebitRequestDto;
};
export type CancelSubscriptionApiResponse =
  /** status 200 Subscription cancelled */ SubscriptionDetailDto;
export type CancelSubscriptionApiArg = void;
export type ListPaymentsApiResponse = /** status 200 Payments */ PaymentPageDto;
export type ListPaymentsApiArg = {
  /** Opaque cursor: the `nextCursor` of the previous page */
  cursor?: string;
  /** Page size (default 20, max 100) */
  limit?: number;
};
export type RegisterManualPaymentApiResponse =
  /** status 201 Payment registered */ PaymentDto;
export type RegisterManualPaymentApiArg = {
  manualPaymentRequestDto: ManualPaymentRequestDto;
};
export type CreatePatientApiResponse =
  /** status 201 Patient registered */ PatientDto;
export type CreatePatientApiArg = {
  patientInputDto: PatientInputDto;
};
export type SearchPatientsApiResponse =
  /** status 200 Matching patients by surname */ PatientSummaryPageDto;
export type SearchPatientsApiArg = {
  /** Opaque cursor: the `nextCursor` of the previous page */
  cursor?: string;
  /** Page size (default 20, max 100) */
  limit?: number;
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
  /** status 200 Matching diagnoses */ DiagnosisCatalogPageDto;
export type SearchDiagnosesApiArg = {
  /** Opaque cursor: the `nextCursor` of the previous page */
  cursor?: string;
  /** Page size (default 20, max 100) */
  limit?: number;
  /** Name or code fragment */
  q?: string;
  category?: string;
};
export type GetClinicalRecordApiResponse =
  /** status 200 Clinical record */ ClinicalRecordDto;
export type GetClinicalRecordApiArg = {
  patientId: string;
  /** Opaque cursor: the `nextCursor` of the previous page */
  cursor?: string;
  /** Page size (default 20, max 100) */
  limit?: number;
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
  /** status 200 Diagnosis history */ DiagnosisHistoryPageDto;
export type GetDiagnosisHistoryApiArg = {
  patientId: string;
  /** Opaque cursor: the `nextCursor` of the previous page */
  cursor?: string;
  /** Page size (default 20, max 100) */
  limit?: number;
};
export type GetRecordAccessLogApiResponse =
  /** status 200 Access log */ RecordAccessPageDto;
export type GetRecordAccessLogApiArg = {
  patientId: string;
  /** Opaque cursor: the `nextCursor` of the previous page */
  cursor?: string;
  /** Page size (default 20, max 100) */
  limit?: number;
};
export type ListAppointmentsApiResponse =
  /** status 200 Appointments ordered by start */ AppointmentPageDto;
export type ListAppointmentsApiArg = {
  /** Opaque cursor: the `nextCursor` of the previous page */
  cursor?: string;
  /** Page size (default 20, max 100) */
  limit?: number;
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
export type GetConsultationFeesApiResponse =
  /** status 200 Fee table */ ConsultationFeesDto;
export type GetConsultationFeesApiArg = void;
export type UpdateConsultationFeesApiResponse =
  /** status 200 Fee table saved */ ConsultationFeesDto;
export type UpdateConsultationFeesApiArg = {
  updateConsultationFeesRequestDto: UpdateConsultationFeesRequestDto;
};
export type GetEarningsReportApiResponse =
  /** status 200 Monthly earnings */ EarningsReportDto;
export type GetEarningsReportApiArg = {
  /** First month (YYYY-MM) */
  from: string;
  /** Last month, inclusive (YYYY-MM). Max 24 months */
  to: string;
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
export type ListNotificationsApiResponse =
  /** status 200 Newest first */ NotificationPageDto;
export type ListNotificationsApiArg = {
  /** Opaque cursor: the `nextCursor` of the previous page */
  cursor?: string;
  /** Page size (default 20, max 100) */
  limit?: number;
  patientId: string;
};
export type StartVirtualMeetingApiResponse =
  /** status 201 Meeting created (or the existing one of the appointment) */ VirtualMeetingDto;
export type StartVirtualMeetingApiArg = {
  startVirtualMeetingRequestDto: StartVirtualMeetingRequestDto;
};
export type ListVirtualMeetingsApiResponse =
  /** status 200 Newest first */ VirtualMeetingPageDto;
export type ListVirtualMeetingsApiArg = {
  /** Opaque cursor: the `nextCursor` of the previous page */
  cursor?: string;
  /** Page size (default 20, max 100) */
  limit?: number;
  patientId?: string;
  appointmentId?: string;
};
export type GetBookingSettingsApiResponse =
  /** status 200 Settings */ BookingSettingsDto;
export type GetBookingSettingsApiArg = void;
export type UpdateBookingSettingsApiResponse =
  /** status 200 Saved */ BookingSettingsDto;
export type UpdateBookingSettingsApiArg = {
  updateBookingSettingsRequestDto: UpdateBookingSettingsRequestDto;
};
export type ListBookingRequestsApiResponse =
  /** status 200 Pending by start; others newest first */ BookingRequestPageDto;
export type ListBookingRequestsApiArg = {
  /** Opaque cursor: the `nextCursor` of the previous page */
  cursor?: string;
  /** Page size (default 20, max 100) */
  limit?: number;
  status?: "pending" | "accepted" | "rejected" | "expired";
};
export type AcceptBookingRequestApiResponse =
  /** status 200 Accepted */ BookingRequestDto;
export type AcceptBookingRequestApiArg = {
  id: string;
  acceptBookingRequestDto: AcceptBookingRequestDto;
};
export type RejectBookingRequestApiResponse =
  /** status 200 Rejected */ BookingRequestDto;
export type RejectBookingRequestApiArg = {
  id: string;
  rejectBookingRequestDto: RejectBookingRequestDto;
};
export type GetPublicBookingPageApiResponse =
  /** status 200 Page */ PublicBookingPageDto;
export type GetPublicBookingPageApiArg = {
  slug: string;
};
export type GetAvailableSlotsApiResponse =
  /** status 200 Free slots */ AvailableSlotsDto;
export type GetAvailableSlotsApiArg = {
  slug: string;
  /** First day (YYYY-MM-DD); default today */
  from?: string;
  days?: number;
};
export type CreateBookingRequestApiResponse =
  /** status 201 Request received */ BookingReceiptDto;
export type CreateBookingRequestApiArg = {
  slug: string;
  createBookingRequestDto: CreateBookingRequestDto;
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
  offices: string[];
  hasLogo: boolean;
};
export type SubscriptionDto = {
  status:
    | "trial"
    | "active"
    | "pending_payment"
    | "suspended"
    | "cancelled"
    | "expired";
  /** false: only the plan page is available */
  hasAccess: boolean;
  accessEndsAt: string;
  daysLeft: number;
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
  offices?: string[];
};
export type LoginRequestDto = {
  email: string;
  password: string;
};
export type RecoveryRequestedDto = {
  message: string;
};
export type PasswordRecoveryRequestDto = {
  email: string;
};
export type VerifyRecoveryCodeRequestDto = {
  email: string;
  code: string;
};
export type ResetPasswordRequestDto = {
  email: string;
  code: string;
  newPassword: string;
};
export type ChangePasswordRequestDto = {
  currentPassword: string;
  newPassword: string;
};
export type UpdateProfileRequestDto = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  offices: string[];
};
export type LogoDto = {
  /** PNG or JPEG data URL; null when the default logo is used */
  dataUrl: string | null;
};
export type UploadLogoRequestDto = {
  /** data:image/png;base64,... or data:image/jpeg;base64,... (512 KB) */
  dataUrl: string;
};
export type AuditEventDto = {
  id: string;
  /** `<category>.<verb>`, e.g. `patient.created` */
  action: string;
  category: string;
  actor: "professional" | "patient" | "system";
  targetType: string | null;
  targetId: string | null;
  details: {
    [key: string]: string | number | boolean | null;
  };
  ip: string | null;
  userAgent: string | null;
  occurredAt: string;
};
export type AuditEventPageDto = {
  items: AuditEventDto[];
  /** Pass it as `cursor` to get the next page; null on the last page */
  nextCursor: string | null;
};
export type PlanDto = {
  id: "monthly" | "annual";
  name: string;
  description: string;
  months: number;
  price: number;
  currency: string;
};
export type PaymentMethodDto = {
  id: string;
  brand: "visa" | "mastercard" | "amex" | "other";
  label: string;
  last4: string;
  expMonth: number;
  expYear: number;
  holderName: string;
  isDefault: boolean;
};
export type SubscriptionDetailDto = {
  status:
    | "trial"
    | "active"
    | "pending_payment"
    | "suspended"
    | "cancelled"
    | "expired";
  hasAccess: boolean;
  plan: PlanDto | null;
  currentPeriodEndsAt: string;
  daysLeft: number;
  autoDebit: boolean;
  paymentMethods: PaymentMethodDto[];
  cancelledAt: string | null;
  availablePlans: PlanDto[];
};
export type ChoosePlanRequestDto = {
  planId: "monthly" | "annual";
};
export type AddPaymentMethodRequestDto = {
  holderName: string;
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  makeDefault?: boolean;
};
export type UpdatePaymentMethodRequestDto = {
  holderName?: string;
  expMonth?: number;
  expYear?: number;
  makeDefault?: boolean;
};
export type AutoDebitRequestDto = {
  enabled: boolean;
};
export type PaymentDto = {
  id: string;
  planId: "monthly" | "annual";
  amount: number;
  currency: string;
  kind: "automatic" | "plan_change" | "manual";
  status: "approved" | "declined" | "failed";
  methodLabel: string;
  reference: string | null;
  failureReason: string | null;
  paidAt: string;
};
export type PaymentPageDto = {
  items: PaymentDto[];
  /** Pass it as `cursor` to get the next page; null on the last page */
  nextCursor: string | null;
};
export type ManualPaymentRequestDto = {
  amount: number;
  /** Day the payment was made */
  paidAt: string;
  method: "bank_transfer" | "cash" | "card" | "other";
  reference?: string | null;
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
  lastConsultationAt: string | null;
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
export type PatientSummaryPageDto = {
  items: PatientSummaryDto[];
  /** Pass it as `cursor` to get the next page; null on the last page */
  nextCursor: string | null;
};
export type ChangePatientStatusRequestDto = {
  status: "active" | "discharged";
};
export type DiagnosisCatalogEntryDto = {
  code: string;
  name: string;
  category: string;
};
export type DiagnosisCatalogPageDto = {
  items: DiagnosisCatalogEntryDto[];
  /** Pass it as `cursor` to get the next page; null on the last page */
  nextCursor: string | null;
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
export type ConsultationSummaryPageDto = {
  items: ConsultationSummaryDto[];
  /** Pass it as `cursor` to get the next page; null on the last page */
  nextCursor: string | null;
};
export type ClinicalRecordDto = {
  patientId: string;
  openedAt: string;
  updatedAt: string;
  consultations: ConsultationSummaryPageDto;
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
export type DiagnosisHistoryPageDto = {
  items: DiagnosisHistoryEntryDto[];
  /** Pass it as `cursor` to get the next page; null on the last page */
  nextCursor: string | null;
};
export type RecordAccessDto = {
  action:
    | "view_record"
    | "view_consultation"
    | "view_diagnoses"
    | "register_consultation";
  consultationId: string | null;
  at: string;
};
export type RecordAccessPageDto = {
  items: RecordAccessDto[];
  /** Pass it as `cursor` to get the next page; null on the last page */
  nextCursor: string | null;
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
  /** Consultation fee (ARS); null = no fee */
  fee: number | null;
  /** `online`: requested by the patient */
  source: "agenda" | "online";
  cancelledAt: string | null;
};
export type AppointmentPageDto = {
  items: AppointmentDto[];
  /** Pass it as `cursor` to get the next page; null on the last page */
  nextCursor: string | null;
};
export type ScheduleAppointmentRequestDto = {
  patientId: string;
  startsAt: string;
  durationMinutes: number;
  type: "first_visit" | "control" | "follow_up" | "medication" | "other";
  modality: "in_person" | "virtual";
  notes?: string | null;
  /** Omit to use the fee configured for the type; null for no fee */
  fee?: number | null;
};
export type ConsultationFeesDto = {
  currency: string;
  amounts: {
    first_visit: number | null;
    control: number | null;
    follow_up: number | null;
    medication: number | null;
    other: number | null;
  };
  updatedAt: string;
};
export type UpdateConsultationFeesRequestDto = {
  amounts: {
    first_visit: number | null;
    control: number | null;
    follow_up: number | null;
    medication: number | null;
    other: number | null;
  };
};
export type EarningsReportDto = {
  currency: string;
  from: string;
  to: string;
  months: {
    month: string;
    earned: number;
    projected: number;
    appointments: number;
    unpriced: number;
    byType: {
      type: "first_visit" | "control" | "follow_up" | "medication" | "other";
      earned: number;
      projected: number;
      appointments: number;
    }[];
  }[];
  totals: {
    earned: number;
    projected: number;
    appointments: number;
    unpriced: number;
  };
};
export type RescheduleAppointmentRequestDto = {
  startsAt: string;
  durationMinutes: number;
  type: "first_visit" | "control" | "follow_up" | "medication" | "other";
  modality: "in_person" | "virtual";
  notes?: string | null;
  /** Omit to use the fee configured for the type; null for no fee */
  fee?: number | null;
};
export type NotificationDto = {
  id: string;
  patientId: string;
  channel: "whatsapp" | "email";
  topic:
    | "appointment_scheduled"
    | "appointment_rescheduled"
    | "appointment_cancelled"
    | "appointment_reminder"
    | "virtual_meeting";
  recipient: string | null;
  body: string;
  status: "sent" | "failed" | "skipped";
  attempts: number;
  error: string | null;
  createdAt: string;
};
export type NotificationPageDto = {
  items: NotificationDto[];
  /** Pass it as `cursor` to get the next page; null on the last page */
  nextCursor: string | null;
};
export type VirtualMeetingDto = {
  id: string;
  patientId: string;
  appointmentId: string | null;
  provider: "jitsi" | "google_meet";
  joinUrl: string;
  invitationStatus: "pending" | "sent" | "failed" | "skipped";
  invitationError: string | null;
  createdAt: string;
};
export type StartVirtualMeetingRequestDto = {
  patientId: string;
  /** Virtual appointment the call belongs to; omit from the patient file */
  appointmentId?: string | null;
};
export type VirtualMeetingPageDto = {
  items: VirtualMeetingDto[];
  /** Pass it as `cursor` to get the next page; null on the last page */
  nextCursor: string | null;
};
export type BookingSettingsDto = {
  slug: string;
  timezone: string;
  enabled: boolean;
  slotMinutes: number;
  minNoticeHours: number;
  horizonDays: number;
  modalities: ("in_person" | "virtual")[];
  weeklyHours: {
    /** ISO weekday: 1 Monday … 7 Sunday */
    weekday: number;
    start: string;
    end: string;
  }[];
  instructions: string | null;
};
export type UpdateBookingSettingsRequestDto = {
  enabled: boolean;
  slotMinutes: number;
  minNoticeHours: number;
  horizonDays: number;
  modalities: ("in_person" | "virtual")[];
  weeklyHours: {
    /** ISO weekday: 1 Monday … 7 Sunday */
    weekday: number;
    start: string;
    end: string;
  }[];
  instructions: string | null;
};
export type BookingRequestDto = {
  id: string;
  requester: {
    firstName: string;
    lastName: string;
    dni: string;
    birthDate: string | null;
    phone: string | null;
    email: string | null;
  };
  /** Patient with the same DNI, if the requester is already a patient */
  existingPatientId: string | null;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  modality: "in_person" | "virtual";
  reason: string | null;
  status: "pending" | "accepted" | "rejected" | "expired";
  appointmentId: string | null;
  rejectionReason: string | null;
  createdAt: string;
  decidedAt: string | null;
};
export type BookingRequestPageDto = {
  items: BookingRequestDto[];
  /** Pass it as `cursor` to get the next page; null on the last page */
  nextCursor: string | null;
};
export type AcceptBookingRequestDto = {
  type: "first_visit" | "control" | "follow_up" | "medication" | "other";
  notes?: string | null;
};
export type RejectBookingRequestDto = {
  reason?: string | null;
};
export type PublicBookingPageDto = {
  slug: string;
  professional: {
    fullName: string;
    specialty: string;
    offices: string[];
  };
  slotMinutes: number;
  horizonDays: number;
  modalities: ("in_person" | "virtual")[];
  instructions: string | null;
  timezone: string;
};
export type AvailableSlotsDto = {
  timezone: string;
  days: {
    date: string;
    slots: string[];
  }[];
};
export type BookingReceiptDto = {
  id: string;
  startsAt: string;
  durationMinutes: number;
  modality: "in_person" | "virtual";
  status: "pending";
};
export type CreateBookingRequestDto = {
  firstName: string;
  lastName: string;
  dni: string;
  birthDate?: string | null;
  phone?: string | null;
  email?: string | null;
  startsAt: string;
  modality: "in_person" | "virtual";
  reason?: string | null;
  /** Honeypot: must stay empty */
  website?: string;
};
export const {
  useGetHealthQuery,
  useGetLivenessQuery,
  useGetReadinessQuery,
  useRegisterProfessionalMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentProfessionalQuery,
  useRequestPasswordRecoveryMutation,
  useVerifyRecoveryCodeMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useUpdateProfileMutation,
  useGetLogoQuery,
  useUploadLogoMutation,
  useRemoveLogoMutation,
  useListAuditEventsQuery,
  useGetSubscriptionQuery,
  useChoosePlanMutation,
  useAddPaymentMethodMutation,
  useUpdatePaymentMethodMutation,
  useRemovePaymentMethodMutation,
  useSetAutoDebitMutation,
  useCancelSubscriptionMutation,
  useListPaymentsQuery,
  useRegisterManualPaymentMutation,
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
  useGetRecordAccessLogQuery,
  useListAppointmentsQuery,
  useScheduleAppointmentMutation,
  useGetConsultationFeesQuery,
  useUpdateConsultationFeesMutation,
  useGetEarningsReportQuery,
  useGetAppointmentQuery,
  useRescheduleAppointmentMutation,
  useCancelAppointmentMutation,
  useListNotificationsQuery,
  useStartVirtualMeetingMutation,
  useListVirtualMeetingsQuery,
  useGetBookingSettingsQuery,
  useUpdateBookingSettingsMutation,
  useListBookingRequestsQuery,
  useAcceptBookingRequestMutation,
  useRejectBookingRequestMutation,
  useGetPublicBookingPageQuery,
  useGetAvailableSlotsQuery,
  useCreateBookingRequestMutation,
} = injectedRtkApi;
