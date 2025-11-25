CREATE TABLE `i18n_strings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`text_en` text NOT NULL,
	`text_fr` text NOT NULL,
	`text_ar` text NOT NULL,
	`category` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `i18n_strings_key_unique` ON `i18n_strings` (`key`);--> statement-breakpoint
CREATE INDEX `i18n_key_idx` ON `i18n_strings` (`key`);--> statement-breakpoint
CREATE INDEX `i18n_category_idx` ON `i18n_strings` (`category`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_staff` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`tenant_id` integer NOT NULL,
	`name_en` text NOT NULL,
	`name_fr` text NOT NULL,
	`name_ar` text NOT NULL,
	`photo_url` text,
	`role` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_staff`("id", "user_id", "tenant_id", "name_en", "name_fr", "name_ar", "photo_url", "role", "is_active", "created_at", "updated_at") SELECT "id", "user_id", "tenant_id", "name_en", "name_fr", "name_ar", "photo_url", "role", "is_active", "created_at", "updated_at" FROM `staff`;--> statement-breakpoint
DROP TABLE `staff`;--> statement-breakpoint
ALTER TABLE `__new_staff` RENAME TO `staff`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `staff_tenant_idx` ON `staff` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `staff_user_idx` ON `staff` (`user_id`);--> statement-breakpoint
ALTER TABLE `appointments` ADD `rejection_reason` text;--> statement-breakpoint
ALTER TABLE `appointments` ADD `customer_language` text DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `global_settings` ADD `hero_text_en` text;--> statement-breakpoint
ALTER TABLE `global_settings` ADD `hero_text_fr` text;--> statement-breakpoint
ALTER TABLE `global_settings` ADD `hero_text_ar` text;--> statement-breakpoint
ALTER TABLE `tenants` ADD `name_en` text NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `name_fr` text NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `name_ar` text NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `about_en` text;--> statement-breakpoint
ALTER TABLE `tenants` ADD `about_fr` text;--> statement-breakpoint
ALTER TABLE `tenants` ADD `about_ar` text;--> statement-breakpoint
ALTER TABLE `tenants` ADD `password_hash` text NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `owner_name` text NOT NULL;