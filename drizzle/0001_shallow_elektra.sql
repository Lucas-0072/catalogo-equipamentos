CREATE TABLE `equipamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(50) NOT NULL,
	`referencia` varchar(100),
	`descricao` text NOT NULL,
	`unidade` varchar(20),
	`idTipo` varchar(20),
	`grupo` varchar(20),
	`grupoNome` varchar(100),
	`subgrupo` varchar(20),
	`subgrupoNome` varchar(100),
	`ncm` varchar(20),
	`ipi` varchar(20),
	`imagem` text,
	`fornecedor1Id` int,
	`fornecedor2Id` int,
	`fornecedor3Id` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fornecedores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`logo` text,
	`contato` varchar(255),
	`email` varchar(320),
	`telefone` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fornecedores_id` PRIMARY KEY(`id`)
);
