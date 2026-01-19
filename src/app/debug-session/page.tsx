/**
 * Debug Session Page
 * 
 * Displays complete session data for debugging
 */

'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugSessionPage() {
  const { data: session, status } = useSession();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Session Debug Info</h1>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Status</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto">
                {status}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(session, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {session?.user && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>User Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>ID:</strong> {session.user.id}</p>
                    <p><strong>Name:</strong> {session.user.name}</p>
                    <p><strong>Email:</strong> {session.user.email}</p>
                    <p><strong>Role:</strong> {session.user.role}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Modules</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(session.user.activeModules, null, 2)}
                  </pre>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Count: {session.user.activeModules?.length || 0}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
