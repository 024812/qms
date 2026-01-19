# QuiltCard Component Implementation

## Overview

This document describes the implementation of the QuiltCard component for the extensible item management framework's module system.

## Task

**Task 15.1**: 实现 QuiltCard 组件

**Requirements**: 4.1

## Implementation Details

### Component Location

- **File**: `src/modules/quilts/ui/QuiltCard.tsx`
- **Test File**: `src/modules/quilts/ui/__tests__/QuiltCard.test.tsx`

### Features Implemented

1. **Display Key Quilt Information**
   - Item number with icon
   - Quilt name
   - Season badge with color coding
   - Status badge with color coding
   - Dimensions (length × width)
   - Weight and fill material
   - Color and location

2. **Image Support**
   - Displays main image when available
   - Uses Next.js Image component for optimization
   - Gracefully handles missing images

3. **Status Badges**
   - Season badges: WINTER (blue), SPRING_AUTUMN (green), SUMMER (orange)
   - Status badges: IN_USE (green), STORAGE (gray), MAINTENANCE (yellow)

4. **Module System Compatibility**
   - Registered in `src/modules/quilts/config.ts`
   - Works with the core `ItemCard` component
   - Follows the module registry pattern

5. **Existing Functionality Preservation**
   - Maintains the same visual design as the original QuiltCard
   - Displays all the same information
   - Uses the same color schemes and badges

### Design Decisions

1. **No Card Wrapper**: The component does NOT include its own Card wrapper because the parent `ItemCard` component provides the Card wrapper. This follows the composition pattern used in the module system.

2. **Type Safety**: Uses the `QuiltItem` type from the schema, ensuring type safety across the module system.

3. **Localization**: Includes helper functions for translating season and status values to Chinese labels.

4. **Responsive Images**: Uses Next.js Image component with appropriate sizes for responsive loading.

### Integration with Module System

The QuiltCard is registered in the quilt module configuration:

```typescript
// src/modules/quilts/config.ts
export const quiltModule: ModuleDefinition = {
  id: 'quilt',
  name: '被子管理',
  // ...
  CardComponent: QuiltCard,
  // ...
};
```

This allows the core `ItemCard` component to dynamically render the QuiltCard when displaying quilt items.

### Testing

**Test Coverage**: 15 unit tests covering:
- Rendering of all key information fields
- Season and status badge display
- Image handling (with and without images)
- Handling of missing optional fields (dimensions, weight)
- Correct localization of season and status labels

**Test Results**: All 15 tests passing ✓

### Compatibility

The QuiltCard component is compatible with:
- ✅ Module registry system
- ✅ Core ItemCard component
- ✅ Existing quilt schema and types
- ✅ Both new module routes and existing quilt routes

### Files Modified

1. **Created**: `src/modules/quilts/ui/QuiltCard.tsx`
2. **Created**: `src/modules/quilts/ui/__tests__/QuiltCard.test.tsx`
3. **Modified**: `src/modules/quilts/config.ts` (added CardComponent import and registration)
4. **Created**: `vitest.config.ts` (test configuration)
5. **Created**: `vitest.setup.ts` (test setup)

### Next Steps

The next task (15.2) will implement the QuiltDetail component for displaying full quilt information in the detail view.

## Verification

To verify the implementation:

1. **Run Tests**:
   ```bash
   npx vitest run src/modules/quilts/ui/__tests__/QuiltCard.test.tsx
   ```

2. **Check TypeScript**:
   ```bash
   npm run type-check
   ```

3. **Visual Verification**: The component can be tested by navigating to a quilt list page in the application.

## Notes

- The component preserves all existing functionality from the original QuiltCard
- It maintains the same visual design and user experience
- It's fully compatible with both the new module system and existing routes
- All tests pass successfully
- No TypeScript errors
