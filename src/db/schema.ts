/**
 * Database Schema Definition
 * 
 * This file defines the database schema using Drizzle ORM.
 * It uses a single-table inheritance pattern with JSONB for module-specific attributes.
 * 
 * Architecture:
 * - users: User accounts with role-based access control
 * - items: Universal items table (quilts, cards, shoes, etc.)
 * - usage_logs: Activity tracking for all items
 * 
 * Requirements: 2.1, 2.2, 8.1
 */

import { pgTable, text, timestamp, jsonb, pgEnum, uuid, index } from 'drizzle-orm/pg-core';

/**
 * User role enumeration
 * - admin: Full system access
 * - member: Standard user access
 */
export const userRoleEnum = pgEnum('user_role', ['admin', 'member']);

/**
 * Item status enumeration
 * - in_use: Currently being used
 * - storage: In storage
 * - maintenance: Under maintenance
 * - lost: Lost or missing
 */
export const itemStatusEnum = pgEnum('item_status', [
  'in_use',
  'storage',
  'maintenance',
  'lost',
]);

/**
 * Item type enumeration
 * - quilt: Quilt/blanket management
 * - card: Sports card collection
 * - shoe: Shoe collection (future)
 * - racket: Racket collection (future)
 */
export const itemTypeEnum = pgEnum('item_type', ['quilt', 'card', 'shoe', 'racket']);

/**
 * Users table
 * Stores user accounts with authentication and module subscription information
 * 
 * Requirements: 8.1 (Authentication and RBAC)
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    role: userRoleEnum('role').notNull().default('member'),
    activeModules: jsonb('active_modules').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
  })
);

/**
 * Items table (Single Table Inheritance)
 * Universal table for all item types with JSONB for module-specific attributes
 * 
 * Requirements: 2.1, 2.2, 2.5 (Flexible schema with JSONB)
 */
export const items = pgTable(
  'items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: itemTypeEnum('type').notNull(),
    name: text('name').notNull(),
    status: itemStatusEnum('status').notNull().default('storage'),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // JSONB field for module-specific attributes
    attributes: jsonb('attributes').$type<Record<string, any>>().notNull().default({}),
    // JSONB field for image URLs
    images: jsonb('images').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    typeIdx: index('items_type_idx').on(table.type),
    ownerIdx: index('items_owner_idx').on(table.ownerId),
    statusIdx: index('items_status_idx').on(table.status),
    typeOwnerIdx: index('items_type_owner_idx').on(table.type, table.ownerId),
  })
);

/**
 * Usage logs table
 * Tracks all item usage and status changes
 * 
 * Requirements: 6.2, 8.5 (Usage tracking and audit logs)
 */
export const usageLogs = pgTable(
  'usage_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    itemId: uuid('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: text('action').notNull(), // 'created', 'updated', 'status_changed', 'deleted'
    snapshot: jsonb('snapshot').$type<Record<string, any>>().notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    itemIdx: index('usage_logs_item_idx').on(table.itemId),
    userIdx: index('usage_logs_user_idx').on(table.userId),
    createdAtIdx: index('usage_logs_created_at_idx').on(table.createdAt),
  })
);

/**
 * Audit event type enumeration
 * - permission_check: Permission verification attempt
 * - access_granted: Successful access to resource
 * - access_denied: Failed access attempt
 * - role_changed: User role modification
 * - module_subscribed: Module subscription added
 * - module_unsubscribed: Module subscription removed
 * - login_success: Successful login
 * - login_failed: Failed login attempt
 * - logout: User logout
 */
export const auditEventTypeEnum = pgEnum('audit_event_type', [
  'permission_check',
  'access_granted',
  'access_denied',
  'role_changed',
  'module_subscribed',
  'module_unsubscribed',
  'login_success',
  'login_failed',
  'logout',
]);

/**
 * Audit logs table
 * Records all permission-related operations and access control events
 * 
 * Requirements: 8.5 (Permission operation audit)
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // User who performed the action (nullable for failed login attempts)
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    // Event type
    eventType: auditEventTypeEnum('event_type').notNull(),
    // Resource being accessed (e.g., 'item:123', 'module:quilt')
    resource: text('resource'),
    // Action attempted (e.g., 'read', 'write', 'delete')
    action: text('action'),
    // Result of the operation (true for success, false for denial)
    success: text('success').notNull(), // 'true' or 'false' as text for compatibility
    // Reason for denial (if applicable)
    reason: text('reason'),
    // Additional context data
    metadata: jsonb('metadata').$type<Record<string, any>>().notNull().default({}),
    // IP address of the request
    ipAddress: text('ip_address'),
    // User agent string
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('audit_logs_user_idx').on(table.userId),
    eventTypeIdx: index('audit_logs_event_type_idx').on(table.eventType),
    successIdx: index('audit_logs_success_idx').on(table.success),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
    resourceIdx: index('audit_logs_resource_idx').on(table.resource),
  })
);

// Type exports for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;
