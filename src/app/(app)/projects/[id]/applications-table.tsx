
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
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Plus, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import type { Application, Project } from '../projects-data';
import { G702Form } from './g702-form';

export function ApplicationsTable({
  initialData,
  onDataChange,
  project,
}: {
  initialData: Application[];
  onDataChange: (data: Application[]) => void;
  project: Project;
}) {
  const [applications, setApplications] = React.useState<Application[]>(initialData);
  const [selectedApplication, setSelectedApplication] = React.useState<Application | null>(null);

  React.useEffect(() => {
    setApplications(initialData);
  }, [initialData]);

  const handleCreateNewApplication = () => {
    const nextAppNumber = applications.length > 0 ? Math.max(...applications.map(a => a.applicationNumber)) + 1 : 1;
    
    // Create G703 lines from the project's budget (Schedule of Values)
    const g703Lines = project.budgetData.map(budgetItem => ({
        id: `${nextAppNumber}-${budgetItem.id}`,
        sovId: budgetItem.id,
        description: budgetItem.category,
        scheduledValue: budgetItem.originalBudget,
        workCompletedThisPeriod: 0,
        materialsStored: 0,
        totalCompletedAndStored: 0,
        retainagePercent: 10,
        totalRetainage: 0,
        balanceToFinish: budgetItem.originalBudget,
    }));
    
    const newApplication: Application = {
      id: `app-${nextAppNumber}`,
      applicationNumber: nextAppNumber,
      periodStart: new Date().toISOString().split('T')[0],
      periodEnd: new Date().toISOString().split('T')[0],
      status: 'Draft',
      g703Lines: g703Lines,
    };
    
    const newApplications = [...applications, newApplication];
    setApplications(newApplications);
    onDataChange(newApplications);
    setSelectedApplication(newApplication);
  };
  
  const handleViewApplication = (app: Application) => {
    setSelectedApplication(app);
  };

  const getStatusBadgeClass = (status: Application['status']) => {
    switch (status) {
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Paid':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const onApplicationUpdate = (updatedApp: Application) => {
    const newApplications = applications.map(app => app.id === updatedApp.id ? updatedApp : app);
    setApplications(newApplications);
    onDataChange(newApplications);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment Applications</CardTitle>
            <CardDescription>Manage all G702/G703 payment applications for this project.</CardDescription>
          </div>
          <Button onClick={handleCreateNewApplication}>
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>App #</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount Due</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No payment applications for this project yet.
                </TableCell>
              </TableRow>
            ) : (
              applications.map(app => {
                 const totalCompleted = app.g703Lines.reduce((sum, line) => sum + line.totalCompletedAndStored, 0);
                 const totalRetainage = app.g703Lines.reduce((sum, line) => sum + line.totalRetainage, 0);
                 const amountDue = totalCompleted - totalRetainage;
                return (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.applicationNumber}</TableCell>
                        <TableCell>{new Date(app.periodStart).toLocaleDateString()} - {new Date(app.periodEnd).toLocaleDateString()}</TableCell>
                        <TableCell>
                            <Badge variant="secondary" className={getStatusBadgeClass(app.status)}>
                                {app.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">${amountDue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="sm" onClick={() => handleViewApplication(app)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Button>
                        </TableCell>
                    </TableRow>
                )
            })
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!selectedApplication} onOpenChange={(isOpen) => !isOpen && setSelectedApplication(null)}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Application for Payment #{selectedApplication?.applicationNumber}</DialogTitle>
             <DialogDescription>
                Project: {project.name} | Period: {selectedApplication ? new Date(selectedApplication.periodStart).toLocaleDateString() : ''} to {selectedApplication ? new Date(selectedApplication.periodEnd).toLocaleDateString() : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="flex-1 overflow-y-auto pr-6">
                <G702Form application={selectedApplication} project={project} onUpdate={onApplicationUpdate} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
