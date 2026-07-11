import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { agentIdempotencyKeys } from '@/db/schema';
import { requireAgent, type AgentIdentity, type AgentScope } from '@/lib/agent/auth';
import { recordAgentAudit } from '@/lib/agent/audit';
import {
  createBadRequestResponse,
  createConflictResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/api/response';
import { getCardById, getCards, saveCard } from '@/lib/data/cards';
import {
  countQuilts,
  getQuiltById,
  getQuilts,
  saveQuilt,
  updateQuiltStatusWithUsageRecord,
} from '@/lib/data/quilts';
import { getAppSettings, getDatabaseStats, getSystemInfo } from '@/lib/data/settings';
import {
  createUsageRecord,
  getActiveUsageRecord,
  getUsageRecordsWithQuilts,
  updateUsageRecord,
} from '@/lib/data/usage';

const toolSchema = z.object({
  tool: z.enum([
    'quilts.search',
    'quilts.get',
    'quilts.create',
    'quilts.update',
    'quilts.changeStatus',
    'usage.search',
    'usage.create',
    'usage.end',
    'cards.search',
    'cards.get',
    'cards.create',
    'cards.update',
    'settings.read',
  ]),
  input: z.record(z.string(), z.unknown()).default({}),
  dryRun: z.boolean().optional().default(false),
  confirm: z.boolean().optional().default(false),
  idempotencyKey: z.string().trim().min(8).optional(),
});

const quiltSearchSchema = z.object({
  season: z.enum(['WINTER', 'SPRING_AUTUMN', 'SUMMER']).optional(),
  status: z.enum(['IN_USE', 'MAINTENANCE', 'STORAGE']).optional(),
  location: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sortBy: z
    .enum(['itemNumber', 'name', 'season', 'weightGrams', 'createdAt', 'updatedAt'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const quiltWriteSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  season: z.enum(['WINTER', 'SPRING_AUTUMN', 'SUMMER']).optional(),
  lengthCm: z.coerce.number().int().positive().optional(),
  widthCm: z.coerce.number().int().positive().optional(),
  weightGrams: z.coerce.number().int().positive().optional(),
  fillMaterial: z.string().optional(),
  materialDetails: z.string().nullable().optional(),
  color: z.string().optional(),
  brand: z.string().nullable().optional(),
  purchaseDate: z.coerce.date().nullable().optional(),
  location: z.string().optional(),
  packagingInfo: z.string().nullable().optional(),
  currentStatus: z.enum(['IN_USE', 'MAINTENANCE', 'STORAGE']).optional(),
  notes: z.string().nullable().optional(),
  mainImage: z.string().nullable().optional(),
  attachmentImages: z.array(z.string()).nullable().optional(),
});

const quiltStatusSchema = z.object({
  quiltId: z.string().min(1),
  status: z.enum(['IN_USE', 'MAINTENANCE', 'STORAGE']),
  usageType: z
    .enum(['REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION'])
    .optional()
    .default('REGULAR'),
  notes: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const idSchema = z.object({ id: z.string().min(1) });

const usageSearchSchema = z.object({
  quiltId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const usageCreateSchema = z.object({
  quiltId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  usageType: z
    .enum(['REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION'])
    .optional()
    .default('REGULAR'),
  notes: z.string().nullable().optional(),
});

const usageEndSchema = z.object({
  quiltId: z.string().min(1),
  endDate: z.coerce
    .date()
    .optional()
    .default(() => new Date()),
  notes: z.string().optional(),
});

const cardSearchSchema = z.object({
  search: z.string().optional(),
  sport: z.enum(['BASKETBALL', 'SOCCER', 'OTHER']).optional(),
  gradingCompany: z.enum(['UNGRADED', 'PSA', 'BGS', 'SGC', 'CGC']).optional(),
  status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY']).optional(),
  includeSold: z.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

const cardWriteSchema = z.object({
  id: z.string().optional(),
  playerName: z.string().min(1),
  sport: z.enum(['BASKETBALL', 'SOCCER', 'OTHER']),
  team: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  year: z.coerce.number().int().min(1900).max(2100),
  brand: z.string().min(1),
  series: z.string().nullable().optional(),
  cardNumber: z.string().nullable().optional(),
  gradingCompany: z.enum(['UNGRADED', 'PSA', 'BGS', 'SGC', 'CGC']).nullable().optional(),
  grade: z.coerce.number().min(0).max(10).nullable().optional(),
  certificationNumber: z.string().nullable().optional(),
  purchasePrice: z.coerce.number().min(0).nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  currentValue: z.coerce.number().min(0).nullable().optional(),
  estimatedValue: z.coerce.number().min(0).nullable().optional(),
  soldPrice: z.coerce.number().min(0).nullable().optional(),
  soldDate: z.string().nullable().optional(),
  status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY']).nullable().optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  mainImage: z.string().nullable().optional(),
  attachmentImages: z.array(z.string()).nullable().optional(),
});

const scopeByTool: Record<z.infer<typeof toolSchema>['tool'], AgentScope> = {
  'quilts.search': 'read:quilts',
  'quilts.get': 'read:quilts',
  'quilts.create': 'write:quilts',
  'quilts.update': 'write:quilts',
  'quilts.changeStatus': 'write:quilts',
  'usage.search': 'read:usage',
  'usage.create': 'write:usage',
  'usage.end': 'write:usage',
  'cards.search': 'read:cards',
  'cards.get': 'read:cards',
  'cards.create': 'write:cards',
  'cards.update': 'write:cards',
  'settings.read': 'read:settings',
};

const writeTools = new Set([
  'quilts.create',
  'quilts.update',
  'quilts.changeStatus',
  'usage.create',
  'usage.end',
  'cards.create',
  'cards.update',
]);

type ToolRequest = z.infer<typeof toolSchema>;
type ToolSuccessPayload = {
  tool: ToolRequest['tool'];
  dryRun: boolean;
  result: unknown;
  idempotentReplay?: boolean;
};

type IdempotencyReservation =
  | { kind: 'none' }
  | { kind: 'reserved'; inputHash: string }
  | { kind: 'response'; response: ReturnType<typeof createSuccessResponse> };

function validationResponse(error: z.ZodError) {
  return createValidationErrorResponse(
    'Agent tool input validation failed',
    error.flatten().fieldErrors as Record<string, string[]>
  );
}

function requireWriteConfirmation(request: z.infer<typeof toolSchema>) {
  if (!writeTools.has(request.tool)) return null;
  if (request.dryRun) return null;
  if (!request.confirm)
    return createBadRequestResponse('Write tools require confirm=true or dryRun=true');
  if (!request.idempotencyKey) {
    return createBadRequestResponse('Write tools require idempotencyKey');
  }
  return null;
}

function stableStringify(value: unknown): string {
  if (value === undefined) {
    return '"[undefined]"';
  }

  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
}

function hashToolInput(request: ToolRequest) {
  return crypto
    .createHash('sha256')
    .update(stableStringify({ input: request.input, tool: request.tool }))
    .digest('hex');
}

function idempotencyKeyWhere(agentId: string, idempotencyKey: string) {
  return and(
    eq(agentIdempotencyKeys.agentId, agentId),
    eq(agentIdempotencyKeys.idempotencyKey, idempotencyKey)
  );
}

async function reserveIdempotencyKey(
  agentId: string,
  request: ToolRequest
): Promise<IdempotencyReservation> {
  if (!writeTools.has(request.tool) || request.dryRun) {
    return { kind: 'none' };
  }

  const idempotencyKey = request.idempotencyKey;

  if (!idempotencyKey) {
    return { kind: 'none' };
  }

  const inputHash = hashToolInput(request);
  const [inserted] = await db
    .insert(agentIdempotencyKeys)
    .values({
      agentId,
      idempotencyKey,
      toolName: request.tool,
      inputHash,
      status: 'in_progress',
    })
    .onConflictDoNothing({
      target: [agentIdempotencyKeys.agentId, agentIdempotencyKeys.idempotencyKey],
    })
    .returning({ id: agentIdempotencyKeys.id });

  if (inserted) {
    return { kind: 'reserved', inputHash };
  }

  const [existing] = await db
    .select()
    .from(agentIdempotencyKeys)
    .where(idempotencyKeyWhere(agentId, idempotencyKey))
    .limit(1);

  if (!existing) {
    return {
      kind: 'response',
      response: createConflictResponse('Idempotency key could not be reserved'),
    };
  }

  if (existing.toolName !== request.tool || existing.inputHash !== inputHash) {
    return {
      kind: 'response',
      response: createConflictResponse('Idempotency key was already used for a different request'),
    };
  }

  if (existing.status === 'succeeded' && existing.response) {
    const replayPayload = {
      ...existing.response,
      idempotentReplay: true,
    } as ToolSuccessPayload;
    return { kind: 'response', response: createSuccessResponse(replayPayload) };
  }

  return {
    kind: 'response',
    response: createConflictResponse('Idempotency key is already in use or previously failed', {
      status: existing.status,
    }),
  };
}

async function markIdempotencySucceeded(
  agentId: string,
  idempotencyKey: string | undefined,
  payload: ToolSuccessPayload
) {
  if (!idempotencyKey) return;

  await db
    .update(agentIdempotencyKeys)
    .set({
      status: 'succeeded',
      response: payload as Record<string, unknown>,
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(idempotencyKeyWhere(agentId, idempotencyKey));
}

async function markIdempotencyFailed(
  agentId: string,
  idempotencyKey: string | undefined,
  error: unknown
) {
  if (!idempotencyKey) return;

  await db
    .update(agentIdempotencyKeys)
    .set({
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : String(error),
      updatedAt: new Date(),
    })
    .where(idempotencyKeyWhere(agentId, idempotencyKey));
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createBadRequestResponse('Request body must be valid JSON');
  }

  const parsedRequest = toolSchema.safeParse(body);
  if (!parsedRequest.success) return validationResponse(parsedRequest.error);

  const toolRequest = parsedRequest.data;
  const authResult = await requireAgent(request, scopeByTool[toolRequest.tool]);
  if (!authResult.ok) return authResult.response;

  const confirmationError = requireWriteConfirmation(toolRequest);
  if (confirmationError) return confirmationError;

  const idempotencyReservation = await reserveIdempotencyKey(authResult.agent.id, toolRequest);
  if (idempotencyReservation.kind === 'response') {
    await recordAgentAudit({
      agent: authResult.agent,
      toolName: toolRequest.tool,
      action: 'replay',
      success: true,
      metadata: { idempotencyKey: toolRequest.idempotencyKey, input: toolRequest.input },
    });

    return idempotencyReservation.response;
  }

  try {
    const result = await callTool(toolRequest, authResult.agent);
    const payload: ToolSuccessPayload = {
      tool: toolRequest.tool,
      dryRun: toolRequest.dryRun,
      result,
    };

    if (idempotencyReservation.kind === 'reserved') {
      await markIdempotencySucceeded(authResult.agent.id, toolRequest.idempotencyKey, payload);
    }

    await recordAgentAudit({
      agent: authResult.agent,
      toolName: toolRequest.tool,
      action: toolRequest.dryRun ? 'dryRun' : 'execute',
      success: true,
      metadata: { idempotencyKey: toolRequest.idempotencyKey, input: toolRequest.input },
    });

    return createSuccessResponse(payload);
  } catch (error) {
    if (idempotencyReservation.kind === 'reserved') {
      await markIdempotencyFailed(authResult.agent.id, toolRequest.idempotencyKey, error);
    }

    await recordAgentAudit({
      agent: authResult.agent,
      toolName: toolRequest.tool,
      action: toolRequest.dryRun ? 'dryRun' : 'execute',
      success: false,
      metadata: {
        idempotencyKey: toolRequest.idempotencyKey,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

async function callTool(request: z.infer<typeof toolSchema>, agent: AgentIdentity) {
  switch (request.tool) {
    case 'quilts.search': {
      const input = quiltSearchSchema.parse(request.input);
      const [quilts, total] = await Promise.all([getQuilts(input), countQuilts(input)]);
      return { quilts, total };
    }
    case 'quilts.get': {
      const { id } = idSchema.parse(request.input);
      return { quilt: await getQuiltById(id) };
    }
    case 'quilts.create':
    case 'quilts.update': {
      const input = quiltWriteSchema.parse(request.input);
      if (request.tool === 'quilts.create' && input.id)
        throw new Error('Create input cannot include id');
      if (request.tool === 'quilts.update' && !input.id)
        throw new Error('Update input requires id');
      if (request.dryRun) return { planned: input };
      return await saveQuilt(input as Parameters<typeof saveQuilt>[0]);
    }
    case 'quilts.changeStatus': {
      const input = quiltStatusSchema.parse(request.input);
      if (request.dryRun) return { planned: input };
      return await updateQuiltStatusWithUsageRecord(
        input.quiltId,
        input.status,
        input.usageType,
        input.notes,
        {
          startDate: input.startDate,
          endDate: input.endDate,
        }
      );
    }
    case 'usage.search': {
      const input = usageSearchSchema.parse(request.input);
      return { records: await getUsageRecordsWithQuilts(input) };
    }
    case 'usage.create': {
      const input = usageCreateSchema.parse(request.input);
      if (request.dryRun) return { planned: input };
      return { record: await createUsageRecord(input) };
    }
    case 'usage.end': {
      const input = usageEndSchema.parse(request.input);
      if (request.dryRun) return { planned: input };
      const activeRecord = await getActiveUsageRecord(input.quiltId);
      if (!activeRecord) throw new Error('No active usage record for quilt');
      return {
        record: await updateUsageRecord(activeRecord.id, {
          endDate: input.endDate,
          notes: input.notes,
        }),
      };
    }
    case 'cards.search': {
      const input = cardSearchSchema.parse(request.input);
      return await getCards({
        search: input.search,
        filter: {
          ...(input.sport ? { sport: input.sport } : {}),
          ...(input.gradingCompany ? { gradingCompany: input.gradingCompany } : {}),
          ...(input.status ? { status: input.status } : {}),
        },
        includeSold: input.includeSold,
        page: input.page,
        pageSize: input.pageSize,
      });
    }
    case 'cards.get': {
      const { id } = idSchema.parse(request.input);
      return { card: await getCardById(id) };
    }
    case 'cards.create':
    case 'cards.update': {
      const input = cardWriteSchema.parse(request.input);
      if (request.tool === 'cards.create' && input.id)
        throw new Error('Create input cannot include id');
      if (request.tool === 'cards.update' && !input.id) throw new Error('Update input requires id');
      if (request.dryRun) return { planned: input };
      return {
        card: await saveCard({
          ...input,
          ...(request.tool === 'cards.create' ? { userId: agent.userId } : {}),
        }),
      };
    }
    case 'settings.read': {
      const [settings, databaseStats, systemInfo] = await Promise.all([
        getAppSettings(),
        getDatabaseStats(),
        getSystemInfo(),
      ]);
      return { settings, databaseStats, systemInfo };
    }
  }
}
