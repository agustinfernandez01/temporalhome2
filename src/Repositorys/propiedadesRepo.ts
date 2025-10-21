'use server';
import { conexionSupabase } from "@/lib/index.server";  

export const obtenerPropiedades = async () => {
    const supabase = await conexionSupabase();
    const { data, error } = await supabase.from('propiedades').select('*');
    if (error) {
        throw new Error('Error al obtener las propiedades: ' + error.message);
    }

    return data;
}