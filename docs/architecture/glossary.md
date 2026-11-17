# Domain glossary (ES → EN)

The use-case specification and the class diagram are written in Spanish. Code, API and docs
use these English names consistently ([ADR-0016](../adr/0016-english-only.md)).

| Spanish (spec / diagram) | English (code) | Where |
| --- | --- | --- |
| Persona | `Person` | `apps/api/src/core/model/Person.ts` |
| Psiquiatra / Profesional médico | `Professional` | `modules/auth` |
| Matrícula profesional | `licenseNumber` | `Professional` |
| Especialidad | `specialty` | `Professional` |
| Suscripción / período de prueba | `Subscription` (`trial`, `active`, `pending_payment`, `suspended`, `cancelled`, `expired`) | `modules/subscriptions` |
| Plan / medio de pago / débito automático | `Plan`, `PaymentMethod`, `autoDebit` | `modules/subscriptions` |
| Pago / historial de pagos / pago manual | `Payment` (`automatic`, `plan_change`, `manual`) | `modules/subscriptions` |
| Código de recuperación | `PasswordRecovery` | `modules/auth` |
| Membrete / logo / dirección de consultorio | Letterhead, `ProfessionalLogo`, `offices` | `modules/auth`, `features/prescriptions` |
| Receta médica | Prescription (`PrescriptionDocument`) | `features/prescriptions` |
| Consulta virtual / enlace de videollamada | `VirtualMeeting` (`joinUrl`) | `modules/virtual-consultations` |
| Paciente | `Patient` | `modules/patients` |
| Obra social / número de afiliado | `healthInsurance` / `memberNumber` | `Patient` |
| Contacto familiar | `FamilyContact` | `Patient` |
| Deuda | `debt` | `Patient` |
| Alergias | `allergies` | `Patient` |
| Estado del paciente: activo / alta / inactivo | `status`: `active` / `discharged` / `inactive` | `Patient` |
| Historia clínica | `ClinicalRecord` | `modules/clinical-records` |
| Consulta | `Consultation` | `ClinicalRecord` |
| Presencial / virtual | `in_person` / `virtual` | `Consultation.type`, `Appointment.modality` |
| Motivo de consulta | `reason` | `Consultation` |
| Nota de evolución / evolución | `evolution` | `Consultation` |
| Diagnóstico | `AssignedDiagnosis` | `Consultation` |
| Catálogo de diagnósticos (DSM-5) | `DiagnosisCatalogEntry`, `DiagnosisCatalog` | `modules/diagnosis-catalog` |
| Medicamento / medicación | `Medication` (`dose`, `frequency`, `duration`, `indications`) | `Consultation` |
| Turno | `Appointment` | `modules/appointments` |
| Agenda / calendario | Agenda (`AgendaEntry`, `AgendaPage`) | `modules/appointments`, `features/appointments` |
| Tipo de consulta: primera consulta / control / seguimiento / medicación / otra | `first_visit` / `control` / `follow_up` / `medication` / `other` | `Appointment.type` |
| Reprogramar / cancelar turno | `reschedule` / `cancel` | `Appointment` |
| Recordatorio / notificación por WhatsApp | `Notification`, `NotificationCenter`, `AppointmentNotifier` | `modules/notifications`, `modules/appointments` |
| Inactivación automática (3 meses) | `Patient.isDormantAt`, `lastClinicalActivityAt` | `modules/patients` |
| Institución | `Institution` (not implemented yet) | — |
| Liquidación, Obra social (entidad) | `Settlement`, `HealthInsurer` (not implemented yet) | — |
