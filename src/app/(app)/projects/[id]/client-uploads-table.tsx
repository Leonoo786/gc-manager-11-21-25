
'use client';
import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  FilePenLine,
  Trash,
  Upload,
  File as FileIcon,
} from 'lucide-react';
import { type ClientUpload } from './client-uploads-data';
import { format } from 'date-fns';

export function ClientUploadsTable({ initialData, onDataChange }: { initialData: ClientUpload[], onDataChange: (data: ClientUpload[]) => void }) {
  const [files, setFiles] = React.useState<ClientUpload[]>(initialData);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setFiles(initialData);
  }, [initialData]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        const newFile: ClientUpload = {
            id: (Date.now() + Math.random()).toString(),
            name: selectedFile.name,
            size: `${(selectedFile.size / 1024).toFixed(2)} KB`,
            date: format(new Date(), 'MMM d, yyyy'),
        };

        const newFiles = [newFile, ...files];
        setFiles(newFiles);
        onDataChange(newFiles);
    }
    // Reset file input to allow uploading the same file again
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleDelete = (fileId: string) => {
    const newFiles = files.filter(f => f.id !== fileId);
    setFiles(newFiles);
    onDataChange(newFiles);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Uploads</CardTitle>
        <CardDescription>
          Documents and files uploaded by the client.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {files.length === 0 ? (
             <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-lg">
                <Upload className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mt-4">No client uploads yet</h3>
                <p className="text-muted-foreground text-sm">Use the button below to upload the first file.</p>
            </div>
        ) : (
            <ul className="space-y-3">
            {files.map((file) => (
                <li
                key={file.id}
                className="flex items-center justify-between rounded-lg border p-3"
                >
                <div className="flex items-center gap-4">
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                    <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {file.size} • {file.date}
                    </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                    <FilePenLine className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(file.id)}>
                    <Trash className="h-4 w-4" />
                    </Button>
                </div>
                </li>
            ))}
            </ul>
        )}
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
        />
        <Button className="w-full" onClick={handleUploadClick}>
          <Upload className="mr-2 h-4 w-4" />
          Upload a File
        </Button>
      </CardContent>
    </Card>
  );
}
