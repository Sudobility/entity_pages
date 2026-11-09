# @sudobility/entity_pages

Page containers for entity/organization management in React web applications.

## Installation

`@sudobility/*` packages are published to GitHub Packages, so the scope must be
pointed at that registry (this repo's `.npmrc` already does so for local work):

```
@sudobility:registry=https://npm.pkg.github.com
```

```bash
bun add @sudobility/entity_pages
```

This package ships **ESM only**. It externalizes React, `@tanstack/*`,
`@heroicons/*`, `@revenuecat/*`, and every `@sudobility/*` peer, so the consuming
app must provide a single copy of each (see Peer Dependencies).

## Usage

```tsx
import {
  EntityListPage,
  MembersManagementPage,
  InvitationsPage,
  ApiKeysPage,
} from '@sudobility/entity_pages';
import { EntityClient } from '@sudobility/entity_client';

const client = new EntityClient({ baseUrl, networkClient });

// In your router
<Route path="/workspaces" element={
  <EntityListPage client={client} onSelectEntity={handleSelect} />
} />
<Route path="/workspaces/:slug/members" element={
  <MembersManagementPage client={client} entity={entity} currentUserId={userId} />
} />
<Route path="/invitations" element={
  <InvitationsPage client={client} />
} />
<Route path="/workspaces/:slug/api-keys" element={
  <ApiKeysPage client={client} entity={entity} />
} />
```

## API

### Pages

| Component | Description |
|-----------|-------------|
| `EntityListPage` | List and select the user's entities |
| `MembersManagementPage` | View members, change roles, remove members |
| `InvitationsPage` | Accept or decline invitations addressed to the user |
| `ApiKeysPage` | Create, rename, deactivate, and revoke entity API keys |

Each page is exported alongside its props type (`EntityListPageProps`,
`MembersManagementPageProps`, `InvitationsPageProps`, `ApiKeysPageProps`).

### App shell

The package also exports an app wrapper that layers an entity context on top of
`@sudobility/building_blocks`' Firebase-auth app shell:

```tsx
import {
  SudobilityAppWithFirebaseAuthAndEntities,
  useCurrentEntity,
} from '@sudobility/entity_pages';

<SudobilityAppWithFirebaseAuthAndEntities i18n={i18n} apiUrl="https://api.myapp.com">
  <Routes>{/* ... */}</Routes>
</SudobilityAppWithFirebaseAuthAndEntities>
```

It builds an `EntityClient` from the app's network client (`apiUrl` or the
`VITE_API_URL` env var; entity calls hit `<apiUrl>/api/v1`) and wires
`CurrentEntityProvider` to the signed-in user. It is deliberately
subscription-agnostic: an app layers its own subscription provider through the
`AppProviders` slot, which renders inside the entity context and can read
`useCurrentEntity()`. Exported alongside its props type
(`SudobilityAppWithFirebaseAuthAndEntitiesProps`) and `useCurrentEntity`.

### Props

Every page takes an `EntityClient` and fetches its own data through
`@sudobility/entity_client` hooks. There is no shared `PageProps` base.

```typescript
interface EntityListPageProps {
  /** Entity API client */
  client: EntityClient;
  /** Handler for selecting an entity */
  onSelectEntity?: (entity: EntityWithRole) => void;
  /** Handler for navigating to entity settings */
  onNavigateToSettings?: (entitySlug: string) => void;
}

interface MembersManagementPageProps {
  client: EntityClient;
  /** Entity to manage */
  entity: EntityWithRole;
  /** Current user's ID */
  currentUserId: string;
}

interface InvitationsPageProps {
  client: EntityClient;
  /** Callback when an invitation is accepted */
  onInvitationAccepted?: () => void;
}

interface ApiKeysPageProps {
  client: EntityClient;
  /** Entity whose keys are managed */
  entity: EntityWithRole;
}
```

### API Keys

`ApiKeysPage` manages entity-scoped keys -- credentials that authenticate a
caller as the entity itself, for CI jobs, scripts, and integrations that should
outlive any individual member. The server stores only a hash, so a new key's
secret appears once in a one-time reveal panel and cannot be retrieved again.

The page derives its own gating from the member's role via
`getPermissionsForRole(entity.userRole).canManageApiKeys`: Owners and Managers
get create, rename, activate/deactivate, and revoke; Members see the list
read-only.

### Scope

These pages cover entities, members, invitations, and entity API keys.
Application-specific credentials stay in the consuming app: LLM provider keys,
per-project keys, and cloud storage configuration differ in shape and API
surface from one product to the next.

`entity_service` derives an `EntityPermissions` set from the member's role
(Owner > Manager > Member) and enforces it server-side. `ApiKeysPage` mirrors
that check client-side to hide controls the API would reject; pages that take
no `entity` prop leave gating to the caller.

### Peer Dependencies

Required in the consuming app (all externalized by the build):

- `react` / `react-dom` >= 18 (|| 19)
- `@tanstack/react-query` >= 5
- `@sudobility/types` -- shared type definitions
- `@sudobility/entity_client` -- data hooks + `EntityClient`
- `@sudobility/components` -- UI components (pages import from
  `@sudobility/components` and `@sudobility/components/entity`)
- `@sudobility/building_blocks` -- app shell / Firebase auth (for the app wrapper)
- `@sudobility/auth_lib` -- auth hooks
- `@sudobility/design` -- design tokens (`ui`)
- `@heroicons/react` >= 2.2
- `firebase` >= 11 (|| 12) -- **optional**; only needed for the app wrapper

## Development

```bash
bun install           # Install dependencies
bun run build         # tsc + vite (lib build) + fix-esm-imports -> dist/
bun run dev           # vite build --watch (rebuild on change)
bun run type-check    # tsc --noEmit  (note: hyphenated, NOT `typecheck`)
bun run lint          # ESLint
bun run lint:fix      # ESLint --fix
bun run format        # Prettier write
bun run format:check  # Prettier check
bun run test:unit     # Vitest (run once)
bun run test:watch    # Vitest (watch mode)
```

There is no single `verify` script. Before publishing, run:

```bash
bun run type-check && bun run lint && bun run test:unit && bun run build
```

## License

BUSL-1.1
