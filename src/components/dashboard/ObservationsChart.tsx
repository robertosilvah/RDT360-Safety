'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { mockObservationsByMonth } from '@/lib/mockData';
import { ChartTooltipContent } from '@/components/ui/chart';

export function ObservationsChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={mockObservationsByMonth}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
            cursor={{ fill: 'hsl(var(--accent) / 0.2)'}}
            content={<ChartTooltipContent />}
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
