"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Loader2,
  Download,
  Maximize2,
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
  Dialog,
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const STORAGE_KEY = "photos";

type PhotoItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;          // data URL
  uploadedAt: string;   // ISO string
};

export default function PhotosPage() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<PhotoItem | null>(null);

  // Load from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setPhotos(parsed);
        }
      }
    } catch {
      console.warn("Could not parse photos from localStorage");
    }

    setIsMounted(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    } catch {
      console.warn("Could not store photos in localStorage");
    }
  }, [photos, isMounted]);

  const handleUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, etc.).");
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;

      const newPhoto: PhotoItem = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        uploadedAt: new Date().toISOString(),
      };

      setPhotos((prev) => [...prev, newPhoto]);
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const deletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (previewPhoto && previewPhoto.id === id) {
      setPreviewPhoto(null);
    }
  };

  if (!isMounted) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading photos…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header + upload */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Photos
          </h1>
          <p className="text-muted-foreground">
            Store and preview jobsite photos, progress shots, and reference images.
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Photo</DialogTitle>
              <DialogDescription>
                Choose an image from your computer or phone.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload(e.target.files?.[0] || null)}
              />
            </div>

            <DialogFooter>
              {uploading ? (
                <Button disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading…
                </Button>
              ) : (
                <Button type="button">Done</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-500" />
            Photo Gallery
          </CardTitle>
          <CardDescription>
            All photos are stored locally in this browser. They won’t leave your machine.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {photos.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-sm text-muted-foreground gap-1">
              <ImageIcon className="h-8 w-8 mb-1 text-muted-foreground/60" />
              No photos uploaded yet.
              <span className="text-xs">
                Use &quot;Upload Photo&quot; to add jobsite or progress images.
              </span>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative rounded-lg border bg-card overflow-hidden flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewPhoto(photo)}
                    className="relative aspect-video w-full overflow-hidden"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.description || 'Project photo'}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </button>

                  <div className="p-3 flex flex-col gap-1 text-xs">
                    <div className="font-medium truncate">{photo.name}</div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>
                        {(photo.size / 1024).toFixed(1)} KB
                      </span>
                      <span>
                        {new Date(photo.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <a href={photo.url} download={photo.name}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          type="button"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </a>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        type="button"
                        onClick={() => deletePhoto(photo.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview dialog */}
      <Dialog open={!!previewPhoto} onOpenChange={(open) => !open && setPreviewPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
              {previewPhoto?.name ?? "Photo Preview"}
            </DialogTitle>
            <DialogDescription>
              {previewPhoto &&
                `${(previewPhoto.size / 1024).toFixed(1)} KB • ${new Date(
                  previewPhoto.uploadedAt
                ).toLocaleString()}`}
            </DialogDescription>
          </DialogHeader>

          {previewPhoto && (
            <div className="relative w-full h-[400px] md:h-[500px] rounded-md overflow-hidden bg-muted">
              <Image
                src={previewPhoto.url}
                alt={previewPhoto.name}
                fill
                className="object-contain"
              />
            </div>
          )}

          <DialogFooter className="flex items-center justify-between">
            {previewPhoto && (
              <a href={previewPhoto.url} download={previewPhoto.name}>
                <Button variant="outline" type="button">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              type="button"
              className="text-destructive ml-auto"
              onClick={() => previewPhoto && deletePhoto(previewPhoto.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
