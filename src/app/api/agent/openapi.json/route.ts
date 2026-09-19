import { NextResponse } from 'next/server';

import packageJson from '../../../../../package.json';

import { MODULE_AGENT_SCOPES } from '@/lib/agent/scopes';
import { AGENT_TOOL_NAMES } from '@/lib/agent/tool-names';
import { QUILT_STATUSES } from '@/lib/validations/quilt';

const enums = {
  quiltSeason: ['WINTER', 'SPRING_AUTUMN', 'SUMMER'],
  quiltStatus: [...QUILT_STATUSES],
  usageType: ['REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION'],
  cardSport: ['BASKETBALL', 'SOCCER', 'OTHER'],
  gradingCompany: ['UNGRADED', 'PSA', 'BGS', 'SGC', 'CGC'],
  cardStatus: ['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY'],
  paddleStatus: ['ACTIVE', 'RETIRED', 'FOR_SALE', 'SOLD', 'DISPLAY'],
  handleType: ['FL', 'ST', 'CS', 'AN'],
  antiqueCategory: ['JADE', 'WOOD', 'CERAMIC', 'METAL', 'STONE', 'PAPER', 'TOOL', 'OTHER'],
  antiqueStatus: ['COLLECTION', 'FOR_SALE', 'SOLD', 'DISPLAY', 'APPRAISAL'],
  mapType: [
    'TOPOGRAPHIC',
    'ROAD',
    'CITY',
    'HISTORICAL',
    'THEMATIC',
    'NAUTICAL',
    'AERONAUTICAL',
    'ATLAS',
    'OTHER',
  ],
  mapMaterial: ['PAPER', 'CLOTH', 'DIGITAL', 'OTHER'],
  mapStatus: ['COLLECTION', 'FOR_SALE', 'SOLD', 'DISPLAY', 'FRAMED'],
  spiritType: [
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
  ],
  spiritStatus: ['COLLECTION', 'AGING', 'FOR_SALE', 'SOLD', 'OPENED', 'EMPTY'],
  bottleStatus: ['SEALED', 'OPENED', 'EMPTY'],
};

export async function GET() {
  return NextResponse.json({
    openapi: '3.1.0',
    info: {
      title: 'QMS Agent API',
      version: packageJson.version,
      description: [
        'Restricted OpenAPI surface for AI agents to query and mutate QMS subsystems.',
        '',
        'Scopes are derived from the calling API key owner’s active modules: each',
        'registered module grants `read:<module>` and `write:<module>`. The `quilts`',
        'module additionally grants `read:usage` / `write:usage`, and every',
        'authenticated key receives `read:settings` (app preferences, aggregate',
        'counters and runtime metadata — no secrets). Administrators receive the',
        '`*` wildcard. See `components.schemas.AgentScope` for the full list.',
      ].join('\n'),
    },
    servers: [{ url: '/api/agent' }],
    security: [{ bearerAuth: [] }],
    paths: {
      '/tools': {
        post: {
          operationId: 'callAgentTool',
          summary: 'Call a whitelisted QMS agent tool',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AgentToolRequest' },
              },
            },
          },
          responses: {
            '200': { description: 'Tool result' },
            '400': { description: 'Invalid input' },
            '401': { description: 'Missing or invalid bearer token' },
            '403': { description: 'Missing required scope' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
      schemas: {
        AgentToolRequest: {
          type: 'object',
          // `input` is intentionally absent from `required`: the request schema
          // declares `input: z.record(...).default({})`, so omitting it is valid
          // for tools that take no arguments.
          required: ['tool'],
          properties: {
            tool: {
              type: 'string',
              enum: [...AGENT_TOOL_NAMES],
            },
            input: { type: 'object', additionalProperties: true, default: {} },
            dryRun: { type: 'boolean', default: false },
            confirm: { type: 'boolean', default: false },
            idempotencyKey: { type: 'string', minLength: 8 },
          },
        },
        AgentScope: {
          type: 'string',
          description: [
            'Capability granted to an API key, derived from its owner’s modules.',
            'Each registered module grants `read:<module>` and `write:<module>`;',
            '`quilts` additionally grants `read:usage` / `write:usage`;',
            '`read:settings` is granted to every authenticated key;',
            '`*` is granted to administrators only.',
          ].join(' '),
          enum: ['*', ...MODULE_AGENT_SCOPES, 'read:usage', 'write:usage', 'read:settings', 'admin:settings'],
        },
        QuiltSearchInput: {
          type: 'object',
          properties: {
            season: { type: 'string', enum: enums.quiltSeason },
            status: { type: 'string', enum: enums.quiltStatus },
            search: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            offset: { type: 'integer', minimum: 0 },
          },
        },
        UsageInput: {
          type: 'object',
          properties: {
            quiltId: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            usageType: { type: 'string', enum: enums.usageType },
            notes: { type: 'string' },
          },
        },
        CardSearchInput: {
          type: 'object',
          properties: {
            search: { type: 'string' },
            sport: { type: 'string', enum: enums.cardSport },
            gradingCompany: { type: 'string', enum: enums.gradingCompany },
            status: { type: 'string', enum: enums.cardStatus },
            includeSold: { type: 'boolean' },
            page: { type: 'integer', minimum: 1 },
            pageSize: { type: 'integer', minimum: 1, maximum: 100 },
          },
        },
        PaddleSearchInput: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: enums.paddleStatus },
            bladeBrand: { type: 'string' },
            handleType: { type: 'string', enum: enums.handleType },
            search: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            offset: { type: 'integer', minimum: 0 },
          },
        },
        AntiqueSearchInput: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: enums.antiqueCategory },
            status: { type: 'string', enum: enums.antiqueStatus },
            era: { type: 'string' },
            dynasty: { type: 'string' },
            search: { type: 'string' },
            minValue: { type: 'number', minimum: 0 },
            maxValue: { type: 'number', minimum: 0 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            offset: { type: 'integer', minimum: 0 },
          },
        },
        MapSearchInput: {
          type: 'object',
          properties: {
            mapType: { type: 'string', enum: enums.mapType },
            status: { type: 'string', enum: enums.mapStatus },
            material: { type: 'string', enum: enums.mapMaterial },
            region: { type: 'string' },
            country: { type: 'string' },
            search: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            offset: { type: 'integer', minimum: 0 },
          },
        },
        SpiritSearchInput: {
          type: 'object',
          properties: {
            spiritType: { type: 'string', enum: enums.spiritType },
            status: { type: 'string', enum: enums.spiritStatus },
            bottleStatus: { type: 'string', enum: enums.bottleStatus },
            brand: { type: 'string' },
            country: { type: 'string' },
            region: { type: 'string' },
            limitedEdition: { type: 'boolean' },
            search: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            offset: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
  });
}
