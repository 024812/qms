'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { ModuleAccessError, requireModuleAccess } from '@/lib/module-access';
import { sanitizeApiInput } from '@/lib/sanitization';
import {
  countMaps,
  createMap,
  deleteMap as deleteMapData,
  getMapById,
  getMaps,
  updateMap,
} from '@/lib/data/maps';
import type { MapFilters, MapDTO } from '@/lib/data/maps';
import { CreateMapInputSchema, UpdateMapInputSchema } from '@/modules/maps/schema';
import type { CreateMapInput, UpdateMapInput } from '@/modules/maps/schema';

// ============================================================================
// Action Result Types
// ============================================================================

interface ActionSuccess<T> {
  success: true;
  data: T;
}

interface ActionError {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

type ActionResult<T> = ActionSuccess<T> | ActionError;

// ============================================================================
// Search Input Schema
// ============================================================================

const MapSearchInputSchema = z.object({
  filters: z
    .object({
      mapType: z
        .enum([
          'TOPOGRAPHIC',
          'ROAD',
          'CITY',
          'HISTORICAL',
          'THEMATIC',
          'NAUTICAL',
          'AERONAUTICAL',
          'OTHER',
        ])
        .optional(),
      status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'DISPLAY', 'FRAMED']).optional(),
      material: z.enum(['PAPER', 'CLOTH', 'DIGITAL', 'OTHER']).optional(),
      region: z.string().optional(),
      country: z.string().optional(),
      search: z.string().optional(),
    })
    .optional(),
  sortBy: z
    .enum(['itemNumber', 'name', 'mapType', 'publishedYear', 'createdAt', 'updatedAt'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  skip: z.number().int().nonnegative().optional(),
  take: z.number().int().positive().max(100).optional(),
});

type MapSearchInput = z.infer<typeof MapSearchInputSchema>;

// ============================================================================
// Error Helpers
// ============================================================================

function validationErrorResult(
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'VALIDATION_FAILED',
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
    },
  };
}

function notFoundErrorResult(message: string): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message,
    },
  };
}

function unauthorizedErrorResult(message = 'Unauthorized'): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
  };
}

function internalErrorResult(message: string): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  };
}

// ============================================================================
// Auth Helper
// ============================================================================

async function requireAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {
    return requireModuleAccess(session, 'maps');
  } catch (error) {
    if (error instanceof ModuleAccessError) return null;
    throw error;
  }
}

// ============================================================================
// Data Layer Adapter
// ============================================================================

function toDataLayerFilters(input?: MapSearchInput): MapFilters {
  return {
    ...(input?.filters?.mapType ? { mapType: input.filters.mapType } : {}),
    ...(input?.filters?.status ? { status: input.filters.status } : {}),
    ...(input?.filters?.material ? { material: input.filters.material } : {}),
    ...(input?.filters?.region ? { region: input.filters.region } : {}),
    ...(input?.filters?.country ? { country: input.filters.country } : {}),
    ...(input?.filters?.search ? { search: input.filters.search } : {}),
    ...(input?.take !== undefined ? { limit: input.take } : {}),
    ...(input?.skip !== undefined ? { offset: input.skip } : {}),
    ...(input?.sortBy ? { sortBy: input.sortBy } : {}),
    ...(input?.sortOrder ? { sortOrder: input.sortOrder } : {}),
  };
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get maps with optional filtering, sorting, and pagination
 */
export async function getMapsAction(
  input?: MapSearchInput
): Promise<ActionResult<{ maps: MapDTO[]; total: number; hasMore: boolean }>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    // Validate input
    if (input) {
      const parseResult = MapSearchInputSchema.safeParse(input);
      if (!parseResult.success) {
        return validationErrorResult(
          'Invalid search parameters',
          parseResult.error.flatten().fieldErrors as Record<string, string[]>
        );
      }
    }

    const filters = toDataLayerFilters(input);
    const [mapsList, total] = await Promise.all([getMaps(filters), countMaps(filters)]);

    const hasMore =
      filters.limit && filters.offset !== undefined
        ? filters.offset + filters.limit < total
        : false;

    return {
      success: true,
      data: {
        maps: mapsList,
        total,
        hasMore,
      },
    };
  } catch (error) {
    console.error('[Server Action] getMapsAction error:', error);
    return internalErrorResult('Failed to retrieve maps');
  }
}

/**
 * Get a single map by ID
 */
export async function getMapAction(id: string): Promise<ActionResult<MapDTO>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    if (!id || typeof id !== 'string') {
      return validationErrorResult('Invalid map ID');
    }

    const map = await getMapById(id);

    if (!map) {
      return notFoundErrorResult('Map not found');
    }

    return {
      success: true,
      data: map,
    };
  } catch (error) {
    console.error('[Server Action] getMapAction error:', error);
    return internalErrorResult('Failed to retrieve map');
  }
}

/**
 * Create a new map
 */
export async function createMapAction(input: CreateMapInput): Promise<ActionResult<MapDTO>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    // Validate input
    const parseResult = CreateMapInputSchema.safeParse(sanitizeApiInput(input));
    if (!parseResult.success) {
      return validationErrorResult(
        'Invalid map data',
        parseResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const validatedData = parseResult.data;

    // The schema coerces date strings, so pass validated data straight through.
    const map = await createMap(validatedData);

    return {
      success: true,
      data: map,
    };
  } catch (error) {
    console.error('[Server Action] createMapAction error:', error);
    return internalErrorResult('Failed to create map');
  }
}

/**
 * Update an existing map
 */
export async function updateMapAction(input: UpdateMapInput): Promise<ActionResult<MapDTO>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    // Validate input
    const parseResult = UpdateMapInputSchema.safeParse(sanitizeApiInput(input));
    if (!parseResult.success) {
      return validationErrorResult(
        'Invalid map data',
        parseResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const validatedData = parseResult.data;

    // The schema coerces date strings; pass validated data straight through so
    // untouched optional fields stay undefined (not cleared) on partial updates.
    const map = await updateMap(validatedData);

    return {
      success: true,
      data: map,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Map not found') {
      return notFoundErrorResult('Map not found');
    }
    return internalErrorResult('Failed to update map');
  }
}

/**
 * Delete a map
 */
export async function deleteMapAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    if (!id || typeof id !== 'string') {
      return validationErrorResult('Invalid map ID');
    }

    await deleteMapData(id);

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Map not found') {
      return notFoundErrorResult('Map not found');
    }
    return internalErrorResult('Failed to delete map');
  }
}
