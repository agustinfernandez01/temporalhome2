import { conexionSupabase } from "@/lib/index.server";

// Intentar obtener columnas desde el catálogo cuando no hay filas en la tabla
const obtenerColumnasDesdeCatalogo = async (nombreTabla: string): Promise<string[]> => {
  try {
    const supabase = await conexionSupabase();
    // Consultamos information_schema.columns para el esquema public
    // Nota: en algunos proyectos puede requerir policies/permisos
    const { data, error } = await (supabase as any)
      .schema("information_schema")
      .from("columns")
      .select("column_name, ordinal_position")
      .eq("table_schema", "public")
      .eq("table_name", nombreTabla)
      .order("ordinal_position", { ascending: true });

    if (error || !data) return [];
    return (data as Array<{ column_name: string }>).map((c) => c.column_name);
  } catch {
    return [];
  }
};

// Obtener columnas Y datos de una tabla, aun cuando esté vacía
const obtenerTabla = async (nombreTabla: string) => {
  const supabase = await conexionSupabase();

  const { data, error } = await supabase.from(nombreTabla).select("*");

  // Si hay datos, inferimos columnas del primer registro
  if (!error && data && data.length > 0) {
    const columnas = Object.keys(data[0]);
    return { columnas, datos: data };
  }

  // Si no hay datos, intentamos obtener columnas desde el catálogo
  const columnasCatalogo = await obtenerColumnasDesdeCatalogo(nombreTabla);

  if (error) {
    console.error("Error al obtener la tabla:", error);
  }

  return {
    columnas: columnasCatalogo,
    datos: [],
  };
};

const eliminarfila = async (nombreTabla: string, id: number) => {
  const supabase = await conexionSupabase();

  const { error } = await supabase.from(nombreTabla).delete().eq("id", id);

  if (error) {
    console.error("Error al eliminar la fila:", error);
  }
};

export { obtenerTabla, eliminarfila };