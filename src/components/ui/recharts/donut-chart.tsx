
"use client";

import * as React from "react";
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import type { ChartConfig } from "@/components/ui/chart";

import { ChartContainer, ChartLegendContent } from "@/components/ui/chart";

const DonutChart = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<React.ComponentProps<typeof PieChart> & { data: any[], config: ChartConfig, innerRadius?: number | string, outerRadius?: number | string }>
>(({ className, data, config, innerRadius = "60%", outerRadius = "80%", children, ...props }, ref) => (
  <ChartContainer ref={ref} config={config} className={className}>
    <PieChart {...props}>
      <Tooltip cursor={false} content={<TooltipContent />} />
      <Pie data={data} dataKey="value" nameKey="name" innerRadius={innerRadius} outerRadius={outerRadius} strokeWidth={5}>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.fill} />
        ))}
      </Pie>
      {children}
    </PieChart>
  </ChartContainer>
));
DonutChart.displayName = "DonutChart";

const DonutChartCell = Cell;

const DonutChartLegend = (props: React.ComponentProps<typeof Legend>) => {
    const { payload } = props;
    if (!payload) return null;
    return <Legend content={<ChartLegendContent payload={payload} />} {...props} />;
}

const TooltipContent = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const { name, value, fill } = data;
    const config = (payload[0] as any)?.chart?.props.config;
    const itemConfig = config?.[name];

    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {itemConfig?.label || name}
            </span>
            <span className="font-bold" style={{color: fill}}>
              {value}%
            </span>
          </div>
        </div>
      </div>
    )
  }

  return null
}


export { DonutChart, DonutChartCell, DonutChartLegend };
