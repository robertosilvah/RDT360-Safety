'use client';

import * as React from 'react';
import { Pie, PieChart, Cell, Label } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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
  const totalCount = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.count, 0);
  }, [data]);

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {totalCount.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 20}
                      className="fill-muted-foreground"
                    >
                      Total
                    </tspan>
                  </text>
                );
              }
            }}
          />
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={chartConfig[entry.name as keyof typeof chartConfig]?.color}
            />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="[&>*]:justify-center flex-wrap"
        />
      </PieChart>
    </ChartContainer>
  );
}
