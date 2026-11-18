# Sequence diagrams

The most important flows, drawn from the implemented code. Class names match the sources and the
[class diagram](class-diagram.md). Every diagram is Mermaid, so GitHub renders it.

| # | Flow | Use cases |
| --- | --- | --- |
| 1 | [Request lifecycle (MVP Passive View)](#1-request-lifecycle-mvp-passive-view) | all |
| 2 | [Log in and access check](#2-log-in-and-access-check) | CU-01, CU-18 |
| 3 | [Register with a free trial](#3-register-with-a-free-trial) | CU-03 |
| 4 | [Password recovery](#4-password-recovery) | CU-02 |
| 5 | [Register a consultation](#5-register-a-consultation) | CU-09, CU-06 |
| 6 | [Schedule an appointment and notify by WhatsApp](#6-schedule-an-appointment-and-notify-by-whatsapp) | CU-10, CU-14 |
| 7 | [Scheduled jobs: appointment reminders](#7-scheduled-jobs-appointment-reminders) | CU-14 |
| 8 | [Start a virtual consultation](#8-start-a-virtual-consultation) | CU-15 |
| 9 | [Choose a plan and pay](#9-choose-a-plan-and-pay) | CU-18 |
| 10 | [Automatic renewal](#10-automatic-renewal) | CU-18 |
| 11 | [Database backup and restore](#11-database-backup-and-restore) | operations |

## 1. Request lifecycle (MVP Passive View)

Every endpoint follows this path (ADR-0004, ADR-0025). The presenter never touches Express and
the view never decides anything.

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser (View + ViewModel)
  participant N as nginx (web image)
  participant E as ExpressServer
  participant R as Routes (module view)
  participant P as Presenter
  participant S as Service (model)
  participant T as MongoTransactionManager
  participant Repo as MongooseRepository
  participant V as HttpView

  B->>N: HTTPS request /api/... (cookie mentora_session)
  N->>E: proxy, X-Request-Id
  E->>E: request id, pino log, helmet, cookie parser
  E->>R: route match
  R->>R: RateLimiter.limit() (auth routes only)
  R->>R: AuthGuard.requireActiveSubscription → res.locals.actor
  R->>R: InputParser.parse(zod contract, body)
  R->>P: presenters.useCase(HttpViews.json(res)).present(input)
  P->>S: execute(input)
  S->>T: run(work)
  T->>T: TransactionContext.runWith(session)
  T->>Repo: findOwned / save (session from the context)
  Repo-->>T: aggregate
  T-->>S: commit
  S-->>P: domain result
  alt success
    P->>V: render(viewModel)
    V-->>B: 200/201 JSON DTO
  else ApplicationError
    P->>V: renderError(kind, code, message)
    V-->>B: 400/401/403/404/409/429/503 error DTO
  else unexpected error
    P-->>E: throw
    E-->>B: HttpErrorHandler → 500 (X-Request-Id header, same id in the log)
  end
```

## 2. Log in and access check

Login always succeeds for valid credentials, even when the subscription has ended, so the
professional can still pay. Protected routes check the access date stored in the token; `/auth/me`
refreshes it after a payment (ADR-0018, ADR-0029, ADR-0034).

```mermaid
sequenceDiagram
  autonumber
  actor U as Professional
  participant W as useLoginViewModel
  participant A as AuthRoutes
  participant L as RateLimiter
  participant P as LoginPresenter
  participant S as AuthService
  participant PR as ProfessionalRepository
  participant H as ScryptPasswordHasher
  participant X as SubscriptionAccessAdapter
  participant J as JoseTokenService
  participant G as AuthGuard

  U->>W: email + password
  W->>A: POST /api/auth/login
  A->>L: login-ip (50/15 min), login-account (10/15 min, IP + email) and login-email (30/h)
  alt over the limit
    L-->>W: 429 TOO_MANY_REQUESTS + Retry-After
  end
  A->>P: present({email, password})
  P->>S: authenticate(email, password)
  S->>PR: findByEmail(normalized)
  S->>H: verify(password, hash)
  alt unknown email or wrong password
    S-->>W: 401 "Invalid email or password"
  end
  S->>X: accessOf(professionalId)
  X-->>S: {status, hasAccess, accessEndsAt, daysLeft}
  P->>S: issueSessionToken(subject)
  S->>J: issue({professionalId, accessEndsAt, cv})
  P-->>W: SessionHttpView sets httpOnly cookie, 200 SessionDto
  W->>W: hasAccess ? agenda : subscription screen

  Note over W,G: Later, any protected request
  W->>G: GET /api/patients (cookie)
  G->>J: verify(token)
  alt accessEndsAt <= now
    G-->>W: 403 SUBSCRIPTION_INACTIVE → web redirects to /subscription
  else password changed on another device
    Note over G,S: /auth/me compares cv with Professional.credentialsVersion → 401
  else valid
    G->>A: next() with res.locals.actor
  end
```

## 3. Register with a free trial

The professional and the trial subscription are written in one transaction. `auth` reaches
`subscriptions` through a consumer-owned port and an adapter (ADR-0022, ADR-0033).

```mermaid
sequenceDiagram
  autonumber
  participant W as useRegisterViewModel
  participant P as RegisterProfessionalPresenter
  participant S as AuthService
  participant H as ScryptPasswordHasher
  participant T as TransactionManager
  participant PR as ProfessionalRepository
  participant X as SubscriptionAccessAdapter
  participant SA as SubscriptionAccess
  participant SR as SubscriptionRepository

  W->>P: POST /api/auth/register (10/h per IP)
  P->>S: register(data)
  S->>S: PasswordPolicy.assertSatisfiedBy(password)
  S->>H: hash(password)
  S->>T: run
  activate T
  T->>S: Professional.register(data, now)
  S->>PR: findByEmail / findByLicenseNumber
  alt already registered
    S-->>W: 409 (field email or licenseNumber)
  end
  S->>PR: save(professional)
  S->>X: startTrial(id, contact)
  X->>SA: startTrial(id, contact)
  SA->>SR: save(Subscription.startTrial(...))
  T-->>S: commit both documents
  deactivate T
  P->>S: issueSessionToken
  P-->>W: 201 SessionDto + cookie (trial, daysLeft)
```

## 4. Password recovery

Same answer for known and unknown emails. Codes are 6 digits, hashed, valid 15 minutes, 5 attempts
and single use (ADR-0028). Resetting the password changes `credentialsVersion`, so every other
session gets 401 (ADR-0034).

```mermaid
sequenceDiagram
  autonumber
  participant W as useForgotPasswordViewModel
  participant S as PasswordRecoveryService
  participant C as CryptoRecoveryCodeGenerator
  participant H as PasswordHasher
  participant T as TransactionManager
  participant RR as PasswordRecoveryRepository
  participant PR as ProfessionalRepository
  participant M as EmailPasswordRecoveryNotifier
  participant SMTP as MailTransport (SMTP / Mailpit)

  W->>S: POST /password-recovery (5/h per email)
  S->>C: generate() → 6-digit code
  S->>H: hash(code)
  S->>T: run
  T->>PR: findByEmail
  opt professional exists
    T->>RR: invalidate the previous code, save the new one
  end
  S--)M: sendCode (fire and forget, after commit)
  M--)SMTP: email with the code
  S-->>W: 202, same message for every email

  W->>S: POST /password-recovery/verify {email, code}
  S->>T: run → check(): expired? attempts left? hash matches?
  T->>RR: save(attempts + 1) on a wrong code
  S-->>W: 204 or 400 INVALID_RECOVERY_CODE

  W->>S: POST /password-recovery/reset {email, code, newPassword}
  S->>T: run
  T->>RR: save(recovery consumed)
  T->>PR: save(professional.changePasswordHash) → new credentialsVersion
  S-->>W: 204, log in with the new password
```

## 5. Register a consultation

The consultation is appended to the `ClinicalRecord` aggregate and the patient's last clinical
activity is updated in the same transaction, through the `patients` module (ADR-0020, ADR-0033).

```mermaid
sequenceDiagram
  autonumber
  participant W as useNewConsultationViewModel
  participant P as RegisterConsultationPresenter
  participant S as ClinicalRecordService
  participant T as TransactionManager
  participant PL as PatientDirectoryLookup
  participant D as CatalogDiagnosisResolver
  participant CR as ClinicalRecordRepository
  participant AR as PatientActivityRecorder
  participant PA as PatientActivity
  participant PR as PatientRepository

  W->>P: POST /api/patients/:id/clinical-record/consultations
  P->>S: registerConsultation(professionalId, patientId, data)
  S->>T: run
  activate T
  T->>PL: exists(professionalId, patientId)
  alt not this professional's patient
    PL-->>W: 404
  end
  S->>D: resolve(diagnosisCode) → AssignedDiagnosis
  S->>S: Consultation.record(...), Medication.prescribe(...)
  S->>CR: findByPatient or ClinicalRecord.open
  S->>S: record.addConsultation(consultation)
  S->>CR: save(record)
  S->>AR: record(professionalId, patientId, date)
  AR->>PA: recordClinicalActivity
  PA->>PR: save(patient) when the date moves forward
  T-->>S: commit
  deactivate T
  P-->>W: 201 ConsultationDto
```

## 6. Schedule an appointment and notify by WhatsApp

The appointment is committed first. The WhatsApp message is sent after the commit, and a failed
delivery never undoes the appointment. Every attempt is logged (ADR-0030).

```mermaid
sequenceDiagram
  autonumber
  participant W as useAppointmentFormViewModel
  participant S as AppointmentService
  participant T as TransactionManager
  participant PN as PatientDirectoryNames
  participant L as AgendaLock (agenda_locks)
  participant AR as AppointmentRepository
  participant N as NotificationAppointmentNotifier
  participant PD as PatientDirectory
  participant NC as NotificationCenter
  participant G as WhatsAppGateway (LocalWhatsAppOutbox or WhatsAppCloudApiGateway)
  participant E as EmailGateway (MailEmailGateway)
  participant NR as NotificationRepository

  W->>S: POST /api/appointments {patientId, startsAt, duration, modality}
  S->>T: run
  activate T
  T->>PN: exists(professionalId, patientId)
  S->>L: acquire(professionalId), a concurrent booking gets a write conflict and is retried
  S->>S: Appointment.schedule(...) (marks the reminder sent if it starts within 24 h)
  S->>AR: findScheduledOverlapping
  alt overlaps
    AR-->>W: 409 with the clashing appointmentId
  end
  S->>AR: save
  T-->>S: commit
  deactivate T
  S->>N: notify('scheduled', appointment)
  N->>PD: contacts(professionalId, [patientId])
  N->>NC: send({phone, email, topic, body})
  opt the patient has a phone
    loop up to 2 attempts, stops on a permanent error
      NC->>G: send(phone, body)
    end
    NC->>NR: save(whatsapp Notification sent / failed)
  end
  opt no phone or WhatsApp failed, and the patient has an email
    NC->>E: send(email, subject, body)
    NC->>NR: save(email Notification sent / failed)
  end
  S-->>W: 201 AppointmentDto
```

## 7. Scheduled jobs: appointment reminders

Three jobs run inside the API process: reminders (10 min), dormant patients (6 h) and renewals
(1 h). A Mongo lease makes sure only one API instance runs each job (ADR-0026, ADR-0037).

```mermaid
sequenceDiagram
  autonumber
  participant SCH as IntervalJobScheduler
  participant LK as MongoJobLock (job_locks)
  participant S as AppointmentService
  participant AR as AppointmentRepository
  participant T as TransactionManager
  participant N as NotificationAppointmentNotifier

  SCH->>SCH: tick('appointments.send-reminders'), skip if still running
  SCH->>LK: acquire(name, leaseMs)
  alt another instance holds the lease
    LK-->>SCH: false → skip this tick
  end
  SCH->>S: sendDueReminders()
  S->>AR: findNeedingReminder(now, now + 24 h, 200)
  loop each candidate
    S->>T: run
    T->>AR: findById → needsReminderAt(now)? markReminderSent, save
    T-->>S: claimed appointment or null
    opt claimed
      S->>N: notify('reminder', appointment)
    end
  end
  SCH->>LK: release(name)
```

## 8. Start a virtual consultation

The link comes from the configured `MeetingLinkProvider` (Jitsi by default). A unique index on
`appointmentId` makes concurrent clicks return the same meeting (ADR-0031).

```mermaid
sequenceDiagram
  autonumber
  participant W as useVirtualMeetingViewModel
  participant S as VirtualConsultationService
  participant PC as PatientContacts
  participant AL as AppointmentLookup
  participant MR as VirtualMeetingRepository
  participant L as MeetingLinkProvider (Jitsi / Google Meet)
  participant I as MeetingInvitations → NotificationCenter

  W->>S: POST /api/virtual-meetings {patientId, appointmentId?}
  S->>PC: find(professionalId, patientId)
  opt appointmentId
    S->>AL: find → must be scheduled, virtual and of this patient
    S->>MR: findByAppointment → return it if it already exists
  end
  S->>L: create({title, startsAt, 50 min})
  alt provider down
    L-->>W: 503 MEETING_PROVIDER_UNAVAILABLE
  end
  S->>MR: insertIfFirstForAppointment(meeting)
  alt lost the race (duplicate key)
    MR-->>S: false → return the existing meeting
  end
  S->>I: send(WhatsApp invitation with the join URL)
  S->>MR: save(meeting with invitation status)
  S-->>W: 201 VirtualMeetingDto → the web opens joinUrl
```

## 9. Choose a plan and pay

The charge runs between two short transactions, never inside one, so a slow provider does not hold
a database session. The idempotency key prevents double charges on retries (ADR-0029).

```mermaid
sequenceDiagram
  autonumber
  participant W as usePlanSettingsViewModel
  participant S as SubscriptionService
  participant T as TransactionManager
  participant SR as SubscriptionRepository
  participant PY as PaymentRepository
  participant G as PaymentGateway (SimulatedPaymentGateway)

  W->>S: PUT /api/subscription/plan {planId}
  S->>T: run (decide)
  T->>SR: get → subscription.choosePlan(plan)
  alt no charge needed (same plan, still paid)
    T-->>W: 200 SubscriptionDto
  end
  T->>PY: countByProfessional → attempt number
  T-->>S: {plan, defaultMethod, key "plan:id:plan:method:attempt"}
  S->>G: charge({token, amount, currency, idempotencyKey})
  G-->>S: approved / declined / error
  S->>T: run (record)
  T->>PY: save(Payment approved / declined / failed)
  opt approved
    T->>SR: subscription.applyPayment(plan) → active, new period end
  end
  alt declined
    S-->>W: 402 PAYMENT_DECLINED
  else provider error
    S-->>W: 503 PAYMENT_PROVIDER_UNAVAILABLE
  else approved
    S-->>W: 200 → the web calls /auth/me to refresh the cookie
  end
```

## 10. Automatic renewal

Run every hour by the `subscriptions.process-renewals` job. One failing subscription never stops
the batch; the report is logged.

```mermaid
sequenceDiagram
  autonumber
  participant J as Job (IntervalJobScheduler + MongoJobLock)
  participant S as SubscriptionService
  participant T as TransactionManager
  participant SR as SubscriptionRepository
  participant G as PaymentGateway
  participant PY as PaymentRepository
  participant B as EmailBillingNotifier

  J->>S: processDueRenewals()
  S->>SR: findDue(now, 100)
  loop each due subscription
    S->>T: run (decide)
    alt trial without a plan
      T->>SR: expireTrial → event trial_expired
    else auto-debit off or no card
      T->>SR: markPaymentPending → event payment_pending
    else charge
      T-->>S: key "renewal:id:periodEnd:failedAttempts"
      S->>G: charge(...)
      S->>T: run (record)
      T->>PY: save(Payment)
      alt approved
        T->>SR: applyPayment → event renewed
      else declined
        T->>SR: markPaymentPending → event payment_declined
      else provider error
        T->>SR: recordFailedCharge → suspended after 3 failures
      end
    end
    S--)B: notify(contact, event), errors ignored
  end
  S-->>J: RenewalReport {processed, failed, errors}
```

## 11. Database backup and restore

Production backups run in the `backup` container with a read-only `backup` user. Restores are done
by an operator with the `restore` role (ADR-0039, [backup-and-restore.md](../operations/backup-and-restore.md)).

```mermaid
sequenceDiagram
  autonumber
  participant SCH as schedule.sh (backup container)
  participant BK as backup.sh
  participant DB as MongoDB (replica set)
  participant FS as ./backups volume
  participant OS as Offsite copy (operator)
  actor OP as Operator
  participant RS as restore.sh

  loop every BACKUP_INTERVAL_HOURS (24 h)
    SCH->>BK: run
    BK->>DB: mongodump --db mentora --gzip --archive (user backup)
    BK->>FS: mentora-<UTC>.archive.gz (renamed from .partial when done)
    BK->>FS: .sha256 checksum
    BK->>FS: delete files older than BACKUP_RETENTION_DAYS (14)
  end
  FS--)OS: copy off the host (see the backup plan)

  OP->>RS: restore.sh mentora-<UTC>.archive.gz
  RS->>FS: sha256sum -c
  alt checksum mismatch
    RS-->>OP: abort, nothing touched
  end
  RS->>DB: mongorestore --drop --gzip --nsInclude "mentora.*"
  OP->>OP: pnpm smoke against the restored stack
```
