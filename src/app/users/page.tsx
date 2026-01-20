/**
 * User Management Page
 *
 * Admin-only page for managing system users.
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { UserManagementClient } from './UserManagementClient';

export default async function UsersPage() {
  const session = await auth();

  // Redirect non-admins
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  return <UserManagementClient currentUserId={session.user.id} />;
}
