CREATE TABLE `game_players` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`player_id` text NOT NULL,
	`seat_position` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`joined_at` text NOT NULL,
	`left_at` text,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'playing' NOT NULL,
	`created_at` text NOT NULL,
	`finished_at` text
);
--> statement-breakpoint
CREATE TABLE `hand_events` (
	`id` text PRIMARY KEY NOT NULL,
	`hand_id` text NOT NULL,
	`type` text NOT NULL,
	`player_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`hand_id`) REFERENCES `hands`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hands` (
	`id` text PRIMARY KEY NOT NULL,
	`round_id` text NOT NULL,
	`dealer_id` text NOT NULL,
	`number` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`dealer_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`avatar` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`number` integer NOT NULL,
	`starter_id` text NOT NULL,
	`status` text DEFAULT 'playing' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`starter_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `score_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`player_id` text NOT NULL,
	`amount` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `hand_events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
