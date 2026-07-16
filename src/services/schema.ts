import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "doctor", "researcher"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Pacientes
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  age: int("age"),
  gender: mysqlEnum("gender", ["M", "F", "O"]),
  medicalRecordId: varchar("medicalRecordId", { length: 100 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

// Diagnósticos
export const diagnoses = mysqlTable("diagnoses", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  tumorType: varchar("tumorType", { length: 255 }).notNull(),
  stage: varchar("stage", { length: 50 }),
  grade: varchar("grade", { length: 50 }),
  diagnosisDate: timestamp("diagnosisDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Diagnosis = typeof diagnoses.$inferSelect;
export type InsertDiagnosis = typeof diagnoses.$inferInsert;

// Mutações Genéticas
export const mutations = mysqlTable("mutations", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  gene: varchar("gene", { length: 100 }).notNull(),
  mutation: varchar("mutation", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }),
  frequency: decimal("frequency", { precision: 5, scale: 2 }),
  clinicalSignificance: varchar("clinicalSignificance", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Mutation = typeof mutations.$inferSelect;
export type InsertMutation = typeof mutations.$inferInsert;

// Biomarcadores
export const biomarkers = mysqlTable("biomarkers", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  referenceRange: varchar("referenceRange", { length: 100 }),
  testDate: timestamp("testDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Biomarker = typeof biomarkers.$inferSelect;
export type InsertBiomarker = typeof biomarkers.$inferInsert;

// Tratamentos
export const treatments = mysqlTable("treatments", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["planned", "ongoing", "completed", "discontinued"]).default("planned"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Treatment = typeof treatments.$inferSelect;
export type InsertTreatment = typeof treatments.$inferInsert;

// Recomendações de Tratamento
export const treatmentRecommendations = mysqlTable("treatmentRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  diagnosisId: int("diagnosisId"),
  recommendation: text("recommendation").notNull(),
  confidenceScore: decimal("confidenceScore", { precision: 3, scale: 2 }),
  source: varchar("source", { length: 100 }),
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TreatmentRecommendation = typeof treatmentRecommendations.$inferSelect;
export type InsertTreatmentRecommendation = typeof treatmentRecommendations.$inferInsert;

// Agentes Médicos (Especialistas PhD)
export const medicalAgents = mysqlTable("medicalAgents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  specialty: varchar("specialty", { length: 255 }).notNull(),
  hIndex: int("hIndex"),
  description: text("description"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MedicalAgent = typeof medicalAgents.$inferSelect;
export type InsertMedicalAgent = typeof medicalAgents.$inferInsert;

// Consenso da Junta Médica
export const medicalBoardConsensus = mysqlTable("medicalBoardConsensus", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  diagnosisId: int("diagnosisId"),
  consensusLevel: decimal("consensusLevel", { precision: 3, scale: 2 }),
  primaryRecommendation: text("primaryRecommendation"),
  alternativeRecommendations: json("alternativeRecommendations"),
  agentsInvolved: json("agentsInvolved"),
  report: text("report"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MedicalBoardConsensus = typeof medicalBoardConsensus.$inferSelect;
export type InsertMedicalBoardConsensus = typeof medicalBoardConsensus.$inferInsert;

// Casos Clínicos
export const clinicalCases = mysqlTable("clinicalCases", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  outcome: text("outcome"),
  learnings: text("learnings"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClinicalCase = typeof clinicalCases.$inferSelect;
export type InsertClinicalCase = typeof clinicalCases.$inferInsert;

// Cache de Literatura
export const literatureCache = mysqlTable("literatureCache", {
  id: int("id").autoincrement().primaryKey(),
  pubmedId: varchar("pubmedId", { length: 100 }).unique(),
  title: varchar("title", { length: 500 }),
  authors: text("authors"),
  abstract: text("abstract"),
  journal: varchar("journal", { length: 255 }),
  publicationDate: timestamp("publicationDate"),
  url: text("url"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LiteratureCache = typeof literatureCache.$inferSelect;
export type InsertLiteratureCache = typeof literatureCache.$inferInsert;

// Estudos Clínicos
export const clinicalTrials = mysqlTable("clinicalTrials", {
  id: int("id").autoincrement().primaryKey(),
  nctNumber: varchar("nctNumber", { length: 50 }).unique(),
  title: varchar("title", { length: 500 }).notNull(),
  status: varchar("status", { length: 100 }),
  phase: varchar("phase", { length: 50 }),
  description: text("description"),
  url: text("url"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClinicalTrial = typeof clinicalTrials.$inferSelect;
export type InsertClinicalTrial = typeof clinicalTrials.$inferInsert;

// Memória do Sistema (Analytics)
export const systemMemory = mysqlTable("systemMemory", {
  id: int("id").autoincrement().primaryKey(),
  metric: varchar("metric", { length: 255 }).notNull(),
  value: decimal("value", { precision: 15, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type SystemMemory = typeof systemMemory.$inferSelect;
export type InsertSystemMemory = typeof systemMemory.$inferInsert;