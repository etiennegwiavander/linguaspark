'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { PublicLessonFilters, LessonCategory, CEFRLevel, LessonType } from '@/lib/types/public-lessons';

interface PublicLibraryFiltersProps {
  onFilterChange: (filters: PublicLessonFilters) => void;
  initialFilters?: PublicLessonFilters;
}

// Category options with display labels
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

// CEFR level options
const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

// Lesson type options with display labels
const LESSON_TYPE_OPTIONS: { value: LessonType; label: string }[] = [
  { value: 'discussion', label: 'Discussion' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'travel', label: 'Travel' },
  { value: 'business', label: 'Business' },
  { value: 'pronunciation', label: 'Pronunciation' },
];

export function PublicLibraryFilters({ onFilterChange, initialFilters = {} }: PublicLibraryFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<LessonCategory | undefined>(initialFilters.category);
  const [selectedCEFRLevel, setSelectedCEFRLevel] = useState<CEFRLevel | undefined>(initialFilters.cefr_level);
  const [selectedLessonTypes, setSelectedLessonTypes] = useState<Set<LessonType>>(
    new Set(initialFilters.lesson_type ? [initialFilters.lesson_type] : [])
  );

  // Calculate active filter count
  const activeFilterCount = 
    (selectedCategory ? 1 : 0) + 
    (selectedCEFRLevel ? 1 : 0) + 
    selectedLessonTypes.size;

  // Emit filter changes to parent
  useEffect(() => {
    const filters: PublicLessonFilters = {};
    
    if (selectedCategory) {
      filters.category = selectedCategory;
    }
    
    if (selectedCEFRLevel) {
      filters.cefr_level = selectedCEFRLevel;
    }
    
    // For lesson types, we'll emit the first selected one
    // (API currently supports single lesson_type filter)
    if (selectedLessonTypes.size > 0) {
      filters.lesson_type = Array.from(selectedLessonTypes)[0];
    }
    
    onFilterChange(filters);
  }, [selectedCategory, selectedCEFRLevel, selectedLessonTypes, onFilterChange]);

  // Handle category checkbox toggle
  const handleCategoryToggle = (category: LessonCategory) => {
    setSelectedCategory(selectedCategory === category ? undefined : category);
  };

  // Handle CEFR level radio selection
  const handleCEFRLevelChange = (level: string) => {
    setSelectedCEFRLevel(level as CEFRLevel);
  };

  // Handle lesson type checkbox toggle
  const handleLessonTypeToggle = (lessonType: LessonType) => {
    const newTypes = new Set(selectedLessonTypes);
    if (newTypes.has(lessonType)) {
      newTypes.delete(lessonType);
    } else {
      newTypes.add(lessonType);
    }
    setSelectedLessonTypes(newTypes);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedCEFRLevel(undefined);
    setSelectedLessonTypes(new Set());
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card">
      {/* Header with active filter count */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {activeFilterCount} active
          </Badge>
        )}
      </div>

      {/* Category Filters */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Category</h4>
        <div className="space-y-2">
          {CATEGORY_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${option.value}`}
                checked={selectedCategory === option.value}
                onCheckedChange={() => handleCategoryToggle(option.value)}
              />
              <Label
                htmlFor={`category-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* CEFR Level Filters */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">CEFR Level</h4>
        <RadioGroup value={selectedCEFRLevel || ''} onValueChange={handleCEFRLevelChange}>
          <div className="space-y-2">
            {CEFR_LEVELS.map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <RadioGroupItem value={level} id={`cefr-${level}`} />
                <Label
                  htmlFor={`cefr-${level}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {level}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
        {selectedCEFRLevel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCEFRLevel(undefined)}
            className="text-xs"
          >
            Clear level
          </Button>
        )}
      </div>

      {/* Lesson Type Filters */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Lesson Type</h4>
        <div className="space-y-2">
          {LESSON_TYPE_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${option.value}`}
                checked={selectedLessonTypes.has(option.value)}
                onCheckedChange={() => handleLessonTypeToggle(option.value)}
              />
              <Label
                htmlFor={`type-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Filters Button */}
      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          onClick={handleClearFilters}
          className="w-full"
        >
          <X className="mr-2 h-4 w-4" />
          Clear all filters
        </Button>
      )}
    </div>
  );
}
