import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardContent } from './DashboardContent';
import { WelcomePage } from './WelcomePage';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const activeModules = (session.user.activeModules as string[]) || [];

  // Show welcome page for all users
  return <WelcomePage />;
}
