/**
 * Usage Monitor System
 * 
 * Provides comprehensive logging and monitoring for AI lesson generation,
 * tracking token usage, errors, and optimization savings.
 */

export interface UsageMetrics {
  totalTokens: number;
  tokensPerSection: Record<string, number>;
  optimizationSavings: number;
  generationTime: number;
  timestamp: Date;
}

export interface UsageLogEntry {
  id: string;
  timestamp: Date;
  section: string;
  tokens: number;
  optimization: string;
  userId?: string;
  lessonId?: string;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  errorType: string;
  errorMessage: string;
  context: Record<string, any>;
  userId?: string;
  lessonId?: string;
  stackTrace?: string;
}

export interface OptimizationLogEntry {
  id: string;
  timestamp: Date;
  strategy: string;
  baselineTokens: number;
  optimizedTokens: number;
  savingsPercentage: number;
  userId?: string;
  lessonId?: string;
}

export interface UsageReport {
  period: {
    start: Date;
    end: Date;
  };
  totalLessons: number;
  totalTokens: number;
  averageTokensPerLesson: number;
  totalOptimizationSavings: number;
  errorRate: number;
  topOptimizationStrategies: Array<{
    strategy: string;
    usage: number;
    averageSavings: number;
  }>;
  errorBreakdown: Record<string, number>;
  sectionTokenBreakdown: Record<string, number>;
}

export interface GenerationContext {
  userId?: string;
  lessonId?: string;
  lessonType?: string;
  difficultyLevel?: string;
  contentLength?: number;
  timestamp: Date;
}

/**
 * Usage Monitor Interface
 * 
 * Defines the contract for monitoring AI usage, errors, and optimizations
 */
export interface UsageMonitor {
  /**
   * Log token usage for a specific lesson section
   */
  logTokenUsage(
    section: string, 
    tokens: number, 
    optimization: string, 
    context?: GenerationContext
  ): void;

  /**
   * Log errors with specific context for debugging
   */
  logError(
    error: Error, 
    errorType: string, 
    context: GenerationContext
  ): void;

  /**
   * Track optimization savings achieved
   */
  logOptimizationSavings(
    baseline: number, 
    optimized: number, 
    strategy: string, 
    context?: GenerationContext
  ): void;

  /**
   * Generate comprehensive usage report
   */
  generateUsageReport(startDate?: Date, endDate?: Date): Promise<UsageReport>;

  /**
   * Get usage metrics for a specific lesson
   */
  getLessonMetrics(lessonId: string): Promise<UsageMetrics | null>;

  /**
   * Clear old logs (for maintenance)
   */
  clearOldLogs(olderThanDays: number): Promise<void>;
}

/**
 * In-Memory Usage Monitor Implementation
 * 
 * Stores usage data in memory with optional persistence to console/external systems.
 * In production, this could be extended to use a database or external logging service.
 */
export class InMemoryUsageMonitor implements UsageMonitor {
  private usageLogs: UsageLogEntry[] = [];
  private errorLogs: ErrorLogEntry[] = [];
  private optimizationLogs: OptimizationLogEntry[] = [];
  private readonly maxLogEntries = 10000; // Prevent memory overflow

  /**
   * Generate unique ID for log entries
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log token usage for a lesson section
   */
  logTokenUsage(
    section: string, 
    tokens: number, 
    optimization: string, 
    context?: GenerationContext
  ): void {
    const entry: UsageLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      section,
      tokens,
      optimization,
      userId: context?.userId,
      lessonId: context?.lessonId
    };

    this.usageLogs.push(entry);
    this.trimLogs();

    // Console logging for development
    console.log(`[UsageMonitor] Token usage - Section: ${section}, Tokens: ${tokens}, Optimization: ${optimization}`);
  }

  /**
   * Log errors with context
   */
  logError(
    error: Error, 
    errorType: string, 
    context: GenerationContext
  ): void {
    const entry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      errorType,
      errorMessage: error.message,
      context: {
        lessonType: context.lessonType,
        difficultyLevel: context.difficultyLevel,
        contentLength: context.contentLength,
        timestamp: context.timestamp
      },
      userId: context.userId,
      lessonId: context.lessonId,
      stackTrace: error.stack
    };

    this.errorLogs.push(entry);
    this.trimLogs();

    // Console logging for development
    console.error(`[UsageMonitor] Error - Type: ${errorType}, Message: ${error.message}`, {
      context,
      errorId: entry.id
    });
  }

  /**
   * Log optimization savings
   */
  logOptimizationSavings(
    baseline: number, 
    optimized: number, 
    strategy: string, 
    context?: GenerationContext
  ): void {
    const savings = baseline - optimized;
    const savingsPercentage = baseline > 0 ? (savings / baseline) * 100 : 0;

    const entry: OptimizationLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      strategy,
      baselineTokens: baseline,
      optimizedTokens: optimized,
      savingsPercentage,
      userId: context?.userId,
      lessonId: context?.lessonId
    };

    this.optimizationLogs.push(entry);
    this.trimLogs();

    // Console logging for development
    console.log(`[UsageMonitor] Optimization - Strategy: ${strategy}, Savings: ${savings} tokens (${savingsPercentage.toFixed(1)}%)`);
  }

  /**
   * Generate comprehensive usage report
   */
  async generateUsageReport(startDate?: Date, endDate?: Date): Promise<UsageReport> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
    const end = endDate || new Date();

    // Filter logs by date range
    const filteredUsageLogs = this.usageLogs.filter(
      log => log.timestamp >= start && log.timestamp <= end
    );
    const filteredErrorLogs = this.errorLogs.filter(
      log => log.timestamp >= start && log.timestamp <= end
    );
    const filteredOptimizationLogs = this.optimizationLogs.filter(
      log => log.timestamp >= start && log.timestamp <= end
    );

    // Calculate metrics
    const uniqueLessons = new Set(filteredUsageLogs.map(log => log.lessonId).filter(Boolean));
    const totalLessons = uniqueLessons.size;
    const totalTokens = filteredUsageLogs.reduce((sum, log) => sum + log.tokens, 0);
    const averageTokensPerLesson = totalLessons > 0 ? totalTokens / totalLessons : 0;

    const totalOptimizationSavings = filteredOptimizationLogs.reduce(
      (sum, log) => sum + (log.baselineTokens - log.optimizedTokens), 0
    );

    const errorRate = totalLessons > 0 ? (filteredErrorLogs.length / totalLessons) * 100 : 0;

    // Top optimization strategies
    const strategyStats = new Map<string, { usage: number; totalSavings: number }>();
    filteredOptimizationLogs.forEach(log => {
      const current = strategyStats.get(log.strategy) || { usage: 0, totalSavings: 0 };
      current.usage++;
      current.totalSavings += (log.baselineTokens - log.optimizedTokens);
      strategyStats.set(log.strategy, current);
    });

    const topOptimizationStrategies = Array.from(strategyStats.entries())
      .map(([strategy, stats]) => ({
        strategy,
        usage: stats.usage,
        averageSavings: stats.usage > 0 ? stats.totalSavings / stats.usage : 0
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);

    // Error breakdown
    const errorBreakdown: Record<string, number> = {};
    filteredErrorLogs.forEach(log => {
      errorBreakdown[log.errorType] = (errorBreakdown[log.errorType] || 0) + 1;
    });

    // Section token breakdown
    const sectionTokenBreakdown: Record<string, number> = {};
    filteredUsageLogs.forEach(log => {
      sectionTokenBreakdown[log.section] = (sectionTokenBreakdown[log.section] || 0) + log.tokens;
    });

    return {
      period: { start, end },
      totalLessons,
      totalTokens,
      averageTokensPerLesson,
      totalOptimizationSavings,
      errorRate,
      topOptimizationStrategies,
      errorBreakdown,
      sectionTokenBreakdown
    };
  }

  /**
   * Get usage metrics for a specific lesson
   */
  async getLessonMetrics(lessonId: string): Promise<UsageMetrics | null> {
    const lessonLogs = this.usageLogs.filter(log => log.lessonId === lessonId);
    
    if (lessonLogs.length === 0) {
      return null;
    }

    const totalTokens = lessonLogs.reduce((sum, log) => sum + log.tokens, 0);
    
    const tokensPerSection: Record<string, number> = {};
    lessonLogs.forEach(log => {
      tokensPerSection[log.section] = (tokensPerSection[log.section] || 0) + log.tokens;
    });

    // Calculate optimization savings for this lesson
    const lessonOptimizationLogs = this.optimizationLogs.filter(log => log.lessonId === lessonId);
    const optimizationSavings = lessonOptimizationLogs.reduce(
      (sum, log) => sum + (log.baselineTokens - log.optimizedTokens), 0
    );

    // Calculate generation time (time between first and last log entry)
    const timestamps = lessonLogs.map(log => log.timestamp.getTime()).sort();
    const generationTime = timestamps.length > 1 ? timestamps[timestamps.length - 1] - timestamps[0] : 0;

    return {
      totalTokens,
      tokensPerSection,
      optimizationSavings,
      generationTime,
      timestamp: new Date(timestamps[0])
    };
  }

  /**
   * Clear old logs to prevent memory overflow
   */
  async clearOldLogs(olderThanDays: number): Promise<void> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    const initialUsageCount = this.usageLogs.length;
    const initialErrorCount = this.errorLogs.length;
    const initialOptimizationCount = this.optimizationLogs.length;

    this.usageLogs = this.usageLogs.filter(log => log.timestamp >= cutoffDate);
    this.errorLogs = this.errorLogs.filter(log => log.timestamp >= cutoffDate);
    this.optimizationLogs = this.optimizationLogs.filter(log => log.timestamp >= cutoffDate);

    const clearedUsage = initialUsageCount - this.usageLogs.length;
    const clearedErrors = initialErrorCount - this.errorLogs.length;
    const clearedOptimizations = initialOptimizationCount - this.optimizationLogs.length;

    console.log(`[UsageMonitor] Cleared old logs: ${clearedUsage} usage, ${clearedErrors} errors, ${clearedOptimizations} optimizations`);
  }

  /**
   * Trim logs to prevent memory overflow
   */
  private trimLogs(): void {
    if (this.usageLogs.length > this.maxLogEntries) {
      this.usageLogs = this.usageLogs.slice(-this.maxLogEntries);
    }
    if (this.errorLogs.length > this.maxLogEntries) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogEntries);
    }
    if (this.optimizationLogs.length > this.maxLogEntries) {
      this.optimizationLogs = this.optimizationLogs.slice(-this.maxLogEntries);
    }
  }

  /**
   * Get current log counts (for debugging)
   */
  getLogCounts(): { usage: number; errors: number; optimizations: number } {
    return {
      usage: this.usageLogs.length,
      errors: this.errorLogs.length,
      optimizations: this.optimizationLogs.length
    };
  }

  /**
   * Export logs for external analysis
   */
  exportLogs(): {
    usage: UsageLogEntry[];
    errors: ErrorLogEntry[];
    optimizations: OptimizationLogEntry[];
  } {
    return {
      usage: [...this.usageLogs],
      errors: [...this.errorLogs],
      optimizations: [...this.optimizationLogs]
    };
  }
}

// Singleton instance for global usage monitoring
export const usageMonitor = new InMemoryUsageMonitor();