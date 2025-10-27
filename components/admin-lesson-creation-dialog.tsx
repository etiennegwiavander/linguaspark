'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LessonCategory, PublicLessonMetadata } from '@/lib/types/public-lessons';

interface AdminLessonCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (metadata: PublicLessonMetadata) => void;
  onCancel: () => void;
}

const CATEGORY_OPTIONS: { value: LessonCategory; label: string }[] = [
  { value: 'general-english', label: 'General English' },
  { value: 'business', label: 'Business' },
  { value: 'travel', label: 'Travel' },
  { value: 'academic', label: 'Academic' },
  { value: 'conversation', label: 'Conversation' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'pronunciation', label: 'Pronunciation' },
  { value: 'culture', label: 'Culture' },
];

export function AdminLessonCreationDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: AdminLessonCreationDialogProps): JSX.Element {
  const [category, setCategory] = React.useState<LessonCategory | ''>('');
  const [tagInput, setTagInput] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [estimatedDuration, setEstimatedDuration] = React.useState<string>('');

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setCategory('');
      setTagInput('');
      setTags([]);
      setEstimatedDuration('');
    }
  }, [open]);

  const handleAddTag = (): void => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string): void => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleConfirm = (): void => {
    if (!category) {
      return;
    }

    const metadata: PublicLessonMetadata = {
      category,
      tags: tags.length > 0 ? tags : undefined,
      estimated_duration_minutes: estimatedDuration
        ? parseInt(estimatedDuration, 10)
        : undefined,
    };

    onConfirm(metadata);
  };

  const handleCancel = (): void => {
    onCancel();
    onOpenChange(false);
  };

  const isValid = category !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save to Public Library</DialogTitle>
          <DialogDescription>
            Add metadata to make this lesson discoverable in the public library.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as LessonCategory)}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                type="text"
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-secondary text-secondary-foreground rounded-md"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive transition-colors"
                      aria-label={`Remove ${tag} tag`}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estimated Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Estimated Duration (minutes, optional)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="300"
              placeholder="e.g., 45"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Save to Public Library
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
