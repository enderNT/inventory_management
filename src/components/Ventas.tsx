import { useState, useEffect } from 'react';
import type { Venta, Producto, VentaProducto } from '../types';
import { supabase } from '../lib/supabase';

export function Ventas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [nuevaVenta, setNuevaVenta] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<VentaProducto[]>([]);
  const [cliente, setCliente] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVentas();
    fetchProductos();
  }, []);

  const fetchVentas = async () => {
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
        .order('fecha', { ascending: false });

      if (error) throw error;
      setVentas(data || []);
    } catch (err) {
      console.error('Error al cargar ventas:', err);
      setError('Error al cargar las ventas');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductos = async () => {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .order('nombre');
    if (data) setProductos(data);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVentas();
    setRefreshing(false);
  };

  const iniciarNuevaVenta = () => {
    setNuevaVenta(true);
    setSelectedProducts([]);
    setCliente('');
  };

  const handleAddProduct = (productoId: string) => {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    setSelectedProducts(prev => {
      const existing = prev.find(p => p.productoId === productoId);
      if (existing) {
        return prev.map(p => 
          p.productoId === productoId
            ? { ...p, cantidad: p.cantidad + 1, subtotal: (p.cantidad + 1) * p.precioUnitario }
            : p
        );
      }
      return [...prev, {
        productoId,
        cantidad: 1,
        precioUnitario: producto.precio,
        subtotal: producto.precio
      }];
    });
  };

  const handleUpdateCantidad = (productoId: string, cantidad: number) => {
    if (cantidad < 1) return;
    setSelectedProducts(prev =>
      prev.map(p =>
        p.productoId === productoId
          ? { ...p, cantidad, subtotal: cantidad * p.precioUnitario }
          : p
      )
    );
  };

  const handleRemoveProduct = (productoId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.productoId !== productoId));
  };

  const handleSubmitVenta = async () => {
    if (!cliente || selectedProducts.length === 0) {
      setError('Por favor complete todos los campos');
      return;
    }

    try {
      const total = selectedProducts.reduce((sum, p) => sum + p.subtotal, 0);
      
      // Insertar venta
      const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert([{ cliente, total }])
        .select()
        .single();

      if (ventaError) throw ventaError;

      // Insertar productos de la venta
      const { error: productosError } = await supabase
        .from('venta_productos')
        .insert(
          selectedProducts.map(p => ({
            venta_id: ventaData.id,
            producto_id: p.productoId,
            cantidad: p.cantidad,
            precio_unitario: p.precioUnitario,
            subtotal: p.subtotal
          }))
        );

      if (productosError) throw productosError;

      // Actualizar stock de productos
      for (const producto of selectedProducts) {
        const { error: updateError, data } = await supabase
          .rpc('decrement_product', {
            p_producto_id: producto.productoId,
            p_cantidad: producto.cantidad
          })
          console.log('LA DATA POR ACTUALIZAR STOCK ES:\n', data)
        if (updateError) throw updateError;
      }

      setNuevaVenta(false);
      setSelectedProducts([]);
      setCliente('');
      fetchVentas();
      setError(null);
    } catch (err) {
      console.error('Error al registrar la venta:', err);
      setError('Error al registrar la venta');
    }
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, p) => sum + p.subtotal, 0);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Ventas</h2>
        <div className="flex space-x-4">
          <button
            onClick={handleRefresh}
            className={`text-gray-600 hover:text-gray-900 ${refreshing ? 'animate-spin' : ''}`}
            disabled={refreshing}
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-rotate-ccw">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
          <button
            onClick={iniciarNuevaVenta}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-5 h-5">
              <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {nuevaVenta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Nueva Venta</h3>
              <button onClick={() => setNuevaVenta(false)} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-6 h-6">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Productos</label>
                <select
                  onChange={(e) => handleAddProduct(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value=""
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} - Stock: {producto.stock} - ${producto.precio}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProducts.length > 0 && (
                <div className="mt-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedProducts.map((item) => {
                        const producto = productos.find(p => p.id === item.productoId);
                        return (
                          <tr key={item.productoId}>
                            <td className="px-6 py-4">{producto?.nombre}</td>
                            <td className="px-6 py-4">
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => handleUpdateCantidad(item.productoId, parseInt(e.target.value))}
                                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="px-6 py-4">${item.precioUnitario}</td>
                            <td className="px-6 py-4">${item.subtotal}</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleRemoveProduct(item.productoId)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-5 h-5">
                                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-4 text-right">
                    <p className="text-lg font-bold">Total: ${calculateTotal()}</p>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={handleSubmitVenta}
                  disabled={selectedProducts.length === 0 || !cliente}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  Completar Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2">Cargando ventas...</span>
                  </div>
                </td>
              </tr>
            ) : ventas.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No hay ventas registradas
                </td>
              </tr>
            ) : (
              ventas.map((venta) => (
                <tr key={venta.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(venta.fecha).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">{venta.cliente}</td>
                  <td className="px-6 py-4">${venta.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <a
                      href={`#/ventas/${venta.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Ver detalles
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}