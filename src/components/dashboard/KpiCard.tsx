import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import type { ReactNode } from 'react';
  
  type KpiCardProps = {
    title: string;
    value: ReactNode;
    icon: ReactNode;
    description?: ReactNode;
  };
  
  export function KpiCard({ title, value, icon, description }: KpiCardProps) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
        </CardContent>
      </Card>
    );
  }
  