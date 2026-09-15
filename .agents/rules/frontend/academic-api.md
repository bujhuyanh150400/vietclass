---
description: Academic frontend API contracts and TypeScript boundaries.
alwaysApply: true
metadata:
  scope: frontend-academic
  paths:
    - "frontend/src/modules/academic/**"
---

# Academic Frontend API Contracts

- Treat TypeScript types as the compile-time source of truth for academic API request and response shapes.
- Every endpoint function must declare an explicit request type and response type. Do not use `any` or `unknown` for request bodies at the endpoint, hook, or component boundary.
- Keep request types in a separate file under `frontend/src/modules/academic/types/`; keep them out of API clients, hooks, and components. Use separate create and update types when their payloads differ.
- Keep Zod schemas for form validation and form-value transformation only. Do not use response schemas in API clients or make API clients infer domain types from form schemas.
- Generic transport helpers may accept `unknown` for raw JSON; that exception ends at the transport boundary. Raw forwarding and error values may also remain `unknown` when their shape is intentionally not interpreted.
- Write academic endpoint paths explicitly as `/api/v1/...` in each API function. Do not hide the path behind a `BASE` constant or replace resource-specific list parameter types with a generic `ListParams`.
- Keep resource API functions split by resource, with `api/index.ts` as the barrel export; do not recreate a monolithic academic client file.
