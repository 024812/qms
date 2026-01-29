/**
 * Database Schema Definition
 *
 * This file defines the database schema using Drizzle ORM.
 *
 * Architecture:
 * - users: User accounts with role-based access control
 * - quilts: Quilt management module (Independent Table)
 * - cards: Sports card collection module (Independent Table)
 * - usage_records: Activity tracking for quilts
 * - audit_logs: System-wide audit logging
 *
 * Requirements: 2.1, 2.2, 8.1
 */

import crypto from 'crypto';
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
 * Sport type enumeration for cards
 */
export const sportTypeEnum = pgEnum('sport_type', ['BASKETBALL', 'SOCCER', 'OTHER']);

/**
 * Grading company enumeration for cards
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
 */
export const cardStatusEnum = pgEnum('card_status_type', [
  'COLLECTION',
  'FOR_SALE',
  'SOLD',
  'GRADING',
  'DISPLAY',
]);

/**
 * Quilt specific enums
 */
export const seasonEnum = pgEnum('season', ['WINTER', 'SPRING_AUTUMN', 'SUMMER']);
export const quiltStatusEnum = pgEnum('quilt_status', ['IN_USE', 'MAINTENANCE', 'STORAGE', 'LOST']);

/**
 * Audit event type enumeration
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
 * Usage type enumeration
 */
export const usageTypeEnum = pgEnum('usage_type', [
  'REGULAR',
  'GUEST',
  'SPECIAL_OCCASION',
  'SEASONAL_ROTATION',
]);

/**
 * Users table
 * Stores user accounts with authentication and module subscription information
 */
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    hashedPassword: text('hashed_password').notNull(),
    preferences: jsonb('preferences')
      .$type<{
        role?: string;
        activeModules?: string[];
        [key: string]: any;
      }>()
      .notNull()
      .default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    emailIdx: index('users_email_idx').on(table.email),
  })
);

/**
 * Quilts table (Independent Table Architecture)
 * Stores quilt collection data with native columns
 */
export const quilts = pgTable(
  'quilts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    itemNumber: serial('item_number').notNull().unique(),

    // Core details
    name: text('name').notNull(),
    season: seasonEnum('season').notNull(),

    // Dimensions & Weight
    lengthCm: integer('length_cm').notNull(),
    widthCm: integer('width_cm').notNull(),
    weightGrams: integer('weight_grams').notNull(),

    // Material & Design
    fillMaterial: text('fill_material').notNull(),
    materialDetails: text('material_details'),
    color: text('color').notNull(),
    brand: text('brand'),
    packagingInfo: text('packaging_info'),

    // Purchase info
    purchaseDate: timestamp('purchase_date'),
    location: text('location').notNull(),

    // Status & Notes
    currentStatus: quiltStatusEnum('current_status').notNull().default('STORAGE'),
    notes: text('notes'),

    // Images
    imageUrl: text('image_url'),
    thumbnailUrl: text('thumbnail_url'),
    mainImage: text('main_image'),
    attachmentImages: jsonb('attachment_images').$type<string[]>().default([]),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    statusIdx: index('quilts_status_idx').on(table.currentStatus),
    seasonIdx: index('quilts_season_idx').on(table.season),
    itemNumberIdx: index('quilts_item_number_idx').on(table.itemNumber),
  })
);

/**
 * Usage records table
 * Tracks usage history for quilts
 */
export const usageRecords = pgTable(
  'usage_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quiltId: uuid('quilt_id')
      .notNull()
      .references(() => quilts.id, { onDelete: 'cascade' }),

    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),

    usageType: usageTypeEnum('usage_type').default('REGULAR'),
    notes: text('notes'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    quiltIdx: index('usage_records_quilt_idx').on(table.quiltId),
    startDateIdx: index('usage_records_start_date_idx').on(table.startDate),
    endDateIdx: index('usage_records_end_date_idx').on(table.endDate),
  })
);

/**
 * Maintenance records table
 * Tracks maintenance history for quilts
 */
export const maintenanceRecords = pgTable(
  'maintenance_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quiltId: uuid('quilt_id')
      .notNull()
      .references(() => quilts.id, { onDelete: 'cascade' }),

    maintenanceType: text('maintenance_type').notNull(),
    description: text('description').notNull(),
    performedAt: timestamp('performed_at').notNull(),
    cost: numeric('cost', { precision: 10, scale: 2 }),
    nextDueDate: timestamp('next_due_date'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    quiltIdx: index('maintenance_records_quilt_idx').on(table.quiltId),
    performedAtIdx: index('maintenance_records_performed_at_idx').on(table.performedAt),
    nextDueDateIdx: index('maintenance_records_next_due_date_idx').on(table.nextDueDate),
  })
);

/**
 * Cards table (Independent Table Architecture)
 * Stores sports card collection data with native columns
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
    userIdx: index('cards_user_idx').on(table.userId),
    sportIdx: index('cards_sport_idx').on(table.sport),
    gradeIdx: index('cards_grade_idx').on(table.grade),
    valueIdx: index('cards_value_idx').on(table.currentValue),
    statusIdx: index('cards_status_idx').on(table.status),
    sportGradeIdx: index('cards_sport_grade_idx').on(table.sport, table.grade),
    itemNumberIdx: index('cards_item_number_idx').on(table.itemNumber),
  })
);

/**
 * Audit logs table
 * Records all permission-related operations and access control events
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    eventType: auditEventTypeEnum('event_type').notNull(),
    resource: text('resource'),
    action: text('action'),
    success: text('success').notNull(),
    reason: text('reason'),
    metadata: jsonb('metadata').$type<Record<string, any>>().notNull().default({}),
    ipAddress: text('ip_address'),
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

/**
 * System settings table
 * Key-value store for application configuration
 */
export const systemSettings = pgTable('system_settings', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Notification priority enumeration
 */
export const notificationPriorityEnum = pgEnum('notification_priority', ['high', 'medium', 'low']);

/**
 * Notification type enumeration
 */
export const notificationTypeEnum = pgEnum('notification_type', [
  'weather_change',
  'maintenance_reminder',
  'disposal_suggestion',
]);

/**
 * Notifications table
 * In-app notification system for users
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: text('type').notNull(), // varchar in DB, using text for compat
    priority: text('priority').notNull().default('medium'),
    title: text('title').notNull(),
    message: text('message').notNull(),
    quiltId: text('quilt_id'), // optional reference
    isRead: boolean('is_read').notNull().default(false),
    actionUrl: text('action_url'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  table => ({
    typeIdx: index('idx_notifications_type').on(table.type),
    priorityIdx: index('idx_notifications_priority').on(table.priority),
    isReadIdx: index('idx_notifications_is_read').on(table.isRead),
    quiltIdIdx: index('idx_notifications_quilt_id').on(table.quiltId),
    createdAtIdx: index('idx_notifications_created_at').on(table.createdAt),
  })
);

/**
 * Seasonal recommendations table
 * Configuration for quilt recommendations by season
 */
export const seasonalRecommendations = pgTable(
  'seasonal_recommendations',
  {
    id: text('id').primaryKey(),
    season: seasonEnum('season').notNull(),
    minWeight: integer('min_weight').notNull(),
    maxWeight: integer('max_weight').notNull(),
    recommendedMaterials: text('recommended_materials').notNull(),
    description: text('description').notNull(),
    priority: integer('priority').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    seasonIdx: index('seasonal_recommendations_season_idx').on(table.season),
  })
);

/**
 * Usage periods table (Legacy)
 * Historical usage tracking - retained for data compatibility
 * @deprecated Use usage_records for new implementations
 */
export const usagePeriods = pgTable(
  'usage_periods',
  {
    id: text('id').primaryKey(),
    quiltId: text('quilt_id').notNull(),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    seasonUsed: text('season_used'),
    usageType: usageTypeEnum('usage_type').notNull().default('REGULAR'),
    notes: text('notes'),
    durationDays: integer('duration_days'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  table => ({
    quiltIdIdx: index('usage_periods_quilt_id_idx').on(table.quiltId),
    startDateIdx: index('usage_periods_start_date_idx').on(table.startDate),
    endDateIdx: index('usage_periods_end_date_idx').on(table.endDate),
  })
);

// Type exports for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Quilt = typeof quilts.$inferSelect;
export type NewQuilt = typeof quilts.$inferInsert;

export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type NewMaintenanceRecord = typeof maintenanceRecords.$inferInsert;

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type SeasonalRecommendation = typeof seasonalRecommendations.$inferSelect;
export type NewSeasonalRecommendation = typeof seasonalRecommendations.$inferInsert;

/** @deprecated Use UsageRecord instead */
export type UsagePeriod = typeof usagePeriods.$inferSelect;
/** @deprecated Use NewUsageRecord instead */
export type NewUsagePeriod = typeof usagePeriods.$inferInsert;

// ============================================================================
// Drizzle ORM Relations
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  cards: many(cards),
  auditLogs: many(auditLogs),
}));

export const quiltsRelations = relations(quilts, ({ many }) => ({
  usageRecords: many(usageRecords),
  maintenanceRecords: many(maintenanceRecords),
  notifications: many(notifications),
}));

export const usageRecordsRelations = relations(usageRecords, ({ one }) => ({
  quilt: one(quilts, { fields: [usageRecords.quiltId], references: [quilts.id] }),
}));

export const maintenanceRecordsRelations = relations(maintenanceRecords, ({ one }) => ({
  quilt: one(quilts, { fields: [maintenanceRecords.quiltId], references: [quilts.id] }),
}));

export const cardsRelations = relations(cards, ({ one }) => ({
  user: one(users, { fields: [cards.userId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  quilt: one(quilts, { fields: [notifications.quiltId], references: [quilts.id] }),
}));
