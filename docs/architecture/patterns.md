# Design patterns in use

Every class that applies a pattern says so in a one-line comment (`// Adapter`, ADR-0035); search
for it to list them all. The generated [class diagram](class-diagram.md) shows the same names as
`<<stereotypes>>`.

## Singleton — [ADR-0006](../adr/0006-singleton-pattern.md)

| Class | File |
| --- | --- |
| `AppConfig` | `apps/api/src/infrastructure/config/AppConfig.ts` |
| `Logger` | `apps/api/src/infrastructure/logger/Logger.ts` |
| `MongoConnection` | `apps/api/src/infrastructure/database/MongoConnection.ts` |
| `OpenApiRegistry` | `apps/api/src/infrastructure/openapi/OpenApiRegistry.ts` |
| `AppStore` | `apps/web/src/app/store/AppStore.ts` |

Rules: private constructor (lint-enforced), `static #instance`, lazy `getInstance()`,
`resetInstance()` for tests. Only composition roots call `getInstance()`; everything else gets the
instance injected.

## Adapter — [ADR-0007](../adr/0007-adapter-pattern.md)

| Our abstraction | Adapter | Wraps |
| --- | --- | --- |
| `Repository<T>` | `MongooseRepository` (+ per-entity subclasses) | Mongoose models |
| `AppLogger` | `PinoLoggerAdapter` | pino |
| `HttpResponder` | `ExpressResponderAdapter` | Express `Response` |
| `ContractRegistry` | `OpenApiRegistry` | zod-to-openapi |
| `HealthIndicator` | `MongoHealthIndicator` | `MongoConnection` |
| `UptimeSource` | `ProcessUptimeSource` | `process.uptime()` |
| `PasswordHasher` | `ScryptPasswordHasher` | `node:crypto` scrypt |
| `TokenService` | `JoseTokenService` | `jose` (JWT, algorithm injected as a `TokenSigningAlgorithm`) |
| `PatientLookup` / `PatientNames` | `PatientDirectoryLookup` / `PatientDirectoryNames` | patients module query service |
| `DiagnosisResolver` | `CatalogDiagnosisResolver` | DSM-5 catalog module |
| `AppointmentNotifier` | `NotificationAppointmentNotifier` | notifications module (CU-14) |
| `TransactionManager` | `MongoTransactionManager` | Mongoose `connection.transaction` + `TransactionContext` |
| `MailTransport` | `SmtpMailTransport` | nodemailer (Mailpit locally) |
| `PasswordRecoveryNotifier` / `BillingNotifier` | `EmailPasswordRecoveryNotifier` / `EmailBillingNotifier` | `MailTransport` |
| `RecoveryCodeGenerator` | `CryptoRecoveryCodeGenerator` | `node:crypto` randomInt |
| `IdGenerator` | `UuidIdGenerator` | `crypto.randomUUID` (ADR-0042) |
| `DateFormatter` | `IntlDateFormatter` | `Intl.DateTimeFormat` in `APP_TIMEZONE` (ADR-0042) |
| `ProfessionalAccess` | `SubscriptionAccessAdapter` | subscriptions module |
| `PaymentGateway` | `SimulatedPaymentGateway` | local sandbox (test cards) |
| `WhatsAppGateway` | `LocalWhatsAppOutbox` / `WhatsAppCloudApiGateway` | log / Meta Graph API |
| `MeetingLinkProvider` | `JitsiMeetingLinkProvider` / `GoogleMeetLinkProvider` | Jitsi URL / Google Calendar API |
| `ClinicalActivityRecorder` | `PatientActivityRecorder` | patients module (command, ADR-0033) |
| `LogoRepository` | `MongooseLogoRepository` | Mongoose (binary) |
| PDF document | `PrescriptionPdfAdapter` | jsPDF (web) |
| UI model | `HealthAdapter` | generated `HealthDto` |
| `UserFeedback` | `SonnerUserFeedback` | sonner toasts (web, ADR-0042) |
| `BrowserActions` | `WindowBrowserActions` | `window.print`, `navigator.clipboard` (web, ADR-0042) |
| `UiError` | `ApiErrorAdapter` | RTK Query error union |

## Other patterns that appear by design

Every class or function that applies a pattern carries a `// <Pattern>` comment with the exact
names below ([ADR-0035](../adr/0035-comments-name-design-patterns.md)); `grep -rn "// Strategy"`
lists them.

| Pattern | Where |
| --- | --- |
| **Template Method** | `Presenter.present()` calls the abstract `execute()` (ADR-0049: presenters only write `execute`) |
| **Abstract Factory** | `<Name>Presenters` classes: one method per use case, built by each `<Name>Module` (ADR-0049) |
| **Presenter / Passive View** | MVP: one `Presenter` per use case, `*HttpView` classes and the `View` interface (ADR-0004) |
| **ViewModel** | MVVM: every `use<Name>ViewModel` hook in the web (ADR-0011) |
| **Repository** | `Repository<T>` and the per-aggregate abstract repositories in each `model/` |
| **Data Mapper** | `DataMapper<Entity, Document>` and every `*Mapper` |
| **Composition Root** | `<Name>Module.ts`, `Application.ts`, `createModules`, `main.ts`; web `AppProviders` (provides `PlatformContext`) |
| **Unit of Work** | `TransactionManager.run` + `TransactionContext` (ADR-0025) |
| **Strategy** | `PaymentGateway`, `WhatsAppGateway`, `MeetingLinkProvider`: implementation picked by configuration; `TokenSigningAlgorithm` (`HmacSha256SigningAlgorithm`) for JWTs (ADR-0041) |
| **Facade** | `NotificationCenter`: delivery, retry and log behind one call (ADR-0030) |
| **Command** | `ScheduledJob` (ADR-0026) |
| **State** | `Subscription` phases and `statusAt` (ADR-0029) |
| **Entity / Aggregate Root / Value Object** | `Entity`, `ValueObject` and their subclasses; aggregates are the entities with a repository |
