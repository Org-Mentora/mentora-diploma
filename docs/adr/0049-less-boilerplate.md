# ADR-0049: Less boilerplate in presenters, routes, contracts, repositories and ViewModels

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, frontend, patterns
- **Supersedes:** — (amends [ADR-0004](0004-backend-mvp-passive-view.md): the presenter factory
  becomes a concrete `<Module>Presenters` class, and presenters get their model through the base
  class; amends [ADR-0021](0021-forms-in-viewmodels.md): API errors reach forms through `FormErrors`)

## Context and problem statement

Every new endpoint needed about nine files, and almost half of their lines were ceremony:
- a presenter constructor that only called `super(view)`;
- each presenter factory method written twice, once in the `<X>PresenterFactory` interface and
  once in the module root;
- `new JsonHttpView(new ExpressResponderAdapter(res))` in every route;
- `tags`, `auth` and the error responses repeated in every OpenAPI route;
- the same Mongoose `.find().session().lean()` and mapping chain in every repository.

In the web, every ViewModel repeated the same `try` / `unwrap` / toast / `setError` block and
copied the paged-list fields one by one. New team members had to read this noise before they
reached the code that matters. The architecture (MVP Passive View, MVVM, the layer rules) stays
the same. Only the repetition moves into shared building blocks.

## Decision drivers

- A junior developer should be able to follow one endpoint from route to repository quickly.
- Layer boundaries and lint rules stay exactly as they are.
- HTTP behaviour and the generated OpenAPI document must not change.

## Considered options

1. Keep the code as it is.
2. Merge presenter and view into controllers.
3. Keep MVP and MVVM, and move the repetition into generic building blocks.

## Decision outcome

Chosen option: **3**, because it removes the ceremony without changing the architecture.

**API**
- `Presenter<TInput, TViewModel, TModel>` receives `(view, model)`. A use case presenter has no
  constructor and only implements `execute`, using `this.model` and returning the view model.
- `presenter/<Module>Presenters.ts` (Abstract Factory) is one concrete class per module. It holds
  the module's services and has one method per use case. It replaces the old
  `<X>PresenterFactory` interface and the factory methods in the module root.
- `HttpViews.json(res, status?)` and `HttpViews.noContent(res)` (`infrastructure/http`) build the
  standard views. Views with their own behaviour (session cookies, readiness) stay classes.
- `moduleRoutes(registry, { tags, auth })` and `errorResponse(description)` fill in the
  repeated parts of an OpenAPI route.
- `MongooseRepository` offers `findOneBy`, `findManyBy` and `findPage(keyset, filter, page)`, and
  `Keyset.newestFirst(path)` is a preset. Together they apply `.session()`, `.lean()` and the
  mapper in one place.

**Web**
- `usePagedList(query, args, toItems)` returns the mapped items and a `UiError`.
- `useAction()` runs a mutation with a success toast and an error toast.
- `FormErrors.apply(form, caught, { fields, fallback })` maps an API error to a form field or to
  `root`.
- `ApiErrorAdapter.messageOf(caught, fallback)` returns an error message with a fallback.

### Consequences

- 👍 About 640 fewer lines in the API, and a new endpoint is one small presenter plus one method
  in the registry.
- 👍 The ADR-0025 session rule is enforced in the base repository instead of by discipline.
- 👎 `this.model` is less descriptive than a named field. The presenter's third type argument
  names the service.

## Enforcement

- `pnpm codegen:check` shows that `openapi.json` and the generated client are unchanged.
- The supertest suites under `apps/api/test/integration` (black box) cover the HTTP behaviour.
- The Biome layer rules are unchanged.
- Code review checks new code against the `new-backend-module` and `new-frontend-feature` skills.

## References

- `apps/api/src/core/presenter/Presenter.ts`
- `apps/api/src/infrastructure/http/HttpViews.ts`
- `apps/api/src/core/module/ContractRegistry.ts`
- `apps/api/src/infrastructure/database/MongooseRepository.ts`
- `apps/web/src/model/api/usePagedList.ts`, `useAction.ts`, `FormErrors.ts`
