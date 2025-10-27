"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PublicNavbar from '@/components/public-navbar';
import PublicFooter from '@/components/public-footer';
import type { PublicLesson } from '@/lib/types/public-lessons';

interface PublicLessonViewProps {
  lesson: PublicLesson;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId?: string;
}

// Convert PublicLesson content to LessonDisplay format
function convertToLessonDisplayFormat(lesson: PublicLesson): any {
  const content = lesson.content;
  
  return {
    lessonTitle: content.title,
    lessonType: lesson.lesson_type,
    studentLevel: lesson.cefr_level,
    targetLanguage: 'english',
    id: lesson.id,
    metadata: {
      sourceUrl: lesson.source_url,
      source_url: lesson.source_url,
      source_title: lesson.source_title,
      bannerImages: lesson.banner_image_url ? [{
        src: lesson.banner_image_url,
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
      vocabulary: content.vocabulary?.words?.map(w => ({
        word: w.word,
        meaning: w.definition,
        example: w.example,
        examples: [w.example],
      })) || [],
      reading: content.reading?.passage || '',
      comprehension: content.reading?.comprehension_questions || [],
      discussion: content.discussion?.questions || [],
      grammar: content.grammar ? {
        focus: content.grammar.focus,
        explanation: {
          form: '',
          usage: content.grammar.explanation || '',
          levelNotes: '',
        },
        examples: content.grammar.examples || [],
        exercise: content.grammar.practice || [],
        exercises: content.grammar.practice?.map(p => ({
          prompt: p,
          answer: '',
          explanation: '',
        })) || [],
      } : {
        focus: 'Grammar Focus',
        examples: [],
        exercise: [],
      },
      pronunciation: content.pronunciation ? {
        instruction: content.pronunciation.focus,
        words: content.pronunciation.words?.map(w => ({
          word: w.word,
          ipa: w.pronunciation,
          difficultSounds: [],
          tips: w.tips ? [w.tips] : [],
          practiceSentence: '',
        })) || [],
        tongueTwisters: [],
      } : undefined,
      wrapup: [content.wrapup?.summary || ''],
    },
  };
}

export default function PublicLessonView({
  lesson,
  isAuthenticated,
  isAdmin,
  userId,
}: PublicLessonViewProps) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isExportingHTML, setIsExportingHTML] = useState(false);
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

  const handleExportHTML = async () => {
    setIsExportingHTML(true);
    try {
      const { exportToHTML } = await import('@/lib/export-html-pptx');
      const lessonWithAttribution = { ...displayLesson, isPublicLesson: true };
      await exportToHTML(lessonWithAttribution, {});
    } catch (error) {
      console.error('HTML export error:', error);
      alert('Failed to export HTML. Please try again.');
    } finally {
      setIsExportingHTML(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this public lesson? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const sessionData = localStorage.getItem('sb-jbkpnirowdvlwlgheqho-auth-token');
      if (!sessionData) {
        throw new Error('No authentication session found');
      }

      const session = JSON.parse(sessionData);
      const authToken = session.access_token;

      const response = await fetch(`/api/public-lessons/delete/${lesson.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete lesson');
      }

      alert('Lesson deleted successfully');
      router.push('/library');
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete lesson');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-vintage-cream">
      <PublicNavbar />

      <main className="flex-1">
        <div className="container mx-auto px-6 py-8">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-6 text-vintage-brown hover:text-vintage-burgundy"
            onClick={() => router.push('/library')}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Button>

          <div className="flex gap-8">
            {/* Main content area */}
            <div className="flex-1 min-w-0">
              {/* Lesson header */}
              <div className="bg-white border-2 border-vintage-brown rounded-lg p-8 shadow-vintage mb-6">
                {lesson.banner_image_url && (
                  <div className="mb-6 rounded-lg overflow-hidden border border-vintage-brown/20">
                    <img
                      src={lesson.banner_image_url}
                      alt={lesson.title}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}
                
                <h1 className="font-serif text-4xl font-bold text-vintage-brown mb-4">
                  {lesson.title}
                </h1>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-vintage-gold/20 text-vintage-brown border-vintage-gold">
                    {lesson.cefr_level}
                  </Badge>
                  <Badge className="bg-vintage-burgundy/10 text-vintage-burgundy border-vintage-burgundy/30">
                    {lesson.lesson_type}
                  </Badge>
                  <Badge className="bg-vintage-brown/10 text-vintage-brown border-vintage-brown/30">
                    {lesson.category}
                  </Badge>
                  {lesson.estimated_duration_minutes && (
                    <Badge variant="outline" className="text-vintage-brown">
                      {lesson.estimated_duration_minutes} min
                    </Badge>
                  )}
                </div>

                {lesson.tags && lesson.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {lesson.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-vintage-cream border border-vintage-brown/20 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {lesson.source_url && (
                  <div className="mt-4 pt-4 border-t border-vintage-brown/20">
                    <p className="text-sm text-vintage-brown/60">
                      Source:{' '}
                      <a
                        href={lesson.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-vintage-burgundy hover:underline"
                      >
                        {lesson.source_title || lesson.source_url}
                      </a>
                    </p>
                  </div>
                )}
              </div>

              {/* Lesson content - using simplified display */}
              <div className="bg-white border-2 border-vintage-brown rounded-lg p-8 shadow-vintage">
                <LessonContentDisplay content={lesson.content} />
              </div>
            </div>

            {/* Sidebar - only show for authenticated users */}
            {isAuthenticated && (
              <aside className="w-80 flex-shrink-0">
                <div className="sticky top-8 bg-white border-2 border-vintage-brown rounded-lg p-6 shadow-vintage">
                  <h2 className="font-serif text-xl font-bold text-vintage-brown mb-4">
                    Actions
                  </h2>

                  <div className="space-y-3">
                    {/* Export options */}
                    <div>
                      <h3 className="text-sm font-medium text-vintage-brown mb-2">Export</h3>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs border-vintage-brown text-vintage-brown hover:bg-vintage-brown hover:text-vintage-cream"
                          onClick={handleExportHTML}
                          disabled={isExportingHTML || isExportingPDF || isExportingWord}
                        >
                          {isExportingHTML ? 'Exporting...' : 'Export as HTML'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs border-vintage-brown text-vintage-brown hover:bg-vintage-brown hover:text-vintage-cream"
                          onClick={handleExportPDF}
                          disabled={isExportingHTML || isExportingPDF || isExportingWord}
                        >
                          {isExportingPDF ? 'Exporting...' : 'Export as PDF'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs border-vintage-brown text-vintage-brown hover:bg-vintage-brown hover:text-vintage-cream"
                          onClick={handleExportWord}
                          disabled={isExportingHTML || isExportingPDF || isExportingWord}
                        >
                          {isExportingWord ? 'Exporting...' : 'Export as Word'}
                        </Button>
                      </div>
                    </div>

                    {/* Admin-only delete option */}
                    {isAdmin && (
                      <div className="pt-3 border-t border-vintage-brown/20">
                        <h3 className="text-sm font-medium text-vintage-brown mb-2">Admin</h3>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete Lesson'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

// Simplified lesson content display component
function LessonContentDisplay({ content }: { content: any }) {
  return (
    <div className="space-y-8">
      {/* Warmup */}
      {content.warmup?.questions && content.warmup.questions.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl font-bold text-vintage-brown mb-4">
            Warm-up Questions
          </h2>
          <div className="space-y-2">
            {content.warmup.questions.map((question: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <span className="font-medium text-vintage-burgundy">{index + 1}.</span>
                <p className="text-vintage-brown">{question}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Vocabulary */}
      {content.vocabulary?.words && content.vocabulary.words.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl font-bold text-vintage-brown mb-4">
            Key Vocabulary
          </h2>
          <div className="space-y-4">
            {content.vocabulary.words.map((word: any, index: number) => (
              <div key={index} className="border border-vintage-brown/20 rounded-lg p-4 bg-vintage-cream/50">
                <h3 className="font-semibold text-lg text-vintage-burgundy mb-1">
                  {word.word}
                </h3>
                <p className="text-vintage-brown mb-2">{word.definition}</p>
                {word.example && (
                  <p className="text-sm text-vintage-brown/70 italic">
                    Example: {word.example}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reading */}
      {content.reading?.passage && (
        <section>
          <h2 className="font-serif text-2xl font-bold text-vintage-brown mb-4">
            Reading Passage
          </h2>
          <div className="prose prose-vintage max-w-none">
            <p className="text-vintage-brown leading-relaxed whitespace-pre-wrap">
              {content.reading.passage}
            </p>
          </div>
          
          {content.reading.comprehension_questions && content.reading.comprehension_questions.length > 0 && (
            <div className="mt-6">
              <h3 className="font-serif text-xl font-bold text-vintage-brown mb-3">
                Comprehension Questions
              </h3>
              <div className="space-y-2">
                {content.reading.comprehension_questions.map((question: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="font-medium text-vintage-burgundy">{index + 1}.</span>
                    <p className="text-vintage-brown">{question}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Grammar */}
      {content.grammar && (
        <section>
          <h2 className="font-serif text-2xl font-bold text-vintage-brown mb-4">
            Grammar Focus: {content.grammar.focus}
          </h2>
          {content.grammar.explanation && (
            <div className="bg-vintage-gold/10 border border-vintage-gold/30 rounded-lg p-4 mb-4">
              <p className="text-vintage-brown">{content.grammar.explanation}</p>
            </div>
          )}
          {content.grammar.examples && content.grammar.examples.length > 0 && (
            <div>
              <h3 className="font-medium text-vintage-brown mb-2">Examples:</h3>
              <div className="space-y-2">
                {content.grammar.examples.map((example: string, index: number) => (
                  <p key={index} className="text-vintage-brown pl-4 border-l-2 border-vintage-burgundy/30">
                    {example}
                  </p>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Discussion */}
      {content.discussion?.questions && content.discussion.questions.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl font-bold text-vintage-brown mb-4">
            Discussion Questions
          </h2>
          <div className="space-y-2">
            {content.discussion.questions.map((question: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <span className="font-medium text-vintage-burgundy">{index + 1}.</span>
                <p className="text-vintage-brown">{question}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pronunciation */}
      {content.pronunciation?.words && content.pronunciation.words.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl font-bold text-vintage-brown mb-4">
            Pronunciation Practice
          </h2>
          {content.pronunciation.focus && (
            <p className="text-vintage-brown mb-4">{content.pronunciation.focus}</p>
          )}
          <div className="space-y-3">
            {content.pronunciation.words.map((word: any, index: number) => (
              <div key={index} className="border border-vintage-brown/20 rounded-lg p-3 bg-vintage-cream/50">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-vintage-burgundy">{word.word}</span>
                  <span className="text-vintage-brown/70">{word.pronunciation}</span>
                </div>
                {word.tips && (
                  <p className="text-sm text-vintage-brown/70 mt-1">{word.tips}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Wrapup */}
      {content.wrapup?.summary && (
        <section>
          <h2 className="font-serif text-2xl font-bold text-vintage-brown mb-4">
            Wrap-up
          </h2>
          <p className="text-vintage-brown">{content.wrapup.summary}</p>
          {content.wrapup.homework && content.wrapup.homework.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-vintage-brown mb-2">Homework:</h3>
              <ul className="space-y-1">
                {content.wrapup.homework.map((task: string, index: number) => (
                  <li key={index} className="text-vintage-brown flex items-start gap-2">
                    <span>•</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
