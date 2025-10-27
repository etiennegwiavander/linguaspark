import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { PublicLessonCard } from "@/components/public-lesson-card";
import { PublicLesson } from "@/lib/types/public-lessons";

// Mock Next.js components
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

// Mock lesson data
const mockLesson: PublicLesson = {
  id: "test-lesson-1",
  created_at: "2025-01-15T10:00:00Z",
  updated_at: "2025-01-15T10:00:00Z",
  creator_id: "creator-1",
  title: "Business English: Effective Email Communication",
  content: {
    title: "Business English: Effective Email Communication",
    warmup: {
      questions: [
        "How often do you write emails in English?",
        "What challenges do you face when writing professional emails?",
      ],
    },
    reading: {
      passage:
        "Email communication is a crucial skill in the modern business world. Professional emails should be clear, concise, and courteous. They typically include a greeting, a clear purpose statement, the main message, and a polite closing.",
      comprehension_questions: [
        "What are the key characteristics of professional emails?",
      ],
    },
    discussion: {
      topics: ["Email etiquette in different cultures"],
      questions: ["How do email conventions differ across cultures?"],
    },
    wrapup: {
      summary: "Today we learned about effective email communication.",
    },
    metadata: {
      cefr_level: "B2",
      lesson_type: "business",
    },
  },
  source_url: "https://example.com/article",
  source_title: "Email Best Practices",
  banner_image_url: "https://example.com/banner.jpg",
  category: "business",
  cefr_level: "B2",
  lesson_type: "business",
  tags: ["email", "communication", "professional"],
  estimated_duration_minutes: 45,
};

const mockLessonWithoutImage: PublicLesson = {
  ...mockLesson,
  id: "test-lesson-2",
  banner_image_url: null,
  estimated_duration_minutes: null,
  tags: [],
};

const mockLessonWithManyTags: PublicLesson = {
  ...mockLesson,
  id: "test-lesson-3",
  tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
};

describe("PublicLessonCard", () => {
  test("renders lesson title correctly", () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    expect(
      screen.getByText("Business English: Effective Email Communication")
    ).toBeInTheDocument();
  });

  test("displays banner image when available", () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    const image = screen.getByAltText(
      "Business English: Effective Email Communication"
    );
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/banner.jpg");
  });

  test("does not display banner image when not available", () => {
    render(<PublicLessonCard lesson={mockLessonWithoutImage} />);
    const images = screen.queryAllByRole("img");
    expect(images).toHaveLength(0);
  });

  test("displays category badge with formatted text", () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    // Business appears twice (category and lesson type), so use getAllByText
    const businessBadges = screen.getAllByText("Business");
    expect(businessBadges.length).toBeGreaterThanOrEqual(1);
  });

  test("formats multi-word categories correctly", () => {
    const lessonWithMultiWordCategory: PublicLesson = {
      ...mockLesson,
      category: "general-english",
    };
    render(<PublicLessonCard lesson={lessonWithMultiWordCategory} />);
    expect(screen.getByText("General English")).toBeInTheDocument();
  });

  test("displays CEFR level badge", () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    expect(screen.getByText("B2")).toBeInTheDocument();
  });

  test("displays lesson type badge with formatted text", () => {
    const lessonWithDiscussion: PublicLesson = {
      ...mockLesson,
      lesson_type: "discussion",
      category: "conversation",
    };
    render(<PublicLessonCard lesson={lessonWithDiscussion} />);
    expect(screen.getByText("Discussion")).toBeInTheDocument();
    expect(screen.getByText("Conversation")).toBeInTheDocument();
  });

  test("displays estimated duration when available", () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    expect(screen.getByText("45 min")).toBeInTheDocument();
  });

  test("does not display duration when not available", () => {
    render(<PublicLessonCard lesson={mockLessonWithoutImage} />);
    expect(screen.queryByText(/min$/)).not.toBeInTheDocument();
  });

  test("displays creation date in formatted form", () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    // Date should be formatted as "Jan 15, 2025" or similar
    expect(screen.getByText(/Jan 15, 2025/)).toBeInTheDocument();
  });

  test("displays tags when available", () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    expect(screen.getByText("email")).toBeInTheDocument();
    expect(screen.getByText("communication")).toBeInTheDocument();
    expect(screen.getByText("professional")).toBeInTheDocument();
  });

  test("limits tag display to 3 tags with overflow indicator", () => {
    render(<PublicLessonCard lesson={mockLessonWithManyTags} />);
    expect(screen.getByText("tag1")).toBeInTheDocument();
    expect(screen.getByText("tag2")).toBeInTheDocument();
    expect(screen.getByText("tag3")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.queryByText("tag4")).not.toBeInTheDocument();
  });

  test("does not display tags section when no tags available", () => {
    render(<PublicLessonCard lesson={mockLessonWithoutImage} />);
    // Should not have any tag badges (check for absence of CardFooter with tags)
    expect(screen.queryByText("email")).not.toBeInTheDocument();
    expect(screen.queryByText("communication")).not.toBeInTheDocument();
    expect(screen.queryByText("professional")).not.toBeInTheDocument();
  });

  test("shows excerpt on hover", () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    const card = screen.getByRole("link");

    // Find the excerpt container
    const excerptContainer = card.querySelector(".text-sm.text-muted-foreground");
    expect(excerptContainer).toBeTruthy();

    // Initially should have opacity-0
    expect(excerptContainer?.className).toContain("opacity-0");

    // Hover over the card (hover on the Card component, not the link)
    const cardElement = card.querySelector('[data-slot="card"]');
    if (cardElement) {
      fireEvent.mouseEnter(cardElement);
    }

    // After hover, should have opacity-100
    expect(excerptContainer?.className).toContain("opacity-100");
    expect(excerptContainer?.textContent).toContain(
      "Email communication is a crucial skill"
    );
  });

  test("hides excerpt when not hovering", () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    const card = screen.getByRole("link");

    // Hover and then unhover
    fireEvent.mouseEnter(card);
    fireEvent.mouseLeave(card);

    // Excerpt should be hidden again
    const hiddenExcerpt = card.querySelector(".opacity-0");
    expect(hiddenExcerpt).toBeInTheDocument();
  });

  test("generates excerpt from reading passage when available", () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    const card = screen.getByRole("link");
    fireEvent.mouseEnter(card);

    expect(card.textContent).toContain(
      "Email communication is a crucial skill"
    );
  });

  test("falls back to warmup questions for excerpt when no reading passage", () => {
    const lessonWithoutReading: PublicLesson = {
      ...mockLesson,
      content: {
        ...mockLesson.content,
        reading: undefined,
      },
    };
    render(<PublicLessonCard lesson={lessonWithoutReading} />);
    const card = screen.getByRole("link");
    fireEvent.mouseEnter(card);

    expect(card.textContent).toContain(
      "How often do you write emails in English?"
    );
  });

  test("falls back to discussion topics when no reading or warmup", () => {
    const lessonWithDiscussionOnly: PublicLesson = {
      ...mockLesson,
      content: {
        ...mockLesson.content,
        reading: undefined,
        warmup: { questions: [] },
      },
    };
    render(<PublicLessonCard lesson={lessonWithDiscussionOnly} />);
    const card = screen.getByRole("link");
    fireEvent.mouseEnter(card);

    expect(card.textContent).toContain(
      "Email etiquette in different cultures"
    );
  });

  test("truncates long excerpts with ellipsis", () => {
    const longPassage = "a".repeat(200);
    const lessonWithLongPassage: PublicLesson = {
      ...mockLesson,
      content: {
        ...mockLesson.content,
        reading: {
          passage: longPassage,
        },
      },
    };
    render(<PublicLessonCard lesson={lessonWithLongPassage} />);
    const card = screen.getByRole("link");
    fireEvent.mouseEnter(card);

    // Check that the excerpt div contains the truncated text with ellipsis
    const excerptDiv = card.querySelector(".line-clamp-3");
    expect(excerptDiv?.textContent).toContain("...");
    // The excerpt should be 150 chars + "..." = 153 chars
    expect(excerptDiv?.textContent?.length).toBeLessThanOrEqual(160);
  });

  test("card is clickable and links to correct lesson view", () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/library/test-lesson-1");
  });

  test("applies hover styles on mouse enter", () => {
    render(<PublicLessonCard lesson={mockLesson} />);
    const card = screen.getByRole("link").firstChild as HTMLElement;

    fireEvent.mouseEnter(card);

    // Check that hover classes are applied
    expect(card.className).toContain("hover:shadow-lg");
    expect(card.className).toContain("hover:scale-");
  });

  test("renders all required metadata elements", () => {
    render(<PublicLessonCard lesson={mockLesson} />);

    // Title
    expect(
      screen.getByText("Business English: Effective Email Communication")
    ).toBeInTheDocument();

    // Category badge (Business appears twice - category and lesson type)
    const businessBadges = screen.getAllByText("Business");
    expect(businessBadges.length).toBeGreaterThanOrEqual(1);

    // CEFR level badge
    expect(screen.getByText("B2")).toBeInTheDocument();

    // Duration
    expect(screen.getByText("45 min")).toBeInTheDocument();

    // Date
    expect(screen.getByText(/Jan 15, 2025/)).toBeInTheDocument();
  });

  test("handles different CEFR levels correctly", () => {
    const levels: Array<"A1" | "A2" | "B1" | "B2" | "C1"> = [
      "A1",
      "A2",
      "B1",
      "B2",
      "C1",
    ];

    levels.forEach((level) => {
      const lessonWithLevel: PublicLesson = {
        ...mockLesson,
        cefr_level: level,
      };
      const { unmount } = render(<PublicLessonCard lesson={lessonWithLevel} />);
      expect(screen.getByText(level)).toBeInTheDocument();
      unmount();
    });
  });

  test("handles different lesson types correctly", () => {
    const types: Array<"discussion" | "grammar" | "travel" | "business" | "pronunciation"> = [
      "discussion",
      "grammar",
      "travel",
      "business",
      "pronunciation",
    ];

    types.forEach((type) => {
      const lessonWithType: PublicLesson = {
        ...mockLesson,
        lesson_type: type,
        category: "conversation", // Use different category to avoid duplicates
      };
      const { unmount } = render(<PublicLessonCard lesson={lessonWithType} />);
      const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
      expect(screen.getByText(formattedType)).toBeInTheDocument();
      unmount();
    });
  });

  test("handles different categories correctly", () => {
    const categories = [
      { value: "general-english", display: "General English" },
      { value: "business", display: "Business" },
      { value: "travel", display: "Travel" },
      { value: "academic", display: "Academic" },
      { value: "conversation", display: "Conversation" },
    ];

    categories.forEach(({ value, display }) => {
      const lessonWithCategory: PublicLesson = {
        ...mockLesson,
        category: value as any,
        lesson_type: "grammar", // Use different lesson type to avoid duplicates
      };
      const { unmount } = render(
        <PublicLessonCard lesson={lessonWithCategory} />
      );
      expect(screen.getByText(display)).toBeInTheDocument();
      unmount();
    });
  });
});
