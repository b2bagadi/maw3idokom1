import { sqliteTable, integer, text, real, index } from 'drizzle-orm/sqlite-core';

// Enums as constants (SQLite doesn't have native enums)
// UserRole: OWNER, STAFF, CUSTOMER
// AppointmentStatus: PENDING, CONFIRMED, CANCELLED, COMPLETED

// Super Admin model - separate authentication for super admins
export const superAdmins = sqliteTable('super_admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  email: text('email').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  usernameIdx: index('super_admin_username_idx').on(table.username),
}));

// Global Settings model - for super admin configuration
export const globalSettings = sqliteTable('global_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  logoUrl: text('logo_url'),
  siteName: text('site_name'),
  heroTextEn: text('hero_text_en'),
  heroTextFr: text('hero_text_fr'),
  heroTextAr: text('hero_text_ar'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// I18nStrings model - database-backed translations
export const i18nStrings = sqliteTable('i18n_strings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  textEn: text('text_en').notNull(),
  textFr: text('text_fr').notNull(),
  textAr: text('text_ar').notNull(),
  category: text('category'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  keyIdx: index('i18n_key_idx').on(table.key),
  categoryIdx: index('i18n_category_idx').on(table.category),
}));

// Tenant model - business accounts
export const tenants = sqliteTable('tenants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  nameEn: text('name_en').notNull(),
  nameFr: text('name_fr').notNull(),
  nameAr: text('name_ar').notNull(),
  aboutEn: text('about_en'),
  aboutFr: text('about_fr'),
  aboutAr: text('about_ar'),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  ownerName: text('owner_name').notNull(),
  phone: text('phone'),
  address: text('address'),
  businessType: text('business_type'),
  logo: text('logo'),
  mapUrl: text('map_url'),
  whatsappUrl: text('whatsapp_url'),
  galleryImages: text('gallery_images'), // JSON array of image URLs
  latitude: real('latitude'),
  longitude: real('longitude'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  slugIdx: index('tenant_slug_idx').on(table.slug),
}));

// User model - supports OWNER, STAFF, CUSTOMER roles
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  role: text('role').notNull(), // OWNER, STAFF, CUSTOMER
  tenantId: integer('tenant_id').references(() => tenants.id), // nullable for customers
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  emailIdx: index('user_email_idx').on(table.email),
  tenantIdx: index('user_tenant_idx').on(table.tenantId),
}));

// Service model - trilingual fields for EN/FR/AR
export const services = sqliteTable('services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  nameEn: text('name_en').notNull(),
  nameFr: text('name_fr').notNull(),
  nameAr: text('name_ar').notNull(),
  descriptionEn: text('description_en'),
  descriptionFr: text('description_fr'),
  descriptionAr: text('description_ar'),
  duration: integer('duration').notNull(), // in minutes
  price: real('price').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  tenantIdx: index('service_tenant_idx').on(table.tenantId),
}));

// Staff model - connects users to tenants as staff members
export const staff = sqliteTable('staff', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  nameEn: text('name_en').notNull(),
  nameFr: text('name_fr').notNull(),
  nameAr: text('name_ar').notNull(),
  photoUrl: text('photo_url'),
  role: text('role').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  tenantIdx: index('staff_tenant_idx').on(table.tenantId),
  userIdx: index('staff_user_idx').on(table.userId),
}));

// StaffService junction table - many-to-many relationship
export const staffServices = sqliteTable('staff_services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  staffId: integer('staff_id').notNull().references(() => staff.id),
  serviceId: integer('service_id').notNull().references(() => services.id),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  staffIdx: index('staff_service_staff_idx').on(table.staffId),
  serviceIdx: index('staff_service_service_idx').on(table.serviceId),
}));

// Appointment model - supports both registered users and guest bookings
export const appointments = sqliteTable('appointments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  serviceId: integer('service_id').notNull().references(() => services.id),
  staffId: integer('staff_id').references(() => staff.id),
  customerId: integer('customer_id').references(() => users.id),
  guestName: text('guest_name'),
  guestEmail: text('guest_email'),
  guestPhone: text('guest_phone'),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  status: text('status').notNull().default('PENDING'),
  rejectionReason: text('rejection_reason'),
  customerLanguage: text('customer_language').default('en'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  tenantIdx: index('appointment_tenant_idx').on(table.tenantId),
  startTimeIdx: index('appointment_start_time_idx').on(table.startTime),
  statusIdx: index('appointment_status_idx').on(table.status),
  tenantStartIdx: index('appointment_tenant_start_idx').on(table.tenantId, table.startTime),
}));

// WorkingHours model - defines availability for staff or default business hours
export const workingHours = sqliteTable('working_hours', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  staffId: integer('staff_id').references(() => staff.id), // nullable for default business hours
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
  startTime: text('start_time').notNull(), // HH:MM format
  endTime: text('end_time').notNull(), // HH:MM format
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  tenantIdx: index('working_hours_tenant_idx').on(table.tenantId),
  staffIdx: index('working_hours_staff_idx').on(table.staffId),
  dayIdx: index('working_hours_day_idx').on(table.dayOfWeek),
}));