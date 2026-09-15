---
description: Shared coding conventions for backend PHP and Laravel code.
alwaysApply: true
metadata:
  scope: backend
  paths:
    - "api/**"
---

# Backend Coding Standards

Apply this rule to backend PHP and Laravel code. Keep the conventions focused on
readability, explicit intent, and stable application contracts.

## Named Arguments

- Prefer named arguments for application-owned constructors and methods when:
  - the call has two or more semantically distinct scalar values;
  - the call includes a boolean or multiple values with the same type;
  - optional parameters are being supplied; or
  - positional arguments would make the call ambiguous.
- Keep positional arguments when there is only one obvious value, the argument
  order is self-explanatory, or a short framework/vendor call is clearer that
  way.
- Do not mix positional arguments after named arguments. Once a call uses named
  arguments, use named arguments for the remaining arguments.
- Treat parameter names on public application APIs, Actions, Repositories, and
  Core abstractions as part of the call contract. Use descriptive names and do
  not rename them casually.
- Do not use named arguments solely because PHP supports them; readability is
  the deciding factor.

Good:

```php
new ActionError(
    message: 'Thông tin đăng nhập không chính xác.',
    code: AuthError::InvalidCredentials,
);
```

```php
ApiResponseFactory::error(
    message: 'Dữ liệu không hợp lệ.',
    status: 422,
    errors: $errors,
);
```

Positional is acceptable when the meaning is already obvious:

```php
Hash::check($password, $hashedPassword);

new CurrentUserResource($user);

Route::prefix('auth');
```

## Business Error Declarations

- Represent expected module business failures with a string-backed enum that
  implements `App\Core\Contracts\ErrorDeclarationEnum`.
- Use a stable uppercase `<MODULE>-<CODE>` value, such as `IDENTITY-001`. Do
  not reuse or casually rename a code once it is emitted to logs or clients.
- Add a concise PHPDoc comment immediately above every error case so its meaning
  can be investigated without reading the Action implementation.
- Implement `httpStatus(): int` on every error declaration. Controllers should
  use the declaration's status instead of maintaining their own error mapping.
- Use the enum's `value` as the stable machine-readable identifier in structured
  logs; never log credentials, tokens, or other sensitive request data alongside
  it.
- Keep this convention separate from database-backed enums, which remain
  int-backed and follow the database rules.

## Action Error Boundary

- Keep one business operation per Action. An Action has exactly one public
  non-constructor method named `handle()`.
- Throw `App\Core\Exceptions\ActionError` for expected business failures and
  pass the module's `ErrorDeclarationEnum` as its code.
- Catch only `ActionError` inside the same Action and convert it to
  `ActionResult::error(...)` with the declaration and safe message.
- Do not catch broad `Throwable` values in an Action. Unexpected exceptions must
  bubble to Laravel's centralized system exception renderer.
- A failed `ActionResult` returned to a controller must carry an
  `ErrorDeclarationEnum`; the shared API boundary derives its HTTP status from
  `httpStatus()`.
- Controllers only coordinate Request -> Action -> Resource/Response. They must
  not throw business errors, catch Action errors, or maintain per-controller
  error-to-status mappings.
- Authentication and other request-state checks that produce an expected
  business failure belong in the Action. Framework validation, middleware, and
  unexpected system exceptions remain handled by Laravel/bootstrap.
