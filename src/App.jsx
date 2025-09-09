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
  Coffee,
  AlertCircle,
  BarChart3,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  BanknoteIcon,
  Download,
} from "lucide-react";

const ColasSimulador = () => {
  // --- Configuración inicial ---
  const [numClientes, setNumClientes] = useState(5);
  const [media, setMedia] = useState(7); // para exponencial T = -media * ln(U)
  const [rangoMin, setRangoMin] = useState(2);
  const [rangoMax, setRangoMax] = useState(6);

  // toggles para usar aleatorios
  const [usarLlegadas, setUsarLlegadas] = useState(true);
  const [usarServicios, setUsarServicios] = useState(true);

  // valores por defecto para reproducir tu ejemplo
  const defaultU1 = [0.8, 0.3, 0.6, 0.1, 0.9];
  const defaultU2 = [0.5, 0.7, 0.2, 0.9, 0.4];

  // arrays U1, U2 (se ajustan al número de clientes)
  const [valoresLlegada, setValoresLlegada] = useState(
    ajustarArray(defaultU1, 5, 0.5)
  );
  const [valoresServicio, setValoresServicio] = useState(
    ajustarArray(defaultU2, 5, 0.5)
  );

  // Campos para simulación sin U1 / sin U2
  const [intervaloFijoLlegada, setIntervaloFijoLlegada] = useState(media); // Δ
  const [llegadaInicialFija, setLlegadaInicialFija] = useState(media); // primera llegada
  const [tiempoServicioFijo, setTiempoServicioFijo] = useState(
    (rangoMin + rangoMax) / 2
  );

  // Resultados y errores
  const [resultados, setResultados] = useState(null);
  const [mostrarCalculos, setMostrarCalculos] = useState(true);
  const [paso, setPaso] = useState(0);
  const [errores, setErrores] = useState([]);

  // --- Helpers ---
  function ajustarArray(arr, n, fill = 0.5) {
    const copy = arr ? arr.slice(0, n) : [];
    while (copy.length < n) copy.push(fill);
    return copy;
  }

  const generarValoresAleatorios = (n) =>
    Array.from({ length: n }, () => Number(Math.random().toFixed(4)));

  const calcularTiempoExponencial = (u, m) => {
    // seguridad: u en (0,1)
    const uu = Math.min(Math.max(u, 1e-12), 0.9999999999);
    return -m * Math.log(uu);
  };

  const calcularTiempoUniforme = (u, a, b) => a + (b - a) * u;

  // Validación antes de ejecutar simulación
  const validarEntradas = () => {
    const errs = [];
    const n = Math.max(1, parseInt(numClientes || 0, 10));

    if (!Number.isInteger(n) || n < 1) errs.push("Número de clientes debe ser entero y ≥ 1.");
    if (!(Number(media) > 0)) errs.push("Media (Exponencial) debe ser un número > 0.");
    if (!(Number(rangoMax) > Number(rangoMin))) errs.push("Rango uniforme inválido: b debe ser mayor que a.");
    if (Number(rangoMin) < 0) errs.push("Rango mínimo (a) no puede ser negativo.");
    // validar llegadas
    if (usarLlegadas) {
      const U1 = ajustarArray(valoresLlegada, n, null);
      U1.forEach((u, i) => {
        if (u === null || u === undefined || isNaN(u)) errs.push(`U₁ cliente ${i + 1} está vacío.`);
        else if (!(u > 0 && u < 1)) errs.push(`U₁ cliente ${i + 1} debe estar en (0,1).`);
      });
    } else {
      if (!(Number(intervaloFijoLlegada) > 0))
        errs.push("Intervalo fijo entre llegadas (Δ) debe ser > 0.");
      if (isNaN(Number(llegadaInicialFija)) || Number(llegadaInicialFija) < 0)
        errs.push("Llegada inicial fija debe ser ≥ 0.");
    }
    // validar servicios
    if (usarServicios) {
      const U2 = ajustarArray(valoresServicio, n, null);
      U2.forEach((u, i) => {
        if (u === null || u === undefined || isNaN(u)) errs.push(`U₂ cliente ${i + 1} está vacío.`);
        else if (!(u > 0 && u < 1)) errs.push(`U₂ cliente ${i + 1} debe estar en (0,1).`);
      });
    } else {
      if (!(Number(tiempoServicioFijo) > 0))
        errs.push("Tiempo de servicio fijo debe ser > 0.");
    }

    return errs;
  };

  // --- Ejecutar simulación ---
  const ejecutarSimulacion = () => {
    setPaso(1);
    const n = Math.max(1, parseInt(numClientes || 0, 10));

    // validar
    const listaErrores = validarEntradas();
    if (listaErrores.length > 0) {
      setErrores(listaErrores);
      window.alert("Errores:\n" + listaErrores.join("\n"));
      return;
    } else {
      setErrores([]);
    }

    // preparar U1 y U2
    const U1 = usarLlegadas ? ajustarArray(valoresLlegada, n, 0.5).map(Number) : null;
    const U2 = usarServicios ? ajustarArray(valoresServicio, n, 0.5).map(Number) : null;

    // 1) tiempos entre llegadas (no acumulados)
    let tiemposEntreLlegadasRaw = [];
    if (usarLlegadas) {
      tiemposEntreLlegadasRaw = U1.map((u) => calcularTiempoExponencial(u, Number(media)));
    } else {
      // todos iguales al intervalo fijo Δ
      tiemposEntreLlegadasRaw = Array(n).fill(Number(intervaloFijoLlegada));
    }

    // 2) llegadas acumuladas
    const tiemposLlegadaAcumuladosRaw = [];
    if (usarLlegadas) {
      // usual: acumulado += T_i
      let acumulado = 0;
      for (let t of tiemposEntreLlegadasRaw) {
        acumulado += t;
        tiemposLlegadaAcumuladosRaw.push(acumulado);
      }
    } else {
      // caso fijo: la primera llegada = llegadaInicialFija, y luego se suma el intervalo
      let cur = Number(llegadaInicialFija);
      tiemposLlegadaAcumuladosRaw.push(cur);
      for (let i = 1; i < n; i++) {
        cur = cur + Number(intervaloFijoLlegada);
        tiemposLlegadaAcumuladosRaw.push(cur);
      }
    }

    // 3) tiempos de servicio
    let tiemposServicioRaw = [];
    if (usarServicios) {
      tiemposServicioRaw = U2.map((u) => calcularTiempoUniforme(u, Number(rangoMin), Number(rangoMax)));
    } else {
      tiemposServicioRaw = Array(n).fill(Number(tiempoServicioFijo));
    }

    // 4) simular colas FIFO (usar valores raw para cálculos)
    const datosClientes = [];
    let tiempoFinAnterior = 0;
    for (let i = 0; i < n; i++) {
      const llegadaRaw = tiemposLlegadaAcumuladosRaw[i];
      const servicioRaw = tiemposServicioRaw[i];

      const inicioRaw = Math.max(llegadaRaw, tiempoFinAnterior);
      const finRaw = inicioRaw + servicioRaw;
      const esperaRaw = Math.max(0, inicioRaw - llegadaRaw);

      datosClientes.push({
        cliente: i + 1,
        u1: usarLlegadas ? U1[i] : null,
        tEntreRaw: tiemposEntreLlegadasRaw[i],
        llegadaRaw,
        u2: usarServicios ? U2[i] : null,
        servicioRaw,
        inicioRaw,
        finRaw,
        esperaRaw,
        // formateados para UI
        tEntre: Number((tiemposEntreLlegadasRaw[i] || 0).toFixed(1)),
        llegada: Number(llegadaRaw.toFixed(1)),
        servicio: Number(servicioRaw.toFixed(1)),
        inicio: Number(inicioRaw.toFixed(1)),
        fin: Number(finRaw.toFixed(1)),
        espera: Number(esperaRaw.toFixed(1)),
      });

      tiempoFinAnterior = finRaw;
    }

    // 5) métricas (usar raw)
    const tiempoPromedioEsperaRaw =
      datosClientes.reduce((s, c) => s + c.esperaRaw, 0) / datosClientes.length;
    const tiempoTotalSimulacionRaw = Math.max(...datosClientes.map((c) => c.finRaw), 0);
    const tiempoTotalServicioRaw = datosClientes.reduce((s, c) => s + c.servicioRaw, 0);
    const utilizacionServidor =
      tiempoTotalSimulacionRaw > 0 ? (tiempoTotalServicioRaw / tiempoTotalSimulacionRaw) * 100 : 0;
    const clientesSinEspera = datosClientes.filter((c) => c.esperaRaw === 0).length;

    setResultados({
      U1: usarLlegadas ? U1.slice(0, n) : null,
      U2: usarServicios ? U2.slice(0, n) : null,
      tiemposEntreLlegadasRaw,
      tiemposLlegadaAcumuladosRaw,
      tiemposServicioRaw,
      datosClientes,
      metricas: {
        tiempoPromedioEsperaRaw,
        tiempoPromedioEspera: Number(tiempoPromedioEsperaRaw.toFixed(2)),
        tiempoTotalSimulacionRaw,
        tiempoTotalSimulacion: Number(tiempoTotalSimulacionRaw.toFixed(2)),
        tiempoTotalServicioRaw,
        tiempoTotalServicio: Number(tiempoTotalServicioRaw.toFixed(2)),
        utilizacionServidor: Number(utilizacionServidor.toFixed(0)),
        clientesSinEspera,
        clientesConEspera: datosClientes.length - clientesSinEspera,
        nClientes: datosClientes.length,
      },
    });

    setPaso(2);
  };

  const reiniciar = () => {
    setResultados(null);
    setPaso(0);
    setMostrarCalculos(true);
    setErrores([]);
    setValoresLlegada(ajustarArray(defaultU1, numClientes, 0.5));
    setValoresServicio(ajustarArray(defaultU2, numClientes, 0.5));
    setIntervaloFijoLlegada(media);
    setLlegadaInicialFija(media);
    setTiempoServicioFijo((rangoMin + rangoMax) / 2);
  };

  const getStatusColor = (espera) => {
    if (espera === 0) return "text-green-600 bg-green-50";
    if (espera < 10) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getUtilizacionColor = (util) => {
    if (util > 80) return "text-red-600";
    if (util > 60) return "text-yellow-600";
    return "text-green-600";
  };

  const exportarCSV = () => {
    if (!resultados || !resultados.datosClientes) return;

    const dataToExport = resultados.datosClientes.map(c => ({
      'Cliente': c.cliente,
      'U1': usarLlegadas ? c.u1 : 'N/A',
      'T (entre llegadas)': c.tEntre,
      'Llegada': c.llegada,
      'U2': usarServicios ? c.u2 : 'N/A',
      'Servicio': c.servicio,
      'Inicio': c.inicio,
      'Fin': c.fin,
      'Espera': c.espera,
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "resultados_simulacion.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <BanknoteIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Simulador General de Colas
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Simulador configurable — llegadas y servicios</p>
        </div>

        {/* CONFIG */}
        {paso === 0 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Panel configuración */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Calculator className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">Configuración</h2>
              </div>

              {/* Errores */}
              {errores.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                  <strong className="text-red-700">Corrige lo siguiente:</strong>
                  <ul className="text-red-600 mt-1 list-disc list-inside">
                    {errores.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Número de clientes</label>
                <input
                  type="number"
                  min={1}
                  value={numClientes}
                  onChange={(e) => {
                    const n = Math.max(1, parseInt(e.target.value || "1", 10));
                    setNumClientes(n);
                    setValoresLlegada((old) => ajustarArray(old, n, 0.5));
                    setValoresServicio((old) => ajustarArray(old, n, 0.5));
                  }}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Media (Exponencial)</label>
                  <input
                    type="number"
                    min={0.0001}
                    step="0.1"
                    value={media}
                    onChange={(e) => setMedia(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Rango uniforme (a - b)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={rangoMin}
                      onChange={(e) => setRangoMin(Number(e.target.value))}
                      className="w-1/2 p-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={rangoMax}
                      onChange={(e) => setRangoMax(Number(e.target.value))}
                      className="w-1/2 p-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4 flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={usarLlegadas}
                    onChange={() => setUsarLlegadas((s) => !s)}
                  />
                  Usar U₁ (Llegadas)
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={usarServicios}
                    onChange={() => setUsarServicios((s) => !s)}
                  />
                  Usar U₂ (Servicios)
                </label>
              </div>

              {/* Inputs U1 o tiempo fijo */}
              {usarLlegadas ? (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Valores U₁ (tiempos entre llegadas)</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {ajustarArray(valoresLlegada, numClientes, 0.5).map((v, i) => (
                      <input
                        key={i}
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        max="0.9999"
                        value={v}
                        onChange={(e) => {
                          const copia = ajustarArray(valoresLlegada, numClientes, 0.5);
                          copia[i] = Number(e.target.value);
                          setValoresLlegada(copia);
                        }}
                        className="p-2 border rounded-lg"
                        title={`U1 cliente ${i + 1}`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex gap-3">
                    <button
                      onClick={() => setValoresLlegada(generarValoresAleatorios(numClientes))}
                      className="text-sm text-blue-600 underline"
                    >
                      Generar aleatorios U₁
                    </button>
                    <button
                      onClick={() => setValoresLlegada(ajustarArray(defaultU1, numClientes, 0.5))}
                      className="text-sm text-gray-600 underline"
                    >
                      Restaurar ejemplo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Intervalo fijo Δ (min)</label>
                    <input
                      type="number"
                      min="0.0001"
                      step="0.1"
                      value={intervaloFijoLlegada}
                      onChange={(e) => setIntervaloFijoLlegada(Number(e.target.value))}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Llegada inicial (min)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={llegadaInicialFija}
                      onChange={(e) => setLlegadaInicialFija(Number(e.target.value))}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Inputs U2 o tiempo fijo servicio */}
              {usarServicios ? (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Valores U₂ (servicio)</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {ajustarArray(valoresServicio, numClientes, 0.5).map((v, i) => (
                      <input
                        key={i}
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        max="0.9999"
                        value={v}
                        onChange={(e) => {
                          const copia = ajustarArray(valoresServicio, numClientes, 0.5);
                          copia[i] = Number(e.target.value);
                          setValoresServicio(copia);
                        }}
                        className="p-2 border rounded-lg"
                        title={`U2 cliente ${i + 1}`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex gap-3">
                    <button
                      onClick={() => setValoresServicio(generarValoresAleatorios(numClientes))}
                      className="text-sm text-purple-600 underline"
                    >
                      Generar aleatorios U₂
                    </button>
                    <button
                      onClick={() => setValoresServicio(ajustarArray(defaultU2, numClientes, 0.5))}
                      className="text-sm text-gray-600 underline"
                    >
                      Restaurar ejemplo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Tiempo de servicio fijo (min)</label>
                  <input
                    type="number"
                    min="0.0001"
                    step="0.1"
                    value={tiempoServicioFijo}
                    onChange={(e) => setTiempoServicioFijo(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}

              <button
                onClick={ejecutarSimulacion}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
              >
                <Play className="w-5 h-5 inline mr-2" />
                Ejecutar Simulación
              </button>
            </div>

            {/* Panel Información del sistema */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-800">Información del Sistema</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-800 mb-2">Distribución Exponencial</h4>
                  <p className="text-blue-700 text-sm">
                    <strong>Fórmula:</strong> T = -media × ln(U₁) <br />
                    <strong>Media:</strong> {media} minutos entre llegadas
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-800 mb-2">Distribución Uniforme</h4>
                  <p className="text-purple-700 text-sm">
                    <strong>Fórmula:</strong> S = a + (b - a) × U₂ <br />
                    <strong>Rango:</strong> {rangoMin} a {rangoMax} minutos de servicio
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-800 mb-2">Sistema de Colas</h4>
                  <p className="text-green-700 text-sm">
                    <strong>Servidor:</strong> 1 (FIFO) <br />
                    <strong>Capacidad:</strong> Ilimitada <br />
                    <strong>Disciplina:</strong> FIFO (Primero en llegar, primero en ser atendido)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESULTADOS */}
        {resultados && (
          <div className="space-y-8">
            {/* Cálculos paso a paso */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calculator className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Cálculos Paso a Paso</h2>
                </div>
                <button
                  onClick={() => setMostrarCalculos((s) => !s)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  {mostrarCalculos ? "Ocultar" : "Mostrar"} Cálculos
                </button>
              </div>

              {mostrarCalculos && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Paso 1: tiempos entre llegadas */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold text-blue-800 mb-3">PASO 1: Tiempos entre Llegadas</h3>
                    <p className="text-sm text-blue-700 mb-2">Fórmula: T = -{media} × ln(U₁)</p>
                    {resultados.U1 ? (
                      resultados.U1.map((u, i) => (
                        <div key={i} className="text-sm text-blue-600 mb-1">
                          Cliente {i + 1}: T = -{media} × ln({u}) ={" "}
                          {Number(resultados.tiemposEntreLlegadasRaw[i].toFixed(1))} min → Llegada acumulada:{" "}
                          {Number(resultados.tiemposLlegadaAcumuladosRaw[i].toFixed(1))} min
                        </div>
                      ))
                    ) : (
                      resultados.tiemposEntreLlegadasRaw.map((t, i) => (
                        <div key={i} className="text-sm text-blue-600 mb-1">
                          Cliente {i + 1}: T fijo = {Number(t.toFixed(1))} min → Llegada acumulada:{" "}
                          {Number(resultados.tiemposLlegadaAcumuladosRaw[i].toFixed(1))} min
                        </div>
                      ))
                    )}
                  </div>

                  {/* Paso 2: tiempos de servicio */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-bold text-purple-800 mb-3">PASO 2: Tiempos de Servicio</h3>
                    <p className="text-sm text-purple-700 mb-2">
                      Fórmula: S = {rangoMin} + ({rangoMax} - {rangoMin}) × U₂
                    </p>
                    {resultados.U2 ? (
                      resultados.U2.map((u, i) => (
                        <div key={i} className="text-sm text-purple-600 mb-1">
                          Cliente {i + 1}: S = {rangoMin} + ({rangoMax} - {rangoMin}) × ({u}) ={" "}
                          {Number(resultados.tiemposServicioRaw[i].toFixed(1))} min
                        </div>
                      ))
                    ) : (
                      resultados.tiemposServicioRaw.map((s, i) => (
                        <div key={i} className="text-sm text-purple-600 mb-1">
                          Cliente {i + 1}: S fijo = {Number(s.toFixed(1))} min
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Tabla de Resultados</h2>
                </div>
                <button
                  onClick={exportarCSV}
                  className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Exportar a CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      <th className="p-3">Cliente</th>
                      {usarLlegadas && <th className="p-3 text-center">U₁</th>}
                      <th className="p-3 text-center">T (entre llegadas)</th>
                      <th className="p-3 text-center">Llegada</th>
                      {usarServicios && <th className="p-3 text-center">U₂</th>}
                      <th className="p-3 text-center">Servicio</th>
                      <th className="p-3 text-center">Inicio</th>
                      <th className="p-3 text-center">Fin</th>
                      <th className="p-3 text-center">Espera</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.datosClientes.map((c, i) => (
                      <tr
                        key={i}
                        className={`border-b hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                      >
                        <td className="p-3 font-semibold text-gray-700">{c.cliente}</td>
                        {usarLlegadas && <td className="p-3 text-center text-gray-600">{c.u1}</td>}
                        <td className="p-3 text-center text-gray-600">{c.tEntre}</td>
                        <td className="p-3 text-center text-gray-600">{c.llegada}</td>
                        {usarServicios && <td className="p-3 text-center text-gray-600">{c.u2}</td>}
                        <td className="p-3 text-center text-gray-600">{c.servicio}</td>
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

            {/* Métricas */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-8 h-8" />
                  <h3 className="text-lg font-semibold">Tiempo Promedio</h3>
                </div>
                <p className="text-3xl font-bold">{resultados.metricas.tiempoPromedioEspera}</p>
                <p className="text-blue-100">minutos de espera</p>
              </div>

              <div
                className={`bg-gradient-to-br rounded-2xl p-6 text-white shadow-xl ${resultados.metricas.utilizacionServidor > 80
                    ? "from-red-500 to-red-600"
                    : resultados.metricas.utilizacionServidor > 60
                    ? "from-yellow-500 to-yellow-600"
                    : "from-green-500 to-green-600"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-8 h-8" />
                  <h3 className="text-lg font-semibold">Utilización</h3>
                </div>
                <p className="text-3xl font-bold">{resultados.metricas.utilizacionServidor}%</p>
                <p className="opacity-90">del servidor</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-8 h-8" />
                  <h3 className="text-lg font-semibold">Sin Espera</h3>
                </div>
                <p className="text-3xl font-bold">{resultados.metricas.clientesSinEspera}</p>
                <p className="text-purple-100">de {resultados.metricas.nClientes} clientes</p>
              </div>

              <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-8 h-8" />
                  <h3 className="text-lg font-semibold">Con Espera</h3>
                </div>
                <p className="text-3xl font-bold">{resultados.metricas.clientesConEspera}</p>
                <p className="text-gray-100">clientes</p>
              </div>
            </div>

            {/* Conclusiones */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-gray-800">Conclusiones del Análisis</h2>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  La simulación muestra que <strong>{resultados.metricas.clientesSinEspera} de {resultados.metricas.nClientes} clientes</strong> no esperaron,
                  mientras que <strong>{resultados.metricas.clientesConEspera}</strong> sí esperaron. El tiempo de espera
                  promedio fue de <strong className="text-blue-600">{resultados.metricas.tiempoPromedioEspera} minutos</strong>.
                </p>

                <p className="text-gray-700 leading-relaxed">
                  La utilización del banquero resultó en <strong className={getUtilizacionColor(resultados.metricas.utilizacionServidor)}>
                    {resultados.metricas.utilizacionServidor}%
                  </strong> de su tiempo.
                </p>
              </div>
            </div>

            {/* Gráfica */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">Tiempos de Clientes</h2>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={resultados.datosClientes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cliente" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="llegada" stroke="#8884d8" name="Llegada" />
                  <Line type="monotone" dataKey="fin" stroke="#82ca9d" name="Fin" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Botones */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  // volver a editar parámetros
                  setResultados(null);
                  setPaso(0);
                }}
                className="bg-gray-200 py-2 px-6 rounded-lg"
              >
                Editar parámetros
              </button>

              <button
                onClick={exportarCSV}
                className="bg-green-500 text-white py-2 px-6 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Exportar a CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColasSimulador;
