import type { AppSession } from '@/auth';
import { notFound } from 'next/navigation';

export class ModuleAccessError extends Error {
  readonly code = 'MODULE_ACCESS_DENIED';

  constructor(public readonly moduleId: string) {
    super(`Access to module "${moduleId}" is denied`);
    this.name = 'ModuleAccessError';
  }
}

export function hasModuleAccess(session: AppSession | null | undefined, moduleId: string): boolean {
  if (!session?.user) return false;
  return session.user.role === 'admin' || session.user.activeModules.includes(moduleId);
}

export function requireModuleAccess(
  session: AppSession | null | undefined,
  moduleId: string
): AppSession {
  if (!hasModuleAccess(session, moduleId)) throw new ModuleAccessError(moduleId);
  return session as AppSession;
}

export function requirePageModuleAccess(
  session: AppSession | null | undefined,
  moduleId: string
): AppSession {
  if (!hasModuleAccess(session, moduleId)) notFound();
  return session as AppSession;
}
