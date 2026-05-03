PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_games` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`status` text DEFAULT 'setup' NOT NULL,
	`created_at` text NOT NULL,
	`finished_at` text
);
--> statement-breakpoint
INSERT INTO `__new_games`("id", "name", "status", "created_at", "finished_at") SELECT "id", "name", "status", "created_at", "finished_at" FROM `games`;--> statement-breakpoint
DROP TABLE `games`;--> statement-breakpoint
ALTER TABLE `__new_games` RENAME TO `games`;--> statement-breakpoint
PRAGMA foreign_keys=ON;