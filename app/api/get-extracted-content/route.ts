import { NextRequest, NextResponse } from 'next/server';

// Temporary storage for extracted content (in production, use Redis or database)
const contentStorage = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const { action, data, sessionId } = await request.json();
    
    if (action === 'store') {
      // Store content from background script
      contentStorage.set(sessionId, {
        ...data,
        timestamp: Date.now()
      });
      
      console.log('[API] Stored content for session:', sessionId, 'length:', data.lessonConfiguration?.sourceContent?.length || 0);
      
      return NextResponse.json({ success: true });
    }
    
    if (action === 'retrieve') {
      // Retrieve content for popup
      const content = contentStorage.get(sessionId);
      
      if (content) {
        // Clean up after retrieval
        contentStorage.delete(sessionId);
        console.log('[API] Retrieved content for session:', sessionId, 'length:', content.lessonConfiguration?.sourceContent?.length || 0);
        return NextResponse.json({ success: true, data: content });
      } else {
        console.log('[API] No content found for session:', sessionId);
        return NextResponse.json({ success: false, error: 'No content found' });
      }
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' });
    
  } catch (error) {
    console.error('[API] Error handling extracted content:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}