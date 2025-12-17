import { NextRequest, NextResponse } from 'next/server';

// Temporary storage for extracted content (in production, use Redis or database)
const contentStorage = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const { action, data, sessionId } = await request.json();
    
    console.log('[API] Received request:', { action, sessionId, hasData: !!data });
    
    if (action === 'store') {
      // Store content from background script
      contentStorage.set(sessionId, {
        ...data,
        timestamp: Date.now()
      });
      
      console.log('[API] Stored content for session:', sessionId, 'length:', data.lessonConfiguration?.sourceContent?.length || 0);
      
      return NextResponse.json({ success: true }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }
    
    if (action === 'retrieve') {
      // Retrieve content for popup
      const content = contentStorage.get(sessionId);
      
      if (content) {
        // Don't clean up immediately - let it expire naturally
        console.log('[API] Retrieved content for session:', sessionId, 'length:', content.lessonConfiguration?.sourceContent?.length || 0);
        return NextResponse.json({ success: true, data: content }, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        });
      } else {
        console.log('[API] No content found for session:', sessionId);
        console.log('[API] Available sessions:', Array.from(contentStorage.keys()));
        return NextResponse.json({ success: false, error: 'No content found' }, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        });
      }
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (error) {
    console.error('[API] Error handling extracted content:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}