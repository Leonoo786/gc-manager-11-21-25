
'use client';
import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import type { ApplicationLine } from '../projects-data';

export function G703Table({
  lines,
  onLinesChange,
}: {
  lines: ApplicationLine[];
  onLinesChange: (lines: ApplicationLine[]) => void;
}) {
  const handleInputChange = (lineId: string, field: keyof ApplicationLine, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const updatedLines = lines.map(line => {
      if (line.id === lineId) {
        const updatedLine = { ...line, [field]: numericValue };

        // Recalculate dependent fields
        if (field === 'workCompletedThisPeriod' || field === 'materialsStored') {
            const totalCompleted = updatedLine.workCompletedThisPeriod + updatedLine.materialsStored;
            updatedLine.totalCompletedAndStored = totalCompleted;
            updatedLine.totalRetainage = (updatedLine.retainagePercent / 100) * totalCompleted;
            updatedLine.balanceToFinish = updatedLine.scheduledValue - totalCompleted;
        }

        return updatedLine;
      }
      return line;
    });
    onLinesChange(updatedLines);
  };

  const totals = React.useMemo(() => {
    return lines.reduce((acc, line) => {
        acc.scheduledValue += line.scheduledValue;
        acc.workCompletedThisPeriod += line.workCompletedThisPeriod;
        acc.materialsStored += line.materialsStored;
        acc.totalCompletedAndStored += line.totalCompletedAndStored;
        acc.totalRetainage += line.totalRetainage;
        acc.balanceToFinish += line.balanceToFinish;
        return acc;
    }, {
        scheduledValue: 0,
        workCompletedThisPeriod: 0,
        materialsStored: 0,
        totalCompletedAndStored: 0,
        totalRetainage: 0,
        balanceToFinish: 0,
    });
  }, [lines]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AIA Document G703 - Continuation Sheet</CardTitle>
        <CardDescription>
          Detailed breakdown of the Schedule of Values and work completed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Description</TableHead>
                <TableHead className="text-right min-w-[150px]">Scheduled Value</TableHead>
                <TableHead className="text-right min-w-[150px]">Work Completed (This Period)</TableHead>
                <TableHead className="text-right min-w-[150px]">Materials Stored</TableHead>
                <TableHead className="text-right min-w-[150px]">Total Completed & Stored</TableHead>
                <TableHead className="text-right min-w-[120px]">Retainage %</TableHead>
                <TableHead className="text-right min-w-[150px]">Total Retainage</TableHead>
                <TableHead className="text-right min-w-[150px]">Balance to Finish</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map(line => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{line.description}</TableCell>
                  <TableCell className="text-right">${formatCurrency(line.scheduledValue)}</TableCell>
                  <TableCell className="text-right">
                    <Input
                        type="number"
                        className="text-right h-8"
                        value={line.workCompletedThisPeriod}
                        onChange={(e) => handleInputChange(line.id, 'workCompletedThisPeriod', e.target.value)}
                        />
                  </TableCell>
                  <TableCell className="text-right">
                     <Input
                        type="number"
                        className="text-right h-8"
                        value={line.materialsStored}
                        onChange={(e) => handleInputChange(line.id, 'materialsStored', e.target.value)}
                        />
                  </TableCell>
                  <TableCell className="text-right bg-muted/50">${formatCurrency(line.totalCompletedAndStored)}</TableCell>
                  <TableCell className="text-right">{line.retainagePercent}%</TableCell>
                  <TableCell className="text-right bg-muted/50">${formatCurrency(line.totalRetainage)}</TableCell>
                  <TableCell className="text-right bg-muted/50">${formatCurrency(line.balanceToFinish)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
             <TableFooter>
                <TableRow className="font-bold bg-muted">
                    <TableCell>Totals</TableCell>
                    <TableCell className="text-right">${formatCurrency(totals.scheduledValue)}</TableCell>
                    <TableCell className="text-right">${formatCurrency(totals.workCompletedThisPeriod)}</TableCell>
                    <TableCell className="text-right">${formatCurrency(totals.materialsStored)}</TableCell>
                    <TableCell className="text-right">${formatCurrency(totals.totalCompletedAndStored)}</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right">${formatCurrency(totals.totalRetainage)}</TableCell>
                    <TableCell className="text-right">${formatCurrency(totals.balanceToFinish)}</TableCell>
                </TableRow>
             </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
