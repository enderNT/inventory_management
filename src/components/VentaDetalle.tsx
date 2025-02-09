import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Venta } from '../types';

interface VentaDetalleProps {
  ventaId: string;
}

export function VentaDetalle({ ventaId }: VentaDetalleProps) {
  const [venta, setVenta] = useState<Venta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVentaDetalle();
  }, [ventaId]);
  
  const fetchVentaDetalle = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        venta_productos (
          id,
          cantidad,
          precio_unitario,
          subtotal,
          producto: productos (
            id,
            nombre,
            codigo
            )
            )
            `)
            .eq('id', ventaId)
            .single();
            
            if (error) throw error;
            setVenta(data);
    } catch (err) {
      console.error('Error al cargar el detalle de la venta:', err);
      setError('Error al cargar el detalle de la venta');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-700 bg-red-100 rounded-lg">
        {error}
      </div>
    );
  }

  if (!venta) {
    return (
      <div className="p-4 text-gray-700">
        Venta no encontrada
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Detalle de Venta</h2>
          <a
            href="#/ventas"
            className="text-indigo-600 hover:text-indigo-900"
          >
            Volver a Ventas
          </a>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Cliente</p>
            <p className="font-medium">{venta.cliente}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha</p>
            <p className="font-medium">{new Date(venta.fecha).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Productos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {venta?.venta_productos?.map((item: any) => (
                  <tr key={item.productoId}>
                    <td className="px-6 py-4">{item.id}</td>
                    <td className="px-6 py-4">{item.producto?.nombre}</td>
                    <td className="px-6 py-4">{item.cantidad}</td>
                    <td className="px-6 py-4">${item.precio_unitario.toFixed(2)}</td>
                    <td className="px-6 py-4">${item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right font-semibold">Total:</td>
                  <td className="px-6 py-4 font-semibold">${venta.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}