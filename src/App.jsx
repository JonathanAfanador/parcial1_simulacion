import React, { useState } from 'react';
import { Play, BarChart3, Clock, Users, Calculator, TrendingUp, Coffee, AlertCircle, CheckCircle } from 'lucide-react';

const CafeteriaSimulator = () => {
  const [valoresLlegada, setValoresLlegada] = useState([0.8, 0.3, 0.6, 0.1, 0.9]);
  const [valoresServicio, setValoresServicio] = useState([0.5, 0.7, 0.2, 0.9, 0.4]);
  const [tiemposLlegada, setTiemposLlegada] = useState([1.5, 8.4, 3.5, 16.1, 0.7]);
  const [resultados, setResultados] = useState(null);
  const [mostrarCalculos, setMostrarCalculos] = useState(false);
  const [paso, setPaso] = useState(0);

  const calcularTiempoExponencial = (valorAleatorio, media = 7) => {
    return -media * Math.log(valorAleatorio);
  };

  const calcularTiempoUniforme = (valorAleatorio, minTiempo = 2, maxTiempo = 6) => {
    return minTiempo + (maxTiempo - minTiempo) * valorAleatorio;
  };

  const ejecutarSimulacion = () => {
    setPaso(1);
    
    // Paso 1: Calcular tiempos entre llegadas
    const tiemposEntreLlegadas = valoresLlegada.map(valor => 
      calcularTiempoExponencial(valor, 7)
    );

    // Paso 2: Calcular tiempos de servicio
    const tiemposServicio = valoresServicio.map(valor => 
      calcularTiempoUniforme(valor, 2, 6)
    );

    // Paso 3: Simular sistema de colas
    const datosClientes = [];
    let tiempoFinServicioAnterior = 0;

    for (let i = 0; i < 5; i++) {
      const clienteNum = i + 1;
      const tiempoLlegada = tiemposLlegada[i];
      const tiempoServicio = tiemposServicio[i];
      
      const tiempoInicioServicio = Math.max(tiempoLlegada, tiempoFinServicioAnterior);
      const tiempoFinServicio = tiempoInicioServicio + tiempoServicio;
      const tiempoEspera = tiempoInicioServicio - tiempoLlegada;

      datosClientes.push({
        cliente: clienteNum,
        llegada: Number(tiempoLlegada.toFixed(1)),
        servicio: Number(tiempoServicio.toFixed(1)),
        inicio: Number(tiempoInicioServicio.toFixed(1)),
        fin: Number(tiempoFinServicio.toFixed(1)),
        espera: Number(tiempoEspera.toFixed(1))
      });

      tiempoFinServicioAnterior = tiempoFinServicio;
    }

    // Calcular métricas
    const tiempoPromedioEspera = datosClientes.reduce((sum, cliente) => sum + cliente.espera, 0) / 5;
    const tiempoTotalSimulacion = Math.max(...datosClientes.map(c => c.fin));
    const tiempoTotalServicio = datosClientes.reduce((sum, cliente) => sum + cliente.servicio, 0);
    const utilizacionServidor = (tiempoTotalServicio / tiempoTotalSimulacion) * 100;
    const clientesSinEspera = datosClientes.filter(c => c.espera === 0).length;
    const clientesConEspera = 5 - clientesSinEspera;

    setResultados({
      tiemposEntreLlegadas,
      tiemposServicio,
      datosClientes,
      metricas: {
        tiempoPromedioEspera,
        utilizacionServidor,
        tiempoTotalSimulacion,
        clientesSinEspera,
        clientesConEspera
      }
    });

    setPaso(2);
  };

  const reiniciar = () => {
    setResultados(null);
    setPaso(0);
    setMostrarCalculos(false);
  };

  const getStatusColor = (espera) => {
    if (espera === 0) return 'text-green-600 bg-green-50';
    if (espera < 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getUtilizacionColor = (utilizacion) => {
    if (utilizacion > 80) return 'text-red-600';
    if (utilizacion > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Simulador de Sistema de Colas
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Cafetería Universitaria - Universidad Piloto de Colombia
          </p>
        </div>

        {paso === 0 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Panel de Configuración */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Calculator className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">Configuración de Parámetros</h2>
              </div>
              
              {/* Valores para Distribución Exponencial */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Valores Aleatorios - Tiempos entre Llegadas (U₁)
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {valoresLlegada.map((valor, index) => (
                    <div key={index} className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="0.9"
                        value={valor}
                        onChange={(e) => {
                          const nuevosValores = [...valoresLlegada];
                          nuevosValores[index] = parseFloat(e.target.value);
                          setValoresLlegada(nuevosValores);
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      />
                      <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500">
                        C{index + 1}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Valores para Distribución Uniforme */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Valores Aleatorios - Tiempos de Servicio (U₂)
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {valoresServicio.map((valor, index) => (
                    <div key={index} className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="0.9"
                        value={valor}
                        onChange={(e) => {
                          const nuevosValores = [...valoresServicio];
                          nuevosValores[index] = parseFloat(e.target.value);
                          setValoresServicio(nuevosValores);
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      />
                      <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500">
                        C{index + 1}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tiempos de Llegada */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Tiempos de Llegada (minutos)
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {tiemposLlegada.map((tiempo, index) => (
                    <div key={index} className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={tiempo}
                        onChange={(e) => {
                          const nuevosTiempos = [...tiemposLlegada];
                          nuevosTiempos[index] = parseFloat(e.target.value);
                          setTiemposLlegada(nuevosTiempos);
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      />
                      <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500">
                        C{index + 1}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={ejecutarSimulacion}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                <Play className="w-5 h-5" />
                Ejecutar Simulación
              </button>
            </div>

            {/* Panel de Información */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-800">Información del Sistema</h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-800 mb-2">Distribución Exponencial</h4>
                  <p className="text-blue-700 text-sm">
                    <strong>Fórmula:</strong> T = -7 × ln(U₁)<br/>
                    <strong>Media:</strong> 7 minutos entre llegadas
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-800 mb-2">Distribución Uniforme</h4>
                  <p className="text-purple-700 text-sm">
                    <strong>Fórmula:</strong> S = 2 + (6-2) × U₂<br/>
                    <strong>Rango:</strong> 2 a 6 minutos de servicio
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-800 mb-2">Sistema de Colas</h4>
                  <p className="text-green-700 text-sm">
                    <strong>Servidor:</strong> 1 barista<br/>
                    <strong>Capacidad:</strong> Ilimitada<br/>
                    <strong>Disciplina:</strong> FIFO (Primero en llegar, primero en ser atendido)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {resultados && (
          <div className="space-y-8">
            {/* Cálculos Paso a Paso */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calculator className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Cálculos Paso a Paso</h2>
                </div>
                <button
                  onClick={() => setMostrarCalculos(!mostrarCalculos)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  {mostrarCalculos ? 'Ocultar' : 'Mostrar'} Cálculos
                </button>
              </div>

              {mostrarCalculos && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Paso 1 */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold text-blue-800 mb-3">PASO 1: Tiempos entre Llegadas</h3>
                    <p className="text-sm text-blue-700 mb-2">Fórmula: T = -7 × ln(U₁)</p>
                    {resultados.tiemposEntreLlegadas.map((tiempo, index) => (
                      <div key={index} className="text-sm text-blue-600 mb-1">
                        Cliente {index + 1}: T = -7 × ln({valoresLlegada[index]}) = {tiempo.toFixed(1)} min
                      </div>
                    ))}
                  </div>

                  {/* Paso 2 */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-bold text-purple-800 mb-3">PASO 2: Tiempos de Servicio</h3>
                    <p className="text-sm text-purple-700 mb-2">Fórmula: S = 2 + (6-2) × U₂</p>
                    {resultados.tiemposServicio.map((tiempo, index) => (
                      <div key={index} className="text-sm text-purple-600 mb-1">
                        Cliente {index + 1}: S = 2 + 4 × ({valoresServicio[index]}) = {tiempo.toFixed(1)} min
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tabla de Resultados */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">Tabla de Resultados</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      <th className="p-3 text-left rounded-tl-lg">Cliente</th>
                      <th className="p-3 text-center">Llegada (min)</th>
                      <th className="p-3 text-center">Servicio (min)</th>
                      <th className="p-3 text-center">Inicio Servicio</th>
                      <th className="p-3 text-center">Fin Servicio</th>
                      <th className="p-3 text-center rounded-tr-lg">Tiempo Espera</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.datosClientes.map((cliente, index) => (
                      <tr key={index} className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="p-3 font-semibold text-gray-700">{cliente.cliente}</td>
                        <td className="p-3 text-center text-gray-600">{cliente.llegada}</td>
                        <td className="p-3 text-center text-gray-600">{cliente.servicio}</td>
                        <td className="p-3 text-center text-gray-600">{cliente.inicio}</td>
                        <td className="p-3 text-center text-gray-600">{cliente.fin}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(cliente.espera)}`}>
                            {cliente.espera} min
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
                <p className="text-3xl font-bold">{resultados.metricas.tiempoPromedioEspera.toFixed(2)}</p>
                <p className="text-blue-100">minutos de espera</p>
              </div>

              <div className={`bg-gradient-to-br rounded-2xl p-6 text-white shadow-xl ${
                resultados.metricas.utilizacionServidor > 80 
                  ? 'from-red-500 to-red-600' 
                  : resultados.metricas.utilizacionServidor > 60 
                    ? 'from-yellow-500 to-yellow-600' 
                    : 'from-green-500 to-green-600'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-8 h-8" />
                  <h3 className="text-lg font-semibold">Utilización</h3>
                </div>
                <p className="text-3xl font-bold">{resultados.metricas.utilizacionServidor.toFixed(0)}%</p>
                <p className="opacity-90">del servidor</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-8 h-8" />
                  <h3 className="text-lg font-semibold">Sin Espera</h3>
                </div>
                <p className="text-3xl font-bold">{resultados.metricas.clientesSinEspera}</p>
                <p className="text-purple-100">de 5 clientes</p>
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
                  La simulación de la cafetería universitaria demuestra un sistema con alta variabilidad 
                  en la atención, donde <strong>{resultados.metricas.clientesSinEspera} de 5 clientes</strong> no 
                  esperaron mientras que <strong>{resultados.metricas.clientesConEspera}</strong> enfrentaron 
                  esperas significativas, resultando en un tiempo de espera promedio de{' '}
                  <strong className="text-blue-600">{resultados.metricas.tiempoPromedioEspera.toFixed(2)} minutos</strong>.
                </p>
                
                <p className="text-gray-700 leading-relaxed">
                  Este comportamiento típico de sistemas de cola evidencia que el barista opera al{' '}
                  <strong className={getUtilizacionColor(resultados.metricas.utilizacionServidor)}>
                    {resultados.metricas.utilizacionServidor.toFixed(0)}%
                  </strong> de su capacidad, sugiriendo{' '}
                  {resultados.metricas.utilizacionServidor > 80 
                    ? 'la necesidad urgente de considerar un segundo empleado durante las horas pico'
                    : resultados.metricas.utilizacionServidor > 60
                    ? 'un funcionamiento eficiente del sistema'
                    : 'que existe capacidad disponible para atender más clientes'
                  } para mejorar la experiencia del cliente y reducir la variabilidad en el servicio.
                </p>
              </div>
            </div>

            {/* Botón Reiniciar */}
            <div className="flex justify-center">
              <button
                onClick={reiniciar}
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-8 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Nueva Simulación
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CafeteriaSimulator;