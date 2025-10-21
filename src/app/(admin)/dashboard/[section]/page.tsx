'use client';
import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import Actions from '@/Modals/Actions';

export default function SectionPage({ 
  params 
}: { 
  params: Promise<{ section: string }> 
}) {
  const [section, setSection] = React.useState<string>('');
  const [columnas, setColumnas] = useState<string[]>([]);
  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const editableColumns = React.useMemo(
    () => columnas.filter((c) => !["id", "created_at", "updated_at", "inserted_at"].includes(c.toLowerCase())),
    [columnas]
  );

  // Resolver params (Next.js 15+ requiere await)
  React.useEffect(() => {
    params.then(p => setSection(p.section));
  }, [params]);

  const fetchData = async () => {
    if (!section) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/tables/${section}`);
      const json = await response.json();
      
      setColumnas(json.columnas || []);
      setDatos(json.datos || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [section]);

  // Inicializar form cuando abre modal o cambian columnas
  useEffect(() => {
    if (showModal) {
      const init: Record<string, any> = {};
      editableColumns.forEach((c) => (init[c] = ""));
      setFormData(init);
    }
  }, [showModal, editableColumns]);

  const handleChange = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNumberChange = (key: string, value: number) => {
    // No permite negativos
    if (value < 0) return;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const incrementNumber = (key: string) => {
    const current = parseInt(formData[key] || "0");
    handleNumberChange(key, current + 1);
  };

  const decrementNumber = (key: string) => {
    const current = parseInt(formData[key] || "0");
    if (current > 0) {
      handleNumberChange(key, current - 1);
    }
  };

  // Campos que deben ser numéricos con controles
  const numericFields = ["capacidad", "ambientes", "banios", "camas"];
  
  const isNumericField = (col: string) => {
    return numericFields.includes(col.toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/tables/${section}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      await fetchData();
      setShowModal(false);
    } catch (err) {
      console.error("Error al guardar:", err);
      alert(`No se pudo guardar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  };

  const toggleRowExpansion = (idx: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedRows(newExpanded);
  };

  // Función para renderizar servicios como badges con límite
  const renderServicios = (servicios: any, rowIdx: number) => {
    if (!servicios) return '-';
    
    const serviciosArray = Array.isArray(servicios) 
      ? servicios 
      : typeof servicios === 'string' 
        ? servicios.split(',').map(s => s.trim()) 
        : [servicios];
    
    const isExpanded = expandedRows.has(rowIdx);
    const limit = 2;
    const hasMore = serviciosArray.length > limit;
    const displayedServicios = isExpanded ? serviciosArray : serviciosArray.slice(0, limit);
    
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {displayedServicios.map((servicio, idx) => (
            <span 
              key={idx} 
              className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg whitespace-nowrap"
            >
              {servicio}
            </span>
          ))}
        </div>
        {hasMore && (
          <button
            onClick={() => toggleRowExpansion(rowIdx)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors w-fit"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Ver menos
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Ver más ({serviciosArray.length - limit})
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  // Función para renderizar el estado con badge de color
  const renderEstado = (estado: string) => {
    if (!estado) return '-';
    
    const estadoLower = estado.toLowerCase();
    
    const estilos = {
      disponible: 'bg-green-100 text-green-700 border-green-200',
      'no disponible': 'bg-red-100 text-red-700 border-red-200',
      mantenimiento: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    
    const estilo = estilos[estadoLower as keyof typeof estilos] || 'bg-gray-100 text-gray-700 border-gray-200';
    
    return (
      <span className={`inline-block px-3 py-1.5 text-xs font-semibold rounded-lg border ${estilo}`}>
        {estado}
      </span>
    );
  };

  // Función para renderizar el contenido de la celda según la columna
  const renderCellContent = (col: string, value: any, rowIdx: number) => {
    const colLower = col.toLowerCase();
    
    if (colLower === 'servicios') {
      return renderServicios(value, rowIdx);
    }
    
    if (colLower === 'tipo' || colLower === 'estado' || colLower === 'status') {
      return renderEstado(value);
    }
    
    return value ?? '-';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-lg">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 capitalize mb-2">
              {section}
            </h1>
            <p className="text-gray-600">Gestión de {section}</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium">
            <Plus className="w-5 h-5" />
            Agregar
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {columnas.map((col) => (
                    <th key={col} className="px-6 py-4 text-left text-sm font-semibold text-gray-700 capitalize border-b-2 border-gray-200">
                      {col}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 border-b-2 border-gray-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {datos.length === 0 ? (
                  <tr>
                    <td colSpan={columnas.length + 1} className="text-center p-12 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <span className="font-medium">No hay datos</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  datos.map((item, idx) => (
                    <tr key={idx} className="hover:bg-blue-50 transition-colors duration-150">
                      {columnas.map((col) => (
                        <td key={col} className="px-6 py-4 text-sm text-gray-700">
                          {renderCellContent(col, item[col], idx)}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de acciones */}
      <Actions open={showModal} onClose={() => setShowModal(false)} title={`Agregar ${section}`}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {editableColumns.map((col) => (
            <div key={col}>
              <label className="mb-1 block text-sm font-medium text-gray-700 capitalize">{col}</label>
              
              {isNumericField(col) ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => decrementNumber(col)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={formData[col] ?? 0}
                    onChange={(e) => handleNumberChange(col, parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => incrementNumber(col)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    +
                  </button>
                </div>
              ) : col.toLowerCase() === "tipo" ? (
                <select
                  value={formData[col] ?? ""}
                  onChange={(e) => handleChange(col, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Casa">Casa</option>
                  <option value="Departamento">Departamento</option>
                  <option value="Duplex">Duplex</option>
                </select>
              ) : col.toLowerCase() === "estado" ? (
                <select
                  value={formData[col] ?? ""}
                  onChange={(e) => handleChange(col, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Disponible">Disponible</option>
                  <option value="No Disponible">No Disponible</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                </select>
              ) : (
                <input
                  value={formData[col] ?? ""}
                  onChange={(e) => handleChange(col, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none"
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Guardar</button>
          </div>
        </form>
      </Actions>
    </div>
  );
}