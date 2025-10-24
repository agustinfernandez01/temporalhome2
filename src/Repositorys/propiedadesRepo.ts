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

type EditOpts = {
  idsImagenesABorrar?: number[];   // ids de la tabla imagenes
  nuevasImagenes?: File[];         // archivos a subir
  nuevaPrincipalId?: number;       // id de la tabla imagenes
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

//GET por ID

export async function getPropiedadByIdRepo(id: number | string): Promise<Property | null> {
  const supabase = await conexionSupabase();

  const { data, error } = await supabase
    .from('propiedades')
    .select('*, imagenes(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(`Error al obtener propiedad: ${error.message}`);
  }

  if (!data) return null;

  // agregar public_url a cada imagen de forma simple
  if (Array.isArray((data as any).imagenes)) {
    (data as any).imagenes = (data as any).imagenes.map((img: any) => {
      const bucket = img.bucket || DEFAULT_BUCKET;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(img.path);
      return { ...img, bucket, public_url: pub?.publicUrl ?? null };
    });
  } else {
    (data as any).imagenes = [];
  }

  return data as Property;
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

// PUT
export async function editPropiedadRepo(
  propiedadId: number | string,
  datos: Partial<Property> = {},
  opts: EditOpts = {}
): Promise<void> {
  const supabase = await conexionSupabase();

  // 1) Actualizar campos simples de la propiedad (si vienen)
  if (Object.keys(datos).length > 0) {
    const { error: updErr } = await supabase
      .from("propiedades")
      .update(datos)
      .eq("id", propiedadId);

    if (updErr) throw new Error(`Error actualizando propiedad: ${updErr.message}`);
  }

  // 2) Borrar imágenes seleccionadas (tabla + storage)
  if (opts.idsImagenesABorrar?.length) {
    // Traer path y bucket de las imágenes a borrar
    const { data: imgs, error: selErr } = await supabase
      .from("imagenes")
      .select("id, path, bucket")
      .in("id", opts.idsImagenesABorrar);

    if (selErr) throw new Error(`Error buscando imágenes a borrar: ${selErr.message}`);

    // Borrar filas
    const { error: delErr } = await supabase
      .from("imagenes")
      .delete()
      .in("id", opts.idsImagenesABorrar);

    if (delErr) throw new Error(`Error eliminando filas de imágenes: ${delErr.message}`);

    // Borrar archivos del storage (agrupando por bucket por si acaso)
    const byBucket: Record<string, string[]> = {};
    for (const i of imgs ?? []) {
      const b = i.bucket || DEFAULT_BUCKET;
      byBucket[b] ??= [];
      byBucket[b].push(i.path);
    }
    for (const [bucket, paths] of Object.entries(byBucket)) {
      if (paths.length) {
        const { error: storErr } = await supabase.storage.from(bucket).remove(paths);
        if (storErr) throw new Error(`Error borrando del storage: ${storErr.message}`);
      }
    }
  }

  // 3) Agregar nuevas imágenes (subir a storage + insertar filas)
  if (opts.nuevasImagenes?.length) {
    const rows: Array<{ id_propiedad: number | string; path: string; is_primary: boolean; bucket: string }> = [];

    for (const f of opts.nuevasImagenes) {
      const fileName = `${Date.now()}-${f.name}`.replace(/\s+/g, "_");
      const path = `${propiedadId}/${fileName}`;

      const { error: upErr } = await supabase.storage.from(DEFAULT_BUCKET).upload(path, f);
      if (upErr) throw new Error(`Error subiendo imagen "${f.name}": ${upErr.message}`);

      rows.push({
        id_propiedad: propiedadId,   // <- tu FK real
        path,
        is_primary: false,
        bucket: DEFAULT_BUCKET,
      });
    }

    const { error: insErr } = await supabase.from("imagenes").insert(rows);
    if (insErr) throw new Error(`Error guardando nuevas imágenes: ${insErr.message}`);
  }

  // 4) Marcar nueva principal (opcional)
  if (typeof opts.nuevaPrincipalId === "number") {
    // desmarcar todas
    const { error: clrErr } = await supabase
      .from("imagenes")
      .update({ is_primary: false })
      .eq("id_propiedad", propiedadId);
    if (clrErr) throw new Error(`Error limpiando principal: ${clrErr.message}`);

    // marcar la elegida
    const { error: setErr } = await supabase
      .from("imagenes")
      .update({ is_primary: true })
      .eq("id", opts.nuevaPrincipalId);
    if (setErr) throw new Error(`Error marcando imagen principal: ${setErr.message}`);
  }
}

// DELETE (opcional)

// src/lib/repository/propiedadesRepo.ts

export async function deletePropiedadRepo(propiedadId: number | string): Promise<void> {
  const supabase = await conexionSupabase();

  // 1) Traer imágenes para borrar del storage (si hubiera)
  const { data: imgs, error: imgErr } = await supabase
    .from("imagenes")
    .select("path, bucket")
    .eq("id_propiedad", propiedadId);

  if (imgErr) throw new Error(`Error obteniendo imágenes: ${imgErr.message}`);

  // 2) Borrar filas de imágenes (no falla si no hay)
  const { error: delImgsErr } = await supabase
    .from("imagenes")
    .delete()
    .eq("id_propiedad", propiedadId);

  if (delImgsErr) throw new Error(`Error eliminando imágenes: ${delImgsErr.message}`);

  // 3) Borrar archivos del storage (si había)
  const byBucket: Record<string, string[]> = {};
  for (const i of imgs ?? []) {
    const b = i.bucket || DEFAULT_BUCKET;
    (byBucket[b] ??= []).push(i.path);
  }
  for (const [bucket, paths] of Object.entries(byBucket)) {
    if (paths.length) {
      const { error: storErr } = await supabase.storage.from(bucket).remove(paths);
      if (storErr) throw new Error(`Error borrando archivos del storage: ${storErr.message}`);
    }
  }

  // 4) Borrar la propiedad y verificar si existía
  const { data: deleted, error: delPropErr } = await supabase
    .from("propiedades")
    .delete()
    .eq("id", propiedadId)
    .select("id"); // <- devuelve las filas borradas

  if (delPropErr) throw new Error(`Error eliminando propiedad: ${delPropErr.message}`);

  if (!deleted || deleted.length === 0) {
    // no existía la propiedad
    throw new Error("NOT_FOUND_PROP");
  }
}
