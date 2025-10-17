/**
 * Enhanced Lesson Generator
 * 
 * Extended version of the lesson generator that can detect and handle extracted content.
 * Integrates with the lesson interface bridge for seamless extraction workflow.
 * 
 * Requirements: 4.2, 4.3, 4.4, 4.5, 6.6
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Info, Sparkles, Globe } from "lucide-react";
import LessonGenerator from "./lesson-generator";
import { useLessonInterfaceBridge } from "@/hooks/use-lesson-interface-bridge";
import { LessonInterfaceUtils } from "@/lib/lesson-interface-bridge";
import type { LessonPreConfiguration } from "@/lib/lesson-interface-bridge";

interface EnhancedLessonGeneratorProps {
  onLessonGenerated: (lesson: any) => void;
  onExtractFromPage: () => void;
}

export default function EnhancedLessonGenerator({
  onLessonGenerated,
  onExtractFromPage,
}: EnhancedLessonGeneratorProps) {
  const [isExtractionSource, setIsExtractionSource] = useState(false);
  const [extractionConfig, setExtractionConfig] = useState<LessonPreConfiguration | null>(null);
  const [showExtractionInfo, setShowExtractionInfo] = useState(false);

  const {
    currentConfiguration,
    isLoading,
    error,
    loadConfiguration,
    clearConfiguration,
    isExtractionSource: checkExtractionSource
  } = useLessonInterfaceBridge({
    autoLoadConfiguration: true,
    onError: (error) => {
      console.error('Lesson interface bridge error:', error);
    }
  });

  // Check if this is an extraction-based lesson generation
  useEffect(() => {
    const checkSource = async () => {
      try {
        // Check URL parameters first
        const isExtractionInterface = await LessonInterfaceUtils.isExtractionLessonInterface();
        
        if (isExtractionInterface) {
          setIsExtractionSource(true);
          setShowExtractionInfo(true);
          
          // Load configuration
          const config = await loadConfiguration();
          if (config) {
            setExtractionConfig(config);
          }
        } else {
          // Check storage for extraction source
          const hasExtractionSource = await checkExtractionSource();
          if (hasExtractionSource) {
            setIsExtractionSource(true);
            const config = await loadConfiguration();
            if (config) {
              setExtractionConfig(config);
              setShowExtractionInfo(true);
            }
          }
        }
      } catch (error) {
        console.error('Failed to check extraction source:', error);
      }
    };

    checkSource();
  }, [loadConfiguration, checkExtractionSource]);

  // Handle clearing extraction data
  const handleClearExtraction = async () => {
    try {
      await clearConfiguration();
      setIsExtractionSource(false);
      setExtractionConfig(null);
      setShowExtractionInfo(false);
      
      // Reload page to reset state
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to clear extraction data:', error);
    }
  };

  // Get initial values for lesson generator
  const getInitialValues = () => {
    if (extractionConfig) {
      return {
        initialText: extractionConfig.sourceContent,
        sourceUrl: extractionConfig.metadata.sourceUrl,
        initialLessonType: extractionConfig.suggestedType,
        initialStudentLevel: extractionConfig.suggestedLevel,
        extractionMetadata: extractionConfig.metadata,
        attribution: extractionConfig.attribution
      };
    }
    return {};
  };

  const formatMetadataDisplay = (config: LessonPreConfiguration): string => {
    return LessonInterfaceUtils.createMetadataDisplay(config.metadata);
  };

  const formatAttribution = (attribution: string): string => {
    return LessonInterfaceUtils.formatAttribution(attribution);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="h-4 w-4 animate-pulse text-primary" />
              <span className="text-sm">Loading extraction data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load extraction data: {error}
          </AlertDescription>
        </Alert>
        <LessonGenerator
          onLessonGenerated={onLessonGenerated}
          onExtractFromPage={onExtractFromPage}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Extraction Information Card */}
      {showExtractionInfo && extractionConfig && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              Content Extracted from Web
              <Badge variant="secondary" className="text-xs">
                Auto-populated
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              This lesson is being generated from content extracted from a webpage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Source Information */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Source</span>
                <a
                  href={extractionConfig.metadata.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {extractionConfig.metadata.domain}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              
              <div className="text-xs text-gray-600">
                {formatMetadataDisplay(extractionConfig)}
              </div>
              
              {extractionConfig.metadata.title && (
                <div className="text-sm font-medium text-gray-900">
                  "{extractionConfig.metadata.title}"
                </div>
              )}
            </div>

            <Separator />

            {/* AI Suggestions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-gray-600">AI Suggested Type</span>
                <div className="text-sm font-medium capitalize">
                  {extractionConfig.suggestedType}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-600">AI Suggested Level</span>
                <div className="text-sm font-medium">
                  {extractionConfig.suggestedLevel}
                </div>
              </div>
            </div>

            <Separator />

            {/* Content Quality */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Content Quality</span>
              <Badge variant="outline" className="text-xs">
                {Math.round(extractionConfig.metadata.suitabilityScore * 100)}% suitable
              </Badge>
            </div>

            {/* Attribution */}
            <div className="text-xs text-gray-500 italic">
              {formatAttribution(extractionConfig.attribution)}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExtractionInfo(false)}
                className="text-xs h-7"
              >
                <Info className="h-3 w-3 mr-1" />
                Hide Details
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearExtraction}
                className="text-xs h-7"
              >
                Clear & Start Fresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Lesson Generator */}
      <EnhancedLessonGeneratorCore
        {...getInitialValues()}
        onLessonGenerated={onLessonGenerated}
        onExtractFromPage={onExtractFromPage}
        isExtractionSource={isExtractionSource}
        extractionConfig={extractionConfig}
      />
    </div>
  );
}

/**
 * Core lesson generator with extraction enhancements
 */
interface EnhancedLessonGeneratorCoreProps {
  initialText?: string;
  sourceUrl?: string;
  initialLessonType?: string;
  initialStudentLevel?: string;
  extractionMetadata?: any;
  attribution?: string;
  onLessonGenerated: (lesson: any) => void;
  onExtractFromPage: () => void;
  isExtractionSource?: boolean;
  extractionConfig?: LessonPreConfiguration | null;
}

function EnhancedLessonGeneratorCore({
  initialText = "",
  sourceUrl = "",
  initialLessonType = "",
  initialStudentLevel = "",
  extractionMetadata,
  attribution,
  onLessonGenerated,
  onExtractFromPage,
  isExtractionSource = false,
  extractionConfig
}: EnhancedLessonGeneratorCoreProps) {
  const [hasAppliedInitialValues, setHasAppliedInitialValues] = useState(false);

  // Enhanced lesson generation handler
  const handleLessonGenerated = (lesson: any) => {
    // Add extraction metadata to the lesson if available
    if (isExtractionSource && extractionConfig) {
      const enhancedLesson = {
        ...lesson,
        extractionSource: {
          url: extractionConfig.metadata.sourceUrl,
          domain: extractionConfig.metadata.domain,
          title: extractionConfig.metadata.title,
          author: extractionConfig.metadata.author,
          extractedAt: extractionConfig.metadata.extractedAt,
          attribution: extractionConfig.attribution
        },
        contentMetadata: {
          wordCount: extractionConfig.metadata.wordCount,
          readingTime: extractionConfig.metadata.readingTime,
          complexity: extractionConfig.metadata.complexity,
          suitabilityScore: extractionConfig.metadata.suitabilityScore
        }
      };
      
      onLessonGenerated(enhancedLesson);
    } else {
      onLessonGenerated(lesson);
    }
  };

  // Use the original LessonGenerator with enhanced props
  return (
    <LessonGeneratorWithInitialValues
      initialText={initialText}
      sourceUrl={sourceUrl}
      initialLessonType={initialLessonType}
      initialStudentLevel={initialStudentLevel}
      onLessonGenerated={handleLessonGenerated}
      onExtractFromPage={onExtractFromPage}
      extractionMetadata={extractionMetadata}
      attribution={attribution}
    />
  );
}

/**
 * Wrapper around original LessonGenerator that applies initial values
 */
interface LessonGeneratorWithInitialValuesProps {
  initialText: string;
  sourceUrl: string;
  initialLessonType: string;
  initialStudentLevel: string;
  extractionMetadata?: any;
  attribution?: string;
  onLessonGenerated: (lesson: any) => void;
  onExtractFromPage: () => void;
}

function LessonGeneratorWithInitialValues({
  initialText,
  sourceUrl,
  initialLessonType,
  initialStudentLevel,
  extractionMetadata,
  attribution,
  onLessonGenerated,
  onExtractFromPage
}: LessonGeneratorWithInitialValuesProps) {
  // Store extraction metadata in Chrome storage for the lesson generator to use
  useEffect(() => {
    if (extractionMetadata && typeof window !== 'undefined' && window.chrome?.storage) {
      window.chrome.storage.local.set({
        extractionMetadata,
        attribution,
        lessonType: initialLessonType,
        studentLevel: initialStudentLevel
      });
    }
  }, [extractionMetadata, attribution, initialLessonType, initialStudentLevel]);

  return (
    <LessonGenerator
      initialText={initialText}
      sourceUrl={sourceUrl}
      onLessonGenerated={onLessonGenerated}
      onExtractFromPage={onExtractFromPage}
    />
  );
}