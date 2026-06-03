# Project: E-Commerce Microservices

A modern e-commerce platform built with a microservices architecture.

## Tech Stack
- **Monorepo Management:** [Turborepo](https://turbo.build/) with [pnpm](https://pnpm.io/) workspaces.
- **Backend:** [NestJS](https://nestjs.com/) (TypeScript).
- **Frontend:** [Next.js](https://nextjs.org/) (TypeScript).
- **Database:** PostgreSQL with [TypeORM](https://typeorm.io/).
- **Observability:** Grafana, Prometheus, Loki.
- **Deployment:** [Render](https://render.com/).

## Architecture & Services
### Apps (`/apps`)
- **api-gateway:** The entry point for all client requests, handling routing and authentication.
- **web:** The main consumer-facing Next.js application.
    - **Feature-Based Architecture:** Uses a modular `/features` directory. Each feature (e.g., `products`, `auth`, `cart`) should follow this structure:
        - `api/`: TanStack Query hooks (queries and mutations).
        - `components/`: Feature-specific UI components.
        - `services/`: Business logic and API client calls.
        - `utils/`: Helper functions specific to the feature.
        - `types.ts`: Feature-specific TypeScript definitions.
- **user-service:** Manages user profiles, authentication, and authorization.
- **catalog-service:** Handles product catalog, categories, and inventory.
- **order-service:** Manages order placement, processing, and history.
- **payment-service:** Integrates with payment providers and tracks transactions.
- **docs:** Internal documentation site.

### Shared Packages (`/packages`)
- **auth:** Shared authentication logic and guards.
- **common:** Utility functions, constants, and shared types.
- **contracts:** API definitions and DTOs shared between services.
- **database:** TypeORM entities and database connection logic.
- **ui:** Shared React components for the frontend.
- **eslint-config / typescript-config:** Standardized linting and TS configurations.

## Reference Documentation
- **PRDs & Design:** See the `/prd` directory for detailed requirements, system design, and API specs.

---

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
5. always create markdown file with plan and checklist of tasks and short explanation on why did you decide those changes. mark as complete one by one you complete them.

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

Misc rules:
When using shell use ";" instead of && cus it is a powershell or cmd terminal that gemini uses.

