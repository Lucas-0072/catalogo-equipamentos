CREATE TABLE `departamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(100) NOT NULL,
	`login` varchar(50) NOT NULL,
	`senhaHash` varchar(255) NOT NULL,
	`ativo` enum('sim','nao') NOT NULL DEFAULT 'sim',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departamentos_id` PRIMARY KEY(`id`),
	CONSTRAINT `departamentos_nome_unique` UNIQUE(`nome`),
	CONSTRAINT `departamentos_login_unique` UNIQUE(`login`)
);
