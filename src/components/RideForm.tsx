import { useState, useEffect } from 'react';
import { supabase, Provider, Unit } from '../lib/supabase';
import { Plus } from 'lucide-react';

interface RideFormProps {
  onRideAdded: () => void;
}

export function RideForm({ onRideAdded }: RideFormProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    provider_id: '',
    unit_id: '',
    start_location: '',
    destination: '',
    payment_type: 'Efectivo' as 'Efectivo' | 'Crédito' | 'Transferencia',
    amount: '',
    has_commission: false,
    unit_requested_credit: false,
    credit_amount: '',
    provider_gave_credit: false,
  });

  useEffect(() => {
    loadProviders();
    loadUnits();
  }, []);

  const loadProviders = async () => {
    const { data } = await supabase.from('providers').select('*').order('name');
    if (data) setProviders(data);
  };

  const loadUnits = async () => {
    const { data } = await supabase.from('units').select('*').order('name');
    if (data) setUnits(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const amount = parseFloat(formData.amount);
    const creditAmount = parseFloat(formData.credit_amount || '0');

    const commissionAmount = formData.has_commission ? amount * 0.1 : 0;

    // --- PAYLOAD SEGURO ---
    const payload: any = {
      date: formData.date,
      provider_id: formData.provider_id,
      unit_id: formData.unit_id,
      start_location: formData.start_location,
      destination: formData.destination,
      payment_type: formData.payment_type,
      amount,
      has_commission: formData.has_commission,
      unit_requested_credit: formData.unit_requested_credit,
      provider_gave_credit: formData.provider_gave_credit,
    };

    if (formData.has_commission) payload.commission_amount = commissionAmount;
    if (formData.unit_requested_credit) payload.credit_amount = creditAmount;

    const { error } = await supabase.from('rides').insert(payload);

    setLoading(false);

    if (error) {
      console.error("SUPABASE ERROR:", error);
      alert("Ocurrió un error al registrar la carrera.");
      return;
    }

    // RESET
    setFormData({
      date: new Date().toISOString().split('T')[0],
      provider_id: '',
      unit_id: '',
      start_location: '',
      destination: '',
      payment_type: 'Efectivo',
      amount: '',
      has_commission: false,
      unit_requested_credit: false,
      credit_amount: '',
      provider_gave_credit: false,
    });

    onRideAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Registrar Nueva Carrera</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Monto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Proveedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
          <select
            required
            value={formData.provider_id}
            onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Seleccionar proveedor</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>

        {/* Unidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
          <select
            required
            value={formData.unit_id}
            onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Seleccionar unidad</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>

        {/* Inicio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
          <input
            type="text"
            required
            value={formData.start_location}
            onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Destino */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
          <input
            type="text"
            required
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Tipo de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago</label>
          <select
            required
            value={formData.payment_type}
            onChange={(e) => setFormData({ ...formData, payment_type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Crédito">Crédito</option>
            <option value="Transferencia">Transferencia</option>
          </select>
        </div>
      </div>

      {/* Opciones */}
      <div className="space-y-3 pt-4 border-t">

        {/* Comisión */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.has_commission}
            onChange={(e) =>
              setFormData({ ...formData, has_commission: e.target.checked })
            }
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">
            Carrera con comisión (10%)
          </span>
        </label>

        {/* Unidad solicitó crédito */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.unit_requested_credit}
            onChange={(e) =>
              setFormData({ ...formData, unit_requested_credit: e.target.checked })
            }
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">
            Unidad solicitó crédito
          </span>
        </label>

        {/* Campo adicional para crédito */}
        {formData.unit_requested_credit && (
          <div className="ml-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto del crédito
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.credit_amount}
              onChange={(e) => setFormData({ ...formData, credit_amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ej. 5.00"
            />
          </div>
        )}

        {/* Proveedor dio crédito */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.provider_gave_credit}
            onChange={(e) =>
              setFormData({ ...formData, provider_gave_credit: e.target.checked })
            }
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">
            Proveedor dio crédito
          </span>
        </label>
      </div>

      {/* Botón */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        <Plus className="w-5 h-5" />
        <span>{loading ? 'Registrando...' : 'Registrar Carrera'}</span>
      </button>
    </form>
  );
}
