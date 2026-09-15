---
name: review-code
description: Branch code review with Markdown output for GitHub PR comments. Use when the user asks to review a branch, review a PR, review code changes, or generate a code review. Triggers on phrases like "review", "code review", "review this branch", "review PR", "/review".
---

# Code Review

Review the current branch against `main` and generate a Markdown file for GitHub PR comments.

## Workflow

1. **Identify the branch**
   - If a branch name is provided, `git checkout` to that branch
   - Otherwise use the current branch
   - Run these git commands to gather context:
     ```bash
     git log main..HEAD --oneline
     git diff main..HEAD --stat
     git diff main..HEAD
     git diff
     ```

2. **Analyze changes**
   - Read the full diff — understand every change
   - Read full files when additional context is needed
   - Compare against the original on `main` when helpful (`git show main:<file>`)
   - Check for uncommitted changes (debugging leftovers, hardcoded secrets)

3. **Write the review** using the output format in [references/output-format.md](references/output-format.md)

4. **Save to file**
   - Write to `review-<branch-name>.md` in the project root
   - Tell the user the file path
   - Remind them to `rm` the file after copying

## Review Criteria (priority order)

1. **Security** — hardcoded secrets, injection, auth issues, OWASP top 10
2. **Correctness** — logic errors, edge cases, data integrity
3. **Project conventions** — coding style, naming, commits per CLAUDE.md
4. **Performance** — N+1 queries, unnecessary writes, missing indexes
5. **Test coverage** — missing tests for new functionality
6. **Documentation** — accuracy, frontmatter, index registration

## Priority Badges

Each finding MUST have exactly one badge:

- High: `> ![High Priority](https://www.gstatic.com/codereviewagent/high-priority.svg)`
- Medium: `> ![Medium Priority](https://www.gstatic.com/codereviewagent/medium-priority.svg)`
- Low: `> ![Low Priority](https://www.gstatic.com/codereviewagent/low-priority.svg)`

## Rules

- Every finding must be actionable with file path and line number
- Use code blocks for specific suggestions
- Flag uncommitted debugging leftovers or secrets as blockers
- Do NOT invent issues — only report what exists in the diff
- Keep "Good" section genuine — highlight real strengths
- If no findings, say so explicitly
