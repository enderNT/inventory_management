import { useState, useEffect } from 'react';
import type { Producto } from '../types';
import { SidePanel } from './SidePanel';
import { supabase } from '../lib/supabase';

export function Inventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | undefined>();
  const [sidePanelMode, setSidePanelMode] = useState<'create' | 'edit' | 'delete'>('create');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar productos al montar el componente
  useEffect(() => {
    fetchProductos();
  }, []);

  // Función para cargar productos desde Supabase
  const fetchProductos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProductos(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError('Error al cargar los productos. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProductos();
    setRefreshing(false);
  };

  const handleCreate = () => {
    setSidePanelMode('create');
    setSelectedProducto(undefined);
    setShowSidePanel(true);
  };

  const handleEdit = (producto: Producto) => {
    setSidePanelMode('edit');
    setSelectedProducto(producto);
    setShowSidePanel(true);
  };

  const handleDelete = (producto: Producto) => {
    setSidePanelMode('delete');
    setSelectedProducto(producto);
    setShowSidePanel(true);
  };

  const handleSubmit = async (productoData: Omit<Producto, 'id'>) => {
    try {
      switch (sidePanelMode) {
        case 'create':
          const { data: insertedData, error: insertError } = await supabase
            .from('productos')
            .insert([productoData])
            .select()
            .single();

          if (insertError) throw insertError;
          setProductos([insertedData, ...productos]);
          break;

        case 'edit':
          if (selectedProducto) {
            const { data: updatedData, error: updateError } = await supabase
              .from('productos')
              .update(productoData)
              .eq('id', selectedProducto.id)
              .select()
              .single();

            if (updateError) throw updateError;
            setProductos(productos.map(p => 
              p.id === selectedProducto.id ? updatedData : p
            ));
          }
          break;

        case 'delete':
          if (selectedProducto) {
            const { error: deleteError } = await supabase
              .from('productos')
              .delete()
              .eq('id', selectedProducto.id);

            if (deleteError) throw deleteError;
            setProductos(productos.filter(p => p.id !== selectedProducto.id));
          }
          break;
      }
      setShowSidePanel(false);
      setError(null);
    } catch (err) {
      console.error('Error al procesar la operación:', err);
      setError('Error al procesar la operación. Por favor, intente nuevamente.');
    }
  };

  // Filtrar productos según la búsqueda
  const productosFiltrados = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Inventario</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            className={`text-gray-600 hover:text-gray-900 ${refreshing ? 'animate-spin' : ''}`}
            disabled={refreshing}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-6 h-6">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
          <button
            onClick={handleCreate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            className="w-5 h-5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            <span>Agregar Producto</span>
          </button>
        </div>
      </div>

      <div className="mb-6 relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          type="text"
          placeholder="Buscar productos..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2">Cargando productos...</span>
                  </div>
                </td>
              </tr>
            ) : productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No hay productos en el inventario
                </td>
              </tr>
            ) : (
              productosFiltrados.map((producto) => (
                <tr key={producto.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{producto.codigo}</td>
                  <td className="px-6 py-4">{producto.nombre}</td>
                  <td className="px-6 py-4">{producto.stock}</td>
                  <td className="px-6 py-4">${producto.precio.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEdit(producto)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-5 h-5"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
                        /><path d="m15 5 4 4"/></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(producto)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-5 h-5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                        /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SidePanel
        isOpen={showSidePanel}
        onClose={() => setShowSidePanel(false)}
        mode={sidePanelMode}
        producto={selectedProducto}
        onSubmit={handleSubmit}
      />
    </div>
  );
}