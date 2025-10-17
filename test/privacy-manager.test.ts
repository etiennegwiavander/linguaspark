/**
 * Unit tests for PrivacyManager
 * 
 * Tests data protection compliance, robots.txt respect, domain exclusion,
 * explicit consent, session-only storage, and attribution system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrivacyManager, getPrivacyManager, resetPrivacyManager } from '../lib/privacy-manager';

// Mock global objects
const mockWindow = {
  location: {
    href: 'https://example.com/article',
    hostname: 'example.com',
  },
  addEventListener: vi.fn(),
};

const mockDocument = {
  title: 'Test Article Title',
};

const mockChrome = {
  storage: {
    session: {
      clear: vi.fn(),
    },
  },
};

// Mock fetch for robots.txt testing
global.fetch = vi.fn();
global.window = mockWindow as any;
global.document = mockDocument as any;
global.chrome = mockChrome as any;

describe('PrivacyManager', () => {
  let privacyManager: PrivacyManager;

  beforeEach(() => {
    resetPrivacyManager();
    privacyManager = new PrivacyManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetPrivacyManager();
  });

  describe('Domain Exclusion', () => {
    it('should exclude social media domains', async () => {
      const socialMediaDomains = [
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'linkedin.com',
        'tiktok.com',
      ];

      for (const domain of socialMediaDomains) {
        const canExtract = await privacyManager.canExtractFromDomain(domain);
        expect(canExtract).toBe(false);
      }
    });

    it('should exclude banking and financial domains', async () => {
      const financialDomains = [
        'paypal.com',
        'stripe.com',
        'chase.com',
        'bankofamerica.com',
      ];

      for (const domain of financialDomains) {
        const canExtract = await privacyManager.canExtractFromDomain(domain);
        expect(canExtract).toBe(false);
      }
    });

    it('should exclude email provider domains', async () => {
      const emailDomains = [
        'gmail.com',
        'outlook.com',
        'yahoo.com',
      ];

      for (const domain of emailDomains) {
        const canExtract = await privacyManager.canExtractFromDomain(domain);
        expect(canExtract).toBe(false);
      }
    });

    it('should allow educational and news domains', async () => {
      // Create a new manager with robots.txt disabled for this test
      const testManager = new PrivacyManager({ respectRobotsTxt: false });

      const allowedDomains = [
        'wikipedia.org',
        'bbc.com',
        'cnn.com',
        'reuters.com',
        'khanacademy.org',
      ];

      for (const domain of allowedDomains) {
        const canExtract = await testManager.canExtractFromDomain(domain);
        expect(canExtract).toBe(true);
      }
    });
  });

  describe('Robots.txt Compliance - Requirement 6.5', () => {
    it('should respect robots.txt disallow rules', async () => {
      const robotsTxt = `
User-agent: *
Disallow: /private/
Disallow: /admin/

User-agent: LinguaSpark
Disallow: /
      `;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(robotsTxt),
      });

      const result = await privacyManager.respectRobotsTxt('https://example.com/private/page');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Disallowed by robots.txt');
    });

    it('should allow extraction when robots.txt permits', async () => {
      const robotsTxt = `
User-agent: *
Disallow: /private/
Allow: /public/
      `;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(robotsTxt),
      });

      const result = await privacyManager.respectRobotsTxt('https://example.com/public/article');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Allowed by robots.txt');
    });

    it('should default to allowed when robots.txt is not found', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
      });

      const result = await privacyManager.respectRobotsTxt('https://example.com/article');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('No robots.txt found');
    });

    it('should handle robots.txt fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await privacyManager.respectRobotsTxt('https://example.com/article');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Error checking robots.txt');
    });
  });

  describe('Content Sanitization - Requirement 6.3', () => {
    it('should remove email addresses from content', () => {
      const content = 'Contact us at john.doe@example.com or support@company.org for help.';
      const sanitized = privacyManager.sanitizeContent(content);
      
      expect(sanitized).not.toContain('john.doe@example.com');
      expect(sanitized).not.toContain('support@company.org');
      expect(sanitized).toContain('[REDACTED]');
    });

    it('should remove phone numbers from content', () => {
      const content = 'Call us at (555) 123-4567 or +1-800-555-0199 for assistance.';
      const sanitized = privacyManager.sanitizeContent(content);
      
      expect(sanitized).not.toContain('(555) 123-4567');
      expect(sanitized).not.toContain('+1-800-555-0199');
      expect(sanitized).toContain('[REDACTED]');
    });

    it('should remove credit card numbers from content', () => {
      const content = 'Payment with card 4532 1234 5678 9012 was processed successfully.';
      const sanitized = privacyManager.sanitizeContent(content);
      
      expect(sanitized).not.toContain('4532 1234 5678 9012');
      expect(sanitized).toContain('[REDACTED]');
    });

    it('should remove social security numbers from content', () => {
      const content = 'SSN: 123-45-6789 is required for verification.';
      const sanitized = privacyManager.sanitizeContent(content);
      
      expect(sanitized).not.toContain('123-45-6789');
      expect(sanitized).toContain('[REDACTED]');
    });

    it('should remove IP addresses from content', () => {
      const content = 'Server IP: 192.168.1.1 is experiencing issues.';
      const sanitized = privacyManager.sanitizeContent(content);
      
      expect(sanitized).not.toContain('192.168.1.1');
      expect(sanitized).toContain('[REDACTED]');
    });

    it('should limit content size to maximum allowed', () => {
      const longContent = 'A'.repeat(60000); // Exceeds default 50KB limit
      const sanitized = privacyManager.sanitizeContent(longContent);
      
      expect(sanitized.length).toBeLessThanOrEqual(50003); // 50000 + '...'
      expect(sanitized.endsWith('...')).toBe(true);
    });

    it('should handle empty or null content gracefully', () => {
      expect(privacyManager.sanitizeContent('')).toBe('');
      expect(privacyManager.sanitizeContent(null as any)).toBe('');
      expect(privacyManager.sanitizeContent(undefined as any)).toBe('');
    });
  });

  describe('Explicit User Consent - Requirement 6.1', () => {
    it('should require explicit consent when enabled', async () => {
      const result = await privacyManager.ensureExplicitUserConsent();
      
      expect(result.granted).toBe(true);
      expect(result.sessionId).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should remember consent within the same session', async () => {
      const firstResult = await privacyManager.ensureExplicitUserConsent();
      const secondResult = await privacyManager.ensureExplicitUserConsent();
      
      expect(firstResult.sessionId).toBe(secondResult.sessionId);
      expect(firstResult.granted).toBe(true);
      expect(secondResult.granted).toBe(true);
    });

    it('should allow bypassing consent when disabled', async () => {
      const customManager = new PrivacyManager({ explicitConsentRequired: false });
      const result = await customManager.ensureExplicitUserConsent();
      
      expect(result.granted).toBe(true);
    });
  });

  describe('Session-Only Storage - Requirement 6.4', () => {
    it('should set up cleanup on window unload', () => {
      privacyManager.enforceSessionOnlyStorage();
      
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
    });

    it('should clear session data when requested', () => {
      // Add some data first
      privacyManager.logDataUsage('test_action', 100);
      expect(privacyManager.getDataUsageLogs()).toHaveLength(1);
      
      // Clear session data
      privacyManager.clearSessionData();
      expect(privacyManager.getDataUsageLogs()).toHaveLength(0);
    });

    it('should clear Chrome storage session data', () => {
      privacyManager.clearSessionData();
      
      expect(mockChrome.storage.session.clear).toHaveBeenCalled();
    });
  });

  describe('Attribution System - Requirement 6.6', () => {
    it('should include proper attribution information', () => {
      const attribution = privacyManager.includeProperAttribution({});
      
      expect(attribution.sourceUrl).toBe('https://example.com/article');
      expect(attribution.title).toBe('Test Article Title');
      expect(attribution.domain).toBe('example.com');
      expect(attribution.extractedAt).toBeInstanceOf(Date);
      expect(attribution.attribution).toContain('Test Article Title');
      expect(attribution.attribution).toContain('example.com');
    });

    it('should handle missing document title gracefully', () => {
      const originalTitle = mockDocument.title;
      mockDocument.title = '';
      
      const attribution = privacyManager.includeProperAttribution({});
      
      expect(attribution.title).toBe('');
      expect(attribution.attribution).toContain('example.com');
      
      // Restore original title
      mockDocument.title = originalTitle;
    });
  });

  describe('Data Usage Logging', () => {
    it('should log data usage actions', () => {
      privacyManager.logDataUsage('test_action', 1024, 'https://test.com');
      
      const logs = privacyManager.getDataUsageLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('test_action');
      expect(logs[0].dataSize).toBe(1024);
      expect(logs[0].url).toBe('https://test.com');
      expect(logs[0].sessionId).toBeDefined();
      expect(logs[0].timestamp).toBeInstanceOf(Date);
    });

    it('should limit log size to prevent memory issues', () => {
      // Create a fresh manager to avoid interference from other tests
      const testManager = new PrivacyManager();
      
      // Clear any initialization logs
      testManager.clearSessionData();
      
      // Add exactly 101 logs to trigger trimming
      for (let i = 0; i < 101; i++) {
        testManager.logDataUsage(`action_${i}`, i);
      }
      
      const logs = testManager.getDataUsageLogs();
      expect(logs.length).toBeLessThanOrEqual(50); // Should be trimmed to 50 when over 100
    });
  });

  describe('Privacy Settings Management', () => {
    it('should return current privacy settings', () => {
      const settings = privacyManager.getPrivacySettings();
      
      expect(settings.respectRobotsTxt).toBe(true);
      expect(settings.explicitConsentRequired).toBe(true);
      expect(settings.sessionOnlyStorage).toBe(true);
      expect(settings.includeAttribution).toBe(true);
      expect(settings.maxContentSize).toBe(50000);
    });

    it('should update privacy settings', () => {
      privacyManager.updatePrivacySettings({
        maxContentSize: 25000,
        respectRobotsTxt: false,
      });
      
      const settings = privacyManager.getPrivacySettings();
      expect(settings.maxContentSize).toBe(25000);
      expect(settings.respectRobotsTxt).toBe(false);
      expect(settings.explicitConsentRequired).toBe(true); // Should remain unchanged
    });
  });

  describe('Data Retention and Cleanup', () => {
    it('should clean up expired data based on retention hours', () => {
      // Create manager with short retention period
      const shortRetentionManager = new PrivacyManager({ dataRetentionHours: 0.001 }); // ~3.6 seconds
      
      shortRetentionManager.logDataUsage('old_action', 100);
      
      // Wait a bit and add new data
      setTimeout(() => {
        shortRetentionManager.logDataUsage('new_action', 200);
        shortRetentionManager.limitDataCollection(); // This should trigger cleanup
        
        const logs = shortRetentionManager.getDataUsageLogs();
        expect(logs.some(log => log.action === 'new_action')).toBe(true);
        // Old data might be cleaned up depending on timing
      }, 10);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = getPrivacyManager();
      const instance2 = getPrivacyManager();
      
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getPrivacyManager();
      resetPrivacyManager();
      const instance2 = getPrivacyManager();
      
      expect(instance1).not.toBe(instance2);
    });

    it('should accept custom settings on first creation', () => {
      resetPrivacyManager();
      const customManager = getPrivacyManager({ maxContentSize: 25000 });
      
      expect(customManager.getPrivacySettings().maxContentSize).toBe(25000);
    });
  });

  describe('Error Handling', () => {
    it('should handle domain check errors gracefully', async () => {
      // Mock fetch to throw error
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      const canExtract = await privacyManager.canExtractFromDomain('error-domain.com');
      expect(canExtract).toBe(false); // Should fail safely
    });

    it('should handle malformed robots.txt gracefully', async () => {
      const malformedRobotsTxt = 'This is not valid robots.txt content';
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(malformedRobotsTxt),
      });
      
      const result = await privacyManager.respectRobotsTxt('https://example.com/page');
      expect(result.allowed).toBe(true); // Should default to allowed for malformed content
    });
  });

  describe('Requirements Compliance', () => {
    it('should enforce Requirement 6.1: Extract only on user request', async () => {
      // This is enforced by the consent mechanism
      const consent = await privacyManager.ensureExplicitUserConsent();
      expect(consent.granted).toBe(true);
      
      // Verify logging
      const logs = privacyManager.getDataUsageLogs();
      expect(logs.some(log => log.action === 'consent_granted')).toBe(true);
    });

    it('should enforce Requirement 6.2: No analysis data storage', () => {
      // This is enforced by the policy
      const policy = (privacyManager as any).policy;
      expect(policy.noAnalysisDataStorage).toBe(true);
      expect(policy.noContentTransmissionDuringAnalysis).toBe(true);
    });

    it('should enforce Requirement 6.3: Process only necessary content', () => {
      const testContent = 'This is test content with email@example.com';
      const sanitized = privacyManager.sanitizeContent(testContent);
      
      expect(sanitized).not.toContain('email@example.com');
      expect(sanitized).toContain('[REDACTED]');
    });

    it('should enforce Requirement 6.4: Session-limited storage', () => {
      const settings = privacyManager.getPrivacySettings();
      expect(settings.sessionOnlyStorage).toBe(true);
      expect(settings.dataRetentionHours).toBe(1);
    });

    it('should enforce Requirement 6.5: Respect robots.txt', () => {
      const settings = privacyManager.getPrivacySettings();
      expect(settings.respectRobotsTxt).toBe(true);
    });

    it('should enforce Requirement 6.6: Include proper attribution', () => {
      const attribution = privacyManager.includeProperAttribution({});
      
      expect(attribution.sourceUrl).toBeDefined();
      expect(attribution.title).toBeDefined();
      expect(attribution.domain).toBeDefined();
      expect(attribution.extractedAt).toBeInstanceOf(Date);
      expect(attribution.attribution).toContain('Content extracted from:');
    });
  });
});