'use client';

import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  count: {
    label: 'Count',
  },
  'Safety Concern': {
    label: 'Safety Concern',
    color: 'hsl(var(--chart-1))',
  },
  'Positive Observation': {
    label: 'Positive Observation',
    color: 'hsl(var(--chart-2))',
  },
  'Near Miss': {
    label: 'Near Miss',
    color: 'hsl(var(--chart-3))',
  },
  'Incident': {
    label: 'Incident',
    color: 'hsl(var(--chart-4))',
  },
  'Accident': {
    label: 'Accident',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

type SubmissionsByTypeChartProps = {
  data: { name: string; count: number }[];
};

export function SubmissionsByTypeChart({ data }: SubmissionsByTypeChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer>
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{
            left: 20,
          }}
        >
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            tickMargin={5}
            axisLine={false}
            tick={{
              fontSize: 12,
            }}
            width={120}
          />
          <XAxis type="number" hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar dataKey="count" radius={4}>
            {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={chartConfig[entry.name as keyof typeof chartConfig]?.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
