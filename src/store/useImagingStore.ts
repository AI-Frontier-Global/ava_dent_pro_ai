import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { PatientImage, ImageType } from '../types';
import type { DbPatientImage } from './db-types';

export function useImagingStore() {
  const loadPatientImages = useCallback(async (patientId: string): Promise<PatientImage[]> => {
    const { data, error } = await supabase
      .from('patient_images')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as DbPatientImage[]).map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      type: r.type,
      title: r.title,
      description: r.description ?? undefined,
      storagePath: r.storage_path,
      createdAt: r.created_at,
    }));
  }, []);

  const uploadPatientImage = useCallback(
    async (
      patientId: string,
      file: File,
      meta: { type: ImageType; title: string; description?: string },
    ): Promise<PatientImage> => {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${patientId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('patient-images')
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { data, error } = await supabase
        .from('patient_images')
        .insert({
          patient_id: patientId,
          type: meta.type,
          title: meta.title,
          description: meta.description ?? null,
          storage_path: path,
        })
        .select()
        .single();
      if (error) {
        await supabase.storage.from('patient-images').remove([path]);
        throw error;
      }
      const r = data as DbPatientImage;
      return {
        id: r.id,
        patientId: r.patient_id,
        type: r.type,
        title: r.title,
        description: r.description ?? undefined,
        storagePath: r.storage_path,
        createdAt: r.created_at,
      };
    },
    [],
  );

  const deletePatientImage = useCallback(async (img: PatientImage) => {
    const { error } = await supabase.from('patient_images').delete().eq('id', img.id);
    if (error) throw error;
    const { error: storageError } = await supabase.storage.from('patient-images').remove([img.storagePath]);
    if (storageError) throw storageError;
  }, []);

  const createSignedImageUrl = useCallback(async (storagePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('patient-images')
      .createSignedUrl(storagePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  }, []);

  return {
    loadPatientImages,
    uploadPatientImage,
    deletePatientImage,
    createSignedImageUrl,
  };
}

export type ImagingStore = ReturnType<typeof useImagingStore>;
