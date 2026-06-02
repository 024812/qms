import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import type { AgentIdentity } from '@/lib/agent/auth';

interface AgentAuditInput {
  agent: AgentIdentity;
  toolName: string;
  action: string;
  success: boolean;
  metadata?: Record<string, unknown>;
}

export async function recordAgentAudit(input: AgentAuditInput) {
  try {
    await db.insert(auditLogs).values({
      userId: null,
      eventType: input.success ? 'access_granted' : 'access_denied',
      resource: 'agent',
      action: input.action,
      success: input.success ? 'true' : 'false',
      reason: input.toolName,
      metadata: {
        actorType: 'agent',
        agentId: input.agent.id,
        scopes: input.agent.scopes,
        toolName: input.toolName,
        ...(input.metadata ?? {}),
      },
    });
  } catch (error) {
    console.error('[AgentAudit] Failed to record audit log:', error);
  }
}
