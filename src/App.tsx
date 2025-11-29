import { useState } from 'react';
import { RideForm } from './components/RideForm';
import { WeeklyReport } from './components/WeeklyReport';
import { ManageEntities } from './components/ManageEntities';
import { Car } from 'lucide-react';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'register' | 'reports' | 'manage'>('register');

  const handleRideAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Car className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">
              Sistema de Gestión de Carreras
            </h1>
          </div>
          <p className="text-gray-600">Control de carreras, proveedores y unidades</p>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap justify-center space-x-2">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Registrar Carrera
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Reportes Semanales
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'manage'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Gestionar
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {activeTab === 'register' && <RideForm onRideAdded={handleRideAdded} />}
          {activeTab === 'reports' && <WeeklyReport key={refreshKey} />}
          {activeTab === 'manage' && <ManageEntities />}
        </div>
      </div>
    </div>
  );
}

export default App;
