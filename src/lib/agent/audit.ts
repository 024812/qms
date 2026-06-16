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

/**
 * Field names whose values can be large base64/data-URL blobs. These are
 * redacted from audit metadata to keep the audit_logs table from bloating.
 */
const REDACTED_FIELDS = new Set([
  'mainImage',
  'frontImage',
  'backImage',
  'attachmentImages',
  'thumbnailUrl',
  'imageUrl',
  'base64Data',
]);

const MAX_STRING_LENGTH = 512;

/**
 * Recursively sanitize audit metadata: redact known image fields and truncate
 * any oversized strings (e.g. inline base64) so audit entries stay compact.
 */
function sanitizeAuditValue(value: unknown, key?: string): unknown {
  if (key && REDACTED_FIELDS.has(key)) {
    return '[redacted]';
  }

  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}…[truncated ${value.length} chars]`
      : value;
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeAuditValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [
        childKey,
        sanitizeAuditValue(childValue, childKey),
      ])
    );
  }

  return value;
}

export async function recordAgentAudit(input: AgentAuditInput) {
  try {
    const sanitizedMetadata = sanitizeAuditValue(input.metadata ?? {}) as Record<string, unknown>;

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
        ...sanitizedMetadata,
      },
    });
  } catch (error) {
    console.error('[AgentAudit] Failed to record audit log:', error);
  }
}
