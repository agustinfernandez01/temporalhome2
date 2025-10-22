// ? = pasa esto ; ?? = si es null/undefined pasa esto ; : = else

'use client';
import { useParams } from 'next/navigation';
import { use, useEffect , useState } from 'react';

export default function Page() {
  const { section } = useParams<{ section: string }>();
  const [ data , setData ] = useState<any>(null);
  const [ columnas , setColumnas ] = useState<string[]>([]);
  const [ loading , setLoading ] = useState<boolean>(true);

  

  useEffect(() => {
    if (!section) return;
    
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/tables/${section}`);
        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }
        const result = await response.json();
        setData(result.datos);
        setColumnas(result.columnas);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
}, [section]); // ✅ Ahora sí reacciona a cambios

  if (loading) {
    return <span>Cargando...</span>;
  }

  return (
    <div>
      <h1>Sección: {section}</h1>
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th key={columna} className="border border-gray-300 px-4 py-2 text-left bg-gray-100">
                {columna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, index: number) => (
            <tr key={index}>
              {columnas.map((columna) => (
                <td key={columna} className="border border-gray-300 px-4 py-2">
                  {row[columna]}
                </td>
              ))}
            </tr>
          
          ))}
          <tr>
            <td colSpan={columnas.length} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
              {data.length === 0 ? 'No hay datos disponibles.' : ''}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
