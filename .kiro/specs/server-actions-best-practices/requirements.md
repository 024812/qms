# Requirements Document: Server Actions Best Practices

## Introduction

This specification addresses critical improvements to the Server Actions implementation to fully align with Next.js 16 best practices as documented in Context7. The current implementation has several issues that prevent optimal error handling, validation, and user experience. This refactoring will restructure Server Actions to follow the official pattern: validate first, authenticate second, return structured responses instead of throwing errors, and integrate with React's `useActionState` hook for progressive enhancement.

## Glossary

- **Server_Action**: A server-side function marked with 'use server' that can be called directly from client components or forms
- **FormData**: Web API object containing form field values, used as the standard input format for Server Actions
- **FormState**: Type definition for the state object returned by Server Actions, containing success/error/data fields
- **useActionState**: React hook that manages form state and provides pending status for Server Actions
- **Zod_Schema**: Runtime validation schema using the Zod library for type-safe input validation
- **Progressive_Enhancement**: Design approach where forms work without JavaScript and enhance with it
- **Cache_Invalidation**: Process of marking cached data as stale using updateTag() to trigger re-fetching
- **Structured_Response**: Return value format { success, data, error, errors } instead of throwing exceptions
- **Field_Errors**: Object mapping form field names to validation error messages
- **Auth_Session**: Authentication session object from Auth.js v5 containing user information

## Requirements

### Requirement 1: Server Action Input Validation

**User Story:** As a developer, I want Server Actions to validate input before any other operations, so that invalid data is caught early and doesn't waste resources on authentication or database queries.

#### Acceptance Criteria

1. WHEN a Server Action receives FormData, THE Server_Action SHALL validate all fields using a Zod_Schema before any other operations
2. WHEN validation fails, THE Server_Action SHALL return a Structured_Response containing field-specific errors without proceeding to authentication
3. WHEN validation succeeds, THE Server_Action SHALL extract the validated data and proceed to authentication checks
4. THE Server_Action SHALL use FormData as the input parameter type, not typed objects
5. FOR ALL Server Actions with form inputs, THE validation step SHALL be the first operation in the function body

### Requirement 2: Authentication After Validation

**User Story:** As a developer, I want authentication checks to happen after validation, so that we don't waste authentication resources on invalid requests.

#### Acceptance Criteria

1. WHEN input validation succeeds, THE Server_Action SHALL check the Auth_Session as the second operation
2. WHEN authentication fails, THE Server_Action SHALL return a Structured_Response with an error message
3. WHEN authentication succeeds, THE Server_Action SHALL proceed to database operations
4. THE Server_Action SHALL NOT call auth() before validating input data

### Requirement 3: Structured Error Responses

**User Story:** As a developer, I want Server Actions to return error states instead of throwing exceptions, so that errors are predictable and easier to handle in the UI.

#### Acceptance Criteria

1. WHEN any error occurs in a Server Action, THE Server_Action SHALL return a Structured_Response object instead of throwing an Error
2. WHEN validation fails, THE Server_Action SHALL return { errors: Field_Errors } where Field_Errors maps field names to error messages
3. WHEN authentication fails, THE Server_Action SHALL return { error: string } with a user-friendly message
4. WHEN database operations fail, THE Server_Action SHALL return { error: string } with a user-friendly message
5. WHEN operations succeed, THE Server_Action SHALL return { success: true, data: any } with the result data
6. THE Structured_Response SHALL be serializable (no class instances, functions, or non-JSON types)

### Requirement 4: FormState Type Definition

**User Story:** As a developer, I want type-safe FormState definitions, so that TypeScript can catch errors at compile time.

#### Acceptance Criteria

1. THE system SHALL define a FormState type for each Server Action's return value
2. THE FormState type SHALL include optional fields: success, data, error, errors
3. THE FormState type SHALL be exported for use in client components
4. THE FormState type SHALL ensure all fields are serializable types
5. WHEN a Server Action returns a value, THE return type SHALL match the defined FormState type

### Requirement 5: Form Component Integration with useActionState

**User Story:** As a user, I want forms to show validation errors inline and display loading states, so that I get immediate feedback on my input.

#### Acceptance Criteria

1. WHEN a form component uses a Server Action, THE component SHALL use the useActionState hook from React
2. WHEN the form is submitting, THE component SHALL display a loading state by checking the pending flag
3. WHEN validation errors exist in FormState, THE component SHALL display Field_Errors next to the corresponding input fields
4. WHEN a global error exists in FormState, THE component SHALL display the error message prominently
5. WHEN the form is pending, THE submit button SHALL be disabled to prevent duplicate submissions
6. THE form component SHALL work without JavaScript (Progressive_Enhancement) by using the action prop

### Requirement 6: Zod Schema Definitions

**User Story:** As a developer, I want Zod schemas defined for all form inputs, so that validation is consistent and type-safe.

#### Acceptance Criteria

1. FOR ALL Server Actions that accept form input, THE system SHALL define a Zod_Schema for input validation
2. THE Zod_Schema SHALL validate all required fields with appropriate constraints (min length, format, etc.)
3. THE Zod_Schema SHALL provide user-friendly error messages for validation failures
4. WHEN a field is optional, THE Zod_Schema SHALL use .optional() or .nullable() appropriately
5. THE Zod_Schema SHALL be reusable across Server Actions and client-side validation

### Requirement 7: Cache Invalidation Preservation

**User Story:** As a developer, I want cache invalidation to continue working correctly after refactoring, so that the UI stays in sync with data changes.

#### Acceptance Criteria

1. WHEN a Server Action successfully modifies data, THE Server_Action SHALL call updateTag() with appropriate cache tags
2. WHEN a Server Action successfully modifies data, THE Server_Action SHALL call revalidatePath() for affected routes
3. THE cache invalidation logic SHALL remain unchanged from the current implementation
4. THE cache tags SHALL follow the existing pattern: 'items', 'items-{type}', 'items-{id}', 'usage-logs'

### Requirement 8: Backward Compatibility

**User Story:** As a developer, I want the refactored Server Actions to maintain the same functionality, so that existing features continue to work.

#### Acceptance Criteria

1. WHEN Server Actions are refactored, THE database operations SHALL remain functionally identical
2. WHEN Server Actions are refactored, THE usage logging SHALL continue to work as before
3. WHEN Server Actions are refactored, THE module validation SHALL continue to use module-specific Zod schemas
4. THE refactored Server Actions SHALL support all existing parameters and options
5. THE refactored Server Actions SHALL return equivalent data structures (wrapped in Structured_Response)

### Requirement 9: Error Message Quality

**User Story:** As a user, I want clear and helpful error messages, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN validation fails, THE error messages SHALL be specific to the field and constraint that failed
2. WHEN authentication fails, THE error message SHALL be "Authentication required" or similar user-friendly text
3. WHEN a database operation fails, THE error message SHALL be user-friendly and not expose internal details
4. THE error messages SHALL NOT include stack traces or sensitive information
5. THE error messages SHALL be consistent in tone and format across all Server Actions

### Requirement 10: Progressive Enhancement Support

**User Story:** As a user, I want forms to work even if JavaScript fails to load, so that the application is resilient.

#### Acceptance Criteria

1. WHEN JavaScript is disabled, THE form SHALL submit using native browser form submission
2. WHEN JavaScript is enabled, THE form SHALL use the useActionState hook for enhanced UX
3. THE Server Action SHALL handle both scenarios identically (same validation, same responses)
4. WHEN JavaScript is disabled and validation fails, THE server SHALL handle the error gracefully
5. THE form component SHALL use the action prop to support native form submission

## Implementation Notes

### Server Action Pattern Example

The official Context7 pattern that all Server Actions should follow:

```typescript
export async function createItem(prevState: FormState, formData: FormData) {
  // 1. VALIDATE FIRST
  const validatedFields = createItemSchema.safeParse({
    type: formData.get('type'),
    name: formData.get('name'),
    // ... other fields
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 2. CHECK AUTH SECOND
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Authentication required' };
  }

  // 3. DATABASE OPERATIONS
  try {
    const item = await db.insert(items).values(validatedFields.data);

    // 4. CACHE INVALIDATION
    updateTag('items');
    revalidatePath('/items');

    // 5. RETURN SUCCESS
    return { success: true, data: item };
  } catch (error) {
    return { error: 'Failed to create item' };
  }
}
```

### Form Component Pattern Example

```typescript
'use client'
import { useActionState } from 'react'

export function ItemForm() {
  const [state, action, pending] = useActionState(createItem, undefined)

  return (
    <form action={action}>
      <input name="name" />
      {state?.errors?.name && <p className="text-red-500">{state.errors.name}</p>}
      <button disabled={pending} type="submit">
        {pending ? 'Creating...' : 'Create Item'}
      </button>
      {state?.error && <p className="text-red-500">{state.error}</p>}
    </form>
  )
}
```

## Priority

HIGH - This refactoring is critical for production readiness and aligns the codebase with Next.js 16 best practices as documented in Context7.

## References

- Next.js 16 Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- React useActionState: https://react.dev/reference/react/useActionState
- Zod Validation: https://zod.dev
- Context7 Documentation: Official Next.js 16 patterns
