import { NextResponse } from "next/server";
import { obtenerTabla } from "@/Repositorys/tableRepo";
import { conexionSupabase } from "@/lib/index.server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name_table: string }> }
) {
  const { name_table } = await params;
  const resultado = await obtenerTabla(name_table);
  
  return NextResponse.json(resultado);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name_table: string }> }
) {
  const { name_table } = await params;
  const payload = await request.json().catch(() => null);

  if (!payload || (typeof payload !== "object")) {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const supabase = await conexionSupabase();
  const { data, error } = await supabase
    .from(name_table)
    // Permite objeto o array de objetos
    .insert(Array.isArray(payload) ? payload : [payload])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data }, { status: 201 });
}