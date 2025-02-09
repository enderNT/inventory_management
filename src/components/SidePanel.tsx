import React from 'react';
import type { Producto } from '../types';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'delete';
  producto?: Producto;
  onSubmit: (producto: Omit<Producto, 'id'>) => void;
}

export function SidePanel({ isOpen, onClose, mode, producto, onSubmit }: SidePanelProps) {
  const [formData, setFormData] = React.useState<Omit<Producto, 'id'>>({
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    precio: producto?.precio || 0,
    stock: producto?.stock || 0,
    categoria: producto?.categoria || '',
    codigo: producto?.codigo || ''
  });

  React.useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        stock: producto.stock,
        categoria: producto.categoria,
        codigo: producto.codigo
      });
    }
  }, [producto]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'precio' || name === 'stock' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const titles = {
    create: 'Nuevo Producto',
    edit: 'Editar Producto',
    delete: 'Eliminar Producto'
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out`}>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium">{titles[mode]}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-6 h-6"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'delete' ? (
            <div className="space-y-4">
              <p className="text-gray-600">¿Estás seguro de que deseas eliminar este producto?</p>
              <div className="font-medium">
                <p>Código: {formData.codigo}</p>
                <p>Nombre: {formData.nombre}</p>
                <p>Stock: {formData.stock}</p>
                <p>Precio: ${formData.precio}</p>
              </div>
              <div className="pt-4 space-y-2">
                <button
                  onClick={handleSubmit}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Confirmar Eliminación
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">Código</label>
                <input
                  type="text"
                  id="codigo"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">Categoría</label>
                <input
                  type="text"
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="precio" className="block text-sm font-medium text-gray-700">Precio</label>
                <input
                  type="number"
                  id="precio"
                  name="precio"
                  value={formData.precio}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock</label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}