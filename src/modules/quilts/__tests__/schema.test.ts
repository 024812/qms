/**
 * Unit tests for Quilt Module Schema
 * 
 * These tests verify that the schema correctly wraps and preserves
 * all existing quilt functionality.
 */

import { describe, it, expect } from 'vitest';
import {
  // Schemas
  QuiltSchema,
  createQuiltSchema,
  updateQuiltSchema,
  quiltAttributesSchema,
  SeasonSchema,
  QuiltStatusSchema,
  UsageTypeSchema,
  // Types
  type Quilt,
  type QuiltAttributes,
  type QuiltItem,
  // Converters
  quiltToQuiltItem,
  quiltItemToQuilt,
  rowToQuilt,
  quiltToRow,
} from '../schema';

describe('Quilt Module Schema', () => {
  describe('Schema Re-exports', () => {
    it('should export QuiltSchema', () => {
      expect(QuiltSchema).toBeDefined();
      expect(QuiltSchema.parse).toBeDefined();
    });

    it('should export createQuiltSchema', () => {
      expect(createQuiltSchema).toBeDefined();
      expect(createQuiltSchema.parse).toBeDefined();
    });

    it('should export updateQuiltSchema', () => {
      expect(updateQuiltSchema).toBeDefined();
      expect(updateQuiltSchema.parse).toBeDefined();
    });

    it('should export enum schemas', () => {
      expect(SeasonSchema).toBeDefined();
      expect(QuiltStatusSchema).toBeDefined();
      expect(UsageTypeSchema).toBeDefined();
    });
  });

  describe('QuiltAttributes Schema', () => {
    it('should validate valid quilt attributes', () => {
      const validAttributes = {
        itemNumber: 1,
        groupId: null,
        name: 'Test Quilt',
        season: 'WINTER' as const,
        lengthCm: 200,
        widthCm: 150,
        weightGrams: 2000,
        fillMaterial: 'Down',
        materialDetails: 'Premium goose down',
        color: 'White',
        brand: 'TestBrand',
        purchaseDate: new Date('2024-01-01'),
        location: 'Bedroom',
        packagingInfo: 'Storage bag',
        currentStatus: 'STORAGE' as const,
        notes: 'Test notes',
        imageUrl: null,
        thumbnailUrl: null,
        mainImage: null,
        attachmentImages: null,
      };

      const result = quiltAttributesSchema.safeParse(validAttributes);
      expect(result.success).toBe(true);
    });

    it('should reject invalid season', () => {
      const invalidAttributes = {
        itemNumber: 1,
        groupId: null,
        name: 'Test Quilt',
        season: 'INVALID_SEASON',
        lengthCm: 200,
        widthCm: 150,
        weightGrams: 2000,
        fillMaterial: 'Down',
        color: 'White',
        location: 'Bedroom',
        currentStatus: 'STORAGE',
      };

      const result = quiltAttributesSchema.safeParse(invalidAttributes);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const invalidAttributes = {
        itemNumber: 1,
        groupId: null,
        name: 'Test Quilt',
        season: 'WINTER',
        lengthCm: 200,
        widthCm: 150,
        weightGrams: 2000,
        fillMaterial: 'Down',
        color: 'White',
        location: 'Bedroom',
        currentStatus: 'INVALID_STATUS',
      };

      const result = quiltAttributesSchema.safeParse(invalidAttributes);
      expect(result.success).toBe(false);
    });
  });

  describe('Conversion Functions', () => {
    const mockQuilt: Quilt = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      itemNumber: 1,
      groupId: null,
      name: 'Test Quilt',
      season: 'WINTER',
      lengthCm: 200,
      widthCm: 150,
      weightGrams: 2000,
      fillMaterial: 'Down',
      materialDetails: 'Premium goose down',
      color: 'White',
      brand: 'TestBrand',
      purchaseDate: new Date('2024-01-01'),
      location: 'Bedroom',
      packagingInfo: 'Storage bag',
      currentStatus: 'STORAGE',
      notes: 'Test notes',
      imageUrl: null,
      thumbnailUrl: null,
      mainImage: null,
      attachmentImages: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    it('should convert Quilt to QuiltItem', () => {
      const quiltItem = quiltToQuiltItem(mockQuilt);
      
      expect(quiltItem.id).toBe(mockQuilt.id);
      expect(quiltItem.type).toBe('quilt');
      expect(quiltItem.itemNumber).toBe(mockQuilt.itemNumber);
      expect(quiltItem.name).toBe(mockQuilt.name);
      expect(quiltItem.season).toBe(mockQuilt.season);
      expect(quiltItem.fillMaterial).toBe(mockQuilt.fillMaterial);
      expect(quiltItem.currentStatus).toBe(mockQuilt.currentStatus);
    });

    it('should convert QuiltItem back to Quilt', () => {
      const quiltItem = quiltToQuiltItem(mockQuilt);
      const convertedBack = quiltItemToQuilt(quiltItem);
      
      expect(convertedBack.id).toBe(mockQuilt.id);
      expect(convertedBack.itemNumber).toBe(mockQuilt.itemNumber);
      expect(convertedBack.name).toBe(mockQuilt.name);
      expect(convertedBack.season).toBe(mockQuilt.season);
      expect(convertedBack.fillMaterial).toBe(mockQuilt.fillMaterial);
      expect(convertedBack.currentStatus).toBe(mockQuilt.currentStatus);
    });

    it('should preserve all fields during conversion round-trip', () => {
      const quiltItem = quiltToQuiltItem(mockQuilt);
      const convertedBack = quiltItemToQuilt(quiltItem);
      
      // Check all fields are preserved
      expect(convertedBack).toEqual(mockQuilt);
    });
  });

  describe('Database Row Transformers', () => {
    it('should export rowToQuilt transformer', () => {
      expect(rowToQuilt).toBeDefined();
      expect(typeof rowToQuilt).toBe('function');
    });

    it('should export quiltToRow transformer', () => {
      expect(quiltToRow).toBeDefined();
      expect(typeof quiltToRow).toBe('function');
    });
  });

  describe('Type Exports', () => {
    it('should export Quilt type', () => {
      // This is a compile-time check, but we can verify the schema exists
      const quilt: Quilt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        itemNumber: 1,
        groupId: null,
        name: 'Test',
        season: 'WINTER',
        lengthCm: 200,
        widthCm: 150,
        weightGrams: 2000,
        fillMaterial: 'Down',
        materialDetails: null,
        color: 'White',
        brand: null,
        purchaseDate: null,
        location: 'Bedroom',
        packagingInfo: null,
        currentStatus: 'STORAGE',
        notes: null,
        imageUrl: null,
        thumbnailUrl: null,
        mainImage: null,
        attachmentImages: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(quilt).toBeDefined();
    });

    it('should export QuiltAttributes type', () => {
      const attributes: QuiltAttributes = {
        itemNumber: 1,
        groupId: null,
        name: 'Test',
        season: 'WINTER',
        lengthCm: 200,
        widthCm: 150,
        weightGrams: 2000,
        fillMaterial: 'Down',
        materialDetails: null,
        color: 'White',
        brand: null,
        purchaseDate: null,
        location: 'Bedroom',
        packagingInfo: null,
        currentStatus: 'STORAGE',
        notes: null,
        imageUrl: null,
        thumbnailUrl: null,
        mainImage: null,
        attachmentImages: null,
      };
      
      expect(attributes).toBeDefined();
    });

    it('should export QuiltItem type', () => {
      const item: QuiltItem = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'quilt',
        itemNumber: 1,
        groupId: null,
        name: 'Test',
        season: 'WINTER',
        lengthCm: 200,
        widthCm: 150,
        weightGrams: 2000,
        fillMaterial: 'Down',
        materialDetails: null,
        color: 'White',
        brand: null,
        purchaseDate: null,
        location: 'Bedroom',
        packagingInfo: null,
        currentStatus: 'STORAGE',
        notes: null,
        imageUrl: null,
        thumbnailUrl: null,
        mainImage: null,
        attachmentImages: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(item).toBeDefined();
    });
  });
});
