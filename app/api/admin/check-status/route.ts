/**
 * API Route: Check Admin Status
 * 
 * Checks if a user has admin privileges
 * Used by Chrome extension to determine if admin features should be shown
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-utils-server';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] 🔍 Admin check API called');
    const body = await request.json();
    const { userId } = body;
    
    console.log('[API] 📋 Received userId:', userId);

    if (!userId) {
      console.log('[API] ❌ No userId provided');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('[API] 🔎 Calling isAdmin function...');
    const adminStatus = await isAdmin(userId);
    console.log('[API] ✅ isAdmin returned:', adminStatus);

    const response = {
      isAdmin: adminStatus,
      userId: userId
    };
    
    console.log('[API] 📤 Sending response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] ❌ Error checking admin status:', error);
    return NextResponse.json(
      { error: 'Failed to check admin status' },
      { status: 500 }
    );
  }
}
