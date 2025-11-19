# LinguaSpark - AI-Powered Language Lesson Platform

> **Admin-Only Lesson Creation | Free Public Access**

Transform web content into professional language lessons with AI. Admins create and curate lessons, while anyone can browse, view, and export them for free.

## 🎯 Platform Overview

### For Public Users (No Signup Required)
- **Browse Free Lessons**: Access 150+ professional language lessons
- **Export Instantly**: Download as PDF, Word, or HTML
- **Use in Classroom**: No restrictions, no fees, no signup
- **CEFR Levels**: A1 to C1 lessons available
- **Multiple Categories**: Grammar, Discussion, Travel, Business, Pronunciation

### For Administrators
- **Chrome Extension**: Extract content from any webpage
- **AI-Powered Generation**: Create lessons using advanced AI
- **Personal Library**: Private workspace for drafts
- **Public Library Management**: Curate and publish lessons
- **Admin Dashboard**: Statistics and management tools

---

## 🚀 Quick Start

### Public Users
1. Visit the website
2. Browse `/library` for free lessons
3. Click any lesson to view
4. Export as PDF, Word, or HTML
5. Use in your classroom

**No signup required!**

### Administrators
1. Login at `/auth/admin/login`
2. Access Chrome extension at `/popup`
3. Extract content from webpages
4. Generate AI-powered lessons
5. Save to personal or public library

---

## 🏗️ Architecture

### Platform Type
**Admin-Only Creation + Public Access**

- Admins create and manage lessons
- Public browses and exports for free
- No user registration system
- No payment processing

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript (Strict Mode)
- Tailwind CSS
- Shadcn UI Components

**Backend:**
- Supabase (PostgreSQL + Auth)
- OpenRouter API (DeepSeek V3)
- Row Level Security (RLS)

**Chrome Extension:**
- Manifest v3
- Content Scripts
- Background Service Worker

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- Chrome browser
- Supabase account
- OpenRouter API key

### Environment Setup

1. **Clone Repository**
```bash
git clone <repository-url>
cd linguaspark
npm install
```

2. **Configure Environment**
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_openrouter_api_key
NEXT_PUBLIC_GOOGLE_AI_BASE_URL=https://openrouter.ai/api/v1
```

3. **Setup Database**
```bash
# Run migrations in Supabase SQL editor
# See scripts/006_create_public_lessons.sql
```

4. **Create Admin User**
```bash
# Run in Supabase SQL editor
# See scripts/008_set_admin_flag.sql
```

5. **Start Development Server**
```bash
npm run dev
```

6. **Load Chrome Extension**
- Open Chrome → Extensions → Developer Mode
- Click "Load unpacked"
- Select project directory
- Extension icon appears in toolbar

---

## 🔐 Admin Setup

### Creating Admin Users

1. **User Signs Up** (via Supabase Auth)
2. **Set Admin Flag** (in database):
```sql
UPDATE tutors 
SET is_admin = true 
WHERE email = 'admin@example.com';
```

3. **Admin Can Now:**
- Access `/popup` (Chrome extension)
- Save to personal library
- Publish to public library
- View admin dashboard
- Manage public lessons

### Admin Permissions
- Create lessons via extension
- Save to personal library (private)
- Publish to public library (visible to all)
- Delete own lessons
- View statistics

---

## 📚 Features

### AI Lesson Generation
- **Content Extraction**: Extract from any webpage
- **Smart Summarization**: AI identifies key points
- **CEFR Adaptation**: Adjusts complexity for level
- **Multiple Types**: Grammar, Discussion, Travel, etc.
- **Vocabulary Extraction**: Contextual word selection
- **Exercise Generation**: Comprehension, discussion, grammar

### Export Formats
- **PDF**: Professional layout, print-ready
- **Word**: Editable .docx format
- **HTML**: Standalone web page

### Lesson Components
- Warmup questions
- Vocabulary with definitions
- Reading passage
- Comprehension questions
- Discussion prompts
- Grammar focus
- Pronunciation guide
- Wrap-up activities

---

## 🗂️ Project Structure

```
├── app/
│   ├── (public)/              # Public routes (no auth)
│   │   ├── (landing)/         # Landing page
│   │   ├── library/           # Public lesson library
│   │   └── auth/admin/login/  # Admin login
│   ├── (protected)/           # Admin routes (auth required)
│   │   ├── popup/             # Chrome extension interface
│   │   ├── my-library/        # Personal library
│   │   └── admin/             # Admin dashboard
│   └── api/                   # API routes
├── components/                # React components
│   ├── ui/                    # Shadcn UI components
│   ├── admin-navigation.tsx   # Admin sidebar
│   ├── lesson-display.tsx     # Lesson viewer
│   └── public-lesson-view.tsx # Public lesson viewer
├── lib/                       # Business logic
│   ├── *-server.ts            # Server-side utilities
│   ├── openrouter-ai-server.ts # AI integration
│   ├── public-lessons-server.ts # Public lesson management
│   └── export-utils.ts        # Export functionality
├── middleware.ts              # Route protection
├── manifest.json              # Chrome extension config
├── content.js                 # Content script
└── background.js              # Service worker
```

---

## 🔒 Security

### Route Protection
- **Middleware**: Protects admin routes
- **API Verification**: Admin checks on all protected endpoints
- **RLS Policies**: Database-level security
- **JWT Tokens**: Secure authentication

### Public Routes (No Auth)
- `/` - Landing page
- `/library` - Browse lessons
- `/library/[id]` - View lesson
- `/api/public-lessons/list` - List lessons
- `/api/public-lessons/[id]` - Get lesson

### Protected Routes (Admin Only)
- `/popup` - Chrome extension
- `/my-library` - Personal library
- `/admin/*` - Admin dashboard
- `/api/save-lesson` - Save to personal library
- `/api/public-lessons/create` - Create public lesson
- `/api/public-lessons/update/*` - Update lesson
- `/api/public-lessons/delete/*` - Delete lesson

---

## 🧪 Testing

See `PHASE_9_TESTING_GUIDE.md` for comprehensive testing procedures.

### Quick Test Commands
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- lesson-display

# Run with coverage
npm test -- --coverage
```

### Manual Testing
1. Test admin login
2. Test extension functionality
3. Test lesson generation
4. Test save to personal library
5. Test publish to public library
6. Test public access (no login)
7. Test export functionality

---

## 📖 Documentation

- `ADMIN_ONLY_REFACTOR_PROGRESS.md` - Implementation progress
- `PHASE_9_TESTING_GUIDE.md` - Testing procedures
- `ADMIN_SETUP_GUIDE.md` - Admin user setup
- `SETUP.md` - Detailed setup instructions
- `SECURITY.md` - Security guidelines

---

## 🎨 Design System

### Colors (Vintage Theme)
- **Vintage Brown**: `#8B4513` - Primary
- **Vintage Gold**: `#DAA520` - Accents
- **Vintage Cream**: `#FFF8DC` - Background
- **Vintage Burgundy**: `#800020` - Secondary

### Typography
- **Headings**: Serif font family
- **Body**: Sans-serif font family
- **Responsive**: Mobile-first approach

---

## 🚢 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Admin users created
- [ ] Chrome extension published
- [ ] SSL certificate configured
- [ ] Analytics setup
- [ ] Error monitoring enabled

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 🤝 Contributing

This is an admin-only platform. Contributions should focus on:
- Admin tools and features
- Public library enhancements
- Export functionality
- AI generation improvements
- Performance optimizations

---

## 📄 License

[Your License Here]

---

## 🆘 Support

### For Public Users
- Browse lessons at `/library`
- Export any lesson for free
- No support account needed

### For Administrators
- Contact system administrator
- Check admin documentation
- Review testing guide

---

## 🎯 Roadmap

### Completed ✅
- Admin-only platform refactoring
- Public library with free access
- Chrome extension for admins
- Personal library for admins
- Export functionality (PDF, Word, HTML)
- Admin dashboard

### Planned 🚀
- Advanced filtering and search
- Lesson analytics
- Batch export functionality
- Lesson templates
- Multi-language support
- Mobile app

---

**Built with ❤️ for language educators**
