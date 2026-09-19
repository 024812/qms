import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { agentIdempotencyKeys } from '@/db/schema';
import { requireAgent, type AgentIdentity, type AgentScope } from '@/lib/agent/auth';
import { recordAgentAudit } from '@/lib/agent/audit';
import { AGENT_TOOL_NAMES } from '@/lib/agent/tool-names';
import { rateLimiters } from '@/lib/rate-limit';
import {
  createBadRequestResponse,
  createConflictResponse,
  createInternalErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/api/response';
import { zodFieldErrors } from '@/lib/api/action-result';
import { getCardById, getCards, saveCard } from '@/lib/data/cards';
import {
  countAntiques,
  createAntique,
  getAntiques,
  getAntiqueById,
  updateAntique,
} from '@/lib/data/antiques';
import { countMaps, createMap, getMapById, getMaps, updateMap } from '@/lib/data/maps';
import {
  countPaddles,
  createPaddle,
  getPaddleById,
  getPaddles,
  updatePaddle,
} from '@/lib/data/paddles';
import {
  countSpirits,
  createSpirit,
  getSpiritById,
  getSpirits,
  updateSpirit,
} from '@/lib/data/spirits';
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
import { attachmentImagesSchema, imageReferenceSchema } from '@/lib/validations/image';
import { QUILT_STATUSES } from '@/lib/validations/quilt';

const MAX_AGENT_REQUEST_CHARS = 1024 * 1024;

const toolSchema = z.object({
  tool: z.enum(AGENT_TOOL_NAMES),
  input: z.record(z.string(), z.unknown()).default({}),
  dryRun: z.boolean().optional().default(false),
  confirm: z.boolean().optional().default(false),
  idempotencyKey: z.string().trim().min(8).optional(),
});

const quiltSearchSchema = z.object({
  season: z.enum(['WINTER', 'SPRING_AUTUMN', 'SUMMER']).optional(),
  status: z.enum(QUILT_STATUSES).optional(),
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
  currentStatus: z.enum(QUILT_STATUSES).optional(),
  notes: z.string().nullable().optional(),
  mainImage: imageReferenceSchema.nullable().optional(),
  attachmentImages: attachmentImagesSchema.nullable().optional(),
});

const quiltStatusSchema = z.object({
  quiltId: z.string().min(1),
  status: z.enum(QUILT_STATUSES),
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
  mainImage: imageReferenceSchema.nullable().optional(),
  attachmentImages: attachmentImagesSchema.nullable().optional(),
});

const paddleSearchSchema = z.object({
  status: z.enum(['ACTIVE', 'RETIRED', 'FOR_SALE', 'SOLD', 'DISPLAY']).optional(),
  bladeBrand: z.string().optional(),
  handleType: z.enum(['FL', 'ST', 'CS', 'AN']).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sortBy: z
    .enum(['itemNumber', 'name', 'bladeBrand', 'bladeWeightG', 'createdAt', 'updatedAt'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const paddleWriteSchema = z.object({
  name: z.string().min(1),
  bladeBrand: z.string().nullable().optional(),
  bladeModel: z.string().nullable().optional(),
  bladeWeightG: z.coerce.number().positive().max(250).nullable().optional(),
  thicknessMm: z.coerce.number().positive().max(20).nullable().optional(),
  handleType: z.enum(['FL', 'ST', 'CS', 'AN']).nullable().optional(),
  forehandRubber: z.string().nullable().optional(),
  backhandRubber: z.string().nullable().optional(),
  rubberThicknessMm: z.coerce.number().min(0.5).max(4).nullable().optional(),
  bladeSpeed: z.coerce.number().int().min(1).max(10).nullable().optional(),
  bladeControl: z.coerce.number().int().min(1).max(10).nullable().optional(),
  purchaseDate: z.coerce.date().nullable().optional(),
  purchasePrice: z.coerce.number().min(0).nullable().optional(),
  acquiredFrom: z.string().nullable().optional(),
  currentValue: z.coerce.number().min(0).nullable().optional(),
  soldPrice: z.coerce.number().min(0).nullable().optional(),
  soldDate: z.coerce.date().nullable().optional(),
  status: z.enum(['ACTIVE', 'RETIRED', 'FOR_SALE', 'SOLD', 'DISPLAY']).optional(),
  condition: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  mainImage: imageReferenceSchema.nullable().optional(),
  attachmentImages: attachmentImagesSchema.nullable().optional(),
});

const paddleUpdateSchema = paddleWriteSchema.partial().extend({ id: z.string().min(1) });

const antiqueSearchSchema = z.object({
  category: z
    .enum(['JADE', 'WOOD', 'CERAMIC', 'METAL', 'STONE', 'PAPER', 'TOOL', 'OTHER'])
    .optional(),
  status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'DISPLAY', 'APPRAISAL']).optional(),
  era: z.string().optional(),
  dynasty: z.string().optional(),
  search: z.string().optional(),
  minValue: z.coerce.number().min(0).optional(),
  maxValue: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sortBy: z
    .enum(['itemNumber', 'name', 'category', 'currentValue', 'createdAt', 'updatedAt'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const antiqueWriteSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['JADE', 'WOOD', 'CERAMIC', 'METAL', 'STONE', 'PAPER', 'TOOL', 'OTHER']),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  subCategory: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  bladeSteel: z.string().nullable().optional(),
  handleMaterial: z.string().nullable().optional(),
  lockType: z.string().nullable().optional(),
  setGroup: z.string().nullable().optional(),
  era: z.string().nullable().optional(),
  dynasty: z.string().nullable().optional(),
  lengthCm: z.coerce.number().positive().nullable().optional(),
  widthCm: z.coerce.number().positive().nullable().optional(),
  heightCm: z.coerce.number().positive().nullable().optional(),
  weightG: z.coerce.number().positive().nullable().optional(),
  condition: z.string().nullable().optional(),
  certificate: z.string().nullable().optional(),
  appraisalDate: z.coerce.date().nullable().optional(),
  appraisalBy: z.string().nullable().optional(),
  purchasePrice: z.coerce.number().min(0).nullable().optional(),
  acquiredFrom: z.string().nullable().optional(),
  acquiredDate: z.coerce.date().nullable().optional(),
  currentValue: z.coerce.number().min(0).nullable().optional(),
  estimatedValue: z.coerce.number().min(0).nullable().optional(),
  soldPrice: z.coerce.number().min(0).nullable().optional(),
  soldDate: z.coerce.date().nullable().optional(),
  status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'DISPLAY', 'APPRAISAL']).optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  mainImage: imageReferenceSchema.nullable().optional(),
  attachmentImages: attachmentImagesSchema.nullable().optional(),
});

const antiqueUpdateSchema = antiqueWriteSchema.partial().extend({ id: z.string().min(1) });

const mapSearchSchema = z.object({
  mapType: z
    .enum([
      'TOPOGRAPHIC',
      'ROAD',
      'CITY',
      'HISTORICAL',
      'THEMATIC',
      'NAUTICAL',
      'AERONAUTICAL',
      'ATLAS',
      'OTHER',
    ])
    .optional(),
  status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'DISPLAY', 'FRAMED']).optional(),
  material: z.enum(['PAPER', 'CLOTH', 'DIGITAL', 'OTHER']).optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sortBy: z
    .enum(['itemNumber', 'name', 'mapType', 'publishedYear', 'createdAt', 'updatedAt'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const mapWriteSchema = z.object({
  name: z.string().min(1),
  mapType: z.enum([
    'TOPOGRAPHIC',
    'ROAD',
    'CITY',
    'HISTORICAL',
    'THEMATIC',
    'NAUTICAL',
    'AERONAUTICAL',
    'ATLAS',
    'OTHER',
  ]),
  scale: z.string().nullable().optional(),
  publishedYear: z.coerce
    .number()
    .int()
    .min(1400)
    .max(new Date().getFullYear())
    .nullable()
    .optional(),
  publishedMonth: z.coerce.number().int().min(1).max(12).nullable().optional(),
  printYear: z.coerce.number().int().min(1400).max(new Date().getFullYear()).nullable().optional(),
  printMonth: z.coerce.number().int().min(1).max(12).nullable().optional(),
  publisher: z.string().nullable().optional(),
  series: z.string().nullable().optional(),
  isbn: z.string().nullable().optional(),
  originalPrice: z.coerce.number().min(0).nullable().optional(),
  material: z.enum(['PAPER', 'CLOTH', 'DIGITAL', 'OTHER']).optional(),
  widthCm: z.coerce.number().positive().nullable().optional(),
  heightCm: z.coerce.number().positive().nullable().optional(),
  country: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  isOriginal: z.boolean().optional(),
  edition: z.string().nullable().optional(),
  acquiredDate: z.coerce.date().nullable().optional(),
  purchasePrice: z.coerce.number().min(0).nullable().optional(),
  currentValue: z.coerce.number().min(0).nullable().optional(),
  status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'DISPLAY', 'FRAMED']).optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  mainImage: imageReferenceSchema.nullable().optional(),
  attachmentImages: attachmentImagesSchema.nullable().optional(),
});

const mapUpdateSchema = mapWriteSchema.partial().extend({ id: z.string().min(1) });

const spiritSearchSchema = z.object({
  spiritType: z
    .enum([
      'WHISKY',
      'COGNAC',
      'BRANDY',
      'RUM',
      'VODKA',
      'GIN',
      'TEQUILA',
      'BAIJIU',
      'WINE',
      'OTHER',
    ])
    .optional(),
  status: z.enum(['COLLECTION', 'AGING', 'FOR_SALE', 'SOLD', 'OPENED', 'EMPTY']).optional(),
  bottleStatus: z.enum(['SEALED', 'OPENED', 'EMPTY']).optional(),
  brand: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  limitedEdition: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sortBy: z
    .enum(['itemNumber', 'name', 'spiritType', 'vintage', 'age', 'createdAt', 'updatedAt'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const spiritWriteSchema = z.object({
  name: z.string().min(1),
  spiritType: z.enum([
    'WHISKY',
    'COGNAC',
    'BRANDY',
    'RUM',
    'VODKA',
    'GIN',
    'TEQUILA',
    'BAIJIU',
    'WINE',
    'OTHER',
  ]),
  subType: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  distillery: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  vintage: z.coerce.number().int().min(1800).max(2100).nullable().optional(),
  age: z.coerce.number().int().min(0).max(200).nullable().optional(),
  abv: z.coerce.number().min(0).max(100).nullable().optional(),
  volumeMl: z.coerce.number().int().min(1).nullable().optional(),
  bottleNumber: z.string().nullable().optional(),
  limitedEdition: z.boolean().optional(),
  caskType: z.string().nullable().optional(),
  bottlingDate: z.coerce.date().nullable().optional(),
  acquiredDate: z.coerce.date().nullable().optional(),
  acquiredFrom: z.string().nullable().optional(),
  purchasePrice: z.coerce.number().min(0).nullable().optional(),
  currentValue: z.coerce.number().min(0).nullable().optional(),
  estimatedValue: z.coerce.number().min(0).nullable().optional(),
  status: z.enum(['COLLECTION', 'AGING', 'FOR_SALE', 'SOLD', 'OPENED', 'EMPTY']).optional(),
  bottleStatus: z.enum(['SEALED', 'OPENED', 'EMPTY']).optional(),
  storageCondition: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  tastingNotes: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  mainImage: imageReferenceSchema.nullable().optional(),
  attachmentImages: attachmentImagesSchema.nullable().optional(),
});

const spiritUpdateSchema = spiritWriteSchema.partial().extend({ id: z.string().min(1) });

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
  'paddles.search': 'read:paddles',
  'paddles.get': 'read:paddles',
  'paddles.create': 'write:paddles',
  'paddles.update': 'write:paddles',
  'antiques.search': 'read:antiques',
  'antiques.get': 'read:antiques',
  'antiques.create': 'write:antiques',
  'antiques.update': 'write:antiques',
  'maps.search': 'read:maps',
  'maps.get': 'read:maps',
  'maps.create': 'write:maps',
  'maps.update': 'write:maps',
  'spirits.search': 'read:spirits',
  'spirits.get': 'read:spirits',
  'spirits.create': 'write:spirits',
  'spirits.update': 'write:spirits',
  'settings.read': 'read:settings',
};

/**
 * Tools that mutate state.
 *
 * Derived from `scopeByTool` rather than hand-listed, so a tool can never be
 * treated as a read while requiring a write scope (or vice versa) — the two
 * tables cannot drift apart.
 */
const writeTools = new Set(
  (Object.entries(scopeByTool) as [z.infer<typeof toolSchema>['tool'], AgentScope][]).flatMap(
    ([tool, scope]) => (scope.startsWith('write:') ? [tool] : [])
  )
);

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

function safeAuditInput(value: unknown, depth = 0): unknown {
  if (depth > 3 || value === null || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') return value.slice(0, 128);
  if (Array.isArray(value)) return value.slice(0, 20).map(item => safeAuditInput(item, depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 50)
        .map(([key, item]) => [key, safeAuditInput(item, depth + 1)])
    );
  }
  return undefined;
}

function parseAuditInput(request: ToolRequest): unknown {
  const schemas: Partial<Record<ToolRequest['tool'], z.ZodType>> = {
    'quilts.search': quiltSearchSchema,
    'quilts.get': idSchema,
    'quilts.create': quiltWriteSchema,
    'quilts.update': quiltWriteSchema,
    'quilts.changeStatus': quiltStatusSchema,
    'usage.search': usageSearchSchema,
    'usage.create': usageCreateSchema,
    'usage.end': usageEndSchema,
    'cards.search': cardSearchSchema,
    'cards.get': idSchema,
    'cards.create': cardWriteSchema,
    'cards.update': cardWriteSchema,
    'paddles.search': paddleSearchSchema,
    'paddles.get': idSchema,
    'paddles.create': paddleWriteSchema,
    'paddles.update': paddleUpdateSchema,
    'antiques.search': antiqueSearchSchema,
    'antiques.get': idSchema,
    'antiques.create': antiqueWriteSchema,
    'antiques.update': antiqueUpdateSchema,
    'maps.search': mapSearchSchema,
    'maps.get': idSchema,
    'maps.create': mapWriteSchema,
    'maps.update': mapUpdateSchema,
    'spirits.search': spiritSearchSchema,
    'spirits.get': idSchema,
    'spirits.create': spiritWriteSchema,
    'spirits.update': spiritUpdateSchema,
  };
  const schema = schemas[request.tool];
  if (!schema) return {};
  const parsed = schema.safeParse(request.input);
  return parsed.success ? safeAuditInput(parsed.data) : {};
}

function validationResponse(error: z.ZodError) {
  return createValidationErrorResponse(
    'Agent tool input validation failed',
    zodFieldErrors(error)
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
  const rateLimit = await rateLimiters.agent.check(request);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(rateLimit.retryAfter ?? 60),
      },
    });
  }

  let body: unknown;

  try {
    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_AGENT_REQUEST_CHARS) {
      return createBadRequestResponse('Request body is too large');
    }

    const requestText = await request.text();
    if (requestText.length > MAX_AGENT_REQUEST_CHARS) {
      return createBadRequestResponse('Request body is too large');
    }

    body = JSON.parse(requestText);
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
      metadata: { idempotencyKey: toolRequest.idempotencyKey, input: parseAuditInput(toolRequest) },
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
      metadata: { idempotencyKey: toolRequest.idempotencyKey, input: parseAuditInput(toolRequest) },
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

    return createInternalErrorResponse('Agent tool execution failed', error);
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
    case 'paddles.search': {
      const input = paddleSearchSchema.parse(request.input);
      const [paddles, total] = await Promise.all([getPaddles(input), countPaddles(input)]);
      return { paddles, total };
    }
    case 'paddles.get': {
      const { id } = idSchema.parse(request.input);
      return { paddle: await getPaddleById(id) };
    }
    case 'paddles.create': {
      const input = paddleWriteSchema.parse(request.input);
      if (request.dryRun) return { planned: input };
      return { paddle: await createPaddle(input) };
    }
    case 'paddles.update': {
      const input = paddleUpdateSchema.parse(request.input);
      if (request.dryRun) return { planned: input };
      const { id, ...changes } = input;
      return { paddle: await updatePaddle(id, changes) };
    }
    case 'antiques.search': {
      const input = antiqueSearchSchema.parse(request.input);
      const [antiques, total] = await Promise.all([getAntiques(input), countAntiques(input)]);
      return { antiques, total };
    }
    case 'antiques.get': {
      const { id } = idSchema.parse(request.input);
      return { antique: await getAntiqueById(id) };
    }
    case 'antiques.create': {
      const input = antiqueWriteSchema.parse(request.input);
      if (request.dryRun) return { planned: input };
      return { antique: await createAntique(input) };
    }
    case 'antiques.update': {
      const input = antiqueUpdateSchema.parse(request.input);
      if (request.dryRun) return { planned: input };
      return { antique: await updateAntique(input) };
    }
    case 'maps.search': {
      const input = mapSearchSchema.parse(request.input);
      const [maps, total] = await Promise.all([getMaps(input), countMaps(input)]);
      return { maps, total };
    }
    case 'maps.get': {
      const { id } = idSchema.parse(request.input);
      return { map: await getMapById(id) };
    }
    case 'maps.create': {
      const input = mapWriteSchema.parse(request.input);
      if (request.dryRun) return { planned: input };
      return { map: await createMap(input) };
    }
    case 'maps.update': {
      const input = mapUpdateSchema.parse(request.input);
      if (request.dryRun) return { planned: input };
      return { map: await updateMap(input) };
    }
    case 'spirits.search': {
      const input = spiritSearchSchema.parse(request.input);
      const [spirits, total] = await Promise.all([getSpirits(input), countSpirits(input)]);
      return { spirits, total };
    }
    case 'spirits.get': {
      const { id } = idSchema.parse(request.input);
      return { spirit: await getSpiritById(id) };
    }
    case 'spirits.create': {
      const input = spiritWriteSchema.parse(request.input);
      if (request.dryRun) return { planned: input };
      return { spirit: await createSpirit(input) };
    }
    case 'spirits.update': {
      const input = spiritUpdateSchema.parse(request.input);
      if (request.dryRun) return { planned: input };
      const { id, ...changes } = input;
      return { spirit: await updateSpirit(id, changes) };
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
