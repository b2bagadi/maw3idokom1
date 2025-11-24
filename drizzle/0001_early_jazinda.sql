CREATE TABLE `global_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`logo_url` text,
	`site_name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `super_admins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `super_admins_username_unique` ON `super_admins` (`username`);--> statement-breakpoint
CREATE INDEX `super_admin_username_idx` ON `super_admins` (`username`);--> statement-breakpoint
ALTER TABLE `tenants` ADD `map_url` text;--> statement-breakpoint
ALTER TABLE `tenants` ADD `whatsapp_url` text;