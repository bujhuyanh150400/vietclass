# Issue Template

Use this file as the semantic template for both `LOCAL` and `GITHUB` targets.

Resolve before rendering:

```text
Target:   LOCAL | GITHUB
Language: VI    | EN
```

Do not maintain separate business content for each target or language.

## Semantic Fields

Every issue contains:

1. Title
2. Status: `DRAFT`
3. Type: `FEATURE | CHANGE | BUG | BUSINESS_REQUEST`
4. Created date
5. Language (`LOCAL` only)
6. User Claim
7. Current Problem
8. Affected Users
9. Expected Outcome
10. Scope
    - In Scope
    - Out of Scope
11. Constraints
12. Known Context
13. Unresolved Decisions
14. References

---

## English Rendering

```markdown
# <Issue Title>

Status: DRAFT
Type: FEATURE | CHANGE | BUG | BUSINESS_REQUEST
Created: YYYY-MM-DD
Language: EN

## User Claim

<Concise representation of the original claim.>

## Current Problem

<What is missing, broken, confusing, inefficient, or currently impossible.>

## Affected Users

- <Role or user group>

## Expected Outcome

<Desired result at a high level without inventing unresolved business policy or technical design.>

## Scope

### In Scope

- <Known scope item>

### Out of Scope

- <Explicitly excluded item, or `None identified.`>

## Constraints

- <Known business, product, regulatory, compatibility, or technical constraint>

## Known Context

- <Relevant existing behavior, terminology, module, evidence, or dependency>

## Unresolved Decisions

- <Business or product decision that remains unresolved>

## References

- <Related issue, ticket, repository path, document, screenshot, log, or conversation reference>
```

---

## Vietnamese Rendering

```markdown
# <Tiêu đề issue>

Status: DRAFT
Type: FEATURE | CHANGE | BUG | BUSINESS_REQUEST
Created: YYYY-MM-DD
Language: VI

## Yêu cầu gốc

<Mô tả ngắn gọn yêu cầu hoặc phản ánh ban đầu.>

## Vấn đề hiện tại

<Mô tả điều đang thiếu, sai, khó hiểu, kém hiệu quả hoặc chưa thể thực hiện.>

## Người dùng bị ảnh hưởng

- <Vai trò hoặc nhóm người dùng>

## Kết quả mong đợi

<Mô tả kết quả mong muốn ở mức high-level, không tự quyết business policy hoặc technical design chưa được xác nhận.>

## Phạm vi

### Trong phạm vi

- <Hạng mục đã biết thuộc phạm vi>

### Ngoài phạm vi

- <Hạng mục được loại trừ rõ ràng, hoặc `Chưa xác định.`>

## Ràng buộc

- <Ràng buộc business, product, regulatory, compatibility hoặc technical đã biết>

## Bối cảnh đã biết

- <Hành vi hiện tại, terminology, module, evidence hoặc dependency liên quan>

## Quyết định chưa làm rõ

- <Business hoặc product decision cần refinement>

## Tham chiếu

- <Issue, ticket, repository path, document, screenshot, log hoặc conversation reference liên quan>
```

---

## GitHub Rendering Rule

For `GITHUB`, use the selected language rendering as the issue title/body, but omit local-only metadata such as `Language:` when repository conventions do not use it.

Do not invent optional GitHub metadata such as labels, assignees, milestones, projects, priority, or sprint.
