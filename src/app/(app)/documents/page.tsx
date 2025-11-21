"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  FileText,
  FileImage,
  File,
  Plus,
  Trash2,
  Loader2,
  Download,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "documents";

type DocItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
};

const getIconForFile = (type: string) => {
  if (type.includes("pdf")) return <FileText className="h-5 w-5 text-red-600" />;
  if (type.includes("image")) return <FileImage className="h-5 w-5 text-blue-600" />;
  return <File className="h-5 w-5 text-gray-600" />;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDocuments(JSON.parse(raw));
    } catch {
      console.warn("Could not parse documents from localStorage");
    }

    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    }
  }, [documents, isMounted]);

  const handleUpload = async (file: File | null) => {
    if (!file) return;

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;

      const newDoc: DocItem = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        uploadedAt: new Date().toISOString(),
      };

      setDocuments((prev) => [...prev, newDoc]);
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Store and manage project documents, drawings, and images.
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>Select a file to upload.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              <Input
                id="doc-upload"
                type="file"
                onChange={(e) => handleUpload(e.target.files?.[0] || null)}
              />
            </div>

            <DialogFooter>
              {uploading ? (
                <Button disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…
                </Button>
              ) : (
                <Button type="button">Done</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">All Documents</CardTitle>
          <CardDescription>Uploaded files stored in your browser.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                      No documents uploaded yet.
                    </TableCell>
                  </TableRow>
                )}

                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{getIconForFile(doc.type)}</TableCell>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.type || "unknown"}</Badge>
                    </TableCell>
                    <TableCell>{(doc.size / 1024).toFixed(1)} KB</TableCell>
                    <TableCell>
                      {new Date(doc.uploadedAt).toLocaleDateString()}{" "}
                      {new Date(doc.uploadedAt).toLocaleTimeString()}
                    </TableCell>

                    <TableCell className="text-right space-x-2">
                      <a href={doc.url} download={doc.name}>
                        <Button variant="outline" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>

                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteDocument(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
