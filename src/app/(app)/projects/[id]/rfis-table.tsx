
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
import { Plus, HelpCircle, MoreHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

type Rfi = {
    id: string;
    rfiNumber: string;
    subject: string;
    question: string;
    date: string;
    status: 'Open' | 'Answered' | 'Closed';
};

function RfiForm({
  onSubmit,
  closeDialog,
}: {
  onSubmit: (subject: string, question: string) => void;
  closeDialog: () => void;
}) {
  const [subject, setSubject] = React.useState('');
  const [question, setQuestion] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(subject, question);
    closeDialog();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input 
            id="subject" 
            placeholder="e.g., Clarification on drawing A-101" 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="question">Question</Label>
          <Textarea 
            id="question" 
            placeholder="Please provide details about..." 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={5}
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit">Submit RFI</Button>
      </DialogFooter>
    </form>
  );
}


export function RfisTable() {
  const [rfis, setRfis] = React.useState<Rfi[]>([]);
  const [isAddRfiOpen, setIsAddRfiOpen] = React.useState(false);

  const handleAddRfi = (subject: string, question: string) => {
    const newRfi: Rfi = {
        id: (Date.now() + Math.random()).toString(),
        rfiNumber: `#${(rfis.length + 1).toString().padStart(3, '0')}`,
        subject,
        question,
        date: format(new Date(), 'MMM d, yyyy'),
        status: 'Open',
    };
    setRfis(prev => [newRfi, ...prev]);
  };

  const getStatusBadgeClass = (status: Rfi['status']) => {
    switch (status) {
        case 'Open':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Answered':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Closed':
            return 'bg-green-100 text-green-800 border-green-200';
        default:
            return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Requests for Information</CardTitle>
            <CardDescription>Manage all RFIs for this project.</CardDescription>
          </div>
          <Dialog open={isAddRfiOpen} onOpenChange={setIsAddRfiOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add RFI
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Submit New RFI</DialogTitle>
                    <DialogDescription>Fill out the form below to submit a new Request for Information.</DialogDescription>
                </DialogHeader>
                <RfiForm onSubmit={handleAddRfi} closeDialog={() => setIsAddRfiOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFI #</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rfis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <HelpCircle className="h-16 w-16 text-muted-foreground/50" />
                    <h3 className="text-xl font-semibold">No RFIs yet</h3>
                    <p className="text-muted-foreground">
                      Get started by creating a new Request for Information.
                    </p>
                    <Dialog open={isAddRfiOpen} onOpenChange={setIsAddRfiOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add RFI
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Submit New RFI</DialogTitle>
                                <DialogDescription>Fill out the form below to submit a new Request for Information.</DialogDescription>
                            </DialogHeader>
                            <RfiForm onSubmit={handleAddRfi} closeDialog={() => setIsAddRfiOpen(false)} />
                        </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rfis.map(rfi => (
                <TableRow key={rfi.id}>
                    <TableCell className="font-medium">{rfi.rfiNumber}</TableCell>
                    <TableCell>{rfi.subject}</TableCell>
                    <TableCell>{rfi.date}</TableCell>
                    <TableCell>
                        <Badge variant="secondary" className={getStatusBadgeClass(rfi.status)}>
                            {rfi.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>View</DropdownMenuItem>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
