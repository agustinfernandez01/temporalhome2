export interface Imagen {
  id: number | string;
  bucket: string;
  path: string;
  is_primary: boolean;
  // opcionales (pueden no venir desde DB)
  id_propiedad?: number | string;
  url?: string;
};
export default interface Property {
    id: number;
    nombre: string;
    direccion: string;
    ubicacion : string;
    precio: number;
    descripcion: string;
    tipo: string;
    estado: string;
    capacidad: number;
    ambientes: number;
    banios: number;
    camas: number;
    servicios: string[];
    ubicaciongoogle?: string;
 
}
