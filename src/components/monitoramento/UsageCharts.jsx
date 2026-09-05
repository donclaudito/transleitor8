import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function ChartCard({ title, data, dataKey, color, suffix = '' }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">{title}</h3>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="model" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={44} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                borderRadius: 12,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
              }}
              formatter={(v) => [`${v}${suffix}`]}
            />
            <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function UsageCharts({ byModel }) {
  if (!byModel.length) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <ChartCard title="Tokens consumidos" data={byModel} dataKey="tokens" color="hsl(var(--chart-1))" />
      <ChartCard title="Tempo médio de resposta" data={byModel} dataKey="tempoMedio" color="hsl(var(--chart-2))" suffix=" ms" />
      <ChartCard title="Precisão média (1–10)" data={byModel} dataKey="precisaoMedia" color="hsl(var(--chart-3))" />
    </div>
  );
}