import { NextResponse } from 'next/server';

const enums = {
  quiltSeason: ['WINTER', 'SPRING_AUTUMN', 'SUMMER'],
  quiltStatus: ['IN_USE', 'MAINTENANCE', 'STORAGE'],
  usageType: ['REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION'],
  cardSport: ['BASKETBALL', 'SOCCER', 'OTHER'],
  gradingCompany: ['UNGRADED', 'PSA', 'BGS', 'SGC', 'CGC'],
  cardStatus: ['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY'],
};

export async function GET() {
  return NextResponse.json({
    openapi: '3.1.0',
    info: {
      title: 'QMS Agent API',
      version: '2026.6.2',
      description: 'Restricted OpenAPI surface for AI agents to query and mutate QMS subsystems.',
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
          required: ['tool', 'input'],
          properties: {
            tool: {
              type: 'string',
              enum: [
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
              ],
            },
            input: { type: 'object', additionalProperties: true },
            dryRun: { type: 'boolean', default: false },
            confirm: { type: 'boolean', default: false },
            idempotencyKey: { type: 'string' },
          },
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
      },
    },
  });
}
