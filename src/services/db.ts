import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  InsertPatient,
  patients,
  InsertDiagnosis,
  diagnoses,
  InsertMutation,
  mutations,
  InsertBiomarker,
  biomarkers,
  InsertTreatment,
  treatments,
  InsertTreatmentRecommendation,
  treatmentRecommendations,
  InsertMedicalAgent,
  medicalAgents,
  InsertMedicalBoardConsensus,
  medicalBoardConsensus,
  InsertClinicalCase,
  clinicalCases,
  InsertLiteratureCache,
  literatureCache,
  InsertClinicalTrial,
  clinicalTrials,
  InsertSystemMemory,
  systemMemory,
} from "./schema";
let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ PACIENTES ============

export async function createPatient(data: InsertPatient) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db.insert(patients).values(data);
}

export async function getPatientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
  return result[0];
}

export async function getAllPatients() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(patients);
}

// ============ DIAGNÓSTICOS ============

export async function createDiagnosis(data: InsertDiagnosis) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db.insert(diagnoses).values(data);
}

export async function getDiagnosesByPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(diagnoses).where(eq(diagnoses.patientId, patientId));
}

// ============ MUTAÇÕES ============

export async function createMutation(data: InsertMutation) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db.insert(mutations).values(data);
}

export async function getMutationsByPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(mutations).where(eq(mutations.patientId, patientId));
}

// ============ BIOMARCADORES ============

export async function createBiomarker(data: InsertBiomarker) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db.insert(biomarkers).values(data);
}

export async function getBiomarkersByPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(biomarkers).where(eq(biomarkers.patientId, patientId));
}

// ============ TRATAMENTOS ============

export async function createTreatment(data: InsertTreatment) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db.insert(treatments).values(data);
}

export async function getTreatmentsByPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(treatments).where(eq(treatments.patientId, patientId));
}

// ============ RECOMENDAÇÕES DE TRATAMENTO ============

export async function createTreatmentRecommendation(data: InsertTreatmentRecommendation) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db.insert(treatmentRecommendations).values(data);
}

export async function getRecommendationsByPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(treatmentRecommendations).where(eq(treatmentRecommendations.patientId, patientId));
}

// ============ AGENTES MÉDICOS ============

export async function getAllMedicalAgents() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(medicalAgents);
}

export async function createMedicalAgent(data: InsertMedicalAgent) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db.insert(medicalAgents).values(data);
}

// ============ CONSENSO DA JUNTA MÉDICA ============

export async function createMedicalBoardConsensus(data: InsertMedicalBoardConsensus) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db.insert(medicalBoardConsensus).values(data);
}

export async function getBoardConsensusByPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(medicalBoardConsensus).where(eq(medicalBoardConsensus.patientId, patientId));
}

// ============ CASOS CLÍNICOS ============

export async function createClinicalCase(data: InsertClinicalCase) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db.insert(clinicalCases).values(data);
}

export async function getClinicalCasesByPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(clinicalCases).where(eq(clinicalCases.patientId, patientId));
}

// ============ LITERATURA ============

export async function cacheLiterature(data: InsertLiteratureCache) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db.insert(literatureCache).values(data);
}

export async function getLiteratureByPubmedId(pubmedId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(literatureCache).where(eq(literatureCache.pubmedId, pubmedId)).limit(1);
  return result[0];
}

// ============ ESTUDOS CLÍNICOS ============

export async function createClinicalTrial(data: InsertClinicalTrial) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db.insert(clinicalTrials).values(data);
}

export async function getAllClinicalTrials() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(clinicalTrials);
}

// ============ MEMÓRIA DO SISTEMA ============

export async function recordSystemMetric(metric: string, value: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db.insert(systemMemory).values({ metric, value: value.toString() });
}

export async function getSystemMetrics(metric: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(systemMemory).where(eq(systemMemory.metric, metric)).limit(limit);
}
