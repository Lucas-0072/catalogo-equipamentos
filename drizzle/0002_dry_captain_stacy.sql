CREATE TABLE `sync_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`status` enum('processing','completed','error') NOT NULL DEFAULT 'processing',
	`totalRows` int DEFAULT 0,
	`adicionados` int DEFAULT 0,
	`atualizados` int DEFAULT 0,
	`ignorados` int DEFAULT 0,
	`erros` int DEFAULT 0,
	`detalhes` text,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `sync_history_id` PRIMARY KEY(`id`)
);
