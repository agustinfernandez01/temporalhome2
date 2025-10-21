'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Home, Calendar } from 'lucide-react';

const DashboardPage = () => {
  const router = useRouter();

  const secciones = [
    { id: 1, nombre: 'Usuarios', icono: Users, color: 'from-blue-500 to-blue-600' },
    { id: 2, nombre: 'Propiedades', icono: Home, color: 'from-emerald-500 to-emerald-600' },
    { id: 3, nombre: 'Estadias', icono: Calendar, color: 'from-purple-500 to-purple-600' },
  ];

  const handleNavigation = (seccionNombre : string) => {
    router.push(`/dashboard/${seccionNombre.toLowerCase()}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">Selecciona una sección para administrar</p>
        </div>
        
        <div className="grid gap-5">
          {secciones.map((seccion) => {
            const IconComponent = seccion.icono;
            return (
              <button
                className="group relative overflow-hidden w-full text-left p-8 rounded-2xl bg-white border border-gray-200 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                key={seccion.id}
                onClick={() => handleNavigation(seccion.nombre)}
              >
                <div className="flex items-center gap-6">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${seccion.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {seccion.nombre}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Gestionar {seccion.nombre.toLowerCase()}</p>
                  </div>
                </div>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;