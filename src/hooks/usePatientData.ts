import { useState } from 'react';
import { trpc } from '../trpc/client';
import { PatientData } from '../types/patient';

export const usePatientData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPatientDiagnosis = async (data: PatientData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await trpc.persistence.diagnoses.create.mutate({
        patientName: data.name,
        age: data.age,
        diagnosis: data.diagnosis,
        stage: data.stage,
        notes: data.notes || ''
      });
      return result;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar diagnóstico');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getPatientHistory = async (patientId: string) => {
    // Implementação futura baseada em endpoints de busca
    console.log('Buscando histórico para:', patientId);
  };

  return {
    createPatientDiagnosis,
    getPatientHistory,
    isLoading,
    error
  };
};
