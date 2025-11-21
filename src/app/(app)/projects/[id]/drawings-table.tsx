
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Upload } from 'lucide-react';
import { type Drawing } from './drawings-data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

function DrawingForm({
    onSubmit,
    closeDialog,
    drawing,
  }: {
    onSubmit: (drawing: Omit<Drawing, 'id'>) => void;
    closeDialog: () => void;
    drawing?: Drawing | null;
  }) {
    const [sheetNumber, setSheetNumber] = React.useState(drawing?.sheetNumber || '');
    const [title, setTitle] = React.useState(drawing?.title || '');
    const [description, setDescription] = React.useState(drawing?.description || '');
    const [fileName, setFileName] = React.useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
        }
    };
  
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newDrawing: Omit<Drawing, 'id'> = {
            sheetNumber,
            title,
            description,
            date: format(new Date(), 'yyyy-MM-dd'),
            version: 'Ver. 1' // Default version, can be updated later
        };
        onSubmit(newDrawing);
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Drawing File</Label>
                <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                        <Input id="drawing-file" type="file" className="hidden" onChange={handleFileChange} />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('drawing-file')?.click()}>Choose File</Button>
                        <span className="ml-3 text-sm text-muted-foreground">{fileName || 'No file chosen'}</span>
                        <p className="text-xs text-muted-foreground mt-1">Select a PDF or image file. The system will attempt to name it.</p>
                    </div>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="sheet-number">Sheet Number</Label>
                <Input id="sheet-number" value={sheetNumber} onChange={(e) => setSheetNumber(e.target.value)} placeholder="e.g., A-101" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="drawing-title">Drawing Title</Label>
                <Input id="drawing-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., First Floor Plan" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="version-description">Version Description (Optional)</Label>
                <Textarea id="version-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Issued for Construction" />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Upload Drawing</Button>
            </DialogFooter>
        </form>
    );
}


export function DrawingsTable({ initialData }: { initialData: Drawing[] }) {
  const [drawings, setDrawings] = React.useState<Drawing[]>(initialData);
  const [isAddDrawingOpen, setIsAddDrawingOpen] = React.useState(false);

  const handleAddDrawing = (drawing: Omit<Drawing, 'id'>) => {
    const newDrawing: Drawing = {
        ...drawing,
        id: (drawings.length + 1).toString(),
    };
    setDrawings(prev => [newDrawing, ...prev]);
  };
    
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Drawings</CardTitle>
            <CardDescription>
              Manage project drawings and versions.
            </CardDescription>
          </div>
           <Dialog open={isAddDrawingOpen} onOpenChange={setIsAddDrawingOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Drawing
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Upload New Drawing</DialogTitle>
                    <DialogDescription>Fill out the form below to upload a new drawing to the project.</DialogDescription>
                </DialogHeader>
                <DrawingForm onSubmit={handleAddDrawing} closeDialog={() => setIsAddDrawingOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sheet No.</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drawings.map((drawing) => (
              <TableRow key={drawing.id}>
                <TableCell className="font-medium">{drawing.sheetNumber}</TableCell>
                <TableCell>{drawing.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{drawing.version}</Badge>
                </TableCell>
                <TableCell>{drawing.date}</TableCell>
                <TableCell>{drawing.description}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Download</DropdownMenuItem>
                            <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
