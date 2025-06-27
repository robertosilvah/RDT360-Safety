'use client';

import * as React from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { mockObservationStatus } from '@/lib/mockData';

const chartConfig = {
  open: {
    label: 'Open',
    color: 'hsl(var(--primary))',
  },
  closed: {
    label: 'Closed',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

export function StatusPieChart() {
  const chartData = [
    { name: 'Open', value: mockObservationStatus[0].value, fill: 'var(--color-open)' },
    { name: 'Closed', value: mockObservationStatus[1].value, fill: 'var(--color-closed)' },
  ];

  return (
    <ChartContainer
      config={chartConfig}
      className="min-h-[200px] w-full h-[350px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-mt-4"
        />
      </PieChart>
    </ChartContainer>
  );
}
