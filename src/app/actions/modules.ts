/**
 * Module Subscription Server Actions
 * 
 * Handles user module subscription management.
 * 
 * Requirements: 5.1, 8.2
 */

'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { getModuleIds } from '@/modules/registry';

/**
 * Subscribe to a module
 * Adds the module to user's activeModules array
 */
export async function subscribeToModule(moduleId: string) {
  // Verify authentication
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  // Validate module exists
  const validModules = getModuleIds();
  if (!validModules.includes(moduleId)) {
    throw new Error(`Invalid module: ${moduleId}`);
  }

  // Get current user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  // Check if already subscribed
  const currentModules = user.preferences?.activeModules || [];
  if (currentModules.includes(moduleId)) {
    return { success: true, message: 'Already subscribed to this module' };
  }

  // Add module to activeModules in preferences
  const updatedModules = [...currentModules, moduleId];
  const updatedPreferences = {
    ...user.preferences,
    activeModules: updatedModules,
  };

  await db
    .update(users)
    .set({
      preferences: updatedPreferences,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  // Revalidate paths
  revalidatePath('/');
  revalidatePath('/modules');

  return { success: true, message: 'Successfully subscribed to module' };
}

/**
 * Unsubscribe from a module
 * Removes the module from user's activeModules array
 */
export async function unsubscribeFromModule(moduleId: string) {
  // Verify authentication
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  // Get current user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  // Remove module from activeModules in preferences
  const currentModules = user.preferences?.activeModules || [];
  const updatedModules = currentModules.filter((m) => m !== moduleId);
  const updatedPreferences = {
    ...user.preferences,
    activeModules: updatedModules,
  };

  await db
    .update(users)
    .set({
      preferences: updatedPreferences,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  // Revalidate paths
  revalidatePath('/');
  revalidatePath('/modules');

  return { success: true, message: 'Successfully unsubscribed from module' };
}

/**
 * Toggle module subscription
 * Subscribes if not subscribed, unsubscribes if already subscribed
 */
export async function toggleModuleSubscription(moduleId: string) {
  // Verify authentication
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  // Validate module exists
  const validModules = getModuleIds();
  if (!validModules.includes(moduleId)) {
    throw new Error(`Invalid module: ${moduleId}`);
  }

  // Get current user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  // Toggle subscription in preferences
  const currentModules = user.preferences?.activeModules || [];
  const isSubscribed = currentModules.includes(moduleId);

  const updatedModules = isSubscribed
    ? currentModules.filter((m) => m !== moduleId)
    : [...currentModules, moduleId];

  const updatedPreferences = {
    ...user.preferences,
    activeModules: updatedModules,
  };

  await db
    .update(users)
    .set({
      preferences: updatedPreferences,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  // Revalidate paths
  revalidatePath('/');
  revalidatePath('/modules');

  return {
    success: true,
    subscribed: !isSubscribed,
    message: isSubscribed
      ? 'Successfully unsubscribed from module'
      : 'Successfully subscribed to module',
  };
}

/**
 * Get user's active modules
 */
export async function getUserActiveModules() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  const [user] = await db
    .select({ preferences: users.preferences })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  return user.preferences?.activeModules || [];
}
