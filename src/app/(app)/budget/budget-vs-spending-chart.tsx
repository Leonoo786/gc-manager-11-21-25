
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend as RechartsLegend,
  ResponsiveContainer,
} from 'recharts';


export function BudgetVsSpendingChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" hide />
        <RechartsLegend
          payload={[
            { value: 'Total Budget', type: 'rect', color: 'hsl(var(--muted))' },
            { value: 'Spent to Date', type: 'rect', color: 'hsl(var(--destructive))' },
            { value: 'Remaining', type: 'rect', color: 'hsl(var(--chart-2))' },
          ]}
        />
        <Bar dataKey="totalBudget" stackId="a" fill="hsl(var(--muted))" barSize={40} />
        <Bar dataKey="spentToDate" stackId="a" fill="hsl(var(--destructive))" barSize={40} />
        <Bar dataKey="remaining" stackId="a" fill="hsl(var(--chart-2))" barSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
