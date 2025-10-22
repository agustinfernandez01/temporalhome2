"use client";

import React from "react";
import { X } from "lucide-react";

type ActionsProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
};

export default function Actions({ open, onClose, title = "Modal de prueba", children }: ActionsProps) {
  if (!open) return null;
    
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Overlay con blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-blue-900/40 to-indigo-900/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente sutil */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-5 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <h2 id="modal-title" className="text-xl font-bold text-gray-800">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-gray-700 transition-all duration-200 hover:shadow-sm"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 text-sm text-gray-700">
          {children ?? (
            <p className="text-gray-600">
              Este es un modal de ejemplo para probar el renderizado. Podés cerrarlo
              tocando fuera o con el botón Cerrar.
            </p>
          )}
        </div>

        {/* Footer con botones mejorados (solo si no hay children) */}
        {!children && (
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-all duration-200 border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
