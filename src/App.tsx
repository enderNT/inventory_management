import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Inventario } from './components/Inventario';
import { Ventas } from './components/Ventas';
import { VentaDetalle } from './components/VentaDetalle';

// Función para obtener y normalizar la ruta del hash
const getPathFromHash = () => {
  let path = window.location.hash.replace('#', '');
  // Elimina barras iniciales y finales (por ejemplo, convierte "/ventas/" en "ventas")
  path = path.replace(/^\/|\/$/g, '');
  return path || 'inventario';
};

function App() {
  // Obtener la ruta normalizada
  const [currentPath, setCurrentPath] = useState(getPathFromHash);

  // Escuchar cambios en el hash de la URL
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(getPathFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Renderizar el componente correspondiente según la ruta
  const renderContent = () => {
    // Regex que detecta rutas del tipo "ventas" o "ventas/{id}"
    const regex = /^ventas(?:\/([^\/]+))?$/;
    const match = currentPath.match(regex);

    // Si se captura un id, es una ruta de detalle
    if (match && match[1]) {
      const ventaId = match[1];
      return <VentaDetalle ventaId={ventaId} />;
    }

    // Si no es una ruta de detalle, se evalúa según el valor de currentPath
    switch (currentPath) {
      case 'ventas':
        return <Ventas />;
      case 'inventario':
      default:
        return <Inventario />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto py-6">
        <div className="mb-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
