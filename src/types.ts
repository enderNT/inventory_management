export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  codigo: string;
}

export interface Venta {
  id: string;
  fecha: Date;
  productos: VentaProducto[];
  total: number;
  cliente: string;
}

export interface VentaProducto {
  id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}