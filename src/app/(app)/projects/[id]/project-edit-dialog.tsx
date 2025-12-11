'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import type { Project } from '../projects-data';

type RichProject = Project & {
  contractAmount?: number;          // original field from Projects page
  finalBidToCustomer?: number;      // new field we keep in sync
  internalContractAmount?: number;
  startDate?: string;
  endDate?: string;
  progress?: number;
};

interface ProjectEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: RichProject;
  /** Sum of Committed Cost (used to fill Internal Contract Amount) */
  totalCommittedCost: number;
  /** Apply changes back up to the page */
  onSave: (partial: Partial<RichProject>) => void;
}

export function ProjectEditDialog({
  open,
  onOpenChange,
  project,
  totalCommittedCost,
  onSave,
}: ProjectEditDialogProps) {
  // -----------------------
  // Local form state
  // -----------------------

  const [name, setName] = useState(project.name ?? '');
  const [description, setDescription] = useState(project.description ?? '');

  // 👇 Final Bid comes from finalBidToCustomer OR the original contractAmount
  const initialFinalBid =
    project.finalBidToCustomer ?? project.contractAmount ?? 0;

  const [finalBid, setFinalBid] = useState(
    initialFinalBid ? initialFinalBid.toString() : '',
  );

  const [internalContract, setInternalContract] = useState(
    (project.internalContractAmount ??
      totalCommittedCost ??
      0
    ).toString(),
  );

  const [startDate, setStartDate] = useState(project.startDate ?? '');
  const [endDate, setEndDate] = useState(project.endDate ?? '');
  const [progress, setProgress] = useState(
    project.progress !== undefined && project.progress !== null
      ? project.progress.toString()
      : '',
  );

  
  // Reset fields when dialog opens or project changes
  useEffect(() => {
    if (!open) return;

    setName(project.name ?? '');
    setDescription(project.description ?? '');

    const fb =
      project.finalBidToCustomer ?? project.contractAmount ?? 0;
    setFinalBid(fb ? fb.toString() : '');

    setInternalContract(
      (project.internalContractAmount ??
        totalCommittedCost ??
        0
      ).toString(),
    );
    setStartDate(project.startDate ?? '');
    setEndDate(project.endDate ?? '');
    setProgress(
      project.progress !== undefined && project.progress !== null
        ? project.progress.toString()
        : '',
    );
  }, [open, project, totalCommittedCost]);

  const handleSave = () => {
    const finalBidNumber = finalBid ? Number(finalBid) : 0;
    const internalNumber = internalContract ? Number(internalContract) : 0;
    const progressNumber = progress ? Number(progress) : undefined;

    onSave({
      name,
      description,
      // keep both fields in sync so main Projects page + detail page match
      finalBidToCustomer: finalBidNumber,
      contractAmount: finalBidNumber,
      internalContractAmount: internalNumber,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      progress: progressNumber,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Project basic info */}
          <div className="grid gap-4">
            <div className="space-y-1">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of the project"
                rows={3}
              />
            </div>
          </div>

          {/* Money fields */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Internal Contract Amount (auto-filled from committed cost) */}
            <div className="space-y-1">
              <Label htmlFor="internal-contract">
                Internal Contract Amount
                <span className="ml-1 text-xs text-muted-foreground">
                  (auto-filled from Total Budget)
                </span>
              </Label>
              <Input
                id="internal-contract"
                type="number"
                value={internalContract}
                onChange={(e) => setInternalContract(e.target.value)}
              />
            </div>

            {/* Final Bid to Customer (user editable) */}
            <div className="space-y-1">
              <Label htmlFor="final-bid">Final Bid to Customer</Label>
              <Input
                id="final-bid"
                type="number"
                value={finalBid}
                onChange={(e) => setFinalBid(e.target.value)}
                placeholder="2416305"
              />
            </div>
          </div>

          {/* Dates + progress */}
<div className="grid gap-4 md:grid-cols-3">
  {/* Start Date */}
  <div className="space-y-1">
    <Label htmlFor="startDate">Start Date</Label>
    <Input
      id="startDate"
      name="startDate"
      type="date" // 👈 date picker
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
    />
  </div>

  {/* End Date */}
  <div className="space-y-1">
    <Label htmlFor="endDate">End Date</Label>
    <Input
      id="endDate"
      name="endDate"
      type="date" // 👈 date picker
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
    />
  </div>

  {/* Progress */}
  <div className="space-y-1">
    <Label htmlFor="progress">
      Progress (%)
      <span className="ml-1 text-xs text-muted-foreground">optional</span>
    </Label>
    <Input
      id="progress"
      type="number"
      min={0}
      max={100}
      value={progress}
      onChange={(e) => setProgress(e.target.value)}
      placeholder="0–100"
    />
  </div>
</div>


        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
