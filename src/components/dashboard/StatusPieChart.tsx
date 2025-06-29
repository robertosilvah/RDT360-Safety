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

type StatusPieChartProps = {
    data: {
        name: 'Open' | 'Closed';
        value: number;
        fill: string;
    }[];
}

export function StatusPieChart({ data }: StatusPieChartProps) {
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
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
        >
          {data.map((entry, index) => (
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
