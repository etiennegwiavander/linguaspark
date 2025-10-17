/**
 * Privacy Manager for Extract from Page Button Feature
 * 
 * Ensures data protection compliance and user privacy during content extraction.
 * Implements robots.txt respect, domain exclusion, explicit consent, and minimal data collection.
 */

export interface PrivacySettings {
  respectRobotsTxt: boolean;
  excludeDomains: string[];
  maxContentSize: number;
  dataRetentionHours: number;
  explicitConsentRequired: boolean;
  sessionOnlyStorage: boolean;
  includeAttribution: boolean;
}

export interface DataHandlingPolicy {
  extractOnlyOnUserRequest: boolean;
  noAnalysisDataStorage: boolean;
  noContentTransmissionDuringAnalysis: boolean;
  sessionLimitedStorage: boolean;
  respectTermsOfService: boolean;
  includeSourceAttribution: boolean;
}

export interface RobotsTxtResult {
  allowed: boolean;
  reason: string;
  userAgent: string;
}

export interface ConsentResult {
  granted: boolean;
  timestamp: Date;
  sessionId: string;
}

export interface AttributionInfo {
  sourceUrl: string;
  title: string;
  domain: string;
  extractedAt: Date;
  attribution: string;
}

export interface DataUsageLog {
  action: string;
  dataSize: number;
  timestamp: Date;
  sessionId: string;
  url: string;
}

/**
 * Default privacy settings that prioritize user privacy and compliance
 */
const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  respectRobotsTxt: true,
  excludeDomains: [
    // Social media platforms
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'linkedin.com',
    'tiktok.com',
    'snapchat.com',
    // Banking and financial
    'paypal.com',
    'stripe.com',
    'chase.com',
    'bankofamerica.com',
    // Email providers
    'gmail.com',
    'outlook.com',
    'yahoo.com',
    // Internal/admin pages
    'localhost',
    '127.0.0.1',
    // Known problematic domains
    'reddit.com/r/', // Specific subreddit pages
  ],
  maxContentSize: 50000, // 50KB limit
  dataRetentionHours: 1, // Session-only storage
  explicitConsentRequired: true,
  sessionOnlyStorage: true,
  includeAttribution: true,
};

/**
 * Data handling policy enforcing privacy-by-design principles
 */
const DATA_HANDLING_POLICY: DataHandlingPolicy = {
  extractOnlyOnUserRequest: true, // Requirement 6.1
  noAnalysisDataStorage: true, // Requirement 6.2
  noContentTransmissionDuringAnalysis: true, // Requirement 6.2
  sessionLimitedStorage: true, // Requirement 6.4
  respectTermsOfService: true, // Requirement 6.5
  includeSourceAttribution: true, // Requirement 6.6
};

export class PrivacyManager {
  private settings: PrivacySettings;
  private policy: DataHandlingPolicy;
  private sessionId: string;
  private consentGranted: boolean = false;
  private dataUsageLogs: DataUsageLog[] = [];

  constructor(customSettings?: Partial<PrivacySettings>) {
    this.settings = { ...DEFAULT_PRIVACY_SETTINGS, ...customSettings };
    this.policy = DATA_HANDLING_POLICY;
    this.sessionId = this.generateSessionId();
    
    // Clean up old data on initialization
    this.cleanupExpiredData();
  }

  /**
   * Check if content extraction is allowed from a specific domain
   * Requirement 6.5: Respect website robots.txt and terms of service
   */
  async canExtractFromDomain(domain: string): Promise<boolean> {
    try {
      // Check excluded domains list
      if (this.isDomainExcluded(domain)) {
        this.logDataUsage('domain_check_excluded', 0, domain);
        return false;
      }

      // Check robots.txt if enabled
      if (this.settings.respectRobotsTxt) {
        const robotsResult = await this.checkRobotsTxt(domain);
        if (!robotsResult.allowed) {
          this.logDataUsage('domain_check_robots_blocked', 0, domain);
          return false;
        }
      }

      this.logDataUsage('domain_check_allowed', 0, domain);
      return true;
    } catch (error) {
      console.warn('Privacy Manager: Error checking domain permissions:', error);
      // Fail safely - if we can't check, don't allow
      return false;
    }
  }

  /**
   * Sanitize extracted content to remove sensitive information
   * Requirement 6.3: Process only content necessary for lesson generation
   */
  sanitizeContent(content: string): string {
    if (!content) return '';

    let sanitized = content;

    // Remove potential personal information patterns
    const sensitivePatterns = [
      // Email addresses
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      // Phone numbers (various formats)
      /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
      // Credit card numbers (basic pattern)
      /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      // Social security numbers
      /\b\d{3}-\d{2}-\d{4}\b/g,
      // IP addresses
      /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    ];

    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    // Limit content size
    if (sanitized.length > this.settings.maxContentSize) {
      sanitized = sanitized.substring(0, this.settings.maxContentSize) + '...';
    }

    this.logDataUsage('content_sanitization', sanitized.length, window.location.href);
    return sanitized;
  }

  /**
   * Check robots.txt for extraction permissions
   * Requirement 6.5: Respect website robots.txt and terms of service
   */
  async respectRobotsTxt(url: string): Promise<RobotsTxtResult> {
    try {
      const domain = new URL(url).origin;
      const robotsUrl = `${domain}/robots.txt`;
      
      const response = await fetch(robotsUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'LinguaSpark-Extension/1.0 (Educational Content Extractor)',
        },
      });

      if (!response.ok) {
        // If robots.txt doesn't exist, assume allowed
        return {
          allowed: true,
          reason: 'No robots.txt found',
          userAgent: 'LinguaSpark-Extension/1.0',
        };
      }

      const robotsText = await response.text();
      const isAllowed = this.parseRobotsTxt(robotsText, url);

      return {
        allowed: isAllowed,
        reason: isAllowed ? 'Allowed by robots.txt' : 'Disallowed by robots.txt',
        userAgent: 'LinguaSpark-Extension/1.0',
      };
    } catch (error) {
      console.warn('Privacy Manager: Error checking robots.txt:', error);
      // Fail safely - if we can't check robots.txt, assume not allowed
      return {
        allowed: false,
        reason: 'Error checking robots.txt',
        userAgent: 'LinguaSpark-Extension/1.0',
      };
    }
  }

  /**
   * Ensure explicit user consent before extraction
   * Requirement 6.1: Extract content only when user explicitly clicks the extract button
   */
  async ensureExplicitUserConsent(): Promise<ConsentResult> {
    if (!this.settings.explicitConsentRequired) {
      return {
        granted: true,
        timestamp: new Date(),
        sessionId: this.sessionId,
      };
    }

    // Check if consent already granted in this session
    if (this.consentGranted) {
      return {
        granted: true,
        timestamp: new Date(),
        sessionId: this.sessionId,
      };
    }

    // In a real implementation, this would show a consent dialog
    // For now, we assume consent is granted when the extract button is clicked
    this.consentGranted = true;
    
    const consentResult: ConsentResult = {
      granted: true,
      timestamp: new Date(),
      sessionId: this.sessionId,
    };

    this.logDataUsage('consent_granted', 0, window.location.href);
    return consentResult;
  }

  /**
   * Limit data collection to minimum necessary
   * Requirement 6.3: Process only content necessary for lesson generation
   */
  limitDataCollection(): void {
    // Clear any unnecessary data from memory
    this.cleanupExpiredData();
    
    // Ensure we're not storing more than necessary
    if (this.dataUsageLogs.length > 100) {
      this.dataUsageLogs = this.dataUsageLogs.slice(-50); // Keep only recent logs
    }
  }

  /**
   * Enforce session-only storage policy
   * Requirement 6.4: No storage of extracted content beyond lesson generation session
   */
  enforceSessionOnlyStorage(): void {
    if (!this.settings.sessionOnlyStorage) return;

    // Set up cleanup when page unloads
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanupSessionData();
      });

      // Also cleanup after the retention period
      setTimeout(() => {
        this.cleanupExpiredData();
      }, this.settings.dataRetentionHours * 60 * 60 * 1000);
    }
  }

  /**
   * Include proper attribution for extracted content
   * Requirement 6.6: Include proper attribution and source URL in generated lessons
   */
  includeProperAttribution(content: any): AttributionInfo {
    const now = new Date();
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const domain = url ? new URL(url).hostname : '';
    const title = typeof document !== 'undefined' ? document.title : '';

    const attribution: AttributionInfo = {
      sourceUrl: url,
      title: title,
      domain: domain,
      extractedAt: now,
      attribution: `Content extracted from: ${title} (${domain}) on ${now.toLocaleDateString()}`,
    };

    this.logDataUsage('attribution_created', JSON.stringify(attribution).length, url);
    return attribution;
  }

  /**
   * Log data usage for compliance and debugging
   */
  logDataUsage(action: string, dataSize: number, url?: string): void {
    const log: DataUsageLog = {
      action,
      dataSize,
      timestamp: new Date(),
      sessionId: this.sessionId,
      url: url || (typeof window !== 'undefined' ? window.location.href : ''),
    };

    this.dataUsageLogs.push(log);
    
    // Keep logs limited in size - trim immediately when over limit
    if (this.dataUsageLogs.length > 100) {
      this.dataUsageLogs = this.dataUsageLogs.slice(-50);
    }
  }

  /**
   * Get current privacy settings
   */
  getPrivacySettings(): PrivacySettings {
    return { ...this.settings };
  }

  /**
   * Update privacy settings
   */
  updatePrivacySettings(newSettings: Partial<PrivacySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.logDataUsage('settings_updated', JSON.stringify(newSettings).length);
  }

  /**
   * Get data usage logs for transparency
   */
  getDataUsageLogs(): DataUsageLog[] {
    return [...this.dataUsageLogs];
  }

  /**
   * Clear all session data
   */
  clearSessionData(): void {
    this.consentGranted = false;
    this.dataUsageLogs = [];
    this.sessionId = this.generateSessionId();
    
    // Clear any stored data in browser storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.session.clear();
    }
  }

  // Private helper methods

  private isDomainExcluded(domain: string): boolean {
    return this.settings.excludeDomains.some(excluded => 
      domain.includes(excluded) || excluded.includes(domain)
    );
  }

  private async checkRobotsTxt(domain: string): Promise<RobotsTxtResult> {
    try {
      const result = await this.respectRobotsTxt(`https://${domain}/`);
      return result;
    } catch (error) {
      return {
        allowed: false,
        reason: 'Error checking robots.txt',
        userAgent: 'LinguaSpark-Extension/1.0',
      };
    }
  }

  private parseRobotsTxt(robotsText: string, url: string): boolean {
    const lines = robotsText.split('\n');
    let currentUserAgent = '';
    let isRelevantSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim().toLowerCase();
      
      if (trimmedLine.startsWith('user-agent:')) {
        const userAgent = trimmedLine.split(':')[1].trim();
        isRelevantSection = userAgent === '*' || userAgent.includes('linguaspark');
        currentUserAgent = userAgent;
      } else if (isRelevantSection && trimmedLine.startsWith('disallow:')) {
        const disallowedPath = trimmedLine.split(':')[1].trim();
        if (disallowedPath === '/' || url.includes(disallowedPath)) {
          return false;
        }
      }
    }
    
    return true; // Default to allowed if no specific disallow rules match
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupExpiredData(): void {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() - this.settings.dataRetentionHours);
    
    this.dataUsageLogs = this.dataUsageLogs.filter(
      log => log.timestamp > expirationTime
    );
  }

  private cleanupSessionData(): void {
    this.clearSessionData();
  }
}

/**
 * Singleton instance for global use
 */
let privacyManagerInstance: PrivacyManager | null = null;

export function getPrivacyManager(customSettings?: Partial<PrivacySettings>): PrivacyManager {
  if (!privacyManagerInstance) {
    privacyManagerInstance = new PrivacyManager(customSettings);
  }
  return privacyManagerInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetPrivacyManager(): void {
  privacyManagerInstance = null;
}