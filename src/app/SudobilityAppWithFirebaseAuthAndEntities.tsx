/**
 * SudobilityAppWithFirebaseAuthAndEntities - App wrapper with Firebase auth and entity support
 *
 * Extends building_blocks' SudobilityAppWithFirebaseAuth with a
 * CurrentEntityProvider (entity_client) wired to the signed-in user, so the app
 * knows the current organization/workspace.
 *
 * This wrapper is intentionally subscription-agnostic: entities and
 * subscriptions are independent concerns, so entity_pages has NO dependency on
 * @sudobility/subscription_pages. An app that wants entity-aware subscriptions
 * layers its own provider via `AppProviders` — that slot renders INSIDE the
 * entity context, so it can read `useCurrentEntity()` and drive RevenueCat.
 */
import { ComponentType, ReactNode, useMemo } from 'react';
import {
  SudobilityAppWithFirebaseAuth,
  type SudobilityAppWithFirebaseAuthProps,
  useApiSafe,
} from '@sudobility/building_blocks/firebase';
import { useAuthUser } from '@sudobility/auth_lib/auth-js';
import {
  CurrentEntityProvider,
  EntityClient,
  useCurrentEntity,
} from '@sudobility/entity_client';

// Re-exported for apps that compose their own entity-aware subscription
// provider in `AppProviders`.
export { useCurrentEntity };

export interface SudobilityAppWithFirebaseAuthAndEntitiesProps extends Omit<
  SudobilityAppWithFirebaseAuthProps,
  'AppProviders' | 'RouterWrapper'
> {
  /**
   * Base URL for the API (optional).
   * Defaults to VITE_API_URL env var.
   * Used for both ApiProvider and EntityClient.
   *
   * @example "https://api.myapp.com"
   */
  apiUrl?: string;

  /**
   * @deprecated Use apiUrl instead. Will be removed in future version.
   */
  entityApiUrl?: string;

  /**
   * Custom AuthAwareEntityProvider component (optional).
   * Defaults to a built-in provider that builds an EntityClient from the
   * ApiProvider's network client when `apiUrl`/`entityApiUrl` is provided.
   */
  AuthAwareEntityProvider?: ComponentType<{ children: ReactNode }>;

  /**
   * Additional providers rendered INSIDE the entity context but outside
   * BrowserRouter. Use this to layer app-specific providers such as an
   * entity-aware subscription provider (reading `useCurrentEntity()`).
   */
  AppProviders?: ComponentType<{ children: ReactNode }>;

  /**
   * Custom router wrapper component (optional).
   * Defaults to BrowserRouter. Pass a fragment wrapper `({ children }) => <>{children}</>`
   * to skip the router entirely (useful when nesting inside an existing router).
   */
  RouterWrapper?: ComponentType<{ children: ReactNode }>;
}

/**
 * Default AuthAwareEntityProvider using CurrentEntityProvider
 */
function DefaultAuthAwareEntityProvider({
  children,
  entityClient,
}: {
  children: ReactNode;
  entityClient: EntityClient;
}) {
  const user = useAuthUser();
  const authUser = useMemo(
    () => (user ? { uid: user.uid, email: user.email } : null),
    [user]
  );

  return (
    <CurrentEntityProvider client={entityClient} user={authUser}>
      {children}
    </CurrentEntityProvider>
  );
}

/**
 * SudobilityAppWithFirebaseAuthAndEntities - entity-aware app wrapper
 *
 * @example
 * ```tsx
 * import { SudobilityAppWithFirebaseAuthAndEntities } from '@sudobility/entity_pages';
 * import i18n from './i18n';
 *
 * function App() {
 *   return (
 *     <SudobilityAppWithFirebaseAuthAndEntities
 *       i18n={i18n}
 *       apiUrl="https://api.myapp.com"
 *       AppProviders={EntityAwareSubscriptionProvider} // app-owned, optional
 *     >
 *       <Routes>
 *         <Route path="/" element={<HomePage />} />
 *       </Routes>
 *     </SudobilityAppWithFirebaseAuthAndEntities>
 *   );
 * }
 * ```
 */
export function SudobilityAppWithFirebaseAuthAndEntities({
  apiUrl,
  entityApiUrl, // deprecated, use apiUrl
  AuthAwareEntityProvider: AuthAwareEntityProviderProp,
  AppProviders,
  RouterWrapper,
  testMode = false,
  ...baseProps
}: SudobilityAppWithFirebaseAuthAndEntitiesProps) {
  // Get API URL from prop or env var
  // Support deprecated entityApiUrl for backwards compatibility
  const baseApiUrl = apiUrl || import.meta.env.VITE_API_URL || '';
  const entityUrl = entityApiUrl || (baseApiUrl ? `${baseApiUrl}/api/v1` : '');

  // Create a combined providers component that includes entity support
  // This renders inside ApiProvider, so useApiSafe() is available
  const EntityProviders: ComponentType<{ children: ReactNode }> = ({
    children,
  }) => {
    const api = useApiSafe();
    const entityClient = useMemo(
      () =>
        entityUrl && api?.networkClient
          ? new EntityClient({
              baseUrl: entityUrl,
              networkClient: api.networkClient,
            })
          : null,
      [api?.networkClient]
    );

    let content = children;

    // Wrap with AppProviders if provided (innermost — inside the entity context)
    if (AppProviders) {
      content = <AppProviders>{content}</AppProviders>;
    }

    // Wrap with AuthAwareEntityProvider (custom or default)
    if (AuthAwareEntityProviderProp) {
      return (
        <AuthAwareEntityProviderProp>{content}</AuthAwareEntityProviderProp>
      );
    }

    // Use default if entityClient is available
    if (entityClient) {
      return (
        <DefaultAuthAwareEntityProvider entityClient={entityClient}>
          {content}
        </DefaultAuthAwareEntityProvider>
      );
    }

    // No entity support if no entityApiUrl or custom provider
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[SudobilityAppWithFirebaseAuthAndEntities] No entityApiUrl or AuthAwareEntityProvider provided. ' +
          'Entity features are disabled. Provide apiUrl or AuthAwareEntityProvider to enable them.'
      );
    }
    return <>{content}</>;
  };

  return (
    <SudobilityAppWithFirebaseAuth
      {...baseProps}
      baseUrl={baseApiUrl}
      testMode={testMode}
      AppProviders={EntityProviders}
      RouterWrapper={RouterWrapper}
    />
  );
}

export default SudobilityAppWithFirebaseAuthAndEntities;
