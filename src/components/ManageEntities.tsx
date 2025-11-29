import { useState, useEffect } from 'react';
import { supabase, Provider, Unit } from '../lib/supabase';
import { Plus, Trash2, Users, Car } from 'lucide-react';

export function ManageEntities() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [newProvider, setNewProvider] = useState('');
  const [newUnit, setNewUnit] = useState('');

  useEffect(() => {
    loadProviders();
    loadUnits();
  }, []);

  const loadProviders = async () => {
    const { data } = await supabase
      .from('providers')
      .select('*')
      .order('name');
    if (data) setProviders(data);
  };

  const loadUnits = async () => {
    const { data } = await supabase
      .from('units')
      .select('*')
      .order('name');
    if (data) setUnits(data);
  };

  const addProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvider.trim()) return;

    await supabase.from('providers').insert({ name: newProvider.trim() });
    setNewProvider('');
    loadProviders();
  };

  const addUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnit.trim()) return;

    await supabase.from('units').insert({ name: newUnit.trim() });
    setNewUnit('');
    loadUnits();
  };

  const deleteProvider = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este proveedor?')) {
      await supabase.from('providers').delete().eq('id', id);
      loadProviders();
    }
  };

  const deleteUnit = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta unidad?')) {
      await supabase.from('units').delete().eq('id', id);
      loadUnits();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestionar Proveedores y Unidades</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Proveedores</h3>
          </div>

          <form onSubmit={addProvider} className="mb-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value)}
                placeholder="Nombre del proveedor"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-800">{provider.name}</span>
                <button
                  onClick={() => deleteProvider(provider.id)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {providers.length === 0 && (
              <p className="text-gray-500 text-center py-4">No hay proveedores registrados</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Car className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Unidades</h3>
          </div>

          <form onSubmit={addUnit} className="mb-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="Nombre/Número de unidad"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-800">{unit.name}</span>
                <button
                  onClick={() => deleteUnit(unit.id)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {units.length === 0 && (
              <p className="text-gray-500 text-center py-4">No hay unidades registradas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
