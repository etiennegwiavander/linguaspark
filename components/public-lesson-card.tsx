"use client";

import React, { useState } from "react";
import { PublicLesson } from "@/lib/types/public-lessons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PublicLessonCardProps {
  lesson: PublicLesson;
}

// Helper function to format category for display
function formatCategory(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper function to format lesson type for display
function formatLessonType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper function to get excerpt from lesson content
function getExcerpt(lesson: PublicLesson): string {
  // Try to get excerpt from reading passage first
  if (lesson.content.reading?.passage) {
    const passage = lesson.content.reading.passage;
    return passage.length > 150 ? passage.substring(0, 150) + "..." : passage;
  }
  
  // Fall back to warmup questions
  if (lesson.content.warmup?.questions && lesson.content.warmup.questions.length > 0) {
    return lesson.content.warmup.questions[0];
  }
  
  // Fall back to discussion topics
  if (lesson.content.discussion?.topics && lesson.content.discussion.topics.length > 0) {
    return lesson.content.discussion.topics[0];
  }
  
  return "Click to view lesson details";
}

export function PublicLessonCard({ lesson }: PublicLessonCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const excerpt = getExcerpt(lesson);

  return (
    <Link href={`/library/${lesson.id}`} className="block">
      <Card
        className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Banner Image */}
        {lesson.banner_image_url && (
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
            <Image
              src={lesson.banner_image_url}
              alt={lesson.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        <CardHeader className="space-y-2">
          {/* Title */}
          <h3 className="text-xl font-semibold line-clamp-2 min-h-[3.5rem]">
            {lesson.title}
          </h3>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {/* Category Badge */}
            <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
              {formatCategory(lesson.category)}
            </Badge>

            {/* CEFR Level Badge */}
            <Badge variant="secondary" className="bg-green-600 hover:bg-green-700 text-white">
              {lesson.cefr_level}
            </Badge>

            {/* Lesson Type Badge */}
            <Badge variant="outline" className="border-purple-600 text-purple-600">
              {formatLessonType(lesson.lesson_type)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Hover Preview/Excerpt */}
          <div
            className={`text-sm text-muted-foreground transition-all duration-200 ${
              isHovered ? "opacity-100 max-h-20" : "opacity-0 max-h-0"
            } overflow-hidden`}
          >
            <p className="line-clamp-3">{excerpt}</p>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            {/* Estimated Duration */}
            {lesson.estimated_duration_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{lesson.estimated_duration_minutes} min</span>
              </div>
            )}

            {/* Creation Date */}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(lesson.created_at)}</span>
            </div>
          </div>
        </CardContent>

        {/* Tags (if available) */}
        {lesson.tags && lesson.tags.length > 0 && (
          <CardFooter className="pt-0">
            <div className="flex flex-wrap gap-1">
              {lesson.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {lesson.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{lesson.tags.length - 3}
                </Badge>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
