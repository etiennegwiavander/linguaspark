"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Edit3, Check, X, Loader2, AlertCircle } from "lucide-react";
import { useExtractionConfirmation } from "@/hooks/use-extraction-confirmation";
import { LessonTypeUtils, CEFRLevelUtils } from "@/lib/extraction-confirmation-manager";
import type { ExtractedContent } from "@/lib/enhanced-content-extractor";
import type { LessonType, CEFRLevel } from "@/lib/extraction-confirmation-manager";

interface ExtractionConfirmationDialogProps {
  onConfirm?: (content: ExtractedContent, lessonType: LessonType, cefrLevel: CEFRLevel) => Promise<void>;
  onCancel?: () => void;
  onContentEdit?: (editedContent: string) => void;
  onLessonTypeChange?: (lessonType: LessonType) => void;
  onCEFRLevelChange?: (cefrLevel: CEFRLevel) => void;
}

export function ExtractionConfirmationDialog({
  onConfirm,
  onCancel,
  onContentEdit,
  onLessonTypeChange,
  onCEFRLevelChange,
}: ExtractionConfirmationDialogProps) {
  const {
    isOpen,
    extractedContent,
    selectedLessonType,
    selectedCEFRLevel,
    editedContent,
    isEditing,
    handleConfirm,
    handleCancel,
    handleContentEdit,
    handleLessonTypeChange,
    handleCEFRLevelChange,
    toggleEditingMode,
    closeDialog,
    isProcessing,
    error
  } = useExtractionConfirmation({
    onConfirm,
    onCancel,
    onContentEdit,
    onLessonTypeChange,
    onCEFRLevelChange,
    autoRecoverSession: true
  });

  if (!extractedContent) return null;

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const lessonTypeOptions = LessonTypeUtils.getAllTypes();
  const cefrLevelOptions = CEFRLevelUtils.getAllLevels();

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Content Extracted Successfully
          </DialogTitle>
          <DialogDescription>
            Review the extracted content and customize your lesson settings before proceeding.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Content Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  Content Preview
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleEditingMode}
                    className="flex items-center gap-2"
                    disabled={isProcessing}
                  >
                    <Edit3 className="h-4 w-4" />
                    {isEditing ? 'Done' : 'Edit'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => handleContentEdit(e.target.value)}
                    className="min-h-[200px] text-sm"
                    placeholder="Edit the extracted content..."
                    disabled={isProcessing}
                  />
                ) : (
                  <ScrollArea className="h-[200px]">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {editedContent.length > 500
                        ? `${editedContent.substring(0, 500)}...`
                        : editedContent}
                    </p>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Content Metadata */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Source Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">Title</h4>
                  <p className="text-sm font-medium">{extractedContent.metadata.title}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm text-gray-600">Source:</h4>
                  <a
                    href={extractedContent.metadata.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {extractedContent.metadata.domain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {extractedContent.metadata.author && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-1">Author</h4>
                    <p className="text-sm">{extractedContent.metadata.author}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-1">Word Count</h4>
                    <p className="text-sm font-medium">{extractedContent.quality.wordCount}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-1">Reading Time</h4>
                    <p className="text-sm font-medium">{extractedContent.quality.readingTime} min</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Content Complexity</h4>
                  <Badge className={getComplexityColor(extractedContent.quality.complexity)}>
                    {extractedContent.quality.complexity}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lesson Configuration */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Lesson Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Lesson Type
                  </label>
                  <Select
                    value={selectedLessonType}
                    onValueChange={handleLessonTypeChange}
                    disabled={isProcessing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lessonTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{option.label}</span>
                            {option.value === extractedContent.suggestedLessonType && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Suggested
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    AI suggested: {extractedContent.suggestedLessonType}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    CEFR Level
                  </label>
                  <Select
                    value={selectedCEFRLevel}
                    onValueChange={handleCEFRLevelChange}
                    disabled={isProcessing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cefrLevelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{option.label}</span>
                            {option.value === extractedContent.suggestedCEFRLevel && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Suggested
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    AI suggested: {extractedContent.suggestedCEFRLevel}
                  </p>
                </div>

                <Separator />

                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm text-blue-900 mb-2">
                    Quality Assessment
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">Suitability Score</span>
                    <Badge variant="outline" className="text-blue-700 border-blue-300">
                      {Math.round(extractedContent.quality.suitabilityScore * 100)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleConfirm}
                className="w-full"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Lesson...
                  </>
                ) : (
                  'Generate Lesson'
                )}
              </Button>
              
              <Button
                onClick={handleCancel}
                variant="outline"
                className="w-full"
                size="lg"
                disabled={isProcessing}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}