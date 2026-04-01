import { describe, expect, it } from 'vitest';
import {
  MaintenanceRecordSchema,
  QuiltSchema,
  UsageRecordSchema,
  updateQuiltSchema,
} from '../validations/quilt';

describe('quilt id validation', () => {
  it('accepts string ids for quilt-related schemas', () => {
    const quiltId = 'cmh8kg6ni000pdtmogzlka4ro';

    expect(updateQuiltSchema.safeParse({ id: quiltId }).success).toBe(true);

    expect(
      QuiltSchema.safeParse({
        id: quiltId,
        itemNumber: 1,
        groupId: null,
        name: '冬被',
        season: 'WINTER',
        lengthCm: 240,
        widthCm: 220,
        weightGrams: 2950,
        fillMaterial: '鹅绒',
        materialDetails: null,
        color: '纯白',
        brand: '东隆朵朵',
        purchaseDate: new Date('2018-11-11T00:00:00.000Z'),
        location: '壁柜右下层',
        packagingInfo: null,
        currentStatus: 'STORAGE',
        notes: null,
        imageUrl: null,
        thumbnailUrl: null,
        mainImage: null,
        attachmentImages: [],
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        updatedAt: new Date('2026-04-01T00:00:00.000Z'),
      }).success
    ).toBe(true);

    expect(
      UsageRecordSchema.safeParse({
        id: 'usage_1',
        quiltId,
        startDate: new Date('2026-03-01T00:00:00.000Z'),
        endDate: null,
        usageType: 'REGULAR',
        notes: null,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      }).success
    ).toBe(true);

    expect(
      MaintenanceRecordSchema.safeParse({
        id: 'maintenance_1',
        quiltId,
        maintenanceType: 'CLEANING',
        description: '专业清洗',
        performedAt: new Date('2026-03-15T00:00:00.000Z'),
        cost: 120,
        nextDueDate: null,
        createdAt: new Date('2026-03-15T00:00:00.000Z'),
        updatedAt: new Date('2026-03-15T00:00:00.000Z'),
      }).success
    ).toBe(true);
  });
});
