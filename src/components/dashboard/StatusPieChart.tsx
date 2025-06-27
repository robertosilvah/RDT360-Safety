'use client';

import * as React from 'react';
import { Pie, PieChart, ResponsiveContainer, Cell, Legend } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
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
    { name: 'Open', value: mockObservationStatus[0].value, fill: chartConfig.open.color },
    { name: 'Closed', value: mockObservationStatus[1].value, fill: chartConfig.closed.color },
  ];

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
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
      </ResponsiveContainer>
    </ChartContainer>
  );
}
