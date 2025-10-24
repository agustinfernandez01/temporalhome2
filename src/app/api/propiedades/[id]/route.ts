import { editPropiedadRepo , getPropiedadByIdRepo , deletePropiedadRepo } from "@/Repositorys/propiedadesRepo";
import { NextResponse } from "next/server";

//GET BY ID

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const prop = await getPropiedadByIdRepo(params.id);
    if (!prop) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    return NextResponse.json(prop);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// EDIT POR ID
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const form = await req.formData();

    // 1) Datos de la propiedad (opcionales)
    let datos: any = {};
    const datosRaw = form.get("datos");
    if (typeof datosRaw === "string" && datosRaw.trim()) {
      datos = JSON.parse(datosRaw);
    }

    // 2) IDs de imágenes a borrar (opcionales)
    let idsImagenesABorrar: number[] | undefined;
    const idsRaw = form.get("idsImagenesABorrar");
    if (typeof idsRaw === "string" && idsRaw.trim()) {
      idsImagenesABorrar = JSON.parse(idsRaw);
    }

    // 3) Nuevas imágenes (opcionales)
    const nuevasImagenes = form.getAll("nuevasImagenes").filter(v => v instanceof File) as File[];

    // 4) Nueva principal (opcional)
    let nuevaPrincipalId: number | undefined;
    const principalRaw = form.get("nuevaPrincipalId");
    if (typeof principalRaw === "string" && principalRaw) {
      const n = Number(principalRaw);
      if (!Number.isNaN(n)) nuevaPrincipalId = n;
    }

    await editPropiedadRepo(id, datos, {
      idsImagenesABorrar,
      nuevasImagenes,
      nuevaPrincipalId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await deletePropiedadRepo(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg === "NOT_FOUND_PROP") {
      return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

