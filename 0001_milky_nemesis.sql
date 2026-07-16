CREATE TABLE `biomarkers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`value` decimal(10,2),
	`unit` varchar(50),
	`referenceRange` varchar(100),
	`testDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `biomarkers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinicalCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`outcome` text,
	`learnings` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinicalCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinicalTrials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nctNumber` varchar(50),
	`title` varchar(500) NOT NULL,
	`status` varchar(100),
	`phase` varchar(50),
	`description` text,
	`url` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clinicalTrials_id` PRIMARY KEY(`id`),
	CONSTRAINT `clinicalTrials_nctNumber_unique` UNIQUE(`nctNumber`)
);
--> statement-breakpoint
CREATE TABLE `diagnoses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`tumorType` varchar(255) NOT NULL,
	`stage` varchar(50),
	`grade` varchar(50),
	`diagnosisDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diagnoses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `literatureCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pubmedId` varchar(100),
	`title` varchar(500),
	`authors` text,
	`abstract` text,
	`journal` varchar(255),
	`publicationDate` timestamp,
	`url` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `literatureCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `literatureCache_pubmedId_unique` UNIQUE(`pubmedId`)
);
--> statement-breakpoint
CREATE TABLE `medicalAgents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`specialty` varchar(255) NOT NULL,
	`hIndex` int,
	`description` text,
	`status` enum('active','inactive') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `medicalAgents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicalBoardConsensus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`diagnosisId` int,
	`consensusLevel` decimal(3,2),
	`primaryRecommendation` text,
	`alternativeRecommendations` json,
	`agentsInvolved` json,
	`report` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicalBoardConsensus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mutations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`gene` varchar(100) NOT NULL,
	`mutation` varchar(255) NOT NULL,
	`type` varchar(100),
	`frequency` decimal(5,2),
	`clinicalSignificance` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mutations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`age` int,
	`gender` enum('M','F','O'),
	`medicalRecordId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`),
	CONSTRAINT `patients_medicalRecordId_unique` UNIQUE(`medicalRecordId`)
);
--> statement-breakpoint
CREATE TABLE `systemMemory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metric` varchar(255) NOT NULL,
	`value` decimal(15,2),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `systemMemory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treatmentRecommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`diagnosisId` int,
	`recommendation` text NOT NULL,
	`confidenceScore` decimal(3,2),
	`source` varchar(100),
	`status` enum('pending','accepted','rejected') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `treatmentRecommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treatments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`startDate` timestamp,
	`endDate` timestamp,
	`status` enum('planned','ongoing','completed','discontinued') DEFAULT 'planned',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `treatments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','doctor','researcher') NOT NULL DEFAULT 'user';