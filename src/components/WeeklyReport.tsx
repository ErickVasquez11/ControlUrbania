import { useState, useEffect } from 'react';
import { supabase, RideWithDetails } from '../lib/supabase';
import { FileDown, Calendar, Edit, X, Save, Trash2, RefreshCw } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type Adjustment = {
  cuadreAPagar?: number;
  frecuenciaFee?: number;
  creditoAFavor?: number; 
  creditosAPagar?: number; 
  enableFrecuencia?: boolean;
  enableCreditoSolicitado?: boolean;
  creditoSolicitadoManual?: number; 
};

export function WeeklyReport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rides, setRides] = useState<RideWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  
  // ESTADO NUEVO PARA TODAS LAS UNIDADES
  const [allUnits, setAllUnits] = useState<any[]>([]);

  const [adjustments, setAdjustments] = useState<Record<string, Adjustment>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'unit' | 'provider' | null>(null);
  const [editingName, setEditingName] = useState('');
  const [tempAdjustment, setTempAdjustment] = useState<Adjustment>({});
  const [modalRides, setModalRides] = useState<RideWithDetails[]>([]);
  const [updatingRide, setUpdatingRide] = useState<string | null>(null);

  useEffect(() => {
    // 1. Cargar catálogo de unidades inmediatamente
    loadAllUnits();

    // 2. Configurar fechas
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    setStartDate(weekStart.toISOString().split('T')[0]);
    setEndDate(weekEnd.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadRides();
      setAdjustments({}); 
    }
  }, [startDate, endDate]);

  // --- NUEVA FUNCIÓN PARA CARGAR UNIDADES DIRECTAMENTE ---
  const loadAllUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('name'); 
      
    if (error) {
        console.error("Error al cargar unidades:", error);
    } else {
        setAllUnits(data || []);
    }
  };

  const loadRides = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('rides')
      .select(`*, provider:providers(id, name), unit:units(id, name)`)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (data) setRides(data as any);
    setLoading(false);
  };

  // ==================================================================
  //           LÓGICA DE CÁLCULO
  // ==================================================================
  const calculateUnitTotal = (unitId: string, currentRides: RideWithDetails[]) => {
    // IMPORTANTE: Aseguramos que los IDs sean del mismo tipo (String) para comparar
    const unitRides = currentRides.filter(r => String(r.unit_id) === String(unitId));
    const rideCount = unitRides.length;
    
    let totalGrossRides = 0;
    let totalCommission = 0;
    let creditoAFavorCalculado = 0;
    let creditoSolicitadoAuto = 0;

    unitRides.forEach(ride => {
      totalGrossRides += ride.amount || 0;
      if (ride.has_commission) totalCommission += (ride.amount || 0) * 0.10;
      if (ride.payment_type === 'Crédito') creditoAFavorCalculado += ride.amount || 0;
      if (ride.unit_requested_credit) creditoSolicitadoAuto += ride.amount || 0;
    });

    const adj = adjustments[unitId] || {};
    
    const cuadreAPagar = adj.cuadreAPagar !== undefined ? adj.cuadreAPagar : 1.00;
    const baseFrecuencia = adj.frecuenciaFee !== undefined ? adj.frecuenciaFee : (rideCount < 5 ? 10.00 : 0.00);
    const baseCreditoSolicitado = adj.creditoSolicitadoManual !== undefined ? adj.creditoSolicitadoManual : creditoSolicitadoAuto;
    const creditoAFavor = adj.creditoAFavor !== undefined ? adj.creditoAFavor : creditoAFavorCalculado;

    const isFrecuenciaEnabled = adj.enableFrecuencia !== undefined ? adj.enableFrecuencia : true;
    const isCreditoSolicitadoEnabled = adj.enableCreditoSolicitado !== undefined ? adj.enableCreditoSolicitado : true;

    const finalFrecuencia = isFrecuenciaEnabled ? baseFrecuencia : 0;
    const finalCreditoSolicitado = isCreditoSolicitadoEnabled ? baseCreditoSolicitado : 0;

    const neto = (cuadreAPagar + totalCommission + finalFrecuencia + finalCreditoSolicitado) - creditoAFavor;

    let totalAPagar = 0;
    let totalARecibir = 0;
    if (neto > 0) totalAPagar = neto;
    else totalARecibir = Math.abs(neto);

    return { 
      rides: unitRides, rideCount, totalGrossRides, 
      creditoSolicitadoAuto, baseCreditoSolicitado, finalCreditoSolicitado, isCreditoSolicitadoEnabled, 
      totalCommission, cuadreAPagar, baseFrecuencia, finalFrecuencia, isFrecuenciaEnabled, 
      creditoAFavor, totalAPagar, totalARecibir
    };
  };

  const calculateProviderTotal = (providerId: string, currentRides: RideWithDetails[]) => {
    const providerRides = currentRides.filter(r => String(r.provider_id) === String(providerId));
    let totalGrossRides = 0;
    let creditosAPagarCalculado = 0; 
    let totalCommission = 0; 

    providerRides.forEach(ride => {
      totalGrossRides += ride.amount || 0;
      if (ride.has_commission) totalCommission += (ride.amount || 0) * 0.10;
      if (ride.provider_gave_credit) creditosAPagarCalculado += ride.amount || 0;
    });

    const adj = adjustments[providerId] || {};
    const cuadreAPagar = adj.cuadreAPagar !== undefined ? adj.cuadreAPagar : 1.00;
    const creditosAPagar = adj.creditosAPagar !== undefined ? adj.creditosAPagar : creditosAPagarCalculado;

    const totalAPagar = creditosAPagar + cuadreAPagar;
    const totalARecibir = totalCommission;

    return { 
      rides: providerRides, totalGrossRides, creditosAPagar, 
      totalCommission, cuadreAPagar, totalAPagar, totalARecibir 
    };
  };

  // --- HANDLERS ---
  const handleUpdateRideAmount = async (rideId: string, newAmount: string) => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount)) return;
    setUpdatingRide(rideId);
    const { error } = await supabase.from('rides').update({ amount: amount }).eq('id', rideId);
    if (!error) {
      const updatedRides = rides.map(r => r.id === rideId ? { ...r, amount } : r);
      setRides(updatedRides);
    }
    setUpdatingRide(null);
  };

  const handleDeleteRide = async (rideId: string) => {
    if (!confirm("¿Eliminar carrera?")) return;
    setUpdatingRide(rideId);
    const { error } = await supabase.from('rides').delete().eq('id', rideId);
    if (!error) {
      setRides(rides.filter(r => r.id !== rideId));
    }
    setUpdatingRide(null);
  };

  const handleEditClick = (type: 'unit' | 'provider', id: string, name: string) => {
    const currentData = type === 'unit' ? calculateUnitTotal(id, rides) : calculateProviderTotal(id, rides);
    
    setTempAdjustment({
      cuadreAPagar: currentData.cuadreAPagar,
      frecuenciaFee: (currentData as any).baseFrecuencia, 
      creditoAFavor: (currentData as any).creditoAFavor, 
      creditosAPagar: (currentData as any).creditosAPagar,
      enableFrecuencia: (currentData as any).isFrecuenciaEnabled ?? true,
      enableCreditoSolicitado: (currentData as any).isCreditoSolicitadoEnabled ?? true,
      creditoSolicitadoManual: (currentData as any).baseCreditoSolicitado 
    });

    setModalRides(currentData.rides);
    setEditingType(type);
    setEditingId(id);
    setEditingName(name);
  };

  const saveAdjustments = () => {
    if (editingId) {
      setAdjustments(prev => ({ ...prev, [editingId]: tempAdjustment }));
      setEditingId(null);
      setEditingType(null);
    }
  };

  const generatePDF = (type: 'unit' | 'provider', id: string, name: string) => {
    const pdf = new jsPDF();
    const title = `Reporte Semanal - ${type === 'unit' ? 'Unidad' : 'Proveedor'}: ${name}`;
    pdf.setFontSize(18); pdf.text(title, 14, 20);
    pdf.setFontSize(12); pdf.text(`Período: ${startDate} al ${endDate}`, 14, 30);
    
    let data: any;
    if (type === 'unit') {
      data = calculateUnitTotal(id, rides);
      autoTable(pdf, {
        startY: 40,
        head: [["Fecha", "Proveedor", "Inicio", "Destino", "Pago", "Monto", "Comisión", "Neto"]],
        body: data.rides.map((r: any) => {
          const comm = r.has_commission ? (r.amount * 0.10) : 0;
          return [r.date, r.provider?.name, r.start_location, r.destination, r.payment_type, `$${r.amount.toFixed(2)}`, r.has_commission ? `$${comm.toFixed(2)}` : '-', `$${(r.amount - comm).toFixed(2)}`];
        }),
      });
    } else {
      data = calculateProviderTotal(id, rides);
      autoTable(pdf, {
        startY: 40,
        head: [["Fecha", "Unidad", "Inicio", "Destino", "Pago", "Monto", "Comisión", "Crédito"]],
        body: data.rides.map((r: any) => {
          const comm = r.has_commission ? (r.amount * 0.10) : 0;
          return [r.date, r.unit?.name, r.start_location, r.destination, r.payment_type, `$${r.amount.toFixed(2)}`, r.has_commission ? `$${comm.toFixed(2)}` : '-', r.provider_gave_credit ? 'Sí' : 'No'];
        }),
      });
    }

    let y = pdf.lastAutoTable.finalY + 15;
    if (y > pdf.internal.pageSize.getHeight() - 60) { pdf.addPage(); y = 40; }

    pdf.setFontSize(14); pdf.text("Resumen Financiero", 14, y); y += 10;
    pdf.setFontSize(12);

    if (type === 'provider') {
        pdf.text(`Créditos a Pagar: $${data.creditosAPagar.toFixed(2)}`, 14, y); y += 7;
        pdf.text(`Cuadre a Pagar: $${data.cuadreAPagar.toFixed(2)}`, 14, y); y += 7;
        pdf.text(`Comisión Total (10%): $${data.totalCommission.toFixed(2)}`, 14, y); y += 10;
        pdf.setFont(undefined, 'bold');
        pdf.text(`TOTAL A PAGAR: $${data.totalAPagar.toFixed(2)}`, 14, y);
    } else {
        pdf.text(`Total Bruto: $${data.totalGrossRides.toFixed(2)}`, 14, y); y += 7;
        const txtCreditoSol = data.isCreditoSolicitadoEnabled ? `$${data.finalCreditoSolicitado.toFixed(2)}` : `$0.00 (Desactivado)`;
        pdf.text(`Crédito Solicitado: ${txtCreditoSol}`, 14, y); y += 7;
        pdf.text(`% Retenido: $${data.totalCommission.toFixed(2)}`, 14, y); y += 7;
        const txtFrecuencia = data.isFrecuenciaEnabled ? `$${data.finalFrecuencia.toFixed(2)}` : `$0.00 (Desactivado)`;
        pdf.text(`Frecuencia: ${txtFrecuencia}`, 14, y); y += 7;
        pdf.text(`Cuadre: $${data.cuadreAPagar.toFixed(2)}`, 14, y); y += 7;
        pdf.text(`Crédito a Favor: $${data.creditoAFavor.toFixed(2)}`, 14, y); y += 10;
        pdf.setFont(undefined, 'bold');
        if (data.totalAPagar > 0) pdf.text(`TOTAL A PAGAR: $${data.totalAPagar.toFixed(2)}`, 14, y);
        else pdf.text(`TOTAL A RECIBIR: $${data.totalARecibir.toFixed(2)}`, 14, y);
    }
    pdf.save(`Reporte_${name}_${startDate}.pdf`);
  };

  const modalData = editingId && editingType 
    ? (editingType === 'unit' ? calculateUnitTotal(editingId, rides) : calculateProviderTotal(editingId, rides))
    : null;

  // Ya no filtramos proveedores por uso para simplificar, pero si quieres filtrar providers que no trabajaron, usa la lógica vieja. 
  // Aquí muestro los proveedores que SÍ tienen carreras en esa semana (lógica original para providers).
  const uniqueProviders = Array.from(new Set(rides.map(r => r.provider_id))).map(id => ({ id, name: rides.find(r => r.provider_id === id)?.provider?.name || 'N/A' }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex items-center space-x-2 mb-6">
        <Calendar className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Reportes Semanales</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 rounded" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 rounded" />
      </div>

      {loading ? <div className="text-center py-8">Cargando...</div> : (
        <div className="space-y-8">
            {/* SECCIÓN UNIDADES: Mostramos allUnits (Todas) */}
            <div>
                <h3 className="text-lg font-bold mb-4 bg-gray-100 p-2 rounded">Reportes por Unidad</h3>
                {allUnits.length === 0 && <p className="text-gray-500 italic">No se encontraron unidades. Revisa permisos de Supabase.</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {allUnits.map(u => {
                        const d = calculateUnitTotal(u.id, rides);
                        return (
                            <div key={u.id} className="border p-4 rounded-lg relative hover:shadow-lg transition">
                                <button onClick={() => handleEditClick('unit', u.id, u.name)} className="absolute top-2 right-2 text-gray-400 hover:text-blue-600"><Edit className="w-5 h-5"/></button>
                                <h4 className="font-bold text-lg mb-2">{u.name}</h4>
                                <div className="text-sm space-y-1">
                                    <p>Carreras: {d.rideCount}</p>
                                    <p className="text-red-600">Crédito Favor: ${d.creditoAFavor.toFixed(2)}</p>
                                    <p className="text-blue-600">Comisión: ${d.totalCommission.toFixed(2)}</p>
                                    {d.totalAPagar > 0 
                                        ? <p className="font-bold text-red-700 text-lg mt-2">Pagar: ${d.totalAPagar.toFixed(2)}</p>
                                        : <p className="font-bold text-green-600 text-lg mt-2">Recibir: ${d.totalARecibir.toFixed(2)}</p>
                                    }
                                </div>
                                <button onClick={() => generatePDF('unit', u.id, u.name)} className="mt-3 w-full bg-blue-600 text-white py-2 rounded flex justify-center gap-2 hover:bg-blue-700"><FileDown size={18}/> PDF</button>
                            </div>
                        )
                    })}
                </div>
            </div>
            
            {/* SECCIÓN PROVEEDORES */}
            <div>
                <h3 className="text-lg font-bold mb-4 bg-gray-100 p-2 rounded">Reportes por Proveedor</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {uniqueProviders.map(p => {
                        const d = calculateProviderTotal(p.id, rides);
                        return (
                             <div key={p.id} className="border p-4 rounded-lg relative hover:shadow-lg transition">
                                <button onClick={() => handleEditClick('provider', p.id, p.name)} className="absolute top-2 right-2 text-gray-400 hover:text-blue-600"><Edit className="w-5 h-5"/></button>
                                <h4 className="font-bold text-lg mb-2">{p.name}</h4>
                                <div className="text-sm space-y-1">
                                    <p className="text-red-600">Créditos a Pagar: ${d.creditosAPagar.toFixed(2)}</p>
                                    <p className="text-blue-600">Comisión: ${d.totalCommission.toFixed(2)}</p>
                                    <div className="mt-2 pt-2 border-t">
                                        <p className="font-bold text-red-700">Total a Pagar: ${d.totalAPagar.toFixed(2)}</p>
                                        <p className="font-bold text-green-600">Total a Recibir: ${d.totalARecibir.toFixed(2)}</p>
                                    </div>
                                </div>
                                <button onClick={() => generatePDF('provider', p.id, p.name)} className="mt-3 w-full bg-blue-600 text-white py-2 rounded flex justify-center gap-2 hover:bg-blue-700"><FileDown size={18}/> PDF</button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL DE EDICIÓN (SIN CAMBIOS) --- */}
      {editingId && modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
              <div><h3 className="text-xl font-bold text-gray-800">Editar: {editingName}</h3></div>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUMNA IZQUIERDA */}
                <div className="space-y-4 lg:col-span-1 border-r pr-4">
                    <h4 className="font-bold text-gray-700 border-b pb-2">Detalles Financieros</h4>
                    <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600">Total Bruto:</span>
                        <span className="font-semibold">${modalData.totalGrossRides.toFixed(2)}</span>
                    </div>

                    {editingType === 'unit' ? (
                    <>
                        <div className="bg-gray-50 p-2 rounded">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center">
                                    <input type="checkbox" checked={tempAdjustment.enableCreditoSolicitado ?? true} onChange={(e) => setTempAdjustment({...tempAdjustment, enableCreditoSolicitado: e.target.checked})} className="w-4 h-4 text-blue-600 rounded mr-2" />
                                    <label className="text-gray-600 text-sm">Crédito Solicitado</label>
                                </div>
                            </div>
                            <input type="number" step="0.01" className={`w-full border rounded px-2 py-1 text-right ${(tempAdjustment.enableCreditoSolicitado ?? true) ? 'bg-white' : 'bg-gray-200 text-gray-400'}`}
                                value={tempAdjustment.creditoSolicitadoManual ?? (modalData as any).creditoSolicitadoAuto}
                                onChange={(e) => setTempAdjustment({ ...tempAdjustment, creditoSolicitadoManual: parseFloat(e.target.value) })}
                                disabled={!(tempAdjustment.enableCreditoSolicitado ?? true)}
                            />
                        </div>
                        <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600">% Retenido:</span>
                            <span className="font-semibold">${modalData.totalCommission.toFixed(2)}</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center">
                                    <input type="checkbox" checked={tempAdjustment.enableFrecuencia ?? true} onChange={(e) => setTempAdjustment({...tempAdjustment, enableFrecuencia: e.target.checked})} className="w-4 h-4 text-blue-600 rounded mr-2" />
                                    <label className="text-gray-600 text-sm">Frecuencia</label>
                                </div>
                            </div>
                            <input type="number" step="0.01" className={`w-full border rounded px-2 py-1 text-right ${(tempAdjustment.enableFrecuencia ?? true) ? 'bg-white' : 'bg-gray-200 text-gray-400'}`}
                                value={tempAdjustment.frecuenciaFee ?? 0}
                                onChange={(e) => setTempAdjustment({ ...tempAdjustment, frecuenciaFee: parseFloat(e.target.value) })}
                                disabled={!(tempAdjustment.enableFrecuencia ?? true)}
                            />
                        </div>
                        <div className="py-1">
                            <label className="block text-sm text-gray-600 mb-1">Cuadre</label>
                            <input type="number" step="0.01" className="w-full border rounded px-2 py-1 text-right"
                                value={tempAdjustment.cuadreAPagar ?? 1.00}
                                onChange={(e) => setTempAdjustment({ ...tempAdjustment, cuadreAPagar: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="py-1">
                            <label className="block text-sm text-gray-600 mb-1">Crédito a Favor</label>
                            <input type="number" step="0.01" className="w-full border rounded px-2 py-1 text-right text-red-600 font-medium"
                                value={tempAdjustment.creditoAFavor ?? 0}
                                onChange={(e) => setTempAdjustment({ ...tempAdjustment, creditoAFavor: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="mt-4 pt-4 border-t">
                            {(modalData as any).totalAPagar > 0 ? (
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-800">TOTAL A PAGAR:</span>
                                    <span className="font-bold text-red-600 text-lg">${(modalData as any).totalAPagar.toFixed(2)}</span>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-800">TOTAL A RECIBIR:</span>
                                    <span className="font-bold text-green-600 text-lg">${(modalData as any).totalARecibir.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-600 text-sm">Créditos a Pagar</label>
                                <input type="number" step="0.01" className="w-full border rounded px-2 py-1"
                                    value={tempAdjustment.creditosAPagar ?? 0}
                                    onChange={(e) => setTempAdjustment({...tempAdjustment, creditosAPagar: parseFloat(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="text-gray-600 text-sm">Cuadre</label>
                                <input type="number" step="0.01" className="w-full border rounded px-2 py-1"
                                    value={tempAdjustment.cuadreAPagar ?? 1.00}
                                    onChange={(e) => setTempAdjustment({...tempAdjustment, cuadreAPagar: parseFloat(e.target.value)})}
                                />
                            </div>
                            <div className="mt-4 pt-4 border-t">
                                <div className="flex justify-between font-bold">
                                    <span>Total A Pagar:</span>
                                    <span className="text-red-600">${(modalData as any).totalAPagar.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-2 flex flex-col h-full">
                    <h4 className="font-bold text-gray-700 border-b pb-2 mb-2 flex justify-between items-center">
                        <span>Carreras ({modalData.rides.length})</span>
                    </h4>
                    <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-200 text-gray-700 sticky top-0">
                                <tr>
                                    <th className="p-2">Fecha</th>
                                    <th className="p-2">Destino</th>
                                    <th className="p-2">Monto ($)</th>
                                    <th className="p-2 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modalData.rides.map((ride: any) => (
                                    <tr key={ride.id} className="border-b bg-white hover:bg-gray-50">
                                        <td className="p-2 whitespace-nowrap">{ride.date.substring(5)}</td>
                                        <td className="p-2 truncate max-w-[150px]" title={ride.destination}>{ride.destination}</td>
                                        <td className="p-2">
                                            <input type="number" className="w-20 border rounded px-1 py-1 text-right"
                                                defaultValue={ride.amount}
                                                onBlur={(e) => { if (parseFloat(e.target.value) !== ride.amount) handleUpdateRideAmount(ride.id, e.target.value); }}
                                                disabled={updatingRide === ride.id}
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => handleDeleteRide(ride.id)} disabled={updatingRide === ride.id} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                {updatingRide === ride.id ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button onClick={() => setEditingId(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">Cancelar</button>
              <button onClick={saveAdjustments} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center shadow-lg">
                <Save className="w-4 h-4 mr-2" /> Guardar Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}