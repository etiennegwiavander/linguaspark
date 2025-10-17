/**
 * Integration tests for PrivacyManager with Enhanced Content Extractor
 * 
 * Tests the integration between privacy management and content extraction
 * to ensure compliance requirements are met during the extraction process.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrivacyManager, getPrivacyManager, resetPrivacyManager } from '../lib/privacy-manager';
import { EnhancedContentExtractor } from '../lib/enhanced-content-extractor';

// Mock global objects
const mockWindow = {
  location: {
    href: 'https://example.com/article',
    hostname: 'example.com',
  },
  addEventListener: vi.fn(),
};

const mockDocument = {
  title: 'Test Article: Learning JavaScript',
  body: {
    innerText: 'This is a comprehensive guide to learning JavaScript. JavaScript is a programming language that enables interactive web pages.',
  },
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
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

describe('PrivacyManager Integration', () => {
  let privacyManager: PrivacyManager;
  let contentExtractor: EnhancedContentExtractor;

  beforeEach(() => {
    resetPrivacyManager();
    privacyManager = new PrivacyManager();
    contentExtractor = new EnhancedContentExtractor();
    vi.clearAllMocks();
    
    // Mock successful robots.txt check
    (global.fetch as any).mockResolvedValue({
      ok: false, // No robots.txt found, should default to allowed
    });
  });

  afterEach(() => {
    resetPrivacyManager();
  });

  describe('Content Extraction with Privacy Compliance', () => {
    it('should check domain permissions before extraction', async () => {
      // Test with allowed domain
      const canExtract = await privacyManager.canExtractFromDomain('example.com');
      expect(canExtract).toBe(true);
      
      // Verify logging
      const logs = privacyManager.getDataUsageLogs();
      expect(logs.some(log => log.action === 'domain_check_allowed')).toBe(true);
    });

    it('should prevent extraction from excluded domains', async () => {
      // Test with social media domain
      const canExtract = await privacyManager.canExtractFromDomain('facebook.com');
      expect(canExtract).toBe(false);
      
      // Verify logging
      const logs = privacyManager.getDataUsageLogs();
      expect(logs.some(log => log.action === 'domain_check_excluded')).toBe(true);
    });

    it('should sanitize extracted content', async () => {
      const testContent = `
        This is an article about web development.
        Contact the author at john.doe@example.com for questions.
        Phone: (555) 123-4567
        Credit card: 4532 1234 5678 9012
        SSN: 123-45-6789
        Server IP: 192.168.1.1
      `;

      const sanitized = privacyManager.sanitizeContent(testContent);
      
      // Verify sensitive information is removed
      expect(sanitized).not.toContain('john.doe@example.com');
      expect(sanitized).not.toContain('(555) 123-4567');
      expect(sanitized).not.toContain('4532 1234 5678 9012');
      expect(sanitized).not.toContain('123-45-6789');
      expect(sanitized).not.toContain('192.168.1.1');
      
      // Verify content is still readable
      expect(sanitized).toContain('web development');
      expect(sanitized).toContain('[REDACTED]');
    });

    it('should require explicit consent before extraction', async () => {
      const consent = await privacyManager.ensureExplicitUserConsent();
      
      expect(consent.granted).toBe(true);
      expect(consent.sessionId).toBeDefined();
      expect(consent.timestamp).toBeInstanceOf(Date);
      
      // Verify consent is logged
      const logs = privacyManager.getDataUsageLogs();
      expect(logs.some(log => log.action === 'consent_granted')).toBe(true);
    });

    it('should include proper attribution for extracted content', () => {
      const mockContent = {
        text: 'Sample article content',
        title: 'Test Article',
      };

      const attribution = privacyManager.includeProperAttribution(mockContent);
      
      expect(attribution.sourceUrl).toBe('https://example.com/article');
      expect(attribution.title).toBe('Test Article: Learning JavaScript');
      expect(attribution.domain).toBe('example.com');
      expect(attribution.extractedAt).toBeInstanceOf(Date);
      expect(attribution.attribution).toContain('Test Article: Learning JavaScript');
      expect(attribution.attribution).toContain('example.com');
      expect(attribution.attribution).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Date format
    });

    it('should enforce session-only storage policy', () => {
      // Add some test data
      privacyManager.logDataUsage('test_extraction', 1024);
      expect(privacyManager.getDataUsageLogs()).toHaveLength(1);
      
      // Clear session data
      privacyManager.clearSessionData();
      expect(privacyManager.getDataUsageLogs()).toHaveLength(0);
      
      // Verify Chrome storage is cleared
      expect(mockChrome.storage.session.clear).toHaveBeenCalled();
    });

    it('should respect robots.txt when checking domain permissions', async () => {
      // Mock robots.txt that disallows extraction
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
User-agent: *
Disallow: /

User-agent: LinguaSpark
Disallow: /
        `),
      });

      const canExtract = await privacyManager.canExtractFromDomain('restricted-site.com');
      expect(canExtract).toBe(false);
      
      // Verify logging
      const logs = privacyManager.getDataUsageLogs();
      expect(logs.some(log => log.action === 'domain_check_robots_blocked')).toBe(true);
    });

    it('should limit data collection to minimum necessary', () => {
      // Test content size limiting
      const largeContent = 'A'.repeat(60000); // Exceeds 50KB limit
      const sanitized = privacyManager.sanitizeContent(largeContent);
      
      expect(sanitized.length).toBeLessThanOrEqual(50003); // 50000 + '...'
      
      // Test log size limiting
      privacyManager.limitDataCollection();
      const logs = privacyManager.getDataUsageLogs();
      expect(logs.length).toBeLessThanOrEqual(100);
    });

    it('should handle extraction workflow with full privacy compliance', async () => {
      // Step 1: Check domain permissions
      const canExtract = await privacyManager.canExtractFromDomain('example.com');
      expect(canExtract).toBe(true);
      
      // Step 2: Ensure user consent
      const consent = await privacyManager.ensureExplicitUserConsent();
      expect(consent.granted).toBe(true);
      
      // Step 3: Extract and sanitize content
      const rawContent = 'Article content with email@test.com and phone (555) 123-4567';
      const sanitizedContent = privacyManager.sanitizeContent(rawContent);
      expect(sanitizedContent).not.toContain('email@test.com');
      expect(sanitizedContent).not.toContain('(555) 123-4567');
      
      // Step 4: Create attribution
      const attribution = privacyManager.includeProperAttribution({ text: sanitizedContent });
      expect(attribution.sourceUrl).toBeDefined();
      expect(attribution.attribution).toContain('Content extracted from:');
      
      // Step 5: Verify all actions are logged
      const logs = privacyManager.getDataUsageLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some(log => log.action === 'domain_check_allowed')).toBe(true);
      expect(logs.some(log => log.action === 'consent_granted')).toBe(true);
      expect(logs.some(log => log.action === 'content_sanitization')).toBe(true);
      expect(logs.some(log => log.action === 'attribution_created')).toBe(true);
    });
  });

  describe('Privacy Settings Integration', () => {
    it('should allow customization of privacy settings', () => {
      const customSettings = {
        maxContentSize: 25000,
        dataRetentionHours: 0.5,
        respectRobotsTxt: false,
      };

      const customManager = new PrivacyManager(customSettings);
      const settings = customManager.getPrivacySettings();
      
      expect(settings.maxContentSize).toBe(25000);
      expect(settings.dataRetentionHours).toBe(0.5);
      expect(settings.respectRobotsTxt).toBe(false);
    });

    it('should update settings and log the change', () => {
      const newSettings = {
        maxContentSize: 30000,
        excludeDomains: ['custom-excluded.com'],
      };

      privacyManager.updatePrivacySettings(newSettings);
      
      const settings = privacyManager.getPrivacySettings();
      expect(settings.maxContentSize).toBe(30000);
      expect(settings.excludeDomains).toContain('custom-excluded.com');
      
      // Verify settings update is logged
      const logs = privacyManager.getDataUsageLogs();
      expect(logs.some(log => log.action === 'settings_updated')).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully during domain checks', async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      const canExtract = await privacyManager.canExtractFromDomain('error-domain.com');
      expect(canExtract).toBe(false); // Should fail safely
    });

    it('should handle malformed content gracefully during sanitization', () => {
      const malformedContent = null;
      const sanitized = privacyManager.sanitizeContent(malformedContent as any);
      expect(sanitized).toBe('');
    });

    it('should maintain privacy compliance even during errors', async () => {
      // Simulate error during robots.txt check
      (global.fetch as any).mockRejectedValue(new Error('Fetch failed'));
      
      const canExtract = await privacyManager.canExtractFromDomain('test.com');
      expect(canExtract).toBe(false); // Should default to not allowed on error
      
      // Verify error handling doesn't bypass privacy requirements
      const logs = privacyManager.getDataUsageLogs();
      expect(logs.length).toBeGreaterThan(0); // Should still log the attempt
    });
  });

  describe('Singleton Pattern Integration', () => {
    it('should maintain consistent privacy settings across the application', () => {
      const manager1 = getPrivacyManager();
      const manager2 = getPrivacyManager();
      
      expect(manager1).toBe(manager2);
      
      // Update settings through one instance
      manager1.updatePrivacySettings({ maxContentSize: 40000 });
      
      // Verify settings are reflected in the other reference
      expect(manager2.getPrivacySettings().maxContentSize).toBe(40000);
    });

    it('should allow fresh instance creation after reset', () => {
      const manager1 = getPrivacyManager();
      manager1.logDataUsage('test_action', 100);
      
      resetPrivacyManager();
      const manager2 = getPrivacyManager();
      
      expect(manager1).not.toBe(manager2);
      expect(manager2.getDataUsageLogs()).toHaveLength(0); // Fresh instance
    });
  });

  describe('Requirements Validation', () => {
    it('validates Requirement 6.1: Extract only on explicit user request', async () => {
      // Privacy manager enforces this through consent mechanism
      const consent = await privacyManager.ensureExplicitUserConsent();
      expect(consent.granted).toBe(true);
      
      // Verify the policy enforces this requirement
      const policy = (privacyManager as any).policy;
      expect(policy.extractOnlyOnUserRequest).toBe(true);
    });

    it('validates Requirement 6.2: No analysis data storage during page analysis', () => {
      const policy = (privacyManager as any).policy;
      expect(policy.noAnalysisDataStorage).toBe(true);
      expect(policy.noContentTransmissionDuringAnalysis).toBe(true);
    });

    it('validates Requirement 6.3: Process only necessary content', () => {
      const testContent = 'Necessary content with email@example.com and unnecessary PII';
      const sanitized = privacyManager.sanitizeContent(testContent);
      
      expect(sanitized).toContain('Necessary content');
      expect(sanitized).not.toContain('email@example.com');
      expect(sanitized).toContain('[REDACTED]');
    });

    it('validates Requirement 6.4: Session-limited storage', () => {
      const settings = privacyManager.getPrivacySettings();
      expect(settings.sessionOnlyStorage).toBe(true);
      expect(settings.dataRetentionHours).toBe(1); // Short retention period
      
      const policy = (privacyManager as any).policy;
      expect(policy.sessionLimitedStorage).toBe(true);
    });

    it('validates Requirement 6.5: Respect robots.txt and terms of service', () => {
      const settings = privacyManager.getPrivacySettings();
      expect(settings.respectRobotsTxt).toBe(true);
      
      const policy = (privacyManager as any).policy;
      expect(policy.respectTermsOfService).toBe(true);
    });

    it('validates Requirement 6.6: Include proper attribution', () => {
      const attribution = privacyManager.includeProperAttribution({});
      
      expect(attribution.sourceUrl).toBeDefined();
      expect(attribution.title).toBeDefined();
      expect(attribution.domain).toBeDefined();
      expect(attribution.extractedAt).toBeInstanceOf(Date);
      expect(attribution.attribution).toContain('Content extracted from:');
      
      const policy = (privacyManager as any).policy;
      expect(policy.includeSourceAttribution).toBe(true);
    });
  });
});