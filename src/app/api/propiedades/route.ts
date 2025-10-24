// app/api/propiedades/route.ts
import { NextResponse } from "next/server";
import { getPropiedadesConImagenes , createPropiedadRepo } from "@/Repositorys/propiedadesRepo";
import { get } from "http";

export const revalidate = 60; // opcional: cache ISR de 60s

export async function GET(_req: Request) {
  try {
    const propiedades = await getPropiedadesConImagenes();
    return NextResponse.json(propiedades, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/propiedades:", error);
    return NextResponse.json(
      {
        error: "Error al obtener propiedades",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

// POST nuevo (FormData: propiedad JSON + imágenes)
export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const raw = form.get("propiedad");
    if (!raw || typeof raw !== "string") {
      return NextResponse.json({ error: "Falta 'propiedad' (JSON en texto)" }, { status: 400 });
    }
    const propiedad = JSON.parse(raw); // { titulo, direccion, ... }

    const imagenes = form.getAll("imagenes").filter(v => v instanceof File) as File[];

    const id = await createPropiedadRepo(propiedad, imagenes);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
