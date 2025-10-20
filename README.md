# LinguaSpark Chrome Extension

Transform any webpage into interactive language lesson material with AI-powered generation and professional export capabilities.

## Features

### 🎯 Core Functionality

- **Content Extraction**: Extract text from any webpage or selected content
- **AI-Powered Generation**: Uses Google AI APIs for intelligent lesson creation
- **Multi-Level Support**: Supports CEFR levels A1-C1
- **Multiple Lesson Types**: Discussion, Grammar, Travel, Business, and Pronunciation lessons
- **Professional Export**: Export lessons as PDF or Word documents

### 🤖 AI Pipeline

- **Summarizer API**: Extracts key points from source content
- **Translator API**: Translates content to target language
- **Prompt API**: Generates structured lesson frameworks
- **Writer API**: Creates detailed exercises and content
- **Rewriter API**: Adapts content complexity for student levels
- **Proofreader API**: Ensures grammar and style quality

### 🔐 Backend Integration

- **Supabase Authentication**: Secure tutor accounts
- **Lesson Storage**: Save and manage generated lessons
- **Student Management**: Track student progress and preferences
- **Export Tracking**: Monitor lesson usage and exports

### 📱 Extension Features

- **Chrome Extension**: Manifest v3 compatible
- **Context Menu**: Right-click to generate lessons from selected text
- **Popup Interface**: Clean, intuitive lesson generation UI
- **Real-time Progress**: Accurate progress tracking with callback-based updates
- **Professional Exports**: Clean Word and PDF exports with automatic markdown stripping

## Installation

### Prerequisites

- Node.js 18+ and npm
- Chrome browser for extension testing
- Supabase account for backend services
- Google Cloud account for AI APIs

### Setup Steps

1. **Clone and Install**
   \`\`\`bash
   git clone <repository-url>
   cd linguaspark-extension
   npm install
   \`\`\`

2. **Environment Variables**
   Create a `.env.local` file:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_google_ai_api_key
   NEXT_PUBLIC_GOOGLE_AI_BASE_URL=https://generativelanguage.googleapis.com
   NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
   \`\`\`

3. **Database Setup**
   Run the SQL scripts in the `scripts/` folder in your Supabase SQL editor:
   \`\`\`sql
   -- Run scripts/001_create_tables.sql
   \`\`\`

4. **Build Extension**
   \`\`\`bash
   npm run build
   \`\`\`

5. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## Usage

### For Tutors

1. **Authentication**

   - Sign up or sign in through the extension popup
   - Your lessons are automatically saved to your account

2. **Generate Lessons**

   - Navigate to any webpage with educational content
   - Click the LinguaSpark extension icon
   - Select lesson type, student level, and target language
   - Click "Generate AI Lesson"

3. **Customize Lessons**

   - Toggle lesson sections on/off
   - Review and modify generated content
   - Export as PDF or Word document

4. **Context Menu**
   - Select text on any webpage
   - Right-click and choose "Generate Lesson from Selection"

### Lesson Types

- **Discussion**: Conversation-focused lessons with open-ended questions
- **Grammar**: Structured grammar lessons with examples and exercises
- **Travel & Tourism**: Vocabulary and scenarios for travel situations
- **Business**: Professional communication and business English
- **Pronunciation**: Phonetic practice with IPA notation

### CEFR Levels

- **A1 (Beginner)**: Basic words and phrases
- **A2 (Elementary)**: Simple conversations
- **B1 (Intermediate)**: Familiar topics
- **B2 (Upper Intermediate)**: Complex topics
- **C1 (Advanced)**: Fluent expression

## Technical Architecture

### Frontend

- **Next.js 14**: React framework with App Router
- **Tailwind CSS**: Utility-first styling
- **Shadcn UI**: Component library
- **TypeScript**: Type-safe development

### Backend

- **Supabase**: Authentication, database, and storage
- **Row Level Security**: Data protection and privacy
- **PostgreSQL**: Relational database with JSONB support

### AI Integration

- **Google AI APIs**: Complete pipeline for content processing
- **Fallback System**: Template-based generation when APIs fail
- **Error Handling**: Graceful degradation and user feedback

### Export System

- **jsPDF**: Client-side PDF generation
- **docx**: Professional Word document creation
- **Custom Formatting**: Engoo-style lesson layouts
- **Markdown Stripping**: Automatic removal of markdown syntax for clean exports
- **Format Consistency**: Identical output quality across PDF and Word formats

## Development

### Project Structure

\`\`\`
├── app/ # Next.js app directory
│   └── api/ # API routes
├── components/ # React components
├── lib/ # Utility libraries
│   ├── progressive-generator.ts # AI generation with progress callbacks
│   └── export-utils.ts # Export utilities with markdown stripping
├── .kiro/specs/ # Feature specifications and documentation
├── scripts/ # Database scripts
├── public/ # Static assets
├── manifest.json # Chrome extension manifest
├── background.js # Extension background script
└── content.js # Extension content script
\`\`\`

### Key Components

- `lesson-generator.tsx`: AI-powered lesson generation interface
- `lesson-display.tsx`: Interactive lesson viewer with export
- `auth-wrapper.tsx`: Authentication and user management
- `export-utils.ts`: PDF and Word export functionality

### API Routes

- `/api/generate-lesson`: AI lesson generation endpoint
- `/api/generate-lesson-stream`: Streaming generation with real-time progress
- `/api/export-lesson`: Export tracking and preparation

### Feature Documentation

Detailed documentation for major features is available in `.kiro/specs/`:

- [Progress and Export Improvements](.kiro/specs/progress-and-export-improvements/README.md) - Real-time progress tracking and markdown stripping
- [AI-Only Lesson Generation](.kiro/specs/ai-only-lesson-generation/) - Pure AI generation without fallbacks
- [Extract From Page Button](.kiro/specs/extract-from-page-button/) - Content extraction UI
- [Lesson Typography Enhancement](.kiro/specs/lesson-typography-enhancement/) - Typography and styling improvements

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Open an issue on GitHub
- Contact the development team
- Check the documentation wiki

---

**LinguaSpark** - Transforming web content into engaging language lessons with the power of AI.
