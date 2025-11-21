
'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import type { Application, Project } from '../projects-data';
import { G703Table } from './g703-table';
import { format } from 'date-fns';

export function G702Form({ application, project, onUpdate }: { application: Application, project: Project, onUpdate: (app: Application) => void }) {
    
    const [currentApplication, setCurrentApplication] = React.useState(application);
    
    React.useEffect(() => {
        setCurrentApplication(application);
    }, [application]);

    const handleG703Change = (updatedLines: Application['g703Lines']) => {
        const newApp = { ...currentApplication, g703Lines: updatedLines };
        setCurrentApplication(newApp);
        onUpdate(newApp);
    }
    
    const originalContractSum = project.budgetData.reduce((acc, item) => acc + item.originalBudget, 0);
    const netChangeByChangeOrders = (project.changeOrdersData || []).reduce((acc, co) => acc + (co.status === 'Approved' ? co.amount : 0), 0);
    const contractSumToDate = originalContractSum + netChangeByChangeOrders;
    
    const totalCompletedAndStored = currentApplication.g703Lines.reduce((sum, line) => sum + line.totalCompletedAndStored, 0);
    const totalRetainage = currentApplication.g703Lines.reduce((sum, line) => sum + line.totalRetainage, 0);
    const totalEarnedLessRetainage = totalCompletedAndStored - totalRetainage;
    
    // For simplicity, we assume no previous certificates for now.
    const lessPreviousCertificates = 0;
    const currentPaymentDue = totalEarnedLessRetainage - lessPreviousCertificates;
    const balanceToFinish = contractSumToDate - totalCompletedAndStored;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AIA Document G702 - Application and Certificate for Payment</CardTitle>
          <CardDescription>Summary of the payment application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {/* Header Info */}
            <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="font-semibold">Project:</span> {project.name}</div>
                <div><span className="font-semibold">To (Owner):</span> {project.client}</div>
                <div><span className="font-semibold">Application Date:</span> {format(new Date(), 'MMM d, yyyy')}</div>
                <div><span className="font-semibold">From (Contractor):</span> ConstructionFlow Inc.</div>
                <div><span className="font-semibold">Via (Architect):</span> N/A</div>
                <div><span className="font-semibold">Period To:</span> {format(new Date(currentApplication.periodEnd), 'MMM d, yyyy')}</div>
            </div>
            
            <Separator />
            
            {/* Main Calculation Table */}
            <div className="space-y-2">
                <h3 className="font-semibold">Contractor's Application for Payment</h3>
                <div className="border rounded-lg">
                    <div className="grid grid-cols-[3fr_1fr] items-center">
                        <div className="p-2 font-medium">1. Original Contract Sum</div>
                        <div className="p-2 text-right border-l">${originalContractSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                     <div className="grid grid-cols-[3fr_1fr] items-center border-t">
                        <div className="p-2 font-medium">2. Net Change by Change Orders</div>
                        <div className="p-2 text-right border-l">${netChangeByChangeOrders.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                     <div className="grid grid-cols-[3fr_1fr] items-center border-t">
                        <div className="p-2 font-medium">3. Contract Sum to Date (1+2)</div>
                        <div className="p-2 text-right border-l">${contractSumToDate.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                     <div className="grid grid-cols-[3fr_1fr] items-center border-t">
                        <div className="p-2 font-medium">4. Total Completed & Stored to Date</div>
                        <div className="p-2 text-right border-l">${totalCompletedAndStored.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                     <div className="grid grid-cols-[3fr_1fr] items-center border-t">
                        <div className="p-2 font-medium">5. Retainage</div>
                        <div className="p-2 text-right border-l">${totalRetainage.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    <div className="grid grid-cols-[3fr_1fr] items-center border-t bg-muted/50">
                        <div className="p-2 font-medium">6. Total Earned Less Retainage (4-5)</div>
                        <div className="p-2 text-right border-l font-bold">${totalEarnedLessRetainage.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                     <div className="grid grid-cols-[3fr_1fr] items-center border-t">
                        <div className="p-2 font-medium">7. Less Previous Certificates for Payment</div>
                        <div className="p-2 text-right border-l">(${lessPreviousCertificates.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</div>
                    </div>
                     <div className="grid grid-cols-[3fr_1fr] items-center border-t bg-muted/50">
                        <div className="p-2 font-bold text-lg">8. Current Payment Due (6-7)</div>
                        <div className="p-2 text-right border-l font-bold text-lg">${currentPaymentDue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    <div className="grid grid-cols-[3fr_1fr] items-center border-t">
                        <div className="p-2 font-medium">9. Balance to Finish, Including Retainage (3-4)</div>
                        <div className="p-2 text-right border-l">${balanceToFinish.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <G703Table lines={currentApplication.g703Lines} onLinesChange={handleG703Change} />
      
      <Card>
        <CardHeader>
            <CardTitle>Signatures & Certification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="flex items-center space-x-2">
                <Checkbox id="architect-certification" />
                <Label htmlFor="architect-certification" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Architect Certified
                </Label>
            </div>
             <p className="text-xs text-muted-foreground">The undersigned Contractor certifies that to the best of the Contractor's knowledge, information and belief the Work covered by this Application for Payment has been completed in accordance with the Contract Documents.</p>
            <div className="grid grid-cols-2 gap-8 pt-8">
                <div className="border-t pt-2">
                    <p className="text-sm font-semibold">Contractor Signature</p>
                </div>
                 <div className="border-t pt-2">
                    <p className="text-sm font-semibold">Architect Signature</p>
                </div>
            </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-4 border-t">
          <Button variant="outline">Save as Draft</Button>
          <Button>Submit Application</Button>
          <Button variant="secondary">Export PDF</Button>
      </div>
    </div>
  );
}
