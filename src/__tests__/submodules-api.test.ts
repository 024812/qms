import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const authMock = vi.fn();
vi.mock('@/auth', () => ({ auth: authMock }));

const findUserByApiKeyMock = vi.fn();
vi.mock('@/lib/data/user-api-keys', () => ({
  findUserByApiKey: findUserByApiKeyMock,
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimiters: {
    agent: { check: vi.fn().mockResolvedValue({ allowed: true }) },
  },
}));

// Mock DB for agent idempotency keys & audit
vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'key-1' }]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}));

vi.mock('@/lib/agent/audit', () => ({
  recordAgentAudit: vi.fn().mockResolvedValue(undefined),
}));

// Mock module DALs
const mockPaddle = { id: 'p-1', name: 'Test Paddle', itemNumber: 1, status: 'ACTIVE' };
const mockAntique = {
  id: 'a-1',
  name: 'Test Antique',
  itemNumber: 1,
  category: 'JADE',
  status: 'COLLECTION',
};
const mockMap = {
  id: 'm-1',
  name: 'Test Map',
  itemNumber: 1,
  mapType: 'CITY',
  status: 'COLLECTION',
};
const mockSpirit = {
  id: 's-1',
  name: 'Test Spirit',
  itemNumber: 1,
  spiritType: 'WHISKY',
  status: 'COLLECTION',
};

vi.mock('@/lib/data/paddles', () => ({
  getPaddles: vi.fn().mockResolvedValue([mockPaddle]),
  countPaddles: vi.fn().mockResolvedValue(1),
  getPaddleById: vi.fn().mockResolvedValue(mockPaddle),
  createPaddle: vi.fn().mockResolvedValue(mockPaddle),
  updatePaddle: vi.fn().mockResolvedValue(mockPaddle),
  deletePaddle: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/data/antiques', () => ({
  getAntiques: vi.fn().mockResolvedValue([mockAntique]),
  countAntiques: vi.fn().mockResolvedValue(1),
  getAntiqueById: vi.fn().mockResolvedValue(mockAntique),
  createAntique: vi.fn().mockResolvedValue(mockAntique),
  updateAntique: vi.fn().mockResolvedValue(mockAntique),
  deleteAntique: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/data/maps', () => ({
  getMaps: vi.fn().mockResolvedValue([mockMap]),
  countMaps: vi.fn().mockResolvedValue(1),
  getMapById: vi.fn().mockResolvedValue(mockMap),
  createMap: vi.fn().mockResolvedValue(mockMap),
  updateMap: vi.fn().mockResolvedValue(mockMap),
  deleteMap: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/data/spirits', () => ({
  getSpirits: vi.fn().mockResolvedValue([mockSpirit]),
  countSpirits: vi.fn().mockResolvedValue(1),
  getSpiritById: vi.fn().mockResolvedValue(mockSpirit),
  createSpirit: vi.fn().mockResolvedValue(mockSpirit),
  updateSpirit: vi.fn().mockResolvedValue(mockSpirit),
  deleteSpirit: vi.fn().mockResolvedValue(undefined),
}));

describe('Submodules API & Agent management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: 'admin-1',
        role: 'admin',
        activeModules: ['paddles', 'antiques', 'maps', 'spirits'],
      },
    });
    findUserByApiKeyMock.mockResolvedValue({
      apiKeyId: 'key-1',
      userId: 'user-1',
      name: 'Agent User',
      email: 'agent@example.com',
      role: 'member',
      activeModules: ['paddles', 'antiques', 'maps', 'spirits'],
    });
  });

  describe('REST API route handlers', () => {
    it('GET /api/paddles returns list and pagination', async () => {
      const { GET } = await import('@/app/api/paddles/route');
      const req = new NextRequest('http://localhost:3000/api/paddles?search=test');
      const res = await GET(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.paddles).toHaveLength(1);
    });

    it('GET /api/antiques returns list', async () => {
      const { GET } = await import('@/app/api/antiques/route');
      const req = new NextRequest('http://localhost:3000/api/antiques');
      const res = await GET(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.antiques).toHaveLength(1);
    });

    it('GET /api/maps returns list', async () => {
      const { GET } = await import('@/app/api/maps/route');
      const req = new NextRequest('http://localhost:3000/api/maps');
      const res = await GET(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.maps).toHaveLength(1);
    });

    it('GET /api/spirits returns list', async () => {
      const { GET } = await import('@/app/api/spirits/route');
      const req = new NextRequest('http://localhost:3000/api/spirits');
      const res = await GET(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.spirits).toHaveLength(1);
    });
  });

  describe('Agent API tools dispatcher', () => {
    it('executes paddles.search through Agent API', async () => {
      const { POST } = await import('@/app/api/agent/tools/route');
      const req = new NextRequest('http://localhost:3000/api/agent/tools', {
        method: 'POST',
        headers: {
          authorization: 'Bearer qms_valid_key',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'paddles.search',
          input: { limit: 10 },
        }),
      });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.result.paddles).toHaveLength(1);
    });

    it('executes maps.create with dryRun=true', async () => {
      const { POST } = await import('@/app/api/agent/tools/route');
      const req = new NextRequest('http://localhost:3000/api/agent/tools', {
        method: 'POST',
        headers: {
          authorization: 'Bearer qms_valid_key',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'maps.create',
          input: { name: 'New City Map', mapType: 'CITY' },
          dryRun: true,
        }),
      });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.dryRun).toBe(true);
      expect(json.data.result.planned.name).toBe('New City Map');
    });

    it('executes spirits.create with confirm and idempotencyKey', async () => {
      const { POST } = await import('@/app/api/agent/tools/route');
      const req = new NextRequest('http://localhost:3000/api/agent/tools', {
        method: 'POST',
        headers: {
          authorization: 'Bearer qms_valid_key',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'spirits.create',
          input: { name: 'Vintage 2000', spiritType: 'WHISKY' },
          confirm: true,
          idempotencyKey: 'idempotent-key-001',
        }),
      });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.result.spirit.name).toBe('Test Spirit');
    });

    it('rejects write tool without confirm/dryRun', async () => {
      const { POST } = await import('@/app/api/agent/tools/route');
      const req = new NextRequest('http://localhost:3000/api/agent/tools', {
        method: 'POST',
        headers: {
          authorization: 'Bearer qms_valid_key',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'antiques.create',
          input: { name: 'New Jade', category: 'JADE' },
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});
