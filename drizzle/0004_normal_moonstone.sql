ALTER TABLE `departamentos` ADD `podeEditar` enum('sim','nao') DEFAULT 'nao' NOT NULL;--> statement-breakpoint
ALTER TABLE `departamentos` ADD `podeCriar` enum('sim','nao') DEFAULT 'nao' NOT NULL;--> statement-breakpoint
ALTER TABLE `departamentos` ADD `podeDeletar` enum('sim','nao') DEFAULT 'nao' NOT NULL;--> statement-breakpoint
ALTER TABLE `departamentos` ADD `podeSincronizar` enum('sim','nao') DEFAULT 'nao' NOT NULL;