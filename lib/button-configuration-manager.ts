/**
 * Button Configuration Manager
 * Handles user preferences for the floating action button including position, appearance, and behavior
 */

export interface ButtonConfiguration {
  // Position and sizing preferences
  position: {
    x: number;
    y: number;
    edge: 'left' | 'right' | 'top' | 'bottom' | 'none';
  };
  size: 'small' | 'medium' | 'large';
  
  // Appearance preferences
  theme: 'light' | 'dark' | 'auto';
  opacity: number; // 0.1 to 1.0
  
  // Behavior preferences
  dragEnabled: boolean;
  snapToEdges: boolean;
  showOnHover: boolean;
  
  // Mascot preferences
  mascotEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  sparkEffects: boolean;
  
  // Keyboard shortcuts
  keyboardShortcut: string;
  
  // Privacy settings
  respectRobotsTxt: boolean;
  excludeDomains: string[];
  showPrivacyNotice: boolean;
}

export interface DomainSpecificSettings {
  domain: string;
  position: { x: number; y: number };
  enabled: boolean;
  lastUsed: Date;
}

export interface UserPreferences {
  buttonConfig: ButtonConfiguration;
  domainSettings: Record<string, DomainSpecificSettings>;
  privacySettings: {
    dataCollection: boolean;
    analytics: boolean;
    errorReporting: boolean;
  };
}

export class ButtonConfigurationManager {
  private static instance: ButtonConfigurationManager;
  private preferences: UserPreferences;
  private readonly STORAGE_KEY = 'linguaspark_button_config';
  private readonly DOMAIN_SETTINGS_KEY = 'linguaspark_domain_settings';

  private constructor() {
    this.preferences = this.getDefaultPreferences();
  }

  public static getInstance(): ButtonConfigurationManager {
    if (!ButtonConfigurationManager.instance) {
      ButtonConfigurationManager.instance = new ButtonConfigurationManager();
    }
    return ButtonConfigurationManager.instance;
  }

  /**
   * Get default configuration values
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      buttonConfig: {
        position: { x: 20, y: 20, edge: 'right' },
        size: 'medium',
        theme: 'auto',
        opacity: 0.9,
        dragEnabled: true,
        snapToEdges: true,
        showOnHover: false,
        mascotEnabled: true,
        animationSpeed: 'normal',
        sparkEffects: true,
        keyboardShortcut: 'Alt+E',
        respectRobotsTxt: true,
        excludeDomains: [],
        showPrivacyNotice: true,
      },
      domainSettings: {},
      privacySettings: {
        dataCollection: false,
        analytics: false,
        errorReporting: true,
      },
    };
  }

  /**
   * Load user preferences from storage
   */
  public async loadPreferences(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get([
          this.STORAGE_KEY,
          this.DOMAIN_SETTINGS_KEY,
        ]);
        
        if (result[this.STORAGE_KEY]) {
          this.preferences = {
            ...this.preferences,
            ...result[this.STORAGE_KEY],
          };
        }
        
        if (result[this.DOMAIN_SETTINGS_KEY]) {
          this.preferences.domainSettings = result[this.DOMAIN_SETTINGS_KEY];
        }
      } else {
        // Fallback to localStorage for testing
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.preferences = { ...this.preferences, ...JSON.parse(stored) };
        }
      }
    } catch (error) {
      console.warn('Failed to load button preferences:', error);
    }
  }

  /**
   * Save user preferences to storage
   */
  public async savePreferences(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set({
          [this.STORAGE_KEY]: this.preferences,
          [this.DOMAIN_SETTINGS_KEY]: this.preferences.domainSettings,
        });
      } else {
        // Fallback to localStorage for testing
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferences));
      }
    } catch (error) {
      console.warn('Failed to save button preferences:', error);
    }
  }

  /**
   * Get current button configuration
   */
  public getButtonConfiguration(): ButtonConfiguration {
    return { ...this.preferences.buttonConfig };
  }

  /**
   * Update button configuration
   */
  public async updateButtonConfiguration(
    updates: Partial<ButtonConfiguration>
  ): Promise<void> {
    this.preferences.buttonConfig = {
      ...this.preferences.buttonConfig,
      ...updates,
    };
    await this.savePreferences();
  }

  /**
   * Get domain-specific position for current domain
   */
  public getDomainPosition(domain: string): { x: number; y: number } | null {
    const domainSettings = this.preferences.domainSettings[domain];
    if (domainSettings && domainSettings.enabled) {
      return domainSettings.position;
    }
    return null;
  }

  /**
   * Save position for specific domain
   */
  public async saveDomainPosition(
    domain: string,
    position: { x: number; y: number }
  ): Promise<void> {
    this.preferences.domainSettings[domain] = {
      domain,
      position,
      enabled: true,
      lastUsed: new Date(),
    };
    await this.savePreferences();
  }

  /**
   * Check if button should be enabled for domain
   */
  public isDomainEnabled(domain: string): boolean {
    const domainSettings = this.preferences.domainSettings[domain];
    if (domainSettings) {
      return domainSettings.enabled;
    }
    
    // Check if domain is in exclude list
    return !this.preferences.buttonConfig.excludeDomains.some(excludeDomain =>
      domain.includes(excludeDomain)
    );
  }

  /**
   * Add domain to exclude list
   */
  public async excludeDomain(domain: string): Promise<void> {
    if (!this.preferences.buttonConfig.excludeDomains.includes(domain)) {
      this.preferences.buttonConfig.excludeDomains.push(domain);
      await this.savePreferences();
    }
  }

  /**
   * Remove domain from exclude list
   */
  public async includeDomain(domain: string): Promise<void> {
    this.preferences.buttonConfig.excludeDomains = 
      this.preferences.buttonConfig.excludeDomains.filter(d => d !== domain);
    await this.savePreferences();
  }

  /**
   * Get privacy settings
   */
  public getPrivacySettings() {
    return { ...this.preferences.privacySettings };
  }

  /**
   * Update privacy settings
   */
  public async updatePrivacySettings(
    updates: Partial<UserPreferences['privacySettings']>
  ): Promise<void> {
    this.preferences.privacySettings = {
      ...this.preferences.privacySettings,
      ...updates,
    };
    await this.savePreferences();
  }

  /**
   * Reset to default preferences
   */
  public async resetToDefaults(): Promise<void> {
    this.preferences = this.getDefaultPreferences();
    await this.savePreferences();
  }

  /**
   * Export preferences for backup
   */
  public exportPreferences(): string {
    return JSON.stringify(this.preferences, null, 2);
  }

  /**
   * Import preferences from backup
   */
  public async importPreferences(preferencesJson: string): Promise<void> {
    try {
      const imported = JSON.parse(preferencesJson);
      this.preferences = { ...this.getDefaultPreferences(), ...imported };
      await this.savePreferences();
    } catch (error) {
      throw new Error('Invalid preferences format');
    }
  }

  /**
   * Get smart position based on viewport and existing elements
   */
  public getSmartPosition(
    viewport: { width: number; height: number },
    existingElements: DOMRect[] = []
  ): { x: number; y: number } {
    const config = this.preferences.buttonConfig;
    const buttonSize = this.getButtonSize();
    
    // Start with saved position or default
    let { x, y } = config.position;
    
    // Adjust for viewport boundaries
    x = Math.max(10, Math.min(x, viewport.width - buttonSize - 10));
    y = Math.max(10, Math.min(y, viewport.height - buttonSize - 10));
    
    // Avoid overlapping with existing elements
    const buttonRect = { x, y, width: buttonSize, height: buttonSize };
    
    for (const element of existingElements) {
      if (this.rectsOverlap(buttonRect, element)) {
        // Try moving to different positions
        const alternatives = [
          { x: element.right + 10, y },
          { x: element.left - buttonSize - 10, y },
          { x, y: element.bottom + 10 },
          { x, y: element.top - buttonSize - 10 },
        ];
        
        for (const alt of alternatives) {
          if (
            alt.x >= 10 &&
            alt.x <= viewport.width - buttonSize - 10 &&
            alt.y >= 10 &&
            alt.y <= viewport.height - buttonSize - 10
          ) {
            x = alt.x;
            y = alt.y;
            break;
          }
        }
      }
    }
    
    return { x, y };
  }

  /**
   * Get button size in pixels based on configuration
   */
  public getButtonSize(): number {
    const sizeMap = {
      small: 48,
      medium: 64,
      large: 80,
    };
    return sizeMap[this.preferences.buttonConfig.size];
  }

  /**
   * Check if two rectangles overlap
   */
  private rectsOverlap(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: DOMRect
  ): boolean {
    return !(
      rect1.x + rect1.width < rect2.left ||
      rect2.right < rect1.x ||
      rect1.y + rect1.height < rect2.top ||
      rect2.bottom < rect1.y
    );
  }

  /**
   * Validate keyboard shortcut format
   */
  public isValidKeyboardShortcut(shortcut: string): boolean {
    const validModifiers = ['Ctrl', 'Alt', 'Shift', 'Meta'];
    const parts = shortcut.split('+');
    
    if (parts.length < 2) return false;
    
    const modifiers = parts.slice(0, -1);
    const key = parts[parts.length - 1];
    
    return (
      modifiers.every(mod => validModifiers.includes(mod)) &&
      key.length === 1 &&
      /[A-Za-z0-9]/.test(key)
    );
  }
}