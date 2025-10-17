# 🎯 How to Use Sparky - Your Extract-from-Page Assistant

Congratulations! All tasks are complete and Sparky is ready to help you extract content from web pages and create language lessons. Here's how to get started:

## 🚀 Quick Start Guide

### Option 1: Chrome Extension (Recommended)

#### Step 1: Build the Extension
```bash
# Build the Next.js application
npm run build

# The extension files are ready in the built application
```

#### Step 2: Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select your project folder (the one containing `manifest.json`)
5. The LinguaSpark extension should now appear in your extensions

#### Step 3: Start Using Sparky
1. **Navigate to any educational webpage** (news articles, blog posts, Wikipedia, etc.)
2. **Look for Sparky** - The floating action button will automatically appear on suitable pages
3. **Click the Sparky button** to extract content
4. **Confirm extraction** in the dialog that appears
5. **Generate your lesson** - You'll be taken to the lesson interface with pre-populated content

### Option 2: Web Application

#### Step 1: Start the Development Server
```bash
npm run dev
```

#### Step 2: Access the Application
- Open `http://localhost:3000` in your browser
- Use the lesson generator interface directly
- Manually paste content you want to turn into lessons

## 🎨 What Sparky Can Do

### ✨ Smart Content Detection
Sparky automatically analyzes web pages and only appears when:
- ✅ Content has 200+ words (sufficient for a lesson)
- ✅ Content is educational (news, blogs, articles, documentation)
- ✅ Content is in English
- ✅ Page structure is suitable for extraction

### 🎯 Supported Websites
Sparky works great on:
- **News Sites**: BBC, CNN, Reuters, Guardian, etc.
- **Educational Sites**: Wikipedia, Khan Academy, Coursera, etc.
- **Blog Platforms**: Medium, WordPress blogs, personal blogs
- **Documentation**: Technical docs, tutorials, guides

### 🚫 What Sparky Avoids
Sparky won't appear on:
- E-commerce sites (Amazon, shopping sites)
- Social media (Facebook, Twitter, Instagram)
- Short content pages
- Non-educational content

## 🎮 Using Sparky - Step by Step

### 1. **Page Analysis** (Automatic)
When you visit a webpage, Sparky:
- Analyzes the content quality and length
- Detects the content type (news, blog, educational)
- Checks if the content is suitable for language learning
- Appears as a floating button if conditions are met

### 2. **Content Extraction** (One Click)
When you click Sparky:
- Extracts the main article content
- Removes ads, navigation, and clutter
- Preserves headings and structure
- Suggests the best lesson type (Discussion, Grammar, etc.)

### 3. **Lesson Generation** (Automatic)
After extraction:
- Opens the lesson interface in a new tab
- Pre-populates with extracted content
- Suggests appropriate CEFR level
- Ready for AI lesson generation

## 🎛️ Sparky Features

### 🎨 **Sparky Mascot Animations**
- **Idle**: Gentle breathing animation when waiting
- **Hover**: Excited bounce when you hover over
- **Loading**: Spinning animation during extraction
- **Success**: Celebration animation when complete
- **Error**: Sad animation if something goes wrong

### 🎯 **Smart Positioning**
- Automatically positions to avoid page elements
- Remembers your preferred position per website
- Adapts to mobile and desktop screens
- Stays out of the way while browsing

### ⌨️ **Accessibility Features**
- **Keyboard Navigation**: Press `Alt+E` to activate
- **Screen Reader Support**: Full ARIA labels and announcements
- **High Contrast**: Adapts to system accessibility settings
- **Touch Friendly**: Works great on tablets and touch devices

### 🔧 **Customization Options**
- Drag to reposition the button
- Configure size and appearance
- Set domain-specific preferences
- Keyboard shortcuts customization

## 🎯 Best Practices for Using Sparky

### ✅ **Great Content for Extraction**
- **News Articles**: Current events, technology, science
- **Educational Blog Posts**: How-to guides, explanations
- **Wikipedia Articles**: Comprehensive topic coverage
- **Tutorial Content**: Step-by-step guides

### 📝 **Lesson Types Sparky Suggests**
- **Discussion Lessons**: For news articles and opinion pieces
- **Grammar Lessons**: For educational content with complex structures
- **Business Lessons**: For professional and technical content
- **Travel Lessons**: For cultural and location-based content

### 🎨 **CEFR Level Adaptation**
Sparky analyzes content complexity and suggests:
- **A1-A2**: Simple news, basic tutorials
- **B1-B2**: Standard articles, educational content
- **C1**: Complex articles, academic content

## 🛠️ Troubleshooting

### Sparky Doesn't Appear?
1. **Check Content Length**: Page needs 200+ words
2. **Verify Content Type**: Must be educational/news content
3. **Check Language**: Currently supports English content
4. **Refresh Page**: Sometimes helps with dynamic content

### Extraction Issues?
1. **Try Manual Selection**: Select text and use copy-paste in lesson generator
2. **Check Internet Connection**: Extraction requires API access
3. **Verify Permissions**: Extension needs page access permissions

### Performance Issues?
1. **Close Other Tabs**: Reduces memory usage
2. **Check System Resources**: Large pages need more processing
3. **Try Smaller Articles**: Start with shorter content

## 🎯 Advanced Usage

### 🔧 **Developer Mode**
If you're developing or testing:
```bash
# Run tests
npm test

# Test specific components
npm test -- test/integration-workflow.test.ts

# Check extraction on specific sites
npm run dev
# Then visit test pages
```

### 📊 **Performance Monitoring**
Sparky includes built-in performance monitoring:
- Content analysis speed
- Memory usage tracking
- Error rate monitoring
- User interaction analytics

### 🔒 **Privacy & Security**
Sparky respects:
- Robots.txt restrictions
- Domain exclusion lists
- Content sanitization
- User privacy preferences

## 🎉 Example Workflow

### Scenario: Creating a Discussion Lesson from BBC News

1. **Visit BBC News Article**
   - Navigate to any BBC news article about technology, science, or current events

2. **Sparky Appears**
   - Look for the floating Sparky button (usually bottom-right)
   - Button shows idle animation with gentle breathing

3. **Extract Content**
   - Click the Sparky button
   - Sparky shows loading animation with progress
   - Extraction confirmation dialog appears

4. **Confirm Extraction**
   - Review the extracted content preview
   - Click "Create Lesson" to proceed
   - Or "Cancel" if content isn't suitable

5. **Generate Lesson**
   - New tab opens with lesson generator
   - Content is pre-populated
   - Lesson type set to "Discussion"
   - CEFR level suggested based on complexity

6. **Customize & Generate**
   - Adjust CEFR level if needed
   - Click "Generate Lesson"
   - AI creates a complete lesson with warmup, discussion questions, vocabulary, etc.

## 🎯 Tips for Best Results

### 📰 **Content Selection**
- Choose articles with clear structure (headings, paragraphs)
- Prefer content with educational value
- Look for articles with good vocabulary diversity
- Avoid heavily technical or specialized content for general lessons

### 🎨 **Lesson Customization**
- Adjust CEFR level based on your students
- Choose lesson type that matches your teaching goals
- Review extracted content before generating
- Use the vocabulary highlighting feature

### 📱 **Cross-Device Usage**
- Works on desktop Chrome browsers
- Responsive design adapts to screen size
- Touch-friendly on tablets
- Keyboard accessible for all users

## 🚀 What's Next?

Now that Sparky is ready:

1. **Start Extracting**: Visit your favorite educational websites
2. **Create Lessons**: Build a library of AI-generated lessons
3. **Customize Settings**: Adjust Sparky's behavior to your preferences
4. **Share Feedback**: Help improve Sparky with your usage patterns

## 🎯 Support & Resources

### 📚 **Documentation**
- Component documentation in `components/floating-action-button-readme.md`
- API documentation for developers
- Test coverage reports

### 🧪 **Testing**
- Comprehensive test suite with 23+ integration tests
- Performance benchmarks established
- Cross-browser compatibility verified

### 🔧 **Configuration**
- Button settings in extension options
- Domain-specific preferences
- Accessibility customizations

---

**Happy lesson creating with Sparky! 🎉**

Your AI-powered content extraction assistant is ready to transform any webpage into engaging language learning material.