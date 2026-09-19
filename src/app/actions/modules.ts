/**
 * Module Subscription Server Actions
 *
 * Thin authorization + validation layer. All reads and writes go through the users
 * DAL (`src/lib/data/users.ts`), which owns the transaction, the row lock and cache
 * invalidation — this module must not touch `db` directly (blueprint §6.2).
 *
 * Requirements: 5.1, 8.2
 */

'use server';

import { auth } from '@/auth';
import {
  getUserActiveModules as getUserActiveModulesData,
  setUserModuleSubscription,
  type ModuleSubscriptionAction,
} from '@/lib/data/users';
import { isRegisteredModuleId, type RegisteredModuleId } from '@/modules/module-ids';

async function requireUserId(): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  return session.user.id;
}

function assertRegisteredModule(moduleId: string): asserts moduleId is RegisteredModuleId {
  if (!isRegisteredModuleId(moduleId)) {
    throw new Error(`Invalid module: ${moduleId}`);
  }
}

function describe(action: ModuleSubscriptionAction, subscribed: boolean): string {
  if (action === 'subscribe') return 'Successfully subscribed to module';
  if (action === 'unsubscribe') return 'Successfully unsubscribed from module';
  return subscribed ? 'Successfully subscribed to module' : 'Successfully unsubscribed from module';
}

/**
 * Subscribe to a module.
 *
 * Adds the module to the user's UI/data access list. This is deliberately not an Agent
 * write grant; Agent write authorization is reserved for admins.
 */
export async function subscribeToModule(moduleId: string) {
  const userId = await requireUserId();
  assertRegisteredModule(moduleId);

  const result = await setUserModuleSubscription(userId, moduleId, 'subscribe');

  return {
    success: true as const,
    message: result.changed
      ? describe('subscribe', true)
      : 'Already subscribed to this module',
  };
}

/**
 * Unsubscribe from a module.
 */
export async function unsubscribeFromModule(moduleId: string) {
  const userId = await requireUserId();
  assertRegisteredModule(moduleId);

  const result = await setUserModuleSubscription(userId, moduleId, 'unsubscribe');

  return {
    success: true as const,
    message: result.changed
      ? describe('unsubscribe', false)
      : 'Already unsubscribed from this module',
  };
}

/**
 * Toggle module subscription.
 *
 * Subscribes if not subscribed, unsubscribes if already subscribed. The current state is
 * read inside the DAL transaction, so the reported `subscribed` value reflects the
 * committed state rather than a value read before the write.
 */
export async function toggleModuleSubscription(moduleId: string) {
  const userId = await requireUserId();
  assertRegisteredModule(moduleId);

  const result = await setUserModuleSubscription(userId, moduleId, 'toggle');

  return {
    success: true as const,
    subscribed: result.subscribed,
    message: describe('toggle', result.subscribed),
  };
}

/**
 * Get the current user's active modules.
 */
export async function getUserActiveModules(): Promise<string[]> {
  return getUserActiveModulesData(await requireUserId());
}
