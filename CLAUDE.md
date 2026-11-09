# Entity Pages — CLAUDE.md

> **Git policy — never auto-commit or auto-push.** Leave work in the working tree.
> Run `git commit`, `git push`, or `gh pr create` **only when the user explicitly
> asks in that turn**. Approval for an earlier change does not carry forward, and
> finishing a task is not permission to commit it. Stay on the current branch; do
> not create feature branches for code changes.

`@sudobility/entity_pages` — React page containers for entity/organization
management (entities, members, invitations, entity API keys), plus a Firebase-auth
app shell. Published library, consumed by downstream apps.

## Stack

- TypeScript + React 18/19, `@tanstack/react-query` v5.
- Bun (package manager + runner). Do **not** use npm/yarn/pnpm to install.
- Build: `tsc` (type-check) → Vite **library mode** → `scripts/fix-esm-imports.mjs`.
- Tests: Vitest + Testing Library, jsdom (config lives in `vite.config.ts`).
- Published to **GitHub Packages** (`.npmrc`: `@sudobility:registry=https://npm.pkg.github.com`).

## Commands (verified in package.json)

```bash
bun install
bun run build         # tsc && vite build && node scripts/fix-esm-imports.mjs
bun run dev           # vite build --watch
bun run type-check    # tsc --noEmit
bun run lint          # eslint .   (also lint:fix)
bun run format        # prettier --write (also format:check)
bun run test:unit     # vitest run   (also test:watch)
```

No `verify`, `clean`, `typecheck`, or bare `test` script. Pre-publish gate:
`bun run type-check && bun run lint && bun run test:unit && bun run build`.

## Architecture

- `src/index.ts` — public entry; re-exports pages (from `src/pages`) and the app
  shell (from `src/app`).
- `src/pages/` — the four page components + their props types:
  `EntityListPage`, `MembersManagementPage`, `InvitationsPage`, `ApiKeysPage`.
  Each takes a `client: EntityClient` and fetches its own data via
  `@sudobility/entity_client` hooks. **There is no shared `PageProps` base.**
  Pages needing an `entity` prop also take `EntityWithRole`.
- `src/app/SudobilityAppWithFirebaseAuthAndEntities.tsx` — wraps
  `@sudobility/building_blocks`' Firebase-auth app shell with
  `CurrentEntityProvider`. Builds an `EntityClient` from `apiUrl` (or
  `VITE_API_URL`); entity calls hit `<apiUrl>/api/v1`. Intentionally
  subscription-agnostic — apps layer their own provider via the `AppProviders`
  slot (renders inside the entity context, can read `useCurrentEntity()`).
- UI comes from `@sudobility/components` and `@sudobility/components/entity`
  (NOT a package called `entity-components`). Design tokens from `@sudobility/design` (`ui`).

## Build / packaging gotchas

- **ESM only.** `vite.config.ts` `lib.formats: ['es']`; `package.json` exports
  only `import` → `dist/index.js`. No CJS/UMD output — do not claim "dual ESM/CJS".
- **`fix-esm-imports.mjs` is required.** `tsc`/Vite emit extensionless relative
  specifiers (`moduleResolution: "bundler"`); this post-build step rewrites them to
  explicit `./x.js` / `./x/index.js` so Node's native ESM loader can resolve them.
  It is idempotent and never fails the build (unresolved specifiers are warnings).
- **Everything is externalized** — React, `react-dom`, `@tanstack/*`,
  `@heroicons/*`, `@revenuecat/*`, and all `@sudobility/*`. Critical for React
  context identity: bundling `@sudobility/building_blocks` or `components` would
  give the shell a different provider instance than the host app. Missing any peer
  surfaces as a confusing error in the consumer.
- **Type-check script is `type-check` (hyphenated).** `bun run typecheck` silently
  does nothing.

## Conventions

- Prettier: single quotes, `jsxSingleQuote`, semicolons, 2-space, width 80,
  `arrowParens: avoid`, `trailingComma: es5`.
- ESLint: most `react-hooks/*` rules and `no-console` are off; `no-explicit-any`
  off; unused vars error unless `_`-prefixed. `.test.*` files are not linted and
  are excluded from the tsconfig build.
- Permission gating mirrors the server: `getPermissionsForRole(entity.userRole)`
  from `@sudobility/types` (e.g. `ApiKeysPage` hides write controls when
  `!canManageApiKeys`). Pages with no `entity` prop leave gating to the caller.
- This package does **not** depend on `entity_service` despite the name — only on
  `@sudobility/entity_client` (hooks) and `@sudobility/components` (UI), which are
  separate repos.

## Publishing

CI (`.github/workflows/ci-cd.yml`) calls `johnqh/workflows` unified-cicd with
`publish-target: github` on push to `main`/`develop`. Do not run `npm publish` by
hand unless asked. `firebase` is an **optional** peer (only the app shell needs it).

## Scope notes

Covers entities, members, invitations, and entity-scoped API keys. App-specific
credentials (LLM provider keys, per-project keys, storage config) stay in the
consuming app. `plans/IMPROVEMENTS.md` holds a (partly stale) backlog — tests now
exist, contrary to its "no tests" note.
