import { Business } from '../../models/Business';
import { MetaWhatsAppService } from './metaWhatsAppService';
import logger from '../../utils/logger';

export interface HealthCheckResult {
  subDomain: string;
  localId?: string;
  isHealthy: boolean;
  reason?: string;
  timestamp: Date;
  details: any;
}

export interface MonitoringConfig {
  checkIntervalMinutes?: number; // Default: 15 minutes
  alertOnFailure?: boolean; // Default: true
  alertOnTokenExpiry?: boolean; // Default: true
  tokenExpiryWarningDays?: number; // Default: 7 days
}

class WhatsAppHealthMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private isChecking: boolean = false;
  private config: MonitoringConfig;
  private failureCounts: Map<string, number> = new Map();
  private readonly MAX_FAILURES = 5;

  constructor(config: MonitoringConfig = {}) {
    this.config = {
      checkIntervalMinutes: config.checkIntervalMinutes || 15,
      alertOnFailure: config.alertOnFailure !== false,
      alertOnTokenExpiry: config.alertOnTokenExpiry !== false,
      tokenExpiryWarningDays: config.tokenExpiryWarningDays || 7,
    };
  }

  /**
   * Start proactive health monitoring
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('WhatsApp health monitor is already running');
      return;
    }

    this.isRunning = true;
    const intervalMs = (this.config.checkIntervalMinutes || 15) * 60 * 1000;

    logger.info(`Starting WhatsApp health monitor (interval: ${this.config.checkIntervalMinutes} minutes)`);

    // Run immediately on start
    this.checkAllBusinesses().catch((error) => {
      logger.error('Error in initial health check:', error);
    });

    // Then run on interval
    this.monitoringInterval = setInterval(() => {
      this.checkAllBusinesses().catch((error) => {
        logger.error('Error in scheduled health check:', error);
      });
    }, intervalMs);
  }

  /**
   * Stop proactive health monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isChecking = false; // Reset checking flag
    this.isRunning = false;
    logger.info('WhatsApp health monitor stopped');
  }

  /**
   * Check health for all active businesses with WhatsApp configured
   */
  private async checkAllBusinesses(): Promise<void> {
    if (this.isChecking) {
      logger.warn('Health check already in progress, skipping');
      return;
    }
    
    this.isChecking = true;
    try {
      logger.info('Running proactive WhatsApp health check for all businesses');

      const businesses = await Business.find({
        isActive: true,
        wabaId: { $exists: true, $ne: null },
        whatsappPhoneNumberIds: { $exists: true, $ne: [] },
      }).select('subDomain wabaId whatsappPhoneNumberIds whatsappTokenExpiresAt');

      logger.info(`Found ${businesses.length} active businesses with WhatsApp configured`);

      const results: HealthCheckResult[] = [];
      const unhealthy: HealthCheckResult[] = [];

      for (const business of businesses) {
        // Circuit breaker: skip businesses with too many consecutive failures
        const failureCount = this.failureCounts.get(business.subDomain) || 0;
        if (failureCount >= this.MAX_FAILURES) {
          logger.warn(`Skipping ${business.subDomain} - ${failureCount} consecutive failures`);
          continue;
        }

        try {
          const health = await MetaWhatsAppService.checkHealth(business.subDomain);

          const result: HealthCheckResult = {
            subDomain: business.subDomain,
            isHealthy: health.isHealthy,
            reason: health.reason,
            timestamp: new Date(),
            details: health.details,
          };

          results.push(result);

          if (!health.isHealthy) {
            unhealthy.push(result);
            logger.warn(`Unhealthy WhatsApp detected for business: ${business.subDomain}`, {
              reason: health.reason,
            });

            if (this.config.alertOnFailure) {
              await this.alertOnFailure(result);
            }
            // Increment failure count
            this.failureCounts.set(business.subDomain, failureCount + 1);
          } else {
            // Reset failure count on success
            this.failureCounts.delete(business.subDomain);
          }

          // Check token expiration
          if (business.whatsappTokenExpiresAt && this.config.alertOnTokenExpiry) {
            const expiresAt = new Date(business.whatsappTokenExpiresAt);
            const now = new Date();
            const daysUntilExpiry = Math.floor(
              (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiry <= (this.config.tokenExpiryWarningDays || 7) && daysUntilExpiry > 0) {
              logger.warn(`WhatsApp token expiring soon for business: ${business.subDomain}`, {
                daysUntilExpiry,
              });
              await this.alertOnTokenExpiry(business.subDomain, daysUntilExpiry);
            }
          }
        } catch (error: any) {
          logger.error(`Error checking health for business ${business.subDomain}:`, error);
          // Increment failure count on error
          this.failureCounts.set(business.subDomain, failureCount + 1);
        }
      }

      logger.info(`Health check completed: ${results.length} businesses checked, ${unhealthy.length} unhealthy`);
    } catch (error: any) {
      logger.error('Error in proactive health check:', error);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Check health for a specific business
   */
  async checkBusiness(subDomain: string, localId?: string): Promise<HealthCheckResult> {
    try {
      const health = await MetaWhatsAppService.checkHealth(subDomain, localId);

      return {
        subDomain,
        localId,
        isHealthy: health.isHealthy,
        reason: health.reason,
        timestamp: new Date(),
        details: health.details,
      };
    } catch (error: any) {
      logger.error(`Error checking health for business ${subDomain}:`, error);
      throw error;
    }
  }

  /**
   * Alert on health failure
   */
  private async alertOnFailure(result: HealthCheckResult): Promise<void> {
    // TODO: Implement alerting mechanism (email, webhook, etc.)
    logger.error(`ALERT: WhatsApp unhealthy for business ${result.subDomain}`, {
      reason: result.reason,
      details: result.details,
    });
    // You can add email notifications, webhook calls, etc. here
  }

  /**
   * Alert on token expiration
   */
  private async alertOnTokenExpiry(subDomain: string, daysUntilExpiry: number): Promise<void> {
    // TODO: Implement alerting mechanism
    logger.warn(`ALERT: WhatsApp token expiring for business ${subDomain} in ${daysUntilExpiry} days`);
    // You can add email notifications, webhook calls, etc. here
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isRunning: boolean;
    config: MonitoringConfig;
    lastCheckTime?: Date;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
    };
  }
}

// Export singleton instance
export const whatsappHealthMonitor = new WhatsAppHealthMonitor();

