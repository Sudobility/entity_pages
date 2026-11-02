/**
 * @fileoverview Entity Pages Library
 * @description Page containers for entity/organization management
 *
 * @example
 * ```tsx
 * import {
 *   EntityListPage,
 *   MembersManagementPage,
 *   InvitationsPage,
 * } from '@sudobility/entity_pages';
 *
 * function WorkspacesRoute() {
 *   return (
 *     <EntityListPage
 *       client={entityClient}
 *       onSelectEntity={handleSelectEntity}
 *     />
 *   );
 * }
 * ```
 */

export {
  EntityListPage,
  type EntityListPageProps,
  MembersManagementPage,
  type MembersManagementPageProps,
  InvitationsPage,
  type InvitationsPageProps,
  ApiKeysPage,
  type ApiKeysPageProps,
} from './pages';

// Firebase-auth app shell with entity wiring (subscription-agnostic).
// Moved here from @sudobility/building_blocks (which must not depend on
// entity_client). Requires @sudobility/building_blocks as a peer. Entities and
// subscriptions are independent: an app layers its own subscription provider via
// the wrapper's `AppProviders` slot (which renders inside the entity context).
export {
  SudobilityAppWithFirebaseAuthAndEntities,
  type SudobilityAppWithFirebaseAuthAndEntitiesProps,
  useCurrentEntity,
} from './app';
