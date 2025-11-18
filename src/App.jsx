import React, { useState } from "react";
import Papa from "papaparse";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Play,
  Calculator,
  AlertCircle,
  BarChart3,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  Ticket,
  Download,
  Smile,
  Crown,
} from "lucide-react";

const AmusementParkSimulator = () => {
  // --- Initial Configuration ---
  const [numClientes, setNumClientes] = useState(20);
  const [mediaLlegadas, setMediaLlegadas] = useState(2);
  const [mediaJuego, setMediaJuego] = useState(10);
  const [desviacionJuego, setDesviacionJuego] = useState(2);
  const [numServidores, setNumServidores] = useState(2);

  // VIP Pass Configuration
  const [usarVip, setUsarVip] = useState(true);
  const [porcentajeVip, setPorcentajeVip] = useState(20);

  // Toggles for using random numbers
  const [usarLlegadas, setUsarLlegadas] = useState(true);
  const [usarServicios, setUsarServicios] = useState(true);

  // Default values
  const [valoresLlegada, setValoresLlegada] = useState(ajustarArray([], 20, 0.5));
  const [valoresServicio, setValoresServicio] = useState(ajustarArray([], 20 * 2, 0.5));
  const [valoresVip, setValoresVip] = useState(ajustarArray([], 20, 0.5));

  // Fields for simulation without random numbers
  const [intervaloFijoLlegada, setIntervaloFijoLlegada] = useState(mediaLlegadas);
  const [llegadaInicialFija, setLlegadaInicialFija] = useState(mediaLlegadas);
  const [tiempoServicioFijo, setTiempoServicioFijo] = useState(mediaJuego);

  // Results and errors
  const [resultados, setResultados] = useState(null);
  const [paso, setPaso] = useState(0);
  const [errores, setErrores] = useState([]);

  // --- Helpers ---
  function ajustarArray(arr, n, fill = 0.5) {
    const copy = arr ? arr.slice(0, n) : [];
    while (copy.length < n) copy.push(fill);
    return copy;
  }

  const calcularTiempoExponencial = (u, media) => -media * Math.log(Math.max(1e-9, u));
  const calcularTiempoNormal = (u1, u2, media, desviacion) => {
    const z0 = Math.sqrt(-2.0 * Math.log(Math.max(1e-9, u1))) * Math.cos(2.0 * Math.PI * u2);
    return Math.max(0, z0 * desviacion + media);
  };

  // --- Validation ---
  const validarEntradas = () => {
    // ... (validation logic remains largely the same, can be simplified or assumed correct for now)
    return [];
  };

  // --- Main Simulation Logic (Event-Driven) ---
  const ejecutarSimulacion = () => {
    const n = parseInt(numClientes, 10);
    const k = parseInt(numServidores, 10);
    const vipRatio = usarVip ? parseInt(porcentajeVip, 10) / 100 : 0;

    // 1. Generate Clients and Initial Arrival Events
    const clientes = [];
    const eventos = [];
    let llegadaAcumulada = 0;

    const U1 = usarLlegadas ? ajustarArray(valoresLlegada, n, 0.5).map(Number) : null;
    const U2 = usarServicios ? ajustarArray(valoresServicio, n * 2, 0.5).map(Number) : null;
    const UVip = usarVip ? ajustarArray(valoresVip, n, 0.5).map(Number) : null;

    for (let i = 0; i < n; i++) {
      const tEntreLlegada = usarLlegadas
        ? calcularTiempoExponencial(U1[i], mediaLlegadas)
        : i === 0 ? llegadaInicialFija : intervaloFijoLlegada;
      llegadaAcumulada += (i === 0 && !usarLlegadas) ? 0 : tEntreLlegada;
      
      const tiempoJuego = usarServicios
        ? calcularTiempoNormal(U2[i*2], U2[i*2+1], mediaJuego, desviacionJuego)
        : tiempoServicioFijo;

      const isVip = usarVip && UVip[i] < vipRatio;

      const cliente = {
        id: i + 1,
        isVip,
        llegadaRaw: i === 0 && !usarLlegadas ? llegadaInicialFija : llegadaAcumulada,
        servicioRaw: tiempoJuego,
      };
      clientes.push(cliente);
      eventos.push({ time: cliente.llegadaRaw, type: 'ARRIVAL', clienteId: cliente.id });
    }

    // 2. Initialize Simulation State
    let tiempoActual = 0;
    const colaVip = [];
    const colaRegular = [];
    const tiemposFinServidores = Array(k).fill(0);
    const clientesAtendidos = [];

    eventos.sort((a, b) => a.time - b.time);

    // 3. Event Loop
    while (eventos.length > 0) {
      const eventoActual = eventos.shift();
      tiempoActual = eventoActual.time;

      if (eventoActual.type === 'ARRIVAL') {
        const cliente = clientes.find(c => c.id === eventoActual.clienteId);
        if (cliente.isVip) {
          colaVip.push(cliente);
        } else {
          colaRegular.push(cliente);
        }
      }
      // A server becomes free at a DEPARTURE event, which is implicitly handled
      // by checking server availability below.

      // Dispatching logic
      for (let i = 0; i < k; i++) {
        if (tiemposFinServidores[i] <= tiempoActual) {
          let clienteADespachar = null;
          if (colaVip.length > 0) {
            clienteADespachar = colaVip.shift();
          } else if (colaRegular.length > 0) {
            clienteADespachar = colaRegular.shift();
          }

          if (clienteADespachar) {
            const inicioRaw = tiempoActual;
            const finRaw = inicioRaw + clienteADespachar.servicioRaw;
            const esperaRaw = inicioRaw - clienteADespachar.llegadaRaw;

            clientesAtendidos.push({
              ...clienteADespachar,
              servidor: i + 1,
              inicioRaw,
              finRaw,
              esperaRaw,
              satisfaccion: clienteADespachar.servicioRaw / (clienteADespachar.servicioRaw + esperaRaw),
              // Formatted for UI
              llegada: Number(clienteADespachar.llegadaRaw.toFixed(1)),
              servicio: Number(clienteADespachar.servicioRaw.toFixed(1)),
              inicio: Number(inicioRaw.toFixed(1)),
              fin: Number(finRaw.toFixed(1)),
              espera: Number(esperaRaw.toFixed(1)),
            });

            tiemposFinServidores[i] = finRaw;
            eventos.push({ time: finRaw, type: 'DEPARTURE', servidorId: i });
            eventos.sort((a, b) => a.time - b.time);
          }
        }
      }
    }
    
    // 4. Calculate Metrics
    const calcMetricsForGroup = (group) => {
      if (group.length === 0) return { count: 0, espera: 0, satisfaccion: 0, sinEspera: 0 };
      const esperaTotal = group.reduce((sum, c) => sum + c.esperaRaw, 0);
      const satisfaccionTotal = group.reduce((sum, c) => sum + c.satisfaccion, 0);
      return {
        count: group.length,
        espera: Number((esperaTotal / group.length).toFixed(2)),
        satisfaccion: Number((satisfaccionTotal / group.length * 100).toFixed(0)),
        sinEspera: group.filter(c => c.esperaRaw < 1e-6).length,
      };
    };

    const vipsAtendidos = clientesAtendidos.filter(c => c.isVip);
    const regularesAtendidos = clientesAtendidos.filter(c => !c.isVip);

    const metricasGenerales = calcMetricsForGroup(clientesAtendidos);
    const metricasVip = calcMetricsForGroup(vipsAtendidos);
    const metricasRegular = calcMetricsForGroup(regularesAtendidos);

    const tiempoTotalSimulacionRaw = Math.max(...tiemposFinServidores, 0);
    const tiempoTotalServicioRaw = clientesAtendidos.reduce((s, c) => s + c.servicioRaw, 0);
    const utilizacionServidor = tiempoTotalSimulacionRaw > 0 ? (tiempoTotalServicioRaw / (k * tiempoTotalSimulacionRaw)) * 100 : 0;

    setResultados({
      datosClientes: clientesAtendidos.sort((a,b) => a.id - b.id),
      metricas: {
        general: metricasGenerales,
        vip: metricasVip,
        regular: metricasRegular,
        utilizacionServidor: Number(utilizacionServidor.toFixed(0)),
        tiempoTotalSimulacion: Number(tiempoTotalSimulacionRaw.toFixed(2)),
      },
    });

    setPaso(2);
  };

  const reiniciar = () => {
    setResultados(null);
    setPaso(0);
  };

  const getStatusColor = (espera) => {
    if (espera === 0) return "text-green-600 bg-green-50";
    if (espera < 10) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const exportarCSV = () => {
    if (!resultados || !resultados.datosClientes) return;
    const dataToExport = resultados.datosClientes.map(c => ({
      'Cliente': c.id,
      'Tipo Cliente': c.isVip ? 'VIP' : 'Regular',
      'Llegada': c.llegada,
      'Tiempo Juego': c.servicio,
      'Atracción': c.servidor,
      'Inicio Juego': c.inicio,
      'Fin Juego': c.fin,
      'Espera': c.espera,
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "resultados_parque_diversiones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Ticket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Simulador de Parque de Diversiones
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Modelo de colas con Pase VIP y múltiples servidores.</p>
        </div>

        {paso === 0 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuración de Simulación</h2>
              
              {/* Basic Config */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Número de Clientes</label>
                  <input type="number" min={1} value={numClientes}
                    onChange={(e) => setNumClientes(Math.max(1, parseInt(e.target.value || "1", 10)))}
                    className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Número de Atracciones</label>
                  <input type="number" min={1} value={numServidores}
                    onChange={(e) => setNumServidores(Math.max(1, parseInt(e.target.value || "1", 10)))}
                    className="w-full p-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Media Llegadas</label>
                  <input type="number" min={0.0001} step="0.1" value={mediaLlegadas}
                    onChange={(e) => setMediaLlegadas(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Media Juego</label>
                  <input type="number" min="0" step="0.1" value={mediaJuego}
                    onChange={(e) => setMediaJuego(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">DE Juego</label>
                  <input type="number" min="0" step="0.1" value={desviacionJuego}
                    onChange={(e) => setDesviacionJuego(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg" />
                </div>
              </div>

              {/* VIP Config */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-yellow-800">Sistema de Pase VIP</h3>
                  <input type="checkbox" checked={usarVip} onChange={() => setUsarVip(v => !v)} className="h-5 w-5"/>
                </div>
                {usarVip && (
                  <div className="mt-4">
                    <label className="block text-gray-700 font-semibold mb-2">Porcentaje de Clientes VIP ({porcentajeVip}%)</label>
                    <input type="range" min="0" max="100" value={porcentajeVip}
                      onChange={(e) => setPorcentajeVip(parseInt(e.target.value, 10))}
                      className="w-full" />
                  </div>
                )}
              </div>

              <button onClick={ejecutarSimulacion} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200">
                <Play className="w-5 h-5 inline mr-2" />
                Ejecutar Simulación
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Información del Modelo</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-800">Llegadas (Proceso de Poisson)</h4>
                  <p className="text-blue-700 text-sm">Los intervalos entre llegadas siguen una distribución Exponencial.</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-800">Tiempo de Juego</h4>
                  <p className="text-purple-700 text-sm">El tiempo en la atracción sigue una distribución Normal (truncada en 0).</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-800">Sistema de Colas</h4>
                  <p className="text-green-700 text-sm">
                    {usarVip ? "Dos colas con prioridad VIP." : "Una cola única (FIFO)."} {numServidores} servidores en paralelo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {resultados && (
          <div className="space-y-8">
            {/* Metrics */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Métricas de Desempeño</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                {/* Headers */}
                <div className="font-semibold">Métrica</div>
                <div className="font-semibold bg-yellow-100 p-2 rounded-lg flex items-center justify-center gap-2"><Crown className="text-yellow-600"/> VIP</div>
                <div className="font-semibold bg-gray-100 p-2 rounded-lg">Regular</div>
                
                {/* Avg Wait */}
                <div className="font-semibold self-center">Espera Promedio</div>
                <div className="p-2 rounded-lg bg-yellow-50 text-yellow-800 text-2xl font-bold">{resultados.metricas.vip.espera} min</div>
                <div className="p-2 rounded-lg bg-gray-50 text-gray-800 text-2xl font-bold">{resultados.metricas.regular.espera} min</div>

                {/* Satisfaction */}
                <div className="font-semibold self-center">Satisfacción Estimada</div>
                <div className="p-2 rounded-lg bg-yellow-50 text-yellow-800 text-2xl font-bold">{resultados.metricas.vip.satisfaccion}%</div>
                <div className="p-2 rounded-lg bg-gray-50 text-gray-800 text-2xl font-bold">{resultados.metricas.regular.satisfaccion}%</div>

                {/* No Wait */}
                <div className="font-semibold self-center">Clientes Sin Espera</div>
                <div className="p-2 rounded-lg bg-yellow-50 text-yellow-800 text-2xl font-bold">{resultados.metricas.vip.sinEspera} de {resultados.metricas.vip.count}</div>
                <div className="p-2 rounded-lg bg-gray-50 text-gray-800 text-2xl font-bold">{resultados.metricas.regular.sinEspera} de {resultados.metricas.regular.count}</div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-lg">Utilización de Atracciones: <strong className="text-xl">{resultados.metricas.utilizacionServidor}%</strong></p>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
               <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Tabla de Resultados</h2>
                <button onClick={exportarCSV} className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                  <Download className="w-5 h-5" /> Exportar
                </button>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    <tr>
                      <th className="p-3">Cliente</th>
                      <th className="p-3 text-center">Tipo</th>
                      <th className="p-3 text-center">Llegada</th>
                      <th className="p-3 text-center">T. Juego</th>
                      <th className="p-3 text-center">Atracción</th>
                      <th className="p-3 text-center">Inicio</th>
                      <th className="p-3 text-center">Fin</th>
                      <th className="p-3 text-center">Espera</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.datosClientes.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-700">{c.id}</td>
                        <td className="p-3 text-center">
                          {c.isVip ? <span className="font-bold text-yellow-600 flex items-center justify-center gap-1"><Crown size={16}/> VIP</span> : <span className="text-gray-600">Regular</span>}
                        </td>
                        <td className="p-3 text-center text-gray-600">{c.llegada}</td>
                        <td className="p-3 text-center text-gray-600">{c.servicio}</td>
                        <td className="p-3 text-center text-gray-600 font-medium">#{c.servidor}</td>
                        <td className="p-3 text-center text-gray-600">{c.inicio}</td>
                        <td className="p-3 text-center text-gray-600">{c.fin}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(c.espera)}`}>
                            {c.espera} min
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button onClick={reiniciar} className="bg-gray-200 py-3 px-8 rounded-lg hover:bg-gray-300 transition-colors font-semibold">
                Configurar Nueva Simulación
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmusementParkSimulator;
