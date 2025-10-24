// src/lib/repository/propiedadesRepo.ts
'use server';

import { conexionSupabase } from "@/lib/index.server";
import type Property from "@/Interfaces/property";

const DEFAULT_BUCKET = "imagenes"; // cambialo si tu bucket se llama distinto

type ImagenInsert = {
  id_propiedad: number | string;
  path: string;
  is_primary: boolean;
  bucket: string; // <-- OBLIGATORIO
};

// GET
export async function getPropiedadesConImagenes(): Promise<Property[]> {
  const supabase = await conexionSupabase();

  const { data, error } = await supabase
    .from('propiedades')
    .select('*, imagenes(*)');

  if (error) throw new Error(`Error al obtener propiedades: ${error.message}`);

  const props = (data ?? []) as any[];

  // Agrega public_url simple para cada imagen
  for (const p of props) {
    if (Array.isArray(p.imagenes)) {
      p.imagenes = p.imagenes.map((img: any) => {
        const bucket = img.bucket || DEFAULT_BUCKET;
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(img.path);
        return { ...img, bucket, public_url: pub?.publicUrl ?? null };
      });
    } else {
      p.imagenes = [];
    }
  }

  return props as Property[];
}

// POST
export async function createPropiedadRepo(
  propiedad: Omit<Property, "id" | "imagenes">,
  imagenes: File[] = []
): Promise<number | string> {
  const supabase = await conexionSupabase();

  const { data: inserted, error: propErr } = await supabase
    .from("propiedades")
    .insert(propiedad)
    .select("id")
    .single();
  if (propErr) throw new Error(`Error al crear propiedad: ${propErr.message}`);

  const propiedadId = inserted!.id;

  if (imagenes.length) {
    const rows: ImagenInsert[] = [];

    for (let i = 0; i < imagenes.length; i++) {
      const f = imagenes[i];
      const fileName = `${Date.now()}-${f.name}`.replace(/\s+/g, "_");
      const path = `${propiedadId}/${fileName}`;

      const { error: upErr } = await supabase.storage.from(DEFAULT_BUCKET).upload(path, f);
      if (upErr) throw new Error(`Error subiendo imagen "${f.name}": ${upErr.message}`);

      rows.push({
        id_propiedad: propiedadId,
        path,
        is_primary: i === 0,
        bucket: DEFAULT_BUCKET,                // <-- SIEMPRE ENVIAMOS BUCKET
      });
    }

    const { error: imgErr } = await supabase.from("imagenes").insert(rows);
    if (imgErr) throw new Error(`Error guardando imágenes: ${imgErr.message}`);
  }

  return propiedadId;
}