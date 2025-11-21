
'use client';

import type { ChartConfig } from '@/components/ui/chart';
import { DonutChart, DonutChartLegend } from '@/components/ui/recharts/donut-chart';
import { useMemo } from 'react';

export function SpendingDistributionChart({ data }: { data: any[] }) {
  
  const spendingDistributionConfig = useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: 'Spending',
      },
    };
    data.forEach(item => {
      config[item.name] = { label: item.name, color: item.fill };
    });
    return config;
  }, [data]);
  
  if (data.length === 0) {
    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No data to display</p>
        </div>
    );
  }

  return (
    <DonutChart
      data={data}
      config={spendingDistributionConfig}
      className="h-60 w-60"
    >
      <DonutChartLegend />
    </DonutChart>
  );
}
