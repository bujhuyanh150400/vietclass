# Output Format

ALWAYS use this exact structure for the review Markdown file:

```markdown
## Code Review: `<branch-name>` (`<short-hash>`)

**Branch:** `<branch-name>` | **Commits:** <count> | **Type:** <feature/fix/docs/refactor>

| Commit | Message |
|--------|---------|
| `<hash>` | <message> |

**Files changed:** <summary>

---

### Summary

<1-3 sentences: what this branch does>

---

### Good

- <strength 1>
- <strength 2>

---

### Findings

#### 1. <finding title>

> ![<Priority> Priority](https://www.gstatic.com/codereviewagent/<priority>-priority.svg)

**`<file>` L<line>**

<explanation with code snippets if relevant>

---

#### 2. <next finding>

(repeat for each finding)

---

### Summary

| Category | Status |
|----------|--------|
| <category> | :white_check_mark: Pass / :yellow_circle: Minor / :red_circle: Blocker |

**Recommendation:** <Approve / Approve with comments / Request changes>
```

## Badge URLs

- High: `https://www.gstatic.com/codereviewagent/high-priority.svg`
- Medium: `https://www.gstatic.com/codereviewagent/medium-priority.svg`
- Low: `https://www.gstatic.com/codereviewagent/low-priority.svg`
