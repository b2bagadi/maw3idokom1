CREATE TABLE `appointments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tenant_id` integer NOT NULL,
	`service_id` integer NOT NULL,
	`staff_id` integer,
	`customer_id` integer,
	`guest_name` text,
	`guest_email` text,
	`guest_phone` text,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `appointment_tenant_idx` ON `appointments` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `appointment_start_time_idx` ON `appointments` (`start_time`);--> statement-breakpoint
CREATE INDEX `appointment_status_idx` ON `appointments` (`status`);--> statement-breakpoint
CREATE INDEX `appointment_tenant_start_idx` ON `appointments` (`tenant_id`,`start_time`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tenant_id` integer NOT NULL,
	`name_en` text NOT NULL,
	`name_fr` text NOT NULL,
	`name_ar` text NOT NULL,
	`description_en` text,
	`description_fr` text,
	`description_ar` text,
	`duration` integer NOT NULL,
	`price` real NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `service_tenant_idx` ON `services` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `staff` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`tenant_id` integer NOT NULL,
	`role` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `staff_tenant_idx` ON `staff` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `staff_user_idx` ON `staff` (`user_id`);--> statement-breakpoint
CREATE TABLE `staff_services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_id` integer NOT NULL,
	`service_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `staff_service_staff_idx` ON `staff_services` (`staff_id`);--> statement-breakpoint
CREATE INDEX `staff_service_service_idx` ON `staff_services` (`service_id`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`address` text,
	`business_type` text,
	`logo` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_unique` ON `tenants` (`slug`);--> statement-breakpoint
CREATE INDEX `tenant_slug_idx` ON `tenants` (`slug`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`phone` text,
	`role` text NOT NULL,
	`tenant_id` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `user_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `user_tenant_idx` ON `users` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `working_hours` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tenant_id` integer NOT NULL,
	`staff_id` integer,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `working_hours_tenant_idx` ON `working_hours` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `working_hours_staff_idx` ON `working_hours` (`staff_id`);--> statement-breakpoint
CREATE INDEX `working_hours_day_idx` ON `working_hours` (`day_of_week`);