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

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  pgEnum,
  uuid,
  index,
  integer,
  numeric,
  boolean,
  date,
  serial,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
export const itemStatusEnum = pgEnum('item_status', ['in_use', 'storage', 'maintenance', 'lost']);

/**
 * Item type enumeration
 * - quilt: Quilt/blanket management
 * - card: Sports card collection
 * - shoe: Shoe collection (future)
 * - racket: Racket collection (future)
 */
export const itemTypeEnum = pgEnum('item_type', ['quilt', 'card', 'shoe', 'racket']);

/**
 * Sport type enumeration for cards
 * - BASKETBALL: Basketball cards
 * - SOCCER: Soccer/Football cards
 * - OTHER: Other sports
 */
export const sportTypeEnum = pgEnum('sport_type', ['BASKETBALL', 'SOCCER', 'OTHER']);

/**
 * Grading company enumeration for cards
 * - PSA: Professional Sports Authenticator
 * - BGS: Beckett Grading Services
 * - SGC: Sportscard Guaranty
 * - CGC: Certified Guaranty Company
 * - UNGRADED: Not professionally graded
 */
export const gradingCompanyEnum = pgEnum('grading_company_type', [
  'PSA',
  'BGS',
  'SGC',
  'CGC',
  'UNGRADED',
]);

/**
 * Card status enumeration
 * - COLLECTION: In personal collection
 * - FOR_SALE: Listed for sale
 * - SOLD: Sold to buyer
 * - GRADING: Sent for grading
 * - DISPLAY: On display
 */
export const cardStatusEnum = pgEnum('card_status_type', [
  'COLLECTION',
  'FOR_SALE',
  'SOLD',
  'GRADING',
  'DISPLAY',
]);

/**
 * Users table
 * Stores user accounts with authentication and module subscription information
 *
 * Requirements: 8.1 (Authentication and RBAC)
 *
 * Note: Production database uses TEXT for id (not UUID with default)
 * and stores role/activeModules in preferences JSONB field
 */
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(), // Production uses TEXT, not UUID with default
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    hashedPassword: text('hashed_password').notNull(), // Production uses hashed_password
    preferences: jsonb('preferences')
      .$type<{
        role?: string;
        activeModules?: string[];
        [key: string]: any;
      }>()
      .notNull()
      .default({}), // Production stores role and activeModules here
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
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
  table => ({
    typeIdx: index('items_type_idx').on(table.type),
    ownerIdx: index('items_owner_idx').on(table.ownerId),
    statusIdx: index('items_status_idx').on(table.status),
    typeOwnerIdx: index('items_type_owner_idx').on(table.type, table.ownerId),
  })
);

/**
 * Cards table (Independent Table Architecture)
 * Stores sports card collection data with native columns for optimal performance
 *
 * Requirements: 5.3, 5.4, 5.6 (Independent table with type-safe schema)
 *
 * Architecture Decision: Uses independent table with 30+ native columns instead of
 * JSONB for better type safety, query performance (2-10x faster), simpler indexing,
 * and database-level data integrity.
 */
export const cards = pgTable(
  'cards',
  {
    // Primary identification
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    itemNumber: serial('item_number').notNull().unique(),

    // Player information
    playerName: text('player_name').notNull(),
    sport: sportTypeEnum('sport').notNull(),
    team: text('team'),
    position: text('position'),

    // Card details
    year: integer('year').notNull(),
    brand: text('brand').notNull(),
    series: text('series'),
    cardNumber: text('card_number'),

    // Grading information
    gradingCompany: gradingCompanyEnum('grading_company').default('UNGRADED'),
    grade: numeric('grade', { precision: 3, scale: 1 }),
    certificationNumber: text('certification_number'),

    // Value information
    purchasePrice: numeric('purchase_price', { precision: 10, scale: 2 }),
    purchaseDate: date('purchase_date'),
    currentValue: numeric('current_value', { precision: 10, scale: 2 }),
    estimatedValue: numeric('estimated_value', { precision: 10, scale: 2 }),

    // Physical characteristics
    parallel: text('parallel'),
    serialNumber: text('serial_number'),
    isAutographed: boolean('is_autographed').default(false).notNull(),
    hasMemorabilia: boolean('has_memorabilia').default(false).notNull(),
    memorabiliaType: text('memorabilia_type'),

    // Storage information
    status: cardStatusEnum('status').default('COLLECTION').notNull(),
    location: text('location'),
    storageType: text('storage_type'),
    condition: text('condition'),
    notes: text('notes'),

    // Images
    mainImage: text('main_image'),
    attachmentImages: jsonb('attachment_images').$type<string[]>().default([]),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => ({
    // Performance indexes based on common query patterns
    userIdx: index('cards_user_idx').on(table.userId),
    sportIdx: index('cards_sport_idx').on(table.sport),
    gradeIdx: index('cards_grade_idx').on(table.grade),
    valueIdx: index('cards_value_idx').on(table.currentValue),
    statusIdx: index('cards_status_idx').on(table.status),
    // Composite index for sport + grade queries
    sportGradeIdx: index('cards_sport_grade_idx').on(table.sport, table.grade),
    // Item number is unique for user-friendly display
    itemNumberIdx: index('cards_item_number_idx').on(table.itemNumber),
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
  table => ({
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
  table => ({
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

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;

export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// ============================================================================
// Drizzle ORM Relations
// Enables relational queries: db.query.users.findMany({ with: { items: true } })
// ============================================================================

/**
 * Users relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  items: many(items),
  cards: many(cards),
  usageLogs: many(usageLogs),
  auditLogs: many(auditLogs),
}));

/**
 * Items relations
 */
export const itemsRelations = relations(items, ({ one, many }) => ({
  owner: one(users, { fields: [items.ownerId], references: [users.id] }),
  usageLogs: many(usageLogs),
}));

/**
 * Cards relations
 */
export const cardsRelations = relations(cards, ({ one }) => ({
  user: one(users, { fields: [cards.userId], references: [users.id] }),
}));

/**
 * Usage logs relations
 */
export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
  item: one(items, { fields: [usageLogs.itemId], references: [items.id] }),
  user: one(users, { fields: [usageLogs.userId], references: [users.id] }),
}));

/**
 * Audit logs relations
 */
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
