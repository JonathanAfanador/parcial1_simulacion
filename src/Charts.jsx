import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const Charts = ({ data }) => {
  console.log("Data received by Charts component:", data);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Gráficas de Resultados</h2>
        <p className="text-center text-gray-500">No hay datos para mostrar en las gráficas.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gráficas de Resultados</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-center mb-4">Tiempo de Espera por Cliente (Barras)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="id" label={{ value: 'Cliente', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="espera" fill="#f59e0b" name="Espera" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-center mb-4">Tiempo de Juego por Cliente</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="id" label={{ value: 'Cliente', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="servicio" fill="#8884d8" name="Juego" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-center mb-4">Tiempo de Espera por Cliente (Líneas)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="id" label={{ value: 'Cliente', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="espera" stroke="#f59e0b" name="Espera" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Charts;
