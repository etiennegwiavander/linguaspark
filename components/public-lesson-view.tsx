"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PublicNavbar from '@/components/public-navbar';
import PublicFooter from '@/components/public-footer';
import LessonDisplay from '@/components/lesson-display';
import type { PublicLesson } from '@/lib/types/public-lessons';
import type { Lesson } from '@/lib/lessons';

interface PublicLessonViewProps {
  lesson: PublicLesson;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId?: string;
}

// Convert PublicLesson content to LessonDisplay format
function convertToLessonDisplayFormat(lesson: PublicLesson): any {
  const content = lesson.content;
  
  console.log('[PublicLessonView] Converting lesson:', lesson.id);
  console.log('[PublicLessonView] Content structure:', JSON.stringify(content, null, 2));

  // Extract banner image from metadata if available
  const bannerImages = content.metadata?.bannerImages || [];
  const bannerImage = bannerImages.length > 0 ? bannerImages[0].src : lesson.banner_image_url;

  // Flatten grammar explanation if it's an object
  const processedGrammar = content.grammar ? flattenGrammarExplanation(content.grammar) : undefined;

  return {
    lessonTitle: content.title || lesson.title,
    lessonType: lesson.lesson_type,
    studentLevel: lesson.cefr_level,
    targetLanguage: 'english',
    id: lesson.id,
    metadata: {
      sourceUrl: lesson.source_url,
      source_url: lesson.source_url,
      source_title: lesson.source_title,
      bannerImages: bannerImage ? [{
        src: bannerImage,
        alt: lesson.title,
        type: 'meta' as const,
        priority: 1,
        width: null,
        height: null,
      }] : [],
    },
    extractionSource: lesson.source_url ? {
      url: lesson.source_url,
      domain: new URL(lesson.source_url).hostname,
      title: lesson.source_title || undefined,
    } : undefined,
    sections: {
      warmup: content.warmup?.questions || [],
      vocabulary: content.vocabulary?.words?.map((w: any) => ({
        word: w.word,
        meaning: w.definition || w.meaning,
        example: w.example,
        examples: w.example ? [w.example] : [],
      })) || content.vocabulary || [],
      reading: content.reading?.passage || content.reading || '',
      comprehension: content.comprehension?.questions || content.reading?.comprehension_questions || content.comprehension || [],
      dialoguePractice: content.dialoguePractice || [],
      dialogueFillGap: content.dialogueFillGap || [],
      discussion: content.discussion?.questions || content.discussion || [],
      grammar: processedGrammar ? {
        focus: processedGrammar.focus || 'Grammar Focus',
        explanation: processedGrammar.explanation || {
          form: '',
          usage: '',
          levelNotes: '',
        },
        examples: processedGrammar.examples || [],
        exercise: processedGrammar.practice || processedGrammar.exercise || [],
        exercises: (processedGrammar.practice || processedGrammar.exercises || []).map((p: any) => 
          typeof p === 'string' ? {
            prompt: p,
            answer: '',
            explanation: '',
          } : p
        ),
      } : undefined,
      pronunciation: content.pronunciation ? {
        instruction: content.pronunciation.focus || content.pronunciation.instruction,
        words: content.pronunciation.words?.map((w: any) => ({
          word: w.word,
          ipa: w.pronunciation || w.ipa,
          difficultSounds: w.difficultSounds || [],
          tips: w.tips ? (Array.isArray(w.tips) ? w.tips : [w.tips]) : [],
          practiceSentence: w.practiceSentence || '',
        })) || [],
        tongueTwisters: content.pronunciation.tongueTwisters || [],
      } : undefined,
      wrapup: content.wrapup?.questions || 
        (content.wrapup?.summary ? 
          // Try to split summary back into questions if it was concatenated
          (() => {
            const summary = content.wrapup.summary;
            // Check if summary contains the instruction pattern
            const instructionMatch = summary.match(/^(.*?wrap-up questions?:?\s*)/i);
            
            if (instructionMatch) {
              // Extract instruction and remaining text
              const instruction = instructionMatch[1].trim();
              const questionsText = summary.substring(instructionMatch[0].length).trim();
              
              // Split questions by pattern: number followed by period and space, or question mark followed by capital letter
              const questions = questionsText
                .split(/(?:(?<=\?)\s+(?=\d+\.|[A-Z])|(?<=\.)\s+(?=\d+\.\s+[A-Z]))/)
                .map((q: string) => q.trim())
                .filter((q: string) => q.length > 0);
              
              return [instruction, ...questions];
            } else if (summary.includes('?')) {
              // No instruction found, just split by questions
              return summary
                .split(/(?<=\?)\s+(?=[A-Z0-9])/)
                .map((q: string) => q.trim())
                .filter((q: string) => q.length > 0);
            } else {
              return [summary];
            }
          })() : 
          []
        ),
    },
  };
}

// Helper to flatten grammar explanation object to string
function flattenGrammarExplanation(grammar: any): any {
  if (!grammar) return grammar;
  
  // If explanation is an object, convert to string
  if (grammar.explanation && typeof grammar.explanation === 'object') {
    const exp = grammar.explanation;
    const parts = [];
    if (exp.form) parts.push(`Form: ${exp.form}`);
    if (exp.usage) parts.push(`Usage: ${exp.usage}`);
    if (exp.levelNotes) parts.push(`Notes: ${exp.levelNotes}`);
    
    return {
      ...grammar,
      explanation: {
        ...exp,
        // Keep the object structure but ensure all values are strings
        form: exp.form || '',
        usage: exp.usage || '',
        levelNotes: exp.levelNotes || '',
      }
    };
  }
  
  return grammar;
}

export default function PublicLessonView({
  lesson,
  isAuthenticated,
  isAdmin,
}: PublicLessonViewProps) {
  const router = useRouter();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Convert lesson to display format
  const displayLesson = convertToLessonDisplayFormat(lesson);

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const { lessonExporter } = await import('@/lib/export-utils');
      const lessonWithAttribution = { ...displayLesson, isPublicLesson: true };
      await lessonExporter.exportToPDF(lessonWithAttribution, {});
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportWord = async () => {
    setIsExportingWord(true);
    try {
      const { lessonExporter } = await import('@/lib/export-utils');
      const lessonWithAttribution = { ...displayLesson, isPublicLesson: true };
      await lessonExporter.exportToWord(lessonWithAttribution, {});
    } catch (error) {
      console.error('Word export error:', error);
      alert('Failed to export Word document. Please try again.');
    } finally {
      setIsExportingWord(false);
    }
  };

  const handleNewLesson = () => {
    router.push('/');
  };

  const handleLoadLesson = (loadedLesson: Lesson) => {
    // Not applicable for public lessons
    console.log('Load lesson not supported for public lessons');
  };

  const handleDeleteLesson = async () => {
    setIsDeleting(true);
    try {
      console.log('[PublicLessonView] Deleting lesson:', lesson.id);
      
      const response = await fetch(`/api/public-lessons/delete/${lesson.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete lesson');
      }

      console.log('[PublicLessonView] ✅ Lesson deleted successfully');
      alert('Lesson deleted successfully!');
      router.push('/library');
    } catch (error) {
      console.error('[PublicLessonView] ❌ Failed to delete lesson:', error);
      alert(`Failed to delete lesson: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1">
        {/* Back button and Admin Actions */}
        <div className="container mx-auto px-6 pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/library')}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Library
            </Button>

            {/* Admin Delete Button */}
            {isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Lesson
              </Button>
            )}
          </div>
        </div>

        {/* Use the same LessonDisplay component as personal library */}
        <LessonDisplay
          lesson={displayLesson}
          onExportPDF={handleExportPDF}
          onExportWord={handleExportWord}
          onNewLesson={handleNewLesson}
          onLoadLesson={handleLoadLesson}
        />
      </main>

      <PublicFooter />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{lesson.title}"? This action cannot be undone and will remove the lesson from the public library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLesson}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


