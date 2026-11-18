# Class diagram

> Generated from the TypeScript sources by `pnpm docs:classes` (`tools/docs/class-diagram.mjs`).
> Do not edit it by hand: CI runs `pnpm docs:check` and fails when it is out of date.

## How to read it

- One diagram per layer or API module, so each one stays readable.
- `<<…>>` shows `abstract` and the design pattern named by the class comment (ADR-0035).
- `<|--` is inheritance, `<|..` is an implemented abstraction, `-->` is a constructor or field
  dependency (the arrow points at what the class needs).
- `<<external>>` boxes are classes from another section; their members are in their own diagram.
- Members: `+` public, `#` protected, `-` private (only injected dependencies are listed),
  `*` abstract, `$` static. Private methods are left out.
- The web is MVVM with hooks, so only its model adapters and the store are classes. Its
  ViewModels and Views are described in [frontend-mvvm.md](frontend-mvvm.md).

## Module dependencies

API modules only talk through the public `index.ts` of another module (ADR-0022, ADR-0033).

```mermaid
flowchart LR
  appointments["appointments"]
  audit["audit"]
  auth["auth"]
  booking["booking"]
  clinical_records["clinical-records"]
  diagnosis_catalog["diagnosis-catalog"]
  health["health"]
  notifications["notifications"]
  patients["patients"]
  subscriptions["subscriptions"]
  virtual_consultations["virtual-consultations"]
  appointments --> notifications
  appointments --> patients
  auth --> subscriptions
  booking --> appointments
  booking --> auth
  booking --> patients
  booking --> subscriptions
  clinical_records --> diagnosis_catalog
  clinical_records --> patients
  virtual_consultations --> appointments
  virtual_consultations --> notifications
  virtual_consultations --> patients
```

## API core (shared kernel)

32 classes.

```mermaid
classDiagram
  direction LR
  class ApplicationError {
    <<abstract>>
    +kind: ErrorKind
    +code: string
    +details: unknown
  }
  class AuditTrail {
    <<abstract>>
    +record(entry)* Promise~void~
  }
  class CalendarMonths {
    +add(date, months)$ Date
  }
  class Clock {
    <<abstract>>
    +now()* Date
  }
  class ConflictError {
    +kind
  }
  class CursorCodec {
    <<Adapter>>
    +encode(key)$ string | null
    +decode(cursor)$ CursorKey | null
    +request(input)$ PageRequest
    +toDto(page, transform)$ PageDto~U~
  }
  class DateFormatter {
    <<abstract>>
    +date(value)* string
    +time(value)* string
    +dateTime(value) string
  }
  class Entity~TProps, TId~ {
    <<abstract · Entity>>
    +id: TId
    #props: TProps
    +equals(other) boolean
  }
  class ForbiddenError {
    +kind
  }
  class HttpView~TViewModel~ {
    <<abstract · Passive View, Template Method>>
    #successStatus: number
    #responder: HttpResponder
    +render(viewModel) void
    +renderError(error) void
    #serialize(viewModel) unknown
  }
  class IdGenerator {
    <<abstract>>
    +next()* string
  }
  class InputParser {
    +parse(schema, raw)$ T
  }
  class JobLock {
    <<abstract>>
    +acquire(job, leaseMs)* Promise~boolean~
    +release(job)* Promise~void~
  }
  class JsonHttpView~TViewModel~ {
    <<Passive View>>
    #successStatus: number
  }
  class NoContentHttpView {
    <<Passive View>>
    +render() void
  }
  class NotFoundError {
    +kind
  }
  class PageRequest {
    <<Value Object>>
    +DEFAULT_LIMIT$
    +MAX_LIMIT$
    +limit: number
    +after: CursorKey | null
    +of(limit, after)$ PageRequest
    +first(limit)$ PageRequest
    +slice(sorted, keyOf) Page~T~
    +map(page, transform)$ Page~U~
  }
  class PasswordHasher {
    <<abstract>>
    +hash(plain)* Promise~string~
    +verify(plain, hash)* Promise~boolean~
  }
  class PaymentDeclinedError {
    +kind
  }
  class Person~TProps~ {
    <<abstract · Entity>>
    +firstName: string
    +lastName: string
    +fullName: string
    +dni: string | null
    +birthDate: Date | null
    +gender: string | null
    +phone: string | null
    +email: string | null
    +address: string | null
    +age(at) number | null
  }
  class Presenter~TInput, TViewModel~ {
    <<abstract · Template Method>>
    #view: View~TViewModel~
    +present(input) Promise~void~
    #execute(input)* Promise~TViewModel~
    #toErrorViewModel(error) ErrorViewModel
  }
  class Repository~TEntity, TId~ {
    <<abstract · Repository>>
    +findById(id)* Promise~TEntity | null~
    +save(entity)* Promise~void~
  }
  class ServiceUnavailableError {
    +kind
  }
  class SubscriptionInactiveError {
  }
  class SystemClock {
    +now() Date
  }
  class TokenService {
    <<abstract>>
    +issue(claims)* Promise~string~
    +verify(token)* Promise~SessionClaims | null~
  }
  class TooManyRequestsError {
    +kind
    +retryAfterSeconds: number
  }
  class TransactionManager {
    <<abstract · Unit of Work>>
    +run(work)* Promise~T~
  }
  class UnauthorizedError {
    +kind
  }
  class UuidIdGenerator {
    +next() string
  }
  class ValidationError {
    +kind
  }
  class ValueObject~TProps~ {
    <<abstract · Value Object>>
    #props: Readonly~TProps~
    +equals(other) boolean
  }
  ApplicationError <|-- ConflictError
  ApplicationError <|-- ForbiddenError
  ApplicationError <|-- NotFoundError
  ApplicationError <|-- PaymentDeclinedError
  ApplicationError <|-- ServiceUnavailableError
  ApplicationError <|-- TooManyRequestsError
  ApplicationError <|-- UnauthorizedError
  ApplicationError <|-- ValidationError
  Clock <|-- SystemClock
  Entity <|-- Person
  ForbiddenError <|-- SubscriptionInactiveError
  HttpView <|-- JsonHttpView
  HttpView <|-- NoContentHttpView
  IdGenerator <|-- UuidIdGenerator
```

## API infrastructure

30 classes.

```mermaid
classDiagram
  direction LR
  class ActorReader {
    +from(res)$ AuthenticatedActor
    +optional(res)$ AuthenticatedActor | null
  }
  class AppConfig {
    <<Singleton>>
    +env: Readonly~Env~
    +getInstance()$ AppConfig
    +resetInstance()$ void
    +isProduction: boolean
  }
  class AuthGuard {
    -tokens: TokenService
    -clock: Clock
    +requireSession: RequestHandler
    +readSession: RequestHandler
    +requireActiveSubscription: RequestHandler
  }
  class ErrorHttpView {
    <<Passive View>>
  }
  class ExpressResponderAdapter {
    <<Adapter>>
    -response: Response
    +send(status, body) void
    +noContent() void
    +setCookie(name, value, options) void
    +clearCookie(name) void
  }
  class ExpressServer {
    +app: Express
    -options: ExpressServerOptions
    +listen(port) Promise~Server~
  }
  class HmacSha256SigningAlgorithm {
    <<Strategy>>
    +name
    +signingKey: KeyObject
    +verificationKey: KeyObject
  }
  class HttpErrorHandler {
    -logger: AppLogger
    +notFound: RequestHandler
    +handle: ErrorRequestHandler
  }
  class IntervalJobScheduler {
    -logger: AppLogger
    -lock: JobLock | null
    -initialDelayMs: 
    +start(jobs) void
    +stop() Promise~void~
  }
  class IntlDateFormatter {
    <<Adapter>>
    +date(value) string
    +time(value) string
  }
  class JoseTokenService {
    <<Adapter>>
    -algorithm: TokenSigningAlgorithm
    -ttlSeconds: number
    +issue(claims) Promise~string~
    +verify(token) Promise~SessionClaims | null~
  }
  class Keyset {
    <<Strategy>>
    -fields: KeysetField[]
    +sort() Record~string, number | boolean~
    +where(base, after) Filter
    +slice(records, request) object
    +page(records, request, toItem) Page~TItem~
  }
  class Logger {
    <<Singleton>>
    +REDACTED_PATHS$
    +getInstance()$ PinoLoggerAdapter
    +resetInstance()$ void
  }
  class MailTransport {
    <<abstract>>
    +send(message)* Promise~void~
  }
  class MigrationLog {
    +COLLECTION$
    -database: MongoConnection
    +runOnce(name, work) Promise~boolean~
  }
  class MongoConnection {
    <<Singleton>>
    +getInstance()$ MongoConnection
    +connect(uri, maxPoolSize) Promise~void~
    +disconnect() Promise~void~
    +isConnected: boolean
    +connection: Connection
    +ping() Promise~number~
  }
  class MongoJobLock {
    <<Adapter>>
    +owner
    -database: MongoConnection
    +acquire(job, leaseMs) Promise~boolean~
    +release(job) Promise~void~
  }
  class MongooseRepository~TEntity, TDocument~ {
    <<abstract · Repository, Adapter>>
    #model: Model~TDocument~
    #mapper: DataMapper~TEntity, TDocument~
    -context: TransactionContext
    #session: ClientSession | null
    +findById(id) Promise~TEntity | null~
    +save(entity) Promise~void~
  }
  class MongoRateLimitStore {
    <<Adapter>>
    +COLLECTION$
    -database: MongoConnection
    +hit(id, windowMs, now) Promise~RateLimitWindow~
  }
  class MongoTransactionManager {
    <<Unit of Work, Adapter>>
    -database: MongoConnection
    -context: TransactionContext
    +run(work) Promise~T~
  }
  class OpenApiRegistry {
    <<Singleton, Adapter>>
    +getInstance()$ OpenApiRegistry
    +resetInstance()$ void
    +registerRoute(route) void
    +generateDocument(version) OpenApiDocument
  }
  class PinoLoggerAdapter {
    <<Adapter>>
    -pino: PinoLogger
    +debug(message, context) void
    +info(message, context) void
    +warn(message, context) void
    +error(message, context) void
    +child(bindings) AppLogger
    +native: PinoLogger
  }
  class RateLimiter {
    -enabled: boolean
    -store: RateLimitStore
    -now: Function
    +byIp(req)$ string
    +byEmail(req)$ string | null
    +limit(rules) RequestHandler
  }
  class RateLimitStore {
    <<abstract>>
    +hit(id, windowMs, now)* Promise~RateLimitWindow~
  }
  class RequestOriginContext {
    +current: RequestOrigin | null
    +capture: RequestHandler
  }
  class ScryptPasswordHasher {
    <<Adapter>>
    +hash(plain) Promise~string~
    +verify(plain, stored) Promise~boolean~
  }
  class SessionCookie {
    -secure: boolean
    -maxAgeSeconds: number
    +write(responder, token) void
    +clear(responder) void
  }
  class SmtpMailTransport {
    <<Adapter>>
    -from: string
    +send(message) Promise~void~
  }
  class TokenSigningAlgorithm {
    <<abstract · Strategy>>
    +name: string
    +signingKey: KeyObject
    +verificationKey: KeyObject
  }
  class TransactionContext {
    +session: ClientSession | null
    +isActive: boolean
    +runWith(session, work) Promise~T~
  }
  class Clock {
    <<external>>
  }
  class DateFormatter {
    <<external>>
  }
  class HttpView {
    <<external>>
  }
  class JobLock {
    <<external>>
  }
  class PasswordHasher {
    <<external>>
  }
  class Repository {
    <<external>>
  }
  class TokenService {
    <<external>>
  }
  class TransactionManager {
    <<external>>
  }
  AuthGuard --> Clock
  AuthGuard --> TokenService
  DateFormatter <|-- IntlDateFormatter
  HttpView <|-- ErrorHttpView
  IntervalJobScheduler --> JobLock
  JobLock <|-- MongoJobLock
  JoseTokenService --> TokenSigningAlgorithm
  MailTransport <|-- SmtpMailTransport
  MigrationLog --> MongoConnection
  MongoJobLock --> MongoConnection
  MongoRateLimitStore --> MongoConnection
  MongoTransactionManager --> MongoConnection
  MongoTransactionManager --> TransactionContext
  MongooseRepository --> TransactionContext
  PasswordHasher <|-- ScryptPasswordHasher
  RateLimitStore <|-- MongoRateLimitStore
  RateLimiter --> RateLimitStore
  Repository <|-- MongooseRepository
  TokenService <|-- JoseTokenService
  TokenSigningAlgorithm <|-- HmacSha256SigningAlgorithm
  TransactionManager <|-- MongoTransactionManager
```

## API composition root

1 classes.

```mermaid
classDiagram
  direction LR
  class Application {
    <<Composition Root>>
    -modules: AppModule[]
    +openApiDocument: object
    +bootstrapModules() Promise~void~
    +runMigrations(log) Promise~string[]~
    +scheduledJobs() ScheduledJob[]
    +createServer(options) ExpressServer
  }
```

## API module: Appointments (CU-10, CU-11, CU-12, CU-13, CU-14)

32 classes.

```mermaid
classDiagram
  direction LR
  class AgendaLock {
    <<abstract>>
    +acquire(professionalId)* Promise~void~
  }
  class Appointment {
    <<Aggregate Root>>
    +MIN_DURATION$
    +MAX_DURATION$
    +REMINDER_WINDOW_MS$
    +MAX_FEE$
    +schedule(id, professionalId, patientId, slot, now, source)$
    +restore(id, props)$ Appointment
    +endOf(startsAt, durationMinutes)$ Date
    +reschedule(slot, now) void
    +cancel(now) void
    +markReminderSent(now) void
    +needsReminderAt(now, windowMs) boolean
    +overlaps(other) boolean
    +professionalId: string
    +patientId: string
    +startsAt: Date
    +endsAt: Date
    +durationMinutes: number
    +type: AppointmentType
    +modality: AppointmentModality
    +notes: string | null
    +fee: number | null
    +source: AppointmentSource
    +status: AppointmentStatus
    +isScheduled: boolean
    +createdAt: Date
    +updatedAt: Date
    +cancelledAt: Date | null
    +reminderSentAt: Date | null
  }
  class AppointmentBooking {
    -agenda: AppointmentService
    +busyIntervals(professionalId, from, to) Promise~BusyInterval[]~
    +book(professionalId, patientId, slot) Promise~string~
    +confirm(professionalId, appointmentId) Promise~void~
  }
  class AppointmentDirectory {
    -appointments: AppointmentRepository
    +findOwned(professionalId, appointmentId) Promise~AppointmentSummary | null~
  }
  class AppointmentMapper {
    <<Data Mapper>>
    +toDomain(record) Appointment
    +toPersistence(appointment) AppointmentDocument
  }
  class AppointmentNotifier {
    <<abstract>>
    +notify(event, appointment)* Promise~void~
  }
  class AppointmentRepository {
    <<abstract · Repository>>
    +findOwned(professionalId, id)* Promise~Appointment | null~
    +findStartingBetween(professionalId, from, to, page)* Promise~Page~Appointment~~
    +findScheduledOverlapping(professionalId, startsAt, endsAt)* Promise~Appointment[]~
    +findNeedingReminder(from, to, limit)* Promise~Appointment[]~
    +earnings(professionalId, from, to, now)* Promise~EarningsRow[]~
  }
  class AppointmentRoutes {
    -presenters: AppointmentPresenterFactory
    -guard: AuthGuard
    +build() Router
  }
  class AppointmentService {
    -appointments: AppointmentRepository
    -transactions: TransactionManager
    -patients: PatientNames
    -notifier: AppointmentNotifier
    -clock: Clock
    -lock: AgendaLock
    -ids: IdGenerator
    -fees: ConsultationFeesRepository
    -audit: AuditTrail
    +list(professionalId, from, to, page) Promise~Page~AgendaEntry~~
    +get(professionalId, appointmentId) Promise~AgendaEntry~
    +schedule(professionalId, patientId, request) Promise~AgendaEntry~
    +book(professionalId, patientId, request) Promise~Appointment~
    +confirmBooked(professionalId, appointmentId) Promise~void~
    +busyIntervals(professionalId, from, to) Promise~BusyInterval[]~
    +reschedule(professionalId, appointmentId, request) Promise~AgendaEntry~
    +cancel(professionalId, appointmentId) Promise~AgendaEntry~
    +sendDueReminders() Promise~number~
  }
  class AppointmentsModule {
    <<Composition Root, Abstract Factory>>
    +basePath
    +directory: AppointmentDirectory
    +booking: AppointmentBooking
    -deps: AppointmentsModuleDependencies
    +registerContracts(registry) void
    +createRouter() Router
    +scheduledJobs() ScheduledJob[]
    +listAppointments(view) ListAppointmentsPresenter
    +getAppointment(view) GetAppointmentPresenter
    +scheduleAppointment(view) ScheduleAppointmentPresenter
    +rescheduleAppointment(view) RescheduleAppointmentPresenter
    +cancelAppointment(view) CancelAppointmentPresenter
    +getConsultationFees(view) GetConsultationFeesPresenter
    +updateConsultationFees(view) UpdateConsultationFeesPresenter
    +getEarningsReport(view) GetEarningsReportPresenter
  }
  class AppointmentViewModel {
    +toDto(appointment,patientName)$ AppointmentDto
    +toSlot(input)$ SlotRequest
  }
  class CancelAppointmentPresenter {
    <<Presenter>>
    -agenda: AppointmentService
    #execute(input) Promise~AppointmentDto~
  }
  class ConsultationFees {
    <<Entity>>
    +CURRENCY$
    +empty(professionalId, now)$ ConsultationFees
    +restore(professionalId, props)$ ConsultationFees
    +update(amounts, now) void
    +feeFor(type) number | null
    +professionalId: string
    +currency: string
    +amounts: FeeTable
    +updatedAt: Date
  }
  class ConsultationFeesMapper {
    <<Data Mapper>>
    +toDomain(record) ConsultationFees
    +toPersistence(fees) ConsultationFeesDocument
  }
  class ConsultationFeesRepository {
    <<abstract · Repository>>
  }
  class EarningsCalculator {
    +summarize(range, currency, rows)$ EarningsReport
  }
  class EarningsService {
    -fees: ConsultationFeesRepository
    -appointments: AppointmentRepository
    -transactions: TransactionManager
    -clock: Clock
    -audit: AuditTrail
    +getFees(professionalId) Promise~ConsultationFees~
    +updateFees(professionalId, amounts) Promise~ConsultationFees~
    +report(professionalId, from, to) Promise~EarningsReport~
  }
  class FeesViewModel {
    +toDto(fees)$ ConsultationFeesDto
  }
  class GetAppointmentPresenter {
    <<Presenter>>
    -agenda: AppointmentService
    #execute(input) Promise~AppointmentDto~
  }
  class GetConsultationFeesPresenter {
    <<Presenter>>
    -earnings: EarningsService
    #execute(actor) Promise~ConsultationFeesDto~
  }
  class GetEarningsReportPresenter {
    <<Presenter>>
    -earnings: EarningsService
    #execute(actor,from,to) Promise~EarningsReportDto~
  }
  class ListAppointmentsPresenter {
    <<Presenter>>
    -agenda: AppointmentService
    #execute(input) Promise~AppointmentPageDto~
  }
  class MongooseAgendaLock {
    <<Adapter>>
    -context: TransactionContext
    +acquire(professionalId) Promise~void~
  }
  class MongooseAppointmentRepository {
    <<Repository, Adapter>>
    -timezone: string
    +findOwned(professionalId, id) Promise~Appointment | null~
    +findStartingBetween(professionalId, from, to, page) Promise~Page~Appointment~~
    +findScheduledOverlapping(professionalId, startsAt, endsAt) Promise~Appointment[]~
    +findNeedingReminder(from, to, limit) Promise~Appointment[]~
    +earnings(professionalId, from, to, now) Promise~EarningsRow[]~
  }
  class MongooseConsultationFeesRepository {
    <<Repository, Adapter>>
  }
  class MonthRange {
    <<Value Object>>
    +MAX_MONTHS$
    +from: string
    +to: string
    +months: string[]
    +of(from, to)$ MonthRange
    +window: object
    +includes(month) boolean
  }
  class NotificationAppointmentNotifier {
    <<Adapter>>
    -patients: PatientDirectory
    -notifications: NotificationCenter
    -dates: DateFormatter
    -logger: AppLogger
    +notify(event, appointment) Promise~void~
  }
  class PatientDirectoryNames {
    <<Adapter>>
    -directory: PatientDirectory
    +exists(professionalId, patientId) Promise~boolean~
    +fullNames(professionalId, patientIds) Promise~Map~string, string~~
  }
  class PatientNames {
    <<abstract>>
    +exists(professionalId, patientId)* Promise~boolean~
    +fullNames(professionalId, patientIds)* Promise~Map~string, string~~
  }
  class RescheduleAppointmentPresenter {
    <<Presenter>>
    -agenda: AppointmentService
    #execute(input) Promise~AppointmentDto~
  }
  class ScheduleAppointmentPresenter {
    <<Presenter>>
    -agenda: AppointmentService
    #execute(actor,data) Promise~AppointmentDto~
  }
  class UpdateConsultationFeesPresenter {
    <<Presenter>>
    -earnings: EarningsService
    #execute(actor,data,) Promise~ConsultationFeesDto~
  }
  class AuditTrail {
    <<external>>
  }
  class AuthGuard {
    <<external>>
  }
  class Clock {
    <<external>>
  }
  class DateFormatter {
    <<external>>
  }
  class Entity {
    <<external>>
  }
  class IdGenerator {
    <<external>>
  }
  class MongooseRepository {
    <<external>>
  }
  class NotificationCenter {
    <<external>>
  }
  class PatientDirectory {
    <<external>>
  }
  class Presenter {
    <<external>>
  }
  class Repository {
    <<external>>
  }
  class TransactionContext {
    <<external>>
  }
  class TransactionManager {
    <<external>>
  }
  AgendaLock <|.. MongooseAgendaLock
  AppointmentBooking --> AppointmentService
  AppointmentDirectory --> AppointmentRepository
  AppointmentNotifier <|-- NotificationAppointmentNotifier
  AppointmentRepository <|.. MongooseAppointmentRepository
  AppointmentRoutes --> AuthGuard
  AppointmentService --> AgendaLock
  AppointmentService --> AppointmentNotifier
  AppointmentService --> AppointmentRepository
  AppointmentService --> AuditTrail
  AppointmentService --> Clock
  AppointmentService --> ConsultationFeesRepository
  AppointmentService --> IdGenerator
  AppointmentService --> PatientNames
  AppointmentService --> TransactionManager
  AppointmentsModule --> AppointmentBooking
  AppointmentsModule --> AppointmentDirectory
  CancelAppointmentPresenter --> AppointmentService
  ConsultationFeesRepository <|.. MongooseConsultationFeesRepository
  EarningsService --> AppointmentRepository
  EarningsService --> AuditTrail
  EarningsService --> Clock
  EarningsService --> ConsultationFeesRepository
  EarningsService --> TransactionManager
  Entity <|-- Appointment
  Entity <|-- ConsultationFees
  GetAppointmentPresenter --> AppointmentService
  GetConsultationFeesPresenter --> EarningsService
  GetEarningsReportPresenter --> EarningsService
  ListAppointmentsPresenter --> AppointmentService
  MongooseAgendaLock --> TransactionContext
  MongooseAppointmentRepository --> TransactionContext
  MongooseConsultationFeesRepository --> TransactionContext
  MongooseRepository <|-- MongooseAppointmentRepository
  MongooseRepository <|-- MongooseConsultationFeesRepository
  NotificationAppointmentNotifier --> DateFormatter
  NotificationAppointmentNotifier --> NotificationCenter
  NotificationAppointmentNotifier --> PatientDirectory
  PatientDirectoryNames --> PatientDirectory
  PatientNames <|-- PatientDirectoryNames
  Presenter <|-- CancelAppointmentPresenter
  Presenter <|-- GetAppointmentPresenter
  Presenter <|-- GetConsultationFeesPresenter
  Presenter <|-- GetEarningsReportPresenter
  Presenter <|-- ListAppointmentsPresenter
  Presenter <|-- RescheduleAppointmentPresenter
  Presenter <|-- ScheduleAppointmentPresenter
  Presenter <|-- UpdateConsultationFeesPresenter
  Repository <|-- AppointmentRepository
  Repository <|-- ConsultationFeesRepository
  RescheduleAppointmentPresenter --> AppointmentService
  ScheduleAppointmentPresenter --> AppointmentService
  UpdateConsultationFeesPresenter --> EarningsService
```

## API module: audit

11 classes.

```mermaid
classDiagram
  direction LR
  class AuditEvent {
    <<Entity>>
    +ACTION_PATTERN$
    +occur(id, props)$ AuditEvent
    +restore(id, props)$ AuditEvent
    +categoryOf(action)$ string
    +professionalId: string
    +actor: AuditActor
    +action: string
    +category: string
    +targetType: string | null
    +targetId: string | null
    +details: Record~string, AuditDetailValue~
    +origin: AuditOrigin | null
    +occurredAt: Date
  }
  class AuditEventMapper {
    <<Data Mapper>>
    +toDomain(record) AuditEvent
    +toPersistence(event) AuditEventDocument
  }
  class AuditEventRepository {
    <<abstract · Repository>>
    +search(professionalId, filter, page)* Promise~Page~AuditEvent~~
  }
  class AuditLog {
    <<Adapter>>
    -events: AuditEventRepository
    -origins: RequestOriginSource
    -clock: Clock
    -ids: IdGenerator
    +record(entry) Promise~void~
  }
  class AuditModule {
    <<Composition Root, Abstract Factory>>
    +basePath
    +trail: AuditTrail
    -deps: AuditModuleDependencies
    +registerContracts(registry) void
    +requestHandlers() RequestHandler[]
    +createRouter() Router
    +listAuditEvents(view) ListAuditEventsPresenter
  }
  class AuditRoutes {
    -presenters: AuditPresenterFactory
    -guard: AuthGuard
    +build() Router
  }
  class AuditService {
    -events: AuditEventRepository
    +list(professionalId, query, page) Promise~Page~AuditEvent~~
  }
  class ListAuditEventsPresenter {
    <<Presenter>>
    -audit: AuditService
    #execute(actor,query) Promise~AuditEventPageDto~
  }
  class MongooseAuditEventRepository {
    <<Repository, Adapter>>
    +save(event) Promise~void~
    +search(professionalId, filter, page) Promise~Page~AuditEvent~~
  }
  class RequestOriginContextSource {
    <<Adapter>>
    -context: RequestOriginContext
    +current() AuditOrigin | null
  }
  class RequestOriginSource {
    <<abstract>>
    +current()* AuditOrigin | null
  }
  class AuditTrail {
    <<external>>
  }
  class AuthGuard {
    <<external>>
  }
  class Clock {
    <<external>>
  }
  class Entity {
    <<external>>
  }
  class IdGenerator {
    <<external>>
  }
  class MongooseRepository {
    <<external>>
  }
  class Presenter {
    <<external>>
  }
  class Repository {
    <<external>>
  }
  class RequestOriginContext {
    <<external>>
  }
  class TransactionContext {
    <<external>>
  }
  AuditEventRepository <|.. MongooseAuditEventRepository
  AuditLog --> AuditEventRepository
  AuditLog --> Clock
  AuditLog --> IdGenerator
  AuditLog --> RequestOriginSource
  AuditModule --> AuditTrail
  AuditRoutes --> AuthGuard
  AuditService --> AuditEventRepository
  AuditTrail <|-- AuditLog
  Entity <|-- AuditEvent
  ListAuditEventsPresenter --> AuditService
  MongooseAuditEventRepository --> TransactionContext
  MongooseRepository <|-- MongooseAuditEventRepository
  Presenter <|-- ListAuditEventsPresenter
  Repository <|-- AuditEventRepository
  RequestOriginContextSource --> RequestOriginContext
  RequestOriginSource <|-- RequestOriginContextSource
```

## API module: Auth and account (CU-01, CU-02, CU-03, CU-16, CU-17)

40 classes.

```mermaid
classDiagram
  direction LR
  class AuthModule {
    <<Composition Root, Abstract Factory>>
    +basePath
    +directory: ProfessionalDirectory
    -deps: AuthModuleDependencies
    +registerContracts(registry) void
    +createRouter() Router
    +migrations() DataMigration[]
    +registerProfessional(view) RegisterProfessionalPresenter
    +login(view) LoginPresenter
    +logout(view) LogoutPresenter
    +getCurrentProfessional(view) GetCurrentProfessionalPresenter
    +requestPasswordRecovery(view) RequestPasswordRecoveryPresenter
    +verifyRecoveryCode(view) VerifyRecoveryCodePresenter
    +resetPassword(view) ResetPasswordPresenter
    +changePassword(view) ChangePasswordPresenter
    +updateProfile(view) UpdateProfilePresenter
    +getLogo(view) GetLogoPresenter
    +uploadLogo(view) UploadLogoPresenter
    +removeLogo(view) RemoveLogoPresenter
  }
  class AuthRoutes {
    -presenters: AuthPresenterFactory
    -guard: AuthGuard
    -cookie: SessionCookie
    -limiter: RateLimiter
    +build() Router
  }
  class AuthService {
    -professionals: ProfessionalRepository
    -access: ProfessionalAccess
    -transactions: TransactionManager
    -hasher: PasswordHasher
    -tokens: TokenService
    -clock: Clock
    -ids: IdGenerator
    -audit: AuditTrail
    +now: Date
    +register(data) Promise~SessionSubject~
    +authenticate(email, password) Promise~SessionSubject~
    +logout(professionalId) Promise~void~
    +getSession(professionalId, credentialsVersion) Promise~SessionSubject~
    +getProfessional(professionalId) Promise~Professional~
    +changePassword(professionalId, currentPassword, newPassword) Promise~SessionSubject~
    +issueSessionToken(professional,access) Promise~string~
    +assertUnique(email, licenseNumber, ownerId) Promise~void~
    +contactOf(professional)$ object
  }
  class ChangePasswordPresenter {
    <<Presenter>>
    -auth: AuthService
    #execute(input) Promise~SessionResult~
  }
  class CryptoRecoveryCodeGenerator {
    <<Adapter>>
    +generate() string
  }
  class EmailPasswordRecoveryNotifier {
    <<Adapter>>
    -mail: MailTransport
    -dates: DateFormatter
    -recoveryUrl: string
    -logger: AppLogger
    +sendCode(message) Promise~void~
  }
  class GetCurrentProfessionalPresenter {
    <<Presenter>>
    -auth: AuthService
    #execute(actor) Promise~SessionResult~
  }
  class GetLogoPresenter {
    <<Presenter>>
    -profiles: ProfileService
    #execute(actor) Promise~LogoDto~
  }
  class LegacySubscriptionMigration {
    -subscriptions: SubscriptionAccess
    -logger: AppLogger
    +run() Promise~number~
  }
  class LoginPresenter {
    <<Presenter>>
    -auth: AuthService
    #execute(input) Promise~SessionResult~
  }
  class LogoRepository {
    <<abstract · Repository>>
    +find(professionalId)* Promise~ProfessionalLogo | null~
    +save(professionalId, logo, at)* Promise~void~
    +delete(professionalId)* Promise~void~
  }
  class LogoutHttpView {
    <<Passive View>>
    -cookie: SessionCookie
    +render() void
  }
  class LogoutPresenter {
    <<Presenter>>
    -auth: AuthService
    #execute(actor) Promise~void~
  }
  class MongooseLogoRepository {
    <<Repository, Adapter>>
    -context: TransactionContext
    +find(professionalId) Promise~ProfessionalLogo | null~
    +save(professionalId, logo, at) Promise~void~
    +delete(professionalId) Promise~void~
  }
  class MongoosePasswordRecoveryRepository {
    <<Repository, Adapter>>
    +findLatestUnused(professionalId) Promise~PasswordRecovery | null~
  }
  class MongooseProfessionalRepository {
    <<Repository, Adapter>>
    +findByEmail(email) Promise~Professional | null~
    +findByLicenseNumber(licenseNumber) Promise~Professional | null~
  }
  class PasswordPolicy {
    +MIN_LENGTH$
    +unmetCriteria(password)$ string[]
    +assertSatisfiedBy(password, field)$ void
  }
  class PasswordRecovery {
    <<Aggregate Root>>
    +TTL_MINUTES$
    +MAX_ATTEMPTS$
    +issue(id, professionalId, codeHash, now)$ PasswordRecovery
    +restore(id, props)$ PasswordRecovery
    +isUsableAt(now) boolean
    +recordFailedAttempt() void
    +invalidate(now) void
    +professionalId: string
    +codeHash: string
    +expiresAt: Date
    +failedAttempts: number
    +usedAt: Date | null
    +createdAt: Date
  }
  class PasswordRecoveryMapper {
    <<Data Mapper>>
    +toDomain(record) PasswordRecovery
    +toPersistence(recovery) PasswordRecoveryDocument
  }
  class PasswordRecoveryNotifier {
    <<abstract>>
    +sendCode(message)* Promise~void~
  }
  class PasswordRecoveryRepository {
    <<abstract · Repository>>
    +findLatestUnused(professionalId)* Promise~PasswordRecovery | null~
  }
  class PasswordRecoveryService {
    -professionals: ProfessionalRepository
    -recoveries: PasswordRecoveryRepository
    -codes: RecoveryCodeGenerator
    -hasher: PasswordHasher
    -notifier: PasswordRecoveryNotifier
    -transactions: TransactionManager
    -clock: Clock
    -ids: IdGenerator
    -audit: AuditTrail
    +request(email) Promise~void~
    +verify(email, code) Promise~void~
    +reset(email, code, newPassword) Promise~void~
    +invalidCode()$ ValidationError
  }
  class Professional {
    <<Aggregate Root>>
    +register(id, data, now)$ Professional
    +restore(id, props)$ Professional
    +normalizeEmail(email)$ string
    +normalizeLicense(licenseNumber)$ string
    +updateProfile(profile, now) void
    +changePasswordHash(passwordHash, now) void
    +markLogo(updatedAt, now) void
    +email: string
    +phone: string
    +licenseNumber: string
    +specialty: string
    +offices: string[]
    +passwordHash: string
    +passwordChangedAt: Date | null
    +credentialsVersion: number
    +logoUpdatedAt: Date | null
    +hasLogo: boolean
    +registeredAt: Date
    +updatedAt: Date
  }
  class ProfessionalAccess {
    <<abstract>>
    +startTrial(professionalId, contact)* Promise~AccessState~
    +accessOf(professionalId)* Promise~AccessState | null~
    +updateContact(professionalId, contact)* Promise~void~
  }
  class ProfessionalDirectory {
    -professionals: ProfessionalRepository
    +publicProfile(professionalId) Promise~PublicProfessionalProfile | null~
  }
  class ProfessionalLogo {
    <<Value Object>>
    +MAX_BYTES$
    +ACCEPTED$
    +fromDataUrl(dataUrl)$ ProfessionalLogo
    +restore(mimeType, base64)$ ProfessionalLogo
    +mimeType: LogoMimeType
    +base64: string
    +toDataUrl() string
  }
  class ProfessionalMapper {
    <<Data Mapper>>
    +toDomain(record) Professional
    +toPersistence(entity) ProfessionalDocument
  }
  class ProfessionalRepository {
    <<abstract · Repository>>
    +findByEmail(email)* Promise~Professional | null~
    +findByLicenseNumber(licenseNumber)* Promise~Professional | null~
  }
  class ProfileService {
    -auth: AuthService
    -professionals: ProfessionalRepository
    -logos: LogoRepository
    -access: ProfessionalAccess
    -transactions: TransactionManager
    -clock: Clock
    -audit: AuditTrail
    +updateProfile(professionalId, profile) Promise~SessionSubject~
    +uploadLogo(professionalId, dataUrl) Promise~void~
    +removeLogo(professionalId) Promise~void~
    +getLogo(professionalId) Promise~ProfessionalLogo | null~
  }
  class RecoveryCodeGenerator {
    <<abstract>>
    +generate()* string
  }
  class RegisterProfessionalPresenter {
    <<Presenter>>
    -auth: AuthService
    #execute(input) Promise~SessionResult~
  }
  class RemoveLogoPresenter {
    <<Presenter>>
    -profiles: ProfileService
    #execute(input) Promise~void~
  }
  class RequestPasswordRecoveryPresenter {
    <<Presenter>>
    -recovery: PasswordRecoveryService
    #execute(input) Promise~RecoveryRequestedDto~
  }
  class ResetPasswordPresenter {
    <<Presenter>>
    -recovery: PasswordRecoveryService
    #execute(input) Promise~void~
  }
  class SessionHttpView {
    <<Passive View>>
    -cookie: SessionCookie
    #successStatus: number
    +render(viewModel) void
  }
  class SessionViewModel {
    +from(professional,access)$ SessionDto
  }
  class SubscriptionAccessAdapter {
    <<Adapter>>
    -subscriptions: SubscriptionAccess
    +startTrial(professionalId, contact) Promise~AccessState~
    +accessOf(professionalId) Promise~AccessState | null~
    +updateContact(professionalId, contact) Promise~void~
  }
  class UpdateProfilePresenter {
    <<Presenter>>
    -profiles: ProfileService
    #execute(actor,data) Promise~SessionDto~
  }
  class UploadLogoPresenter {
    <<Presenter>>
    -profiles: ProfileService
    #execute(input) Promise~void~
  }
  class VerifyRecoveryCodePresenter {
    <<Presenter>>
    -recovery: PasswordRecoveryService
    #execute(input) Promise~void~
  }
  class AuditTrail {
    <<external>>
  }
  class AuthGuard {
    <<external>>
  }
  class Clock {
    <<external>>
  }
  class DateFormatter {
    <<external>>
  }
  class Entity {
    <<external>>
  }
  class HttpView {
    <<external>>
  }
  class IdGenerator {
    <<external>>
  }
  class MailTransport {
    <<external>>
  }
  class MongooseRepository {
    <<external>>
  }
  class PasswordHasher {
    <<external>>
  }
  class Person {
    <<external>>
  }
  class Presenter {
    <<external>>
  }
  class RateLimiter {
    <<external>>
  }
  class Repository {
    <<external>>
  }
  class SessionCookie {
    <<external>>
  }
  class SubscriptionAccess {
    <<external>>
  }
  class TokenService {
    <<external>>
  }
  class TransactionContext {
    <<external>>
  }
  class TransactionManager {
    <<external>>
  }
  class ValueObject {
    <<external>>
  }
  AuthModule --> ProfessionalDirectory
  AuthRoutes --> AuthGuard
  AuthRoutes --> RateLimiter
  AuthRoutes --> SessionCookie
  AuthService --> AuditTrail
  AuthService --> Clock
  AuthService --> IdGenerator
  AuthService --> PasswordHasher
  AuthService --> ProfessionalAccess
  AuthService --> ProfessionalRepository
  AuthService --> TokenService
  AuthService --> TransactionManager
  ChangePasswordPresenter --> AuthService
  EmailPasswordRecoveryNotifier --> DateFormatter
  EmailPasswordRecoveryNotifier --> MailTransport
  Entity <|-- PasswordRecovery
  GetCurrentProfessionalPresenter --> AuthService
  GetLogoPresenter --> ProfileService
  HttpView <|-- LogoutHttpView
  HttpView <|-- SessionHttpView
  LegacySubscriptionMigration --> SubscriptionAccess
  LoginPresenter --> AuthService
  LogoRepository <|-- MongooseLogoRepository
  LogoutHttpView --> SessionCookie
  LogoutPresenter --> AuthService
  MongooseLogoRepository --> TransactionContext
  MongoosePasswordRecoveryRepository --> TransactionContext
  MongooseProfessionalRepository --> TransactionContext
  MongooseRepository <|-- MongoosePasswordRecoveryRepository
  MongooseRepository <|-- MongooseProfessionalRepository
  PasswordRecoveryNotifier <|-- EmailPasswordRecoveryNotifier
  PasswordRecoveryRepository <|.. MongoosePasswordRecoveryRepository
  PasswordRecoveryService --> AuditTrail
  PasswordRecoveryService --> Clock
  PasswordRecoveryService --> IdGenerator
  PasswordRecoveryService --> PasswordHasher
  PasswordRecoveryService --> PasswordRecoveryNotifier
  PasswordRecoveryService --> PasswordRecoveryRepository
  PasswordRecoveryService --> ProfessionalRepository
  PasswordRecoveryService --> RecoveryCodeGenerator
  PasswordRecoveryService --> TransactionManager
  Person <|-- Professional
  Presenter <|-- ChangePasswordPresenter
  Presenter <|-- GetCurrentProfessionalPresenter
  Presenter <|-- GetLogoPresenter
  Presenter <|-- LoginPresenter
  Presenter <|-- LogoutPresenter
  Presenter <|-- RegisterProfessionalPresenter
  Presenter <|-- RemoveLogoPresenter
  Presenter <|-- RequestPasswordRecoveryPresenter
  Presenter <|-- ResetPasswordPresenter
  Presenter <|-- UpdateProfilePresenter
  Presenter <|-- UploadLogoPresenter
  Presenter <|-- VerifyRecoveryCodePresenter
  ProfessionalAccess <|-- SubscriptionAccessAdapter
  ProfessionalDirectory --> ProfessionalRepository
  ProfessionalRepository <|.. MongooseProfessionalRepository
  ProfileService --> AuditTrail
  ProfileService --> AuthService
  ProfileService --> Clock
  ProfileService --> LogoRepository
  ProfileService --> ProfessionalAccess
  ProfileService --> ProfessionalRepository
  ProfileService --> TransactionManager
  RecoveryCodeGenerator <|-- CryptoRecoveryCodeGenerator
  RegisterProfessionalPresenter --> AuthService
  RemoveLogoPresenter --> ProfileService
  Repository <|-- PasswordRecoveryRepository
  Repository <|-- ProfessionalRepository
  RequestPasswordRecoveryPresenter --> PasswordRecoveryService
  ResetPasswordPresenter --> PasswordRecoveryService
  SessionHttpView --> SessionCookie
  SubscriptionAccessAdapter --> SubscriptionAccess
  UpdateProfilePresenter --> ProfileService
  UploadLogoPresenter --> ProfileService
  ValueObject <|-- ProfessionalLogo
  VerifyRecoveryCodePresenter --> PasswordRecoveryService
```

## API module: booking

31 classes.

```mermaid
classDiagram
  direction LR
  class AcceptBookingRequestPresenter {
    <<Presenter>>
    -booking: BookingService
    #execute(actor,requestId,data,) Promise~BookingRequestDto~
  }
  class AgendaBooking {
    <<abstract>>
    +busyIntervals(professionalId, from, to)* Promise~Interval[]~
    +book(professionalId, patientId, slot)* Promise~string~
    +confirm(professionalId, appointmentId)* Promise~void~
  }
  class AppointmentAgendaBooking {
    <<Adapter>>
    -appointments: AppointmentBooking
    +busyIntervals(professionalId, from, to) Promise~Interval[]~
    +book(professionalId, patientId, slot) Promise~string~
    +confirm(professionalId, appointmentId) Promise~void~
  }
  class AuthPracticeDirectory {
    <<Adapter>>
    -professionals: ProfessionalDirectory
    -access: SubscriptionAccess
    +profile(professionalId) Promise~PracticeProfile | null~
    +hasAccess(professionalId) Promise~boolean~
  }
  class BookingModule {
    <<Composition Root, Abstract Factory>>
    +basePath
    -deps: BookingModuleDependencies
    +registerContracts(registry) void
    +createRouter() Router
    +scheduledJobs() ScheduledJob[]
    +getBookingSettings(view) GetBookingSettingsPresenter
    +updateBookingSettings(view) UpdateBookingSettingsPresenter
    +listBookingRequests(view) ListBookingRequestsPresenter
    +acceptBookingRequest(view) AcceptBookingRequestPresenter
    +rejectBookingRequest(view) RejectBookingRequestPresenter
    +getPublicBookingPage(view) GetPublicBookingPagePresenter
    +getAvailableSlots(view) GetAvailableSlotsPresenter
    +createBookingRequest(view) CreateBookingRequestPresenter
  }
  class BookingNotifier {
    <<abstract>>
    +rejected(request, professionalName)* Promise~void~
  }
  class BookingPage {
    <<Aggregate Root>>
    +DEFAULTS: BookingSettings$
    +open(professionalId, slug, now)$ BookingPage
    +restore(professionalId, props)$ BookingPage
    +slugFor(fullName, suffix)$ string
    +configure(settings, now) void
    +windowsOn(weekday) WeeklyWindow[]
    +allows(modality) boolean
    +professionalId: string
    +slug: string
    +settings: BookingSettings
    +enabled: boolean
    +slotMinutes: number
    +minNoticeHours: number
    +horizonDays: number
    +modalities: BookingModality[]
    +instructions: string | null
    +updatedAt: Date
  }
  class BookingPageMapper {
    <<Data Mapper>>
    +toDomain(record) BookingPage
    +toPersistence(page) BookingPageDocument
  }
  class BookingPageRepository {
    <<abstract · Repository>>
    +findBySlug(slug)* Promise~BookingPage | null~
  }
  class BookingRequest {
    <<Aggregate Root>>
    +submit(id, professionalId, data, now)$ BookingRequest
    +restore(id, props)$ BookingRequest
    +normalizeDni(dni)$ string
    +accept(patientId, appointmentId, now) void
    +reject(reason, now) void
    +expireIfPast(now) boolean
    +professionalId: string
    +requester: Requester
    +requesterName: string
    +startsAt: Date
    +endsAt: Date
    +durationMinutes: number
    +modality: BookingModality
    +reason: string | null
    +status: BookingRequestStatus
    +isPending: boolean
    +patientId: string | null
    +appointmentId: string | null
    +rejectionReason: string | null
    +createdAt: Date
    +decidedAt: Date | null
  }
  class BookingRequestMapper {
    <<Data Mapper>>
    +toDomain(record) BookingRequest
    +toPersistence(request) BookingRequestDocument
  }
  class BookingRequestRepository {
    <<abstract · Repository>>
    +findOwned(professionalId, id)* Promise~BookingRequest | null~
    +findPendingBetween(professionalId, from, to)* Promise~BookingRequest[]~
    +countPendingByDni(professionalId, dni)* Promise~number~
    +list(professionalId, status, page)* Promise~Page~BookingRequest~~
    +findExpirable(now, limit)* Promise~BookingRequest[]~
  }
  class BookingRoutes {
    -presenters: BookingPresenterFactory
    -guard: AuthGuard
    -limiter: RateLimiter
    +build() Router
  }
  class BookingService {
    -pages: BookingPageRepository
    -requests: BookingRequestRepository
    -practices: PracticeDirectory
    -patients: PatientRegistry
    -agenda: AgendaBooking
    -notifier: BookingNotifier
    -calendar: LocalCalendar
    -transactions: TransactionManager
    -clock: Clock
    -ids: IdGenerator
    -audit: AuditTrail
    +timezone: string
    +settings(professionalId) Promise~BookingPage~
    +configure(professionalId, settings) Promise~BookingPage~
    +publicPage(slug) Promise~PublicBookingPage~
    +availability(slug, from, days) Promise~DaySlots[]~
    +request(slug, data) Promise~BookingRequest~
    +list(professionalId, status, page) Promise~Page~RequestEntry~~
    +accept(professionalId, requestId, decision) Promise~RequestEntry~
    +reject(professionalId, requestId, reason) Promise~RequestEntry~
    +expirePast() Promise~number~
  }
  class BookingViewModel {
    +settings(page, timezone)$ BookingSettingsDto
    +publicPage(page,profile, timezone)$ PublicBookingPageDto
    +request(request,existingPatientId)$ BookingRequestDto
  }
  class CreateBookingRequestPresenter {
    <<Presenter>>
    -booking: BookingService
    #execute(slug,data) Promise~BookingReceiptDto~
  }
  class EmailBookingNotifier {
    <<Adapter>>
    -mail: MailTransport
    -dates: DateFormatter
    -logger: AppLogger
    +rejected(request, professionalName) Promise~void~
  }
  class GetAvailableSlotsPresenter {
    <<Presenter>>
    -booking: BookingService
    #execute(slug,from,days,) Promise~AvailableSlotsDto~
  }
  class GetBookingSettingsPresenter {
    <<Presenter>>
    -booking: BookingService
    #execute(actor) Promise~BookingSettingsDto~
  }
  class GetPublicBookingPagePresenter {
    <<Presenter>>
    -booking: BookingService
    #execute(slug) Promise~PublicBookingPageDto~
  }
  class IntlLocalCalendar {
    <<Adapter>>
    +timezone: string
    +dateOf(instant) string
    +instantOf(date, time) Date
  }
  class ListBookingRequestsPresenter {
    <<Presenter>>
    -booking: BookingService
    #execute(input) Promise~BookingRequestPageDto~
  }
  class LocalCalendar {
    <<abstract>>
    +timezone: string
    +dateOf(instant)* string
    +instantOf(date, time)* Date
    +weekdayOf(date)$ IsoWeekday
    +addDays(date, days)$ string
  }
  class MongooseBookingPageRepository {
    <<Repository, Adapter>>
    +findBySlug(slug) Promise~BookingPage | null~
  }
  class MongooseBookingRequestRepository {
    <<Repository, Adapter>>
    +findOwned(professionalId, id) Promise~BookingRequest | null~
    +findPendingBetween(professionalId, from, to) Promise~BookingRequest[]~
    +countPendingByDni(professionalId, dni) Promise~number~
    +list(professionalId, status, page) Promise~Page~BookingRequest~~
    +findExpirable(now, limit) Promise~BookingRequest[]~
  }
  class PatientIntakeRegistry {
    <<Adapter>>
    -intake: PatientIntake
    +findIdByDni(professionalId, dni) Promise~string | null~
    +register(professionalId, requester) Promise~string~
  }
  class PatientRegistry {
    <<abstract>>
    +findIdByDni(professionalId, dni)* Promise~string | null~
    +register(professionalId, requester)* Promise~string~
  }
  class PracticeDirectory {
    <<abstract>>
    +profile(professionalId)* Promise~PracticeProfile | null~
    +hasAccess(professionalId)* Promise~boolean~
  }
  class RejectBookingRequestPresenter {
    <<Presenter>>
    -booking: BookingService
    #execute(actor,requestId,data,) Promise~BookingRequestDto~
  }
  class SlotPlanner {
    <<Strategy>>
    -calendar: LocalCalendar
    +bounds(page, now) Interval
    +plan(page, now, from, days, busy) DaySlots[]
    +isAvailable(page, now, startsAt, busy) boolean
    +overlaps(a, b)$ boolean
  }
  class UpdateBookingSettingsPresenter {
    <<Presenter>>
    -booking: BookingService
    #execute(actor,data,) Promise~BookingSettingsDto~
  }
  class AppointmentBooking {
    <<external>>
  }
  class AuditTrail {
    <<external>>
  }
  class AuthGuard {
    <<external>>
  }
  class Clock {
    <<external>>
  }
  class DateFormatter {
    <<external>>
  }
  class Entity {
    <<external>>
  }
  class IdGenerator {
    <<external>>
  }
  class MailTransport {
    <<external>>
  }
  class MongooseRepository {
    <<external>>
  }
  class PatientIntake {
    <<external>>
  }
  class Presenter {
    <<external>>
  }
  class ProfessionalDirectory {
    <<external>>
  }
  class RateLimiter {
    <<external>>
  }
  class Repository {
    <<external>>
  }
  class SubscriptionAccess {
    <<external>>
  }
  class TransactionContext {
    <<external>>
  }
  class TransactionManager {
    <<external>>
  }
  AcceptBookingRequestPresenter --> BookingService
  AgendaBooking <|-- AppointmentAgendaBooking
  AppointmentAgendaBooking --> AppointmentBooking
  AuthPracticeDirectory --> ProfessionalDirectory
  AuthPracticeDirectory --> SubscriptionAccess
  BookingNotifier <|-- EmailBookingNotifier
  BookingPageRepository <|.. MongooseBookingPageRepository
  BookingRequestRepository <|.. MongooseBookingRequestRepository
  BookingRoutes --> AuthGuard
  BookingRoutes --> RateLimiter
  BookingService --> AgendaBooking
  BookingService --> AuditTrail
  BookingService --> BookingNotifier
  BookingService --> BookingPageRepository
  BookingService --> BookingRequestRepository
  BookingService --> Clock
  BookingService --> IdGenerator
  BookingService --> LocalCalendar
  BookingService --> PatientRegistry
  BookingService --> PracticeDirectory
  BookingService --> TransactionManager
  CreateBookingRequestPresenter --> BookingService
  EmailBookingNotifier --> DateFormatter
  EmailBookingNotifier --> MailTransport
  Entity <|-- BookingPage
  Entity <|-- BookingRequest
  GetAvailableSlotsPresenter --> BookingService
  GetBookingSettingsPresenter --> BookingService
  GetPublicBookingPagePresenter --> BookingService
  ListBookingRequestsPresenter --> BookingService
  LocalCalendar <|-- IntlLocalCalendar
  MongooseBookingPageRepository --> TransactionContext
  MongooseBookingRequestRepository --> TransactionContext
  MongooseRepository <|-- MongooseBookingPageRepository
  MongooseRepository <|-- MongooseBookingRequestRepository
  PatientIntakeRegistry --> PatientIntake
  PatientRegistry <|-- PatientIntakeRegistry
  PracticeDirectory <|-- AuthPracticeDirectory
  Presenter <|-- AcceptBookingRequestPresenter
  Presenter <|-- CreateBookingRequestPresenter
  Presenter <|-- GetAvailableSlotsPresenter
  Presenter <|-- GetBookingSettingsPresenter
  Presenter <|-- GetPublicBookingPagePresenter
  Presenter <|-- ListBookingRequestsPresenter
  Presenter <|-- RejectBookingRequestPresenter
  Presenter <|-- UpdateBookingSettingsPresenter
  RejectBookingRequestPresenter --> BookingService
  Repository <|-- BookingPageRepository
  Repository <|-- BookingRequestRepository
  SlotPlanner --> LocalCalendar
  UpdateBookingSettingsPresenter --> BookingService
```

## API module: Clinical records (CU-07, CU-08, CU-09)

25 classes.

```mermaid
classDiagram
  direction LR
  class AssignedDiagnosis {
    <<Value Object>>
    +assign(code, name, at)$ AssignedDiagnosis
    +code: string
    +name: string
    +assignedAt: Date
  }
  class CatalogDiagnosisResolver {
    <<Adapter>>
    -catalog: DiagnosisCatalog
    +resolve(code) Promise~ResolvedDiagnosis | null~
  }
  class ClinicalActivityBackfill {
    -recorder: ClinicalActivityRecorder
    +run() Promise~number~
  }
  class ClinicalActivityRecorder {
    <<abstract>>
    +record(professionalId, patientId, at)* Promise~void~
  }
  class ClinicalRecord {
    <<Aggregate Root>>
    +open(id, professionalId, patientId, now)$ ClinicalRecord
    +restore(id, props)$ ClinicalRecord
    +addConsultation(consultation, now) void
    +consultationsChronological() Consultation[]
    +findConsultation(consultationId) Consultation | null
    +diagnosisHistory() DiagnosisHistoryEntry[]
    +professionalId: string
    +patientId: string
    +openedAt: Date
    +updatedAt: Date
    +consultations: Consultation[]
  }
  class ClinicalRecordMapper {
    <<Data Mapper>>
    +toDomain(record) ClinicalRecord
    +toPersistence(record) ClinicalRecordDocument
  }
  class ClinicalRecordRepository {
    <<abstract · Repository>>
    +findByPatient(professionalId, patientId)* Promise~ClinicalRecord | null~
  }
  class ClinicalRecordRoutes {
    -presenters: ClinicalRecordPresenterFactory
    -guard: AuthGuard
    +build() Router
  }
  class ClinicalRecordService {
    -records: ClinicalRecordRepository
    -transactions: TransactionManager
    -patients: PatientLookup
    -activity: ClinicalActivityRecorder
    -diagnoses: DiagnosisResolver
    -clock: Clock
    -accesses: RecordAccessLog
    -ids: IdGenerator
    -trail: AuditTrail
    +getRecord(professionalId, patientId, page) Promise~object~
    +accessLog(professionalId, patientId, page) Promise~Page~RecordAccess~~
    +registerConsultation(professionalId, patientId, data) Promise~Consultation~
    +getConsultation(professionalId, patientId, consultationId) Promise~Consultation~
    +diagnosisHistory(professionalId, patientId, page) Promise~Page~DiagnosisHistoryEntry~~
  }
  class ClinicalRecordsModule {
    <<Composition Root, Abstract Factory>>
    +basePath
    -deps: ClinicalRecordsModuleDependencies
    +registerContracts(registry) void
    +createRouter() Router
    +migrations() DataMigration[]
    +getClinicalRecord(view) GetClinicalRecordPresenter
    +registerConsultation(view) RegisterConsultationPresenter
    +getConsultation(view) GetConsultationPresenter
    +getDiagnosisHistory(view) GetDiagnosisHistoryPresenter
    +listRecordAccess(view) ListRecordAccessPresenter
  }
  class ClinicalRecordViewModel {
    +record(record, consultations)$ ClinicalRecordDto
    +consultation(consultation)$ ConsultationDto
    +diagnosisEntry(entry)$ DiagnosisHistoryEntryDto
  }
  class Consultation {
    <<Entity>>
    +record(id, data, now)$ Consultation
    +restore(id, props)$ Consultation
    +date: Date
    +type: ConsultationType
    +reason: string
    +observations: string | null
    +evolution: string | null
    +diagnosis: AssignedDiagnosis | null
    +medications: Medication[]
    +recordedAt: Date
  }
  class DiagnosisResolver {
    <<abstract>>
    +resolve(code)* Promise~ResolvedDiagnosis | null~
  }
  class GetClinicalRecordPresenter {
    <<Presenter>>
    -records: ClinicalRecordService
    #execute(input) Promise~ClinicalRecordDto~
  }
  class GetConsultationPresenter {
    <<Presenter>>
    -records: ClinicalRecordService
    #execute(input) Promise~ConsultationDto~
  }
  class GetDiagnosisHistoryPresenter {
    <<Presenter>>
    -records: ClinicalRecordService
    #execute(input) Promise~DiagnosisHistoryPageDto~
  }
  class ListRecordAccessPresenter {
    <<Presenter>>
    -records: ClinicalRecordService
    #execute(input) Promise~RecordAccessPageDto~
  }
  class Medication {
    <<Value Object>>
    +prescribe(data, now)$ Medication
    +restore(props)$ Medication
    +name: string
    +dose: string
    +frequency: string
    +duration: string
    +indications: string | null
    +prescribedAt: Date
  }
  class MongooseClinicalRecordRepository {
    <<Repository, Adapter>>
    +findByPatient(professionalId, patientId) Promise~ClinicalRecord | null~
  }
  class MongooseRecordAccessLog {
    <<Adapter>>
    -context: TransactionContext
    +append(access) Promise~void~
    +findByPatient(professionalId, patientId, page) Promise~Page~RecordAccess~~
  }
  class PatientActivityRecorder {
    <<Adapter>>
    -activity: PatientActivity
    +record(professionalId, patientId, at) Promise~void~
  }
  class PatientDirectoryLookup {
    <<Adapter>>
    -directory: PatientDirectory
    +exists(professionalId, patientId) Promise~boolean~
  }
  class PatientLookup {
    <<abstract>>
    +exists(professionalId, patientId)* Promise~boolean~
  }
  class RecordAccessLog {
    <<abstract>>
    +append(access)* Promise~void~
    +findByPatient(professionalId, patientId, page)* Promise~Page~RecordAccess~~
  }
  class RegisterConsultationPresenter {
    <<Presenter>>
    -records: ClinicalRecordService
    #execute(input) Promise~ConsultationDto~
  }
  class AuditTrail {
    <<external>>
  }
  class AuthGuard {
    <<external>>
  }
  class Clock {
    <<external>>
  }
  class DiagnosisCatalog {
    <<external>>
  }
  class Entity {
    <<external>>
  }
  class IdGenerator {
    <<external>>
  }
  class MongooseRepository {
    <<external>>
  }
  class PatientActivity {
    <<external>>
  }
  class PatientDirectory {
    <<external>>
  }
  class Presenter {
    <<external>>
  }
  class Repository {
    <<external>>
  }
  class TransactionContext {
    <<external>>
  }
  class TransactionManager {
    <<external>>
  }
  class ValueObject {
    <<external>>
  }
  CatalogDiagnosisResolver --> DiagnosisCatalog
  ClinicalActivityBackfill --> ClinicalActivityRecorder
  ClinicalActivityRecorder <|-- PatientActivityRecorder
  ClinicalRecordRepository <|.. MongooseClinicalRecordRepository
  ClinicalRecordRoutes --> AuthGuard
  ClinicalRecordService --> AuditTrail
  ClinicalRecordService --> ClinicalActivityRecorder
  ClinicalRecordService --> ClinicalRecordRepository
  ClinicalRecordService --> Clock
  ClinicalRecordService --> DiagnosisResolver
  ClinicalRecordService --> IdGenerator
  ClinicalRecordService --> PatientLookup
  ClinicalRecordService --> RecordAccessLog
  ClinicalRecordService --> TransactionManager
  DiagnosisResolver <|-- CatalogDiagnosisResolver
  Entity <|-- ClinicalRecord
  Entity <|-- Consultation
  GetClinicalRecordPresenter --> ClinicalRecordService
  GetConsultationPresenter --> ClinicalRecordService
  GetDiagnosisHistoryPresenter --> ClinicalRecordService
  ListRecordAccessPresenter --> ClinicalRecordService
  MongooseClinicalRecordRepository --> TransactionContext
  MongooseRecordAccessLog --> TransactionContext
  MongooseRepository <|-- MongooseClinicalRecordRepository
  PatientActivityRecorder --> PatientActivity
  PatientDirectoryLookup --> PatientDirectory
  PatientLookup <|-- PatientDirectoryLookup
  Presenter <|-- GetClinicalRecordPresenter
  Presenter <|-- GetConsultationPresenter
  Presenter <|-- GetDiagnosisHistoryPresenter
  Presenter <|-- ListRecordAccessPresenter
  Presenter <|-- RegisterConsultationPresenter
  RecordAccessLog <|.. MongooseRecordAccessLog
  RegisterConsultationPresenter --> ClinicalRecordService
  Repository <|-- ClinicalRecordRepository
  ValueObject <|-- AssignedDiagnosis
  ValueObject <|-- Medication
```

## API module: Diagnosis catalog

9 classes.

```mermaid
classDiagram
  direction LR
  class DiagnosisCatalog {
    -entries: DiagnosisCatalogRepository
    +search(term, category, page) Promise~Page~DiagnosisCatalogEntry~~
    +findActive(code) Promise~DiagnosisCatalogEntry | null~
  }
  class DiagnosisCatalogEntry {
    <<Entity>>
    +restore(code, props)$ DiagnosisCatalogEntry
    +code: string
    +name: string
    +category: string
    +active: boolean
  }
  class DiagnosisCatalogModule {
    <<Composition Root, Abstract Factory>>
    +basePath
    +catalog: DiagnosisCatalog
    -deps: DiagnosisCatalogModuleDependencies
    +registerContracts(registry) void
    +createRouter() Router
    +onBootstrap() Promise~void~
    +searchDiagnoses(view) SearchDiagnosesPresenter
  }
  class DiagnosisCatalogRepository {
    <<abstract · Repository>>
    +search(criteria)* Promise~Page~DiagnosisCatalogEntry~~
    +findByCode(code)* Promise~DiagnosisCatalogEntry | null~
  }
  class DiagnosisCatalogRoutes {
    -presenters: DiagnosisCatalogPresenterFactory
    -guard: AuthGuard
    +build() Router
  }
  class DiagnosisCatalogSeeder {
    <<abstract>>
    +seed()* Promise~number~
  }
  class MongooseDiagnosisCatalogRepository {
    <<Repository, Adapter>>
    +search(criteria) Promise~Page~DiagnosisCatalogEntry~~
    +findByCode(code) Promise~DiagnosisCatalogEntry | null~
  }
  class MongooseDiagnosisCatalogSeeder {
    <<Adapter>>
    -entries: Dsm5SeedEntry[]
    +seed() Promise~number~
  }
  class SearchDiagnosesPresenter {
    <<Presenter>>
    -catalog: DiagnosisCatalog
    #execute(input) Promise~DiagnosisCatalogPageDto~
  }
  class AuthGuard {
    <<external>>
  }
  class Entity {
    <<external>>
  }
  class Presenter {
    <<external>>
  }
  DiagnosisCatalog --> DiagnosisCatalogRepository
  DiagnosisCatalogModule --> DiagnosisCatalog
  DiagnosisCatalogRepository <|.. MongooseDiagnosisCatalogRepository
  DiagnosisCatalogRoutes --> AuthGuard
  DiagnosisCatalogSeeder <|-- MongooseDiagnosisCatalogSeeder
  Entity <|-- DiagnosisCatalogEntry
  Presenter <|-- SearchDiagnosesPresenter
  SearchDiagnosesPresenter --> DiagnosisCatalog
```

## API module: Health

11 classes.

```mermaid
classDiagram
  direction LR
  class ComponentHealth {
    <<Value Object>>
    +up(name, latencyMs)$ ComponentHealth
    +down(name, error)$ ComponentHealth
    +name: string
    +status: ComponentStatus
    +latencyMs: number | null
    +error: string | null
    +isUp: boolean
  }
  class GetHealthPresenter {
    <<Presenter>>
    -service: HealthService
    -scope: HealthScope
    #execute() Promise~HealthDto~
  }
  class HealthHttpView {
    <<Passive View>>
  }
  class HealthIndicator {
    <<abstract>>
    +name: string
    +check()* Promise~ComponentHealth~
  }
  class HealthModule {
    <<Composition Root, Abstract Factory>>
    +basePath
    +registerContracts(registry) void
    +createRouter() Router
    +getHealth(view, scope) GetHealthPresenter
  }
  class HealthReport {
    <<Value Object>>
    +create(props)$ HealthReport
    +status: OverallStatus
    +components: ComponentHealth[]
    +uptimeSeconds: number
    +checkedAt: Date
  }
  class HealthRoutes {
    -presenters: HealthPresenterFactory
    +build() Router
  }
  class HealthService {
    -indicators: HealthIndicator[]
    -clock: Clock
    -uptime: UptimeSource
    +getReport(scope) Promise~HealthReport~
  }
  class MongoHealthIndicator {
    <<Adapter>>
    +name
    -connection: MongoConnection
    +check() Promise~ComponentHealth~
  }
  class ProcessUptimeSource {
    <<Adapter>>
    +uptimeSeconds() number
  }
  class ReadinessHttpView {
    <<Passive View>>
    +render(viewModel) void
  }
  class Clock {
    <<external>>
  }
  class HttpView {
    <<external>>
  }
  class MongoConnection {
    <<external>>
  }
  class Presenter {
    <<external>>
  }
  class ValueObject {
    <<external>>
  }
  GetHealthPresenter --> HealthService
  HealthIndicator <|-- MongoHealthIndicator
  HealthService --> Clock
  HealthService --> HealthIndicator
  HttpView <|-- HealthHttpView
  HttpView <|-- ReadinessHttpView
  MongoHealthIndicator --> MongoConnection
  Presenter <|-- GetHealthPresenter
  ValueObject <|-- ComponentHealth
  ValueObject <|-- HealthReport
```

## API module: Notifications

14 classes.

```mermaid
classDiagram
  direction LR
  class EmailGateway {
    <<abstract>>
    +send(to, subject, body)* Promise~void~
  }
  class ListNotificationsPresenter {
    <<Presenter>>
    -center: NotificationCenter
    #execute(input) Promise~NotificationPageDto~
  }
  class LocalWhatsAppOutbox {
    <<Adapter>>
    -logger: AppLogger
    +send(to, body) Promise~string~
  }
  class MailEmailGateway {
    <<Adapter>>
    -mail: MailTransport
    +send(to, subject, body) Promise~void~
  }
  class MongooseNotificationRepository {
    <<Repository, Adapter>>
    +findByPatient(professionalId, patientId, page) Promise~Page~Notification~~
  }
  class Notification {
    <<Aggregate Root>>
    +record(id, props)$ Notification
    +restore(id, props)$ Notification
    +professionalId: string
    +patientId: string
    +channel: NotificationChannel
    +topic: NotificationTopic
    +recipient: string | null
    +body: string
    +status: NotificationStatus
    +attempts: number
    +providerMessageId: string | null
    +error: string | null
    +createdAt: Date
  }
  class NotificationCenter {
    <<Facade>>
    -notifications: NotificationRepository
    -whatsapp: WhatsAppGateway
    -email: EmailGateway
    -clock: Clock
    -ids: IdGenerator
    +send(message) Promise~DeliveryOutcome~
    +history(professionalId, patientId, page) Promise~Page~Notification~~
  }
  class NotificationMapper {
    <<Data Mapper>>
    +toDomain(record) Notification
    +toPersistence(notification) NotificationDocument
  }
  class NotificationRepository {
    <<abstract · Repository>>
    +findByPatient(professionalId, patientId, page)* Promise~Page~Notification~~
  }
  class NotificationRoutes {
    -presenters: NotificationPresenterFactory
    -guard: AuthGuard
    +build() Router
  }
  class NotificationsModule {
    <<Composition Root, Abstract Factory>>
    +basePath
    +center: NotificationCenter
    -deps: NotificationsModuleDependencies
    +registerContracts(registry) void
    +createRouter() Router
    +listNotifications(view) ListNotificationsPresenter
  }
  class WhatsAppCloudApiGateway {
    <<Adapter>>
    -options: WhatsAppCloudApiOptions
    +send(to, body) Promise~string~
  }
  class WhatsAppDeliveryError {
    +permanent: boolean
  }
  class WhatsAppGateway {
    <<abstract · Strategy>>
    +send(to, body)* Promise~string~
  }
  class AuthGuard {
    <<external>>
  }
  class Clock {
    <<external>>
  }
  class Entity {
    <<external>>
  }
  class IdGenerator {
    <<external>>
  }
  class MailTransport {
    <<external>>
  }
  class MongooseRepository {
    <<external>>
  }
  class Presenter {
    <<external>>
  }
  class Repository {
    <<external>>
  }
  class TransactionContext {
    <<external>>
  }
  EmailGateway <|-- MailEmailGateway
  Entity <|-- Notification
  ListNotificationsPresenter --> NotificationCenter
  MailEmailGateway --> MailTransport
  MongooseNotificationRepository --> TransactionContext
  MongooseRepository <|-- MongooseNotificationRepository
  NotificationCenter --> Clock
  NotificationCenter --> EmailGateway
  NotificationCenter --> IdGenerator
  NotificationCenter --> NotificationRepository
  NotificationCenter --> WhatsAppGateway
  NotificationRepository <|.. MongooseNotificationRepository
  NotificationRoutes --> AuthGuard
  NotificationsModule --> NotificationCenter
  Presenter <|-- ListNotificationsPresenter
  Repository <|-- NotificationRepository
  WhatsAppGateway <|-- LocalWhatsAppOutbox
  WhatsAppGateway <|-- WhatsAppCloudApiGateway
```

## API module: Patients (CU-04, CU-05, CU-06)

18 classes.

```mermaid
classDiagram
  direction LR
  class ChangePatientStatusPresenter {
    <<Presenter>>
    -patients: PatientService
    #execute(input)
  }
  class CreatePatientPresenter {
    <<Presenter>>
    -patients: PatientService
    #execute(input)
  }
  class FamilyContact {
    <<Value Object>>
    +create(name, phone)$ FamilyContact
    +name: string
    +phone: string
  }
  class GetPatientPresenter {
    <<Presenter>>
    -patients: PatientService
    #execute(input)
  }
  class MongoosePatientRepository {
    <<Repository, Adapter>>
    +findOwned(professionalId, id) Promise~Patient | null~
    +findOwnedMany(professionalId, ids) Promise~Patient[]~
    +findByDni(professionalId, dni) Promise~Patient | null~
    +search(professionalId, terms, page) Promise~Page~Patient~~
    +findDormant(cutoff, limit) Promise~Patient[]~
  }
  class Patient {
    <<Aggregate Root>>
    +DNI_PATTERN$
    +DORMANT_AFTER_MONTHS$
    +dormancyCutoff(now)$ Date
    +register(id, professionalId, details, now)$ Patient
    +restore(id, props)$ Patient
    +normalizeDni(dni)$ string
    +updateDetails(details, now) void
    +changeStatus(status, now) void
    +markInactive(now) void
    +isDormantAt(now) boolean
    +recordClinicalActivity(at) void
    +dni: string
    +professionalId: string
    +healthInsurance: string | null
    +memberNumber: string | null
    +familyContact: FamilyContact | null
    +debt: number
    +allergies: string[]
    +observations: string | null
    +status: PatientStatus
    +statusChangedAt: Date
    +statusOrigin: StatusOrigin
    +registeredAt: Date
    +updatedAt: Date
    +lastClinicalActivityAt: Date | null
  }
  class PatientActivity {
    -patients: PatientRepository
    +recordClinicalActivity(professionalId, patientId, at) Promise~void~
  }
  class PatientDirectory {
    -patients: PatientRepository
    +exists(professionalId, patientId) Promise~boolean~
    +fullNames(professionalId, patientIds) Promise~Map~string, string~~
    +contacts(professionalId, patientIds) Promise~Map~string, PatientContact~~
  }
  class PatientIntake {
    -patients: PatientService
    +findIdByDni(professionalId, dni) Promise~string | null~
    +register(professionalId, details) Promise~string~
  }
  class PatientMapper {
    <<Data Mapper>>
    +toDomain(record) Patient
    +toPersistence(patient) PatientDocument
  }
  class PatientRepository {
    <<abstract · Repository>>
    +findOwned(professionalId, id)* Promise~Patient | null~
    +findOwnedMany(professionalId, ids)* Promise~Patient[]~
    +findByDni(professionalId, dni)* Promise~Patient | null~
    +search(professionalId, terms, page)* Promise~Page~Patient~~
    +findDormant(cutoff, limit)* Promise~Patient[]~
  }
  class PatientRoutes {
    -presenters: PatientPresenterFactory
    -guard: AuthGuard
    +build() Router
  }
  class PatientSearch {
    +normalize(text)$ string
    +terms(query)$ string[]
    +indexText(firstName, lastName, dni)$ string
  }
  class PatientService {
    -patients: PatientRepository
    -transactions: TransactionManager
    -clock: Clock
    -ids: IdGenerator
    -audit: AuditTrail
    +now: Date
    +register(professionalId, details) Promise~Patient~
    +search(professionalId, query, page) Promise~Page~Patient~~
    +get(professionalId, patientId) Promise~Patient~
    +update(professionalId, patientId, details) Promise~Patient~
    +changeStatus(professionalId, patientId, status) Promise~Patient~
    +inactivateDormant() Promise~number~
    +findByDni(professionalId, dni) Promise~Patient | null~
  }
  class PatientsModule {
    <<Composition Root, Abstract Factory>>
    +basePath
    +directory: PatientDirectory
    +activity: PatientActivity
    +intake: PatientIntake
    -deps: PatientsModuleDependencies
    +registerContracts(registry) void
    +createRouter() Router
    +scheduledJobs() ScheduledJob[]
    +createPatient(view) CreatePatientPresenter
    +searchPatients(view) SearchPatientsPresenter
    +getPatient(view) GetPatientPresenter
    +updatePatient(view) UpdatePatientPresenter
    +changePatientStatus(view) ChangePatientStatusPresenter
  }
  class PatientViewModel {
    +toDto(patient, now)$ PatientDto
    +toSummary(patient, now)$ PatientSummaryDto
    +toDetails(input)$ PatientDetails
  }
  class SearchPatientsPresenter {
    <<Presenter>>
    -patients: PatientService
    #execute(input)
  }
  class UpdatePatientPresenter {
    <<Presenter>>
    -patients: PatientService
    #execute(input)
  }
  class AuditTrail {
    <<external>>
  }
  class AuthGuard {
    <<external>>
  }
  class Clock {
    <<external>>
  }
  class IdGenerator {
    <<external>>
  }
  class MongooseRepository {
    <<external>>
  }
  class Person {
    <<external>>
  }
  class Presenter {
    <<external>>
  }
  class Repository {
    <<external>>
  }
  class TransactionContext {
    <<external>>
  }
  class TransactionManager {
    <<external>>
  }
  class ValueObject {
    <<external>>
  }
  ChangePatientStatusPresenter --> PatientService
  CreatePatientPresenter --> PatientService
  GetPatientPresenter --> PatientService
  MongoosePatientRepository --> TransactionContext
  MongooseRepository <|-- MongoosePatientRepository
  PatientActivity --> PatientRepository
  PatientDirectory --> PatientRepository
  PatientIntake --> PatientService
  PatientRepository <|.. MongoosePatientRepository
  PatientRoutes --> AuthGuard
  PatientService --> AuditTrail
  PatientService --> Clock
  PatientService --> IdGenerator
  PatientService --> PatientRepository
  PatientService --> TransactionManager
  PatientsModule --> PatientActivity
  PatientsModule --> PatientDirectory
  PatientsModule --> PatientIntake
  Person <|-- Patient
  Presenter <|-- ChangePatientStatusPresenter
  Presenter <|-- CreatePatientPresenter
  Presenter <|-- GetPatientPresenter
  Presenter <|-- SearchPatientsPresenter
  Presenter <|-- UpdatePatientPresenter
  Repository <|-- PatientRepository
  SearchPatientsPresenter --> PatientService
  UpdatePatientPresenter --> PatientService
  ValueObject <|-- FamilyContact
```

## API module: Subscriptions and payments (CU-18)

29 classes.

```mermaid
classDiagram
  direction LR
  class AddPaymentMethodPresenter {
    <<Presenter>>
    -service: SubscriptionService
    #execute(actor,data) Promise~SubscriptionDetailDto~
  }
  class BillingNotifier {
    <<abstract>>
    +notify(contact, event)* Promise~void~
  }
  class CancelSubscriptionPresenter {
    <<Presenter>>
    -service: SubscriptionService
    #execute(actor) Promise~SubscriptionDetailDto~
  }
  class ChoosePlanPresenter {
    <<Presenter>>
    -service: SubscriptionService
    #execute(actor,data) Promise~SubscriptionDetailDto~
  }
  class EmailBillingNotifier {
    <<Adapter>>
    -mail: MailTransport
    -dates: DateFormatter
    -planUrl: string
    -logger: AppLogger
    +notify(contact, event) Promise~void~
  }
  class GetSubscriptionPresenter {
    <<Presenter>>
    -service: SubscriptionService
    #execute(actor) Promise~SubscriptionDetailDto~
  }
  class ListPaymentsPresenter {
    <<Presenter>>
    -service: SubscriptionService
    #execute(input) Promise~PaymentPageDto~
  }
  class MongoosePaymentRepository {
    <<Repository, Adapter>>
    +findByProfessional(professionalId, page) Promise~Page~Payment~~
    +countByProfessional(professionalId) Promise~number~
    +hasChargeKey(chargeKey) Promise~boolean~
    +hasManualReference(professionalId, reference) Promise~boolean~
  }
  class MongooseSubscriptionRepository {
    <<Repository, Adapter>>
    +findDue(now, limit) Promise~Subscription[]~
  }
  class Payment {
    <<Aggregate Root>>
    +charged(id, data, now)$ Payment
    +manual(id, data, now)$ Payment
    +restore(id, props)$ Payment
    +professionalId: string
    +planId: PlanId
    +amount: number
    +currency: string
    +kind: PaymentKind
    +status: PaymentStatus
    +methodLabel: string
    +reference: string | null
    +chargeKey: string | null
    +failureReason: string | null
    +paidAt: Date
    +createdAt: Date
  }
  class PaymentGateway {
    <<abstract · Strategy>>
    +tokenizeCard(card)* Promise~TokenizedCard~
    +charge(request)* Promise~ChargeResult~
  }
  class PaymentMapper {
    <<Data Mapper>>
    +toDomain(record) Payment
    +toPersistence(payment) PaymentDocument
  }
  class PaymentMethod {
    <<Value Object>>
    +register(id, props, now)$ PaymentMethod
    +restore(props)$ PaymentMethod
    +assertValidExpiry(expMonth, expYear, now)$ void
    +withChanges(changes, now) PaymentMethod
    +id: string
    +brand: CardBrand
    +last4: string
    +expMonth: number
    +expYear: number
    +holderName: string
    +gatewayToken: string
    +addedAt: Date
    +label: string
  }
  class PaymentRepository {
    <<abstract · Repository>>
    +findByProfessional(professionalId, page)* Promise~Page~Payment~~
    +countByProfessional(professionalId)* Promise~number~
    +hasChargeKey(chargeKey)* Promise~boolean~
    +hasManualReference(professionalId, reference)* Promise~boolean~
  }
  class Plan {
    <<Value Object>>
    +create(props)$ Plan
    +id: PlanId
    +name: string
    +description: string
    +months: number
    +price: number
    +currency: string
    +periodEndFrom(start) Date
  }
  class PlanCatalog {
    +all() Plan[]
    +get(planId) Plan
  }
  class RegisterManualPaymentPresenter {
    <<Presenter>>
    -service: SubscriptionService
    #execute(actor,data) Promise~PaymentDto~
  }
  class RemovePaymentMethodPresenter {
    <<Presenter>>
    -service: SubscriptionService
    #execute(actor,methodId,confirmed,) Promise~SubscriptionDetailDto~
  }
  class SetAutoDebitPresenter {
    <<Presenter>>
    -service: SubscriptionService
    #execute(actor,data) Promise~SubscriptionDetailDto~
  }
  class SimulatedPaymentGateway {
    <<Adapter>>
    +tokenizeCard(card) Promise~TokenizedCard~
    +charge(request) Promise~ChargeResult~
  }
  class Subscription {
    <<Aggregate Root, State>>
    +startTrial(professionalId, contact, now, trialDays)$ Subscription
    +migrate(professionalId, contact, legacyPlan, endsAt, now)$ Subscription
    +restore(professionalId, props)$ Subscription
    +statusAt(now) SubscriptionStatus
    +hasAccessAt(now) boolean
    +daysLeftAt(now) number
    +isDueAt(now) boolean
    +choosePlan(plan, now) boolean
    +applyPayment(plan, now) void
    +expireTrial(now) void
    +markPaymentPending(now) void
    +recordFailedCharge(now) void
    +addPaymentMethod(method, makeDefault, now) void
    +updatePaymentMethod(methodId, changes, now) void
    +removePaymentMethod(methodId, confirmed, now) void
    +setAutoDebit(enabled, now) void
    +cancel(now) void
    +assertAcceptsManualPayment(paidAt, now) void
    +updateContact(contact, now) void
    +professionalId: string
    +contact: BillingContact
    +phase: SubscriptionPhase
    +planId: PlanId | null
    +periodEndsAt: Date
    +autoDebit: boolean
    +renewsAutomatically: boolean
    +paymentMethods: PaymentMethod[]
    +defaultPaymentMethodId: string | null
    +defaultPaymentMethod: PaymentMethod | null
    +failedChargeAttempts: number
    +cancelledAt: Date | null
    +createdAt: Date
    +updatedAt: Date
  }
  class SubscriptionAccess {
    -subscriptions: SubscriptionRepository
    -clock: Clock
    -trialDays: number
    +startTrial(professionalId, contact) Promise~AccessSummary~
    +accessOf(professionalId) Promise~AccessSummary | null~
    +updateContact(professionalId, contact) Promise~void~
    +importLegacy(professionalId, contact, plan, endsAt) Promise~void~
  }
  class SubscriptionMapper {
    <<Data Mapper>>
    +toDomain(record) Subscription
    +toPersistence(subscription) SubscriptionDocument
  }
  class SubscriptionRepository {
    <<abstract · Repository>>
    +findDue(now, limit)* Promise~Subscription[]~
  }
  class SubscriptionRoutes {
    -presenters: SubscriptionPresenterFactory
    -guard: AuthGuard
    +build() Router
  }
  class SubscriptionService {
    -subscriptions: SubscriptionRepository
    -payments: PaymentRepository
    -transactions: TransactionManager
    -gateway: PaymentGateway
    -notifier: BillingNotifier
    -catalog: PlanCatalog
    -clock: Clock
    -ids: IdGenerator
    -audit: AuditTrail
    +now: Date
    +plans: Plan[]
    +planOf(subscription) Plan | null
    +get(professionalId) Promise~Subscription~
    +choosePlan(professionalId, planId) Promise~Subscription~
    +addPaymentMethod(professionalId, card, makeDefault) Promise~Subscription~
    +updatePaymentMethod(professionalId, methodId, changes) Promise~Subscription~
    +removePaymentMethod(professionalId, methodId, confirmed) Promise~Subscription~
    +setAutoDebit(professionalId, enabled) Promise~Subscription~
    +cancel(professionalId) Promise~Subscription~
    +registerManualPayment(professionalId, data) Promise~Payment~
    +listPayments(professionalId, page) Promise~Page~Payment~~
    +processDueRenewals() Promise~RenewalReport~
  }
  class SubscriptionsModule {
    <<Composition Root, Abstract Factory>>
    +basePath
    +access: SubscriptionAccess
    -deps: SubscriptionsModuleDependencies
    +registerContracts(registry) void
    +createRouter() Router
    +scheduledJobs() ScheduledJob[]
    +getSubscription(view) GetSubscriptionPresenter
    +choosePlan(view) ChoosePlanPresenter
    +addPaymentMethod(view) AddPaymentMethodPresenter
    +updatePaymentMethod(view) UpdatePaymentMethodPresenter
    +removePaymentMethod(view) RemovePaymentMethodPresenter
    +setAutoDebit(view) SetAutoDebitPresenter
    +cancelSubscription(view) CancelSubscriptionPresenter
    +listPayments(view) ListPaymentsPresenter
    +registerManualPayment(view) RegisterManualPaymentPresenter
  }
  class SubscriptionViewModel {
    +toDto(subscription, service)$ SubscriptionDetailDto
    +plan(plan)$ PlanDto
    +payment(payment)$ PaymentDto
  }
  class UpdatePaymentMethodPresenter {
    <<Presenter>>
    -service: SubscriptionService
    #execute(actor,methodId,data,) Promise~SubscriptionDetailDto~
  }
  class AuditTrail {
    <<external>>
  }
  class AuthGuard {
    <<external>>
  }
  class Clock {
    <<external>>
  }
  class DateFormatter {
    <<external>>
  }
  class Entity {
    <<external>>
  }
  class IdGenerator {
    <<external>>
  }
  class MailTransport {
    <<external>>
  }
  class MongooseRepository {
    <<external>>
  }
  class Presenter {
    <<external>>
  }
  class Repository {
    <<external>>
  }
  class TransactionContext {
    <<external>>
  }
  class TransactionManager {
    <<external>>
  }
  class ValueObject {
    <<external>>
  }
  AddPaymentMethodPresenter --> SubscriptionService
  BillingNotifier <|-- EmailBillingNotifier
  CancelSubscriptionPresenter --> SubscriptionService
  ChoosePlanPresenter --> SubscriptionService
  EmailBillingNotifier --> DateFormatter
  EmailBillingNotifier --> MailTransport
  Entity <|-- Payment
  Entity <|-- Subscription
  GetSubscriptionPresenter --> SubscriptionService
  ListPaymentsPresenter --> SubscriptionService
  MongoosePaymentRepository --> TransactionContext
  MongooseRepository <|-- MongoosePaymentRepository
  MongooseRepository <|-- MongooseSubscriptionRepository
  MongooseSubscriptionRepository --> TransactionContext
  PaymentGateway <|-- SimulatedPaymentGateway
  PaymentRepository <|.. MongoosePaymentRepository
  Presenter <|-- AddPaymentMethodPresenter
  Presenter <|-- CancelSubscriptionPresenter
  Presenter <|-- ChoosePlanPresenter
  Presenter <|-- GetSubscriptionPresenter
  Presenter <|-- ListPaymentsPresenter
  Presenter <|-- RegisterManualPaymentPresenter
  Presenter <|-- RemovePaymentMethodPresenter
  Presenter <|-- SetAutoDebitPresenter
  Presenter <|-- UpdatePaymentMethodPresenter
  RegisterManualPaymentPresenter --> SubscriptionService
  RemovePaymentMethodPresenter --> SubscriptionService
  Repository <|-- PaymentRepository
  Repository <|-- SubscriptionRepository
  SetAutoDebitPresenter --> SubscriptionService
  SubscriptionAccess --> Clock
  SubscriptionAccess --> SubscriptionRepository
  SubscriptionRepository <|.. MongooseSubscriptionRepository
  SubscriptionRoutes --> AuthGuard
  SubscriptionService --> AuditTrail
  SubscriptionService --> BillingNotifier
  SubscriptionService --> Clock
  SubscriptionService --> IdGenerator
  SubscriptionService --> PaymentGateway
  SubscriptionService --> PaymentRepository
  SubscriptionService --> PlanCatalog
  SubscriptionService --> SubscriptionRepository
  SubscriptionService --> TransactionManager
  SubscriptionsModule --> SubscriptionAccess
  UpdatePaymentMethodPresenter --> SubscriptionService
  ValueObject <|-- PaymentMethod
  ValueObject <|-- Plan
```

## API module: Virtual consultations (CU-15)

20 classes.

```mermaid
classDiagram
  direction LR
  class AppointmentDirectoryLookup {
    <<Adapter>>
    -directory: AppointmentDirectory
    +find(professionalId, appointmentId) Promise~AppointmentInfo | null~
  }
  class AppointmentLookup {
    <<abstract>>
    +find(professionalId, appointmentId)* Promise~AppointmentInfo | null~
  }
  class GoogleMeetLinkProvider {
    <<Adapter>>
    +provider
    -options: GoogleMeetOptions
    +create(request) Promise~string~
  }
  class JitsiMeetingLinkProvider {
    <<Adapter>>
    +provider
    -baseUrl: string
    +create() Promise~string~
  }
  class ListVirtualMeetingsPresenter {
    <<Presenter>>
    -consultations: VirtualConsultationService
    #execute(actor,query,) Promise~VirtualMeetingPageDto~
  }
  class MeetingInvitations {
    <<abstract>>
    +send(invitation)* Promise~object~
  }
  class MeetingLinkProvider {
    <<abstract · Strategy>>
    +provider: MeetingProvider
    +create(request)* Promise~string~
  }
  class MeetingProviderError {
  }
  class MongooseVirtualMeetingRepository {
    <<Repository, Adapter>>
    +insertIfFirstForAppointment(meeting) Promise~boolean~
    +findByPatient(professionalId, patientId, page) Promise~Page~VirtualMeeting~~
    +findByAppointment(professionalId, appointmentId) Promise~VirtualMeeting | null~
  }
  class NotificationMeetingInvitations {
    <<Adapter>>
    -notifications: NotificationCenter
    +send(invitation)
  }
  class PatientContacts {
    <<abstract>>
    +find(professionalId, patientId)* Promise~PatientContactInfo | null~
  }
  class PatientDirectoryContacts {
    <<Adapter>>
    -directory: PatientDirectory
    +find(professionalId, patientId) Promise~PatientContactInfo | null~
  }
  class StartVirtualMeetingPresenter {
    <<Presenter>>
    -consultations: VirtualConsultationService
    #execute(actor,data) Promise~VirtualMeetingDto~
  }
  class VirtualConsultationService {
    -meetings: VirtualMeetingRepository
    -links: MeetingLinkProvider
    -patients: PatientContacts
    -appointments: AppointmentLookup
    -invitations: MeetingInvitations
    -transactions: TransactionManager
    -clock: Clock
    -ids: IdGenerator
    -audit: AuditTrail
    +start(professionalId, request) Promise~VirtualMeeting~
    +history(professionalId, patientId, page) Promise~Page~VirtualMeeting~~
    +forAppointment(professionalId, appointmentId) Promise~Page~VirtualMeeting~~
  }
  class VirtualConsultationsModule {
    <<Composition Root, Abstract Factory>>
    +basePath
    -deps: VirtualConsultationsModuleDependencies
    +registerContracts(registry) void
    +createRouter() Router
    +startVirtualMeeting(view) StartVirtualMeetingPresenter
    +listVirtualMeetings(view) ListVirtualMeetingsPresenter
  }
  class VirtualMeeting {
    <<Aggregate Root>>
    +start(id, data, now)$ VirtualMeeting
    +restore(id, props)$ VirtualMeeting
    +recordInvitation(status, error) void
    +professionalId: string
    +patientId: string
    +appointmentId: string | null
    +provider: MeetingProvider
    +joinUrl: string
    +invitationStatus: InvitationStatus
    +invitationError: string | null
    +createdAt: Date
  }
  class VirtualMeetingMapper {
    <<Data Mapper>>
    +toDomain(record) VirtualMeeting
    +toPersistence(meeting) VirtualMeetingDocument
  }
  class VirtualMeetingRepository {
    <<abstract · Repository>>
    +findByPatient(professionalId, patientId, page)* Promise~Page~VirtualMeeting~~
    +findByAppointment(professionalId, appointmentId)* Promise~VirtualMeeting | null~
    +insertIfFirstForAppointment(meeting)* Promise~boolean~
  }
  class VirtualMeetingRoutes {
    -presenters: VirtualConsultationPresenterFactory
    -guard: AuthGuard
    +build() Router
  }
  class VirtualMeetingViewModel {
    +toDto(meeting)$ VirtualMeetingDto
  }
  class AppointmentDirectory {
    <<external>>
  }
  class AuditTrail {
    <<external>>
  }
  class AuthGuard {
    <<external>>
  }
  class Clock {
    <<external>>
  }
  class Entity {
    <<external>>
  }
  class IdGenerator {
    <<external>>
  }
  class MongooseRepository {
    <<external>>
  }
  class NotificationCenter {
    <<external>>
  }
  class PatientDirectory {
    <<external>>
  }
  class Presenter {
    <<external>>
  }
  class Repository {
    <<external>>
  }
  class TransactionContext {
    <<external>>
  }
  class TransactionManager {
    <<external>>
  }
  AppointmentDirectoryLookup --> AppointmentDirectory
  AppointmentLookup <|-- AppointmentDirectoryLookup
  Entity <|-- VirtualMeeting
  ListVirtualMeetingsPresenter --> VirtualConsultationService
  MeetingInvitations <|-- NotificationMeetingInvitations
  MeetingLinkProvider <|-- GoogleMeetLinkProvider
  MeetingLinkProvider <|-- JitsiMeetingLinkProvider
  MongooseRepository <|-- MongooseVirtualMeetingRepository
  MongooseVirtualMeetingRepository --> TransactionContext
  NotificationMeetingInvitations --> NotificationCenter
  PatientContacts <|-- PatientDirectoryContacts
  PatientDirectoryContacts --> PatientDirectory
  Presenter <|-- ListVirtualMeetingsPresenter
  Presenter <|-- StartVirtualMeetingPresenter
  Repository <|-- VirtualMeetingRepository
  StartVirtualMeetingPresenter --> VirtualConsultationService
  VirtualConsultationService --> AppointmentLookup
  VirtualConsultationService --> AuditTrail
  VirtualConsultationService --> Clock
  VirtualConsultationService --> IdGenerator
  VirtualConsultationService --> MeetingInvitations
  VirtualConsultationService --> MeetingLinkProvider
  VirtualConsultationService --> PatientContacts
  VirtualConsultationService --> TransactionManager
  VirtualConsultationService --> VirtualMeetingRepository
  VirtualMeetingRepository <|.. MongooseVirtualMeetingRepository
  VirtualMeetingRoutes --> AuthGuard
```

## Web model and store

28 classes.

```mermaid
classDiagram
  direction LR
  class AgendaAdapter {
    <<Adapter>>
    +monthRange(month)$ object
    +monthTitle(month)$ string
    +weekdayLabels()$ string[]
    +calendar(month, appointments, selectedDay, today)$ CalendarDay[][]
    +dayAgenda(appointments, day)$ AgendaItem[]
    +dayTitle(day)$ string
  }
  class ApiErrorAdapter {
    <<Adapter>>
    +toUiError(error)$ UiError | null
  }
  class AppointmentForm {
    +defaults(day)$ AppointmentFormValues
    +fromDto(dto)$ AppointmentFormValues
    +toReschedule(values)$ RescheduleAppointmentRequestDto
    +toSchedule(values)$ ScheduleAppointmentRequestDto
  }
  class AppStore {
    <<Singleton>>
    +getInstance()$ ReduxStore
    +create()$ ReduxStore
  }
  class AuditAdapter {
    <<Adapter>>
    +categoryLabel(category)$ string
    +toItem(dto)$ AuditItem
  }
  class AuthForms {
    +offices(text)$ string[]
    +toLoginRequest(values)$ LoginRequestDto
    +toRegisterRequest(values)$ RegisterProfessionalRequestDto
    +profileFromDto(dto)$ ProfileFormValues
    +toProfileRequest(values)$ UpdateProfileRequestDto
    +toChangePasswordRequest(values)$ ChangePasswordRequestDto
  }
  class BookingAdapter {
    <<Adapter>>
    +statusLabel(status)$ string
    +toRequestItem(dto, timeZone)$ BookingRequestItem
    +toSummary(dto)$ BookingSettingsSummary
    +toPublicPage(dto)$ PublicPageModel
    +toSlotDays(dto)$ SlotDay[]
    +receipt(startsAt, timeZone)$ string
  }
  class BookingSettingsForm {
    +EMPTY_WINDOW$
    +fromDto(dto)$ BookingSettingsFormValues
    +toRequest(values)$ UpdateBookingSettingsRequestDto
    +publicPath(slug)$ string
  }
  class ClinicalRecordAdapter {
    <<Adapter>>
    +toTimeline(consultations)$ TimelineItem[]
    +toDetail(dto)$ ConsultationDetail
    +toDiagnosisHistory(entries)$ DiagnosisHistoryItem[]
    +toDiagnosisOption(entry)$ DiagnosisOption
  }
  class ConsultationForm {
    +defaults(now)$ ConsultationFormValues
    +toRequest(values)$ RegisterConsultationRequestDto
  }
  class EarningsAdapter {
    <<Adapter>>
    +RANGES$
    +window(today, monthsBack, monthsAhead)$ MonthWindow
    +toSummary(dto)$ EarningsSummary
  }
  class FeesForm {
    +fromDto(dto)$ FeesFormValues
    +toRequest(values)$ UpdateConsultationFeesRequestDto
  }
  class Formats {
    <<Adapter>>
    +date(value, style, timeZone)$ string
    +weekday(isoWeekday, width)$ string
    +dayHeading(isoDate)$ string
    +month(isoMonth, width)$ string
    +compactMoney(amount, currency)$ string
    +isoDate(isoDate)$ string
    +money(amount, currency)$ string
  }
  class HealthAdapter {
    <<Adapter>>
    +toUiModel(dto)$ HealthUiModel
    +formatUptime(totalSeconds)$ string
  }
  class LogoFile {
    +ACCEPT$
    +HINT$
    +problemWith(file)$ string | null
  }
  class NotificationAdapter {
    <<Adapter>>
    +toItem(dto)$ NotificationItem
  }
  class PatientAdapter {
    <<Adapter>>
    +statusLabel(status)$ string
    +formatDni(dni)$ string
    +toListItem(dto)$ PatientListItem
    +toProfile(dto)$ PatientProfile
  }
  class PatientForm {
    +fromDto(dto)$ PatientFormValues
    +toInput(values)$ PatientInputDto
  }
  class PrescriptionBuilder {
    +letterhead(session, logo)$ Letterhead
    +build(letterhead, patient, content, at)$ PrescriptionDocument
  }
  class PrescriptionPdfAdapter {
    <<Adapter>>
    +render(prescription)$ jsPDF
    +download(prescription)$ void
  }
  class PublicBookingForm {
    +defaults(modality)$ PublicBookingFormValues
    +toRequest(values, startsAt)$ CreateBookingRequestDto
  }
  class RecordAccessAdapter {
    <<Adapter>>
    +toItems(dtos)$ RecordAccessItem[]
  }
  class SessionAdapter {
    <<Adapter>>
    +toUiModel(dto)$ SessionUiModel
    +subscription(subscription)$ Pick~SessionUiModel, string~
  }
  class SonnerUserFeedback {
    <<Adapter>>
    +success(message) void
    +error(message) void
    +warning(message) void
  }
  class SubscriptionAdapter {
    <<Adapter>>
    +money(amount, currency)$ string
    +date(iso)$ string
    +toOverview(dto)$ SubscriptionOverview
    +toPlanOptions(dto)$ PlanOption[]
    +toPaymentMethods(dto)$ PaymentMethodItem[]
    +toPayment(dto)$ PaymentItem
  }
  class SubscriptionForms {
    +toAddCard(values)$ AddPaymentMethodRequestDto
    +toEditCard(values)$ UpdatePaymentMethodRequestDto
    +manualDefaults(price, today)$ ManualPaymentFormValues
    +toManualPayment(values)$ ManualPaymentRequestDto
  }
  class VirtualMeetingAdapter {
    <<Adapter>>
    +toItem(dto)$ VirtualMeetingItem
  }
  class WindowBrowserActions {
    <<Adapter>>
    +print() void
    +copyText(text) Promise~void~
    +absoluteUrl(path) string
  }
```
