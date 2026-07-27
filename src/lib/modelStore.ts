import { supabase } from './supabase';
import type { ModelWeights } from './mlModel';

type DbRow = {
  id: number;
  model_type: string;
  weights: ModelWeights;
  trained_at: string;
  training_examples: number;
  training_accuracy: number;
  updated_at: string;
};

export async function loadModel(): Promise<ModelWeights | null> {
  const { data, error } = await supabase
    .from('ai_model_weights')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  const row = data as DbRow;
  return row.weights;
}

export async function saveModel(model: ModelWeights): Promise<void> {
  const { error } = await supabase.from('ai_model_weights').upsert(
    {
      id: 1,
      model_type: 'no_show_logistic',
      weights: model,
      trained_at: model.trainedAt,
      training_examples: model.trainingExamples,
      training_accuracy: model.trainingAccuracy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (error) throw error;
}

export async function getModelMeta(): Promise<{
  trainedAt: string | null;
  trainingExamples: number;
  trainingAccuracy: number;
} | null> {
  const { data, error } = await supabase
    .from('ai_model_weights')
    .select('trained_at, training_examples, training_accuracy')
    .eq('id', 1)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as {
    trained_at: string;
    training_examples: number;
    training_accuracy: number;
  };
  return {
    trainedAt: row.trained_at,
    trainingExamples: row.training_examples,
    trainingAccuracy: row.training_accuracy,
  };
}
