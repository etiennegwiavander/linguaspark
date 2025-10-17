/**
 * API route to test PrivacyManager functionality
 * 
 * This route demonstrates how the PrivacyManager integrates with the
 * content extraction workflow to ensure privacy compliance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPrivacyManager } from '@/lib/privacy-manager';

export async function POST(request: NextRequest) {
  try {
    const { domain, content, testType } = await request.json();
    const privacyManager = getPrivacyManager();

    switch (testType) {
      case 'domain_check':
        const canExtract = await privacyManager.canExtractFromDomain(domain);
        return NextResponse.json({
          success: true,
          data: {
            domain,
            canExtract,
            reason: canExtract ? 'Domain allowed for extraction' : 'Domain blocked or restricted',
          },
        });

      case 'content_sanitization':
        const sanitized = privacyManager.sanitizeContent(content);
        return NextResponse.json({
          success: true,
          data: {
            originalLength: content?.length || 0,
            sanitizedLength: sanitized.length,
            sanitizedContent: sanitized,
            hasSensitiveData: sanitized.includes('[REDACTED]'),
          },
        });

      case 'consent_check':
        const consent = await privacyManager.ensureExplicitUserConsent();
        return NextResponse.json({
          success: true,
          data: {
            consentGranted: consent.granted,
            sessionId: consent.sessionId,
            timestamp: consent.timestamp,
          },
        });

      case 'attribution':
        const attribution = privacyManager.includeProperAttribution({ content });
        return NextResponse.json({
          success: true,
          data: {
            attribution: attribution.attribution,
            sourceUrl: attribution.sourceUrl,
            domain: attribution.domain,
            extractedAt: attribution.extractedAt,
          },
        });

      case 'robots_txt':
        const robotsResult = await privacyManager.respectRobotsTxt(domain);
        return NextResponse.json({
          success: true,
          data: {
            domain,
            allowed: robotsResult.allowed,
            reason: robotsResult.reason,
            userAgent: robotsResult.userAgent,
          },
        });

      case 'privacy_settings':
        const settings = privacyManager.getPrivacySettings();
        return NextResponse.json({
          success: true,
          data: {
            settings,
          },
        });

      case 'data_usage_logs':
        const logs = privacyManager.getDataUsageLogs();
        return NextResponse.json({
          success: true,
          data: {
            logCount: logs.length,
            recentLogs: logs.slice(-5), // Last 5 logs
          },
        });

      case 'full_workflow':
        // Demonstrate complete privacy-compliant extraction workflow
        const workflowResults = {
          domainCheck: await privacyManager.canExtractFromDomain(domain),
          consent: await privacyManager.ensureExplicitUserConsent(),
          sanitizedContent: privacyManager.sanitizeContent(content),
          attribution: privacyManager.includeProperAttribution({ content }),
          logs: privacyManager.getDataUsageLogs().slice(-3),
        };

        return NextResponse.json({
          success: true,
          data: workflowResults,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid test type. Supported types: domain_check, content_sanitization, consent_check, attribution, robots_txt, privacy_settings, data_usage_logs, full_workflow',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Privacy Manager test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Privacy Manager test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const privacyManager = getPrivacyManager();
    
    // Return current privacy status and settings
    const status = {
      settings: privacyManager.getPrivacySettings(),
      logCount: privacyManager.getDataUsageLogs().length,
      recentActivity: privacyManager.getDataUsageLogs().slice(-3),
    };

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Privacy Manager status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get privacy manager status',
      },
      { status: 500 }
    );
  }
}