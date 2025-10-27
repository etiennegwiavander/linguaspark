"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BookOpen, Sparkles, FileText, Globe, Zap, Shield, Chrome, Download } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/signin");
  };
  const handleLessonMaterials = () => {
    router.push("/library");
  };

  return (
    <div className="min-h-screen bg-vintage-cream">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-vintage-cream border-b-3 border-vintage-brown shadow-vintage">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-vintage-gold/20 rounded-full blur-sm"></div>
                <img
                  src="/mascot.png"
                  alt="Sparky Mascot"
                  className="relative w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-vintage-brown">
                  LinguaSpark
                </h1>

              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                variant="ghost"
                className="text-vintage-brown hover:text-vintage-burgundy font-serif"
              >
                Features
              </Button>
              <Button
                onClick={handleLessonMaterials}
                variant="ghost"
                className="text-vintage-brown hover:text-vintage-burgundy font-serif"
              >
                Lesson Materials
              </Button>
              <Button
                onClick={handleGetStarted}
                className="vintage-button-primary"
              >
                <Chrome className="mr-2 h-4 w-4" />
                Get Started
              </Button>

            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b-4 border-vintage-brown">
        <div className="absolute inset-0 bg-vintage-pattern opacity-5"></div>
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 mb-6 px-6 py-2 bg-vintage-gold/20 border-2 border-vintage-gold rounded-full">
                <Chrome className="h-4 w-4 text-vintage-brown" />
                <span className="text-vintage-brown font-serif text-sm tracking-wider uppercase">
                  Chrome Extension for Language Tutors
                </span>
              </div>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-vintage-brown mb-6 leading-tight">
                Transform Any Webpage into
                <span className="block text-vintage-burgundy mt-2">Professional Lessons</span>
              </h1>
              <p className="text-xl text-vintage-brown/80 mb-10 leading-relaxed">
                LinguaSpark is a Chrome extension that turns web articles, blogs, and content into engaging language lessons with AI-powered generation.
                Create professional teaching materials in minutes, not hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  onClick={handleGetStarted}
                  className="vintage-button-primary text-lg px-8 py-6 h-auto"
                >
                  <Chrome className="mr-2 h-5 w-5" />
                  Get Started Free
                </Button>
                <Button
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  variant="outline"
                  className="vintage-button-secondary text-lg px-8 py-6 h-auto"
                >
                  Learn More
                </Button>
              </div>
              <p className="mt-6 text-sm text-vintage-brown/60">
                <Download className="inline h-4 w-4 mr-1" />
                Install as Chrome Extension • No credit card required
              </p>
            </div>

            {/* Right: Lesson Preview Mockup */}
            <div className="relative hidden lg:block">
              {/* Sparky Mascot - Top Right */}
              <div className="absolute -top-8 -right-8 z-20">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 bg-vintage-gold/30 rounded-full blur-xl animate-pulse"></div>
                  <img
                    src="/mascot.png"
                    alt="Sparky Mascot"
                    className="relative w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>
              </div>

              {/* Lesson Preview Card */}
              <div className="bg-vintage-cream-dark border-4 border-vintage-brown rounded-lg p-8 shadow-vintage-lg transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="bg-vintage-cream border-3 border-vintage-brown rounded p-6">
                  {/* Lesson Title Section */}
                  <div className="mb-6">
                    <label className="text-vintage-brown/60 text-xs uppercase tracking-wider block mb-2 font-serif">
                      Lesson Title
                    </label>
                    <div className="bg-white border-2 border-vintage-brown rounded px-4 py-3 font-serif text-vintage-brown">
                      The Art of French Cuisine
                    </div>
                  </div>

                  {/* Learning Objectives Section */}
                  <div className="mb-6">
                    <label className="text-vintage-brown/60 text-xs uppercase tracking-wider block mb-2 font-serif">
                      Learning Objectives
                    </label>
                    <div className="space-y-2">
                      <div className="bg-white border-2 border-vintage-brown rounded px-4 py-2 text-sm">
                        Master culinary vocabulary
                      </div>
                      <div className="bg-white border-2 border-vintage-brown rounded px-4 py-2 text-sm w-5/6">
                        Understand recipe instructions
                      </div>
                      <div className="bg-white border-2 border-vintage-brown rounded px-4 py-2 text-sm w-4/6">
                        Practice food descriptions
                      </div>
                    </div>
                  </div>

                  {/* Activities Section */}
                  <div className="relative">
                    <label className="text-vintage-brown/60 text-xs uppercase tracking-wider block mb-2 font-serif">
                      Activities
                    </label>
                    <div className="space-y-2">
                      <div className="bg-white border-2 border-vintage-brown rounded px-4 py-2 text-sm">
                        Vocabulary matching exercise
                      </div>
                      <div className="bg-white border-2 border-vintage-brown rounded px-4 py-2 text-sm w-5/6">
                        Discussion questions
                      </div>
                    </div>

                    {/* AI Sparkle Button */}
                    <button className="absolute -right-4 -bottom-4 bg-vintage-gold border-3 border-vintage-brown p-3 rounded-full shadow-vintage hover:shadow-vintage-lg hover:scale-110 transition-all duration-200">
                      <Sparkles className="w-6 h-6 text-vintage-burgundy" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-vintage-gold/20 rounded-full blur-2xl"></div>
              <div className="absolute -top-4 left-1/3 w-16 h-16 bg-vintage-burgundy/20 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-vintage-gold via-vintage-burgundy to-vintage-gold"></div>
      </section>

      {/* Chrome Extension Benefits */}
      <section className="py-16 bg-vintage-cream-dark border-b-4 border-vintage-brown">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl font-bold text-vintage-brown mb-4">
                Works Right in Your Browser
              </h2>
              <p className="text-lg text-vintage-brown/70">
                Browse the web naturally and create lessons from any content you find
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="vintage-card text-center">
                <Chrome className="h-12 w-12 text-vintage-burgundy mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold text-vintage-brown mb-2">
                  One-Click Extraction
                </h3>
                <p className="text-vintage-brown/70">
                  Click the extension icon on any webpage to instantly extract content
                </p>
              </div>
              <div className="vintage-card text-center">
                <Zap className="h-12 w-12 text-vintage-burgundy mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold text-vintage-brown mb-2">
                  Instant Generation
                </h3>
                <p className="text-vintage-brown/70">
                  AI creates structured lessons in seconds, right in your browser
                </p>
              </div>
              <div className="vintage-card text-center">
                <FileText className="h-12 w-12 text-vintage-burgundy mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold text-vintage-brown mb-2">
                  Export Anywhere
                </h3>
                <p className="text-vintage-brown/70">
                  Download as PDF or Word and use in your teaching immediately
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-vintage-cream">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-5xl font-bold text-vintage-brown mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-vintage-brown/70 max-w-2xl mx-auto">
              Professional tools designed specifically for language educators
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title="Extract from Any Page"
              description="Turn articles, blogs, and web content into structured lessons with one click."
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="AI-Powered Generation"
              description="Intelligent lesson creation with vocabulary, grammar, and discussion questions."
            />
            <FeatureCard
              icon={<BookOpen className="h-8 w-8" />}
              title="Multiple Lesson Types"
              description="Discussion, Grammar, Travel, Business, and Pronunciation lessons."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="CEFR Level Support"
              description="Adapt content complexity from A1 to C1 for any student level."
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8" />}
              title="Professional Export"
              description="Export to PDF or Word with beautiful formatting and typography."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Secure & Private"
              description="Your lessons are stored securely with enterprise-grade authentication."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-vintage-cream-dark border-t-4 border-vintage-brown">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-5xl font-bold text-vintage-brown mb-4">
              Simple Three-Step Process
            </h2>
            <p className="text-xl text-vintage-brown/70">
              From web content to professional lesson in minutes
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            <StepCard
              number="1"
              title="Browse & Find Content"
              description="Browse the web naturally and find interesting articles, stories, or content that matches your teaching goals. Works on any website."
            />
            <StepCard
              number="2"
              title="Click & Generate"
              description="Click the LinguaSpark extension icon, select your lesson type and CEFR level, and let AI create your lesson instantly."
            />
            <StepCard
              number="3"
              title="Export & Teach"
              description="Review, customize if needed, and export to PDF or Word. Your professional lesson is ready to use in class."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-vintage-burgundy text-vintage-cream border-t-4 border-vintage-brown">
        <div className="container mx-auto px-6 text-center">
          <Chrome className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="font-serif text-5xl font-bold mb-6">
            Ready to Transform Your Teaching?
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
            Join language tutors who are saving hours every week with LinguaSpark
          </p>
          <Button
            onClick={handleGetStarted}
            className="vintage-button-light text-lg px-10 py-6 h-auto"
          >
            <Chrome className="mr-2 h-5 w-5" />
            Get Started Free
          </Button>
          <p className="mt-6 text-sm opacity-75">
            Free to use • Works in Chrome browser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-vintage-brown text-vintage-cream py-8 border-t-4 border-vintage-gold">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/mascot.png"
                alt="Sparky Mascot"
                className="w-8 h-8 object-contain opacity-90"
              />
              <div className="text-center md:text-left">
                <p className="font-serif text-lg mb-1">LinguaSpark</p>
                <p className="text-sm opacity-75">
                  Professional language lesson creation for modern tutors
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm opacity-75">
              <Chrome className="h-4 w-4" />
              <span>Chrome Extension</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="vintage-card group hover:shadow-vintage-lg transition-all duration-300">
      <div className="mb-4 text-vintage-burgundy group-hover:text-vintage-gold transition-colors">
        {icon}
      </div>
      <h3 className="font-serif text-2xl font-bold text-vintage-brown mb-3">
        {title}
      </h3>
      <p className="text-vintage-brown/70 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 w-16 h-16 rounded-full bg-vintage-burgundy text-vintage-cream font-serif text-2xl font-bold flex items-center justify-center border-4 border-vintage-gold shadow-vintage">
        {number}
      </div>
      <div className="flex-1 pt-2">
        <h3 className="font-serif text-3xl font-bold text-vintage-brown mb-3">
          {title}
        </h3>
        <p className="text-lg text-vintage-brown/70 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
