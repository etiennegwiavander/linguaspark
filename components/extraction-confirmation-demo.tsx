"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExtractionConfirmationDialog } from "./extraction-confirmation-dialog";
import { useExtractionConfirmation } from "@/hooks/use-extraction-confirmation";
import type { ExtractedContent } from "@/lib/enhanced-content-extractor";
import type { LessonType, CEFRLevel } from "@/lib/extraction-confirmation-manager";

// Mock extracted content for testing
const mockExtractedContent: ExtractedContent = {
  text: `Climate change is one of the most pressing issues of our time. The Earth's climate has always varied naturally, but scientific evidence shows that human activities, particularly the burning of fossil fuels, are causing unprecedented changes to our planet's climate system.

The greenhouse effect is a natural process that keeps Earth warm enough to support life. However, human activities have intensified this effect by increasing the concentration of greenhouse gases in the atmosphere. Carbon dioxide, methane, and other greenhouse gases trap heat from the sun, causing global temperatures to rise.

The consequences of climate change are already visible around the world. We're seeing more frequent and severe weather events, rising sea levels, melting ice caps, and shifts in precipitation patterns. These changes affect ecosystems, agriculture, water resources, and human communities.

Addressing climate change requires both mitigation and adaptation strategies. Mitigation involves reducing greenhouse gas emissions through renewable energy, energy efficiency, and sustainable practices. Adaptation means preparing for and adjusting to the effects of climate change that are already occurring or inevitable.

Individual actions matter too. We can reduce our carbon footprint by using public transportation, conserving energy at home, supporting renewable energy, and making sustainable consumer choices. Education and awareness are also crucial for building the collective action needed to address this global challenge.`,
  
  structuredContent: {
    headings: [
      { level: 1, text: "Climate Change: A Global Challenge" },
      { level: 2, text: "The Greenhouse Effect" },
      { level: 2, text: "Visible Consequences" },
      { level: 2, text: "Solutions and Actions" }
    ],
    paragraphs: [
      "Climate change is one of the most pressing issues of our time. The Earth's climate has always varied naturally, but scientific evidence shows that human activities, particularly the burning of fossil fuels, are causing unprecedented changes to our planet's climate system.",
      "The greenhouse effect is a natural process that keeps Earth warm enough to support life. However, human activities have intensified this effect by increasing the concentration of greenhouse gases in the atmosphere.",
      "The consequences of climate change are already visible around the world. We're seeing more frequent and severe weather events, rising sea levels, melting ice caps, and shifts in precipitation patterns.",
      "Addressing climate change requires both mitigation and adaptation strategies. Mitigation involves reducing greenhouse gas emissions through renewable energy, energy efficiency, and sustainable practices.",
      "Individual actions matter too. We can reduce our carbon footprint by using public transportation, conserving energy at home, supporting renewable energy, and making sustainable consumer choices."
    ],
    lists: [],
    quotes: [],
    images: [],
    links: [],
    tables: [],
    codeBlocks: []
  },
  
  metadata: {
    title: "Climate Change: Understanding the Global Challenge",
    author: "Dr. Sarah Johnson",
    publicationDate: new Date("2024-01-15"),
    sourceUrl: "https://example.com/climate-change-article",
    domain: "example.com",
    description: "An comprehensive overview of climate change, its causes, effects, and potential solutions.",
    keywords: ["climate change", "global warming", "greenhouse effect", "sustainability", "environment"],
    language: "en",
    contentType: "article",
    estimatedReadingTime: 2
  },
  
  quality: {
    wordCount: 245,
    readingTime: 2,
    complexity: 'intermediate' as const,
    suitabilityScore: 0.92,
    issues: [],
    meetsMinimumStandards: true,
    readabilityScore: 0.85,
    vocabularyComplexity: 0.7,
    sentenceComplexity: 0.6
  },
  
  sourceInfo: {
    url: "https://example.com/climate-change-article",
    domain: "example.com",
    title: "Climate Change: Understanding the Global Challenge",
    extractedAt: new Date(),
    userAgent: "LinguaSpark Extension 1.0",
    attribution: "Source: Climate Change: Understanding the Global Challenge - example.com"
  },
  
  suggestedLessonType: 'discussion' as LessonType,
  suggestedCEFRLevel: 'B2' as CEFRLevel
};

export function ExtractionConfirmationDemo() {
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{
    content: ExtractedContent;
    lessonType: LessonType;
    cefrLevel: CEFRLevel;
  } | null>(null);

  const { showConfirmationDialog } = useExtractionConfirmation({
    onConfirm: async (content, lessonType, cefrLevel) => {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setResult({ content, lessonType, cefrLevel });
      setShowResult(true);
      
      console.log('Confirmation completed:', {
        contentLength: content.text.length,
        lessonType,
        cefrLevel,
        title: content.metadata.title
      });
    },
    
    onCancel: () => {
      console.log('Extraction cancelled');
      setShowResult(false);
      setResult(null);
    },
    
    onContentEdit: (editedContent) => {
      console.log('Content edited, new length:', editedContent.length);
    },
    
    onLessonTypeChange: (lessonType) => {
      console.log('Lesson type changed to:', lessonType);
    },
    
    onCEFRLevelChange: (cefrLevel) => {
      console.log('CEFR level changed to:', cefrLevel);
    }
  });

  const handleShowDialog = async () => {
    setShowResult(false);
    setResult(null);
    await showConfirmationDialog(mockExtractedContent);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Extraction Confirmation Dialog Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            This demo shows the extraction confirmation dialog with mock content.
            Click the button below to see how the dialog works.
          </p>
          
          <Button onClick={handleShowDialog} size="lg">
            Show Confirmation Dialog
          </Button>
          
          {showResult && result && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg text-green-600">
                  ✅ Confirmation Completed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <strong>Selected Lesson Type:</strong> {result.lessonType}
                </div>
                <div>
                  <strong>Selected CEFR Level:</strong> {result.cefrLevel}
                </div>
                <div>
                  <strong>Content Length:</strong> {result.content.text.length} characters
                </div>
                <div>
                  <strong>Title:</strong> {result.content.metadata.title}
                </div>
                <div>
                  <strong>Word Count:</strong> {result.content.quality.wordCount} words
                </div>
                <div>
                  <strong>Suitability Score:</strong> {Math.round(result.content.quality.suitabilityScore * 100)}%
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
      
      <ExtractionConfirmationDialog />
    </div>
  );
}