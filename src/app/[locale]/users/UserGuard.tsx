import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { UserManagementClient } from './UserManagementClient';

export async function UserGuard() {
  // Note: connection() is called at page level, so this component is already dynamic
  const session = await auth();


  // Redirect non-admins
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  return <UserManagementClient currentUserId={session.user.id} />;
}
