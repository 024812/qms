/**
 * System Settings Repository
 *
 * Handles database operations for system-wide settings
 */

import { db, Tx } from '@/db';
import { systemSettings } from '@/db/schema';
import { dbLogger } from '@/lib/logger';
import { BaseRepositoryImpl } from './base.repository';
import { eq, sql } from 'drizzle-orm';

export interface SystemSettingRow {
  id: string;
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function rowToSystemSetting(row: SystemSettingRow): SystemSetting {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    description: row.description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SystemSettingsRepository extends BaseRepositoryImpl<SystemSettingRow, SystemSetting> {
  protected tableName = 'system_settings';

  protected rowToModel(row: SystemSettingRow): SystemSetting {
    return rowToSystemSetting(row);
  }

  protected modelToRow(model: Partial<SystemSetting>): Partial<SystemSettingRow> {
    return {
      id: model.id,
      key: model.key,
      value: model.value,
      description: model.description,
      created_at: model.createdAt?.toISOString(),
      updated_at: model.updatedAt?.toISOString(),
    };
  }

  /**
   * Get a setting by key
   */
  async getSetting(key: string, tx?: Tx): Promise<string | null> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        const rows = await d
          .select({ value: systemSettings.value })
          .from(systemSettings)
          .where(eq(systemSettings.key, key))
          .limit(1);

        return rows[0]?.value || null;
      },
      'getSetting',
      { key }
    );
  }

  /**
   * Set a setting value (insert or update)
   */
  async setSetting(key: string, value: string, description?: string, tx?: Tx): Promise<void> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        const now = new Date();

        // Check if exists using count or direct query?
        // Use insert on conflict update

        await d
          .insert(systemSettings)
          .values({
            key,
            value,
            description: description || null,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: systemSettings.key,
            set: {
              value,
              description: description
                ? description
                : sql`COALESCE(${description}::text, system_settings.description)`,
              updatedAt: now,
            },
          });

        dbLogger.info('Setting updated', { key });
      },
      'setSetting',
      { key }
    );
  }

  /**
   * Get all settings
   */
  async getAllSettings(tx?: Tx): Promise<Record<string, string>> {
    return this.executeQuery(async () => {
      const d = tx || db;
      const rows = await d
        .select({ key: systemSettings.key, value: systemSettings.value })
        .from(systemSettings);

      const settings: Record<string, string> = {};
      rows.forEach(row => {
        settings[row.key] = row.value;
      });

      return settings;
    }, 'getAllSettings');
  }

  /**
   * Delete a setting
   */
  async deleteSetting(key: string, tx?: Tx): Promise<boolean> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        const result = await d
          .delete(systemSettings)
          .where(eq(systemSettings.key, key))
          .returning({ key: systemSettings.key });

        const success = result.length > 0;
        if (success) {
          dbLogger.info('Setting deleted', { key });
        }
        return success;
      },
      'deleteSetting',
      { key }
    );
  }

  /**
   * Get password hash
   */
  async getPasswordHash(tx?: Tx): Promise<string | null> {
    return this.getSetting('password_hash', tx);
  }

  /**
   * Update password hash
   */
  async updatePasswordHash(hash: string, tx?: Tx): Promise<void> {
    return this.setSetting('password_hash', hash, 'Bcrypt hash of the admin password', tx);
  }

  /**
   * Get app name
   */
  async getAppName(tx?: Tx): Promise<string> {
    const name = await this.getSetting('app_name', tx);
    return name || 'QMS - Quilt Management System';
  }

  /**
   * Update app name
   */
  async updateAppName(name: string, tx?: Tx): Promise<void> {
    return this.setSetting('app_name', name, 'Application display name', tx);
  }

  /**
   * Get double click action
   */
  async getDoubleClickAction(tx?: Tx): Promise<string | null> {
    return this.getSetting('double_click_action', tx);
  }

  /**
   * Update double click action
   */
  async updateDoubleClickAction(
    action: 'none' | 'view' | 'status' | 'edit',
    tx?: Tx
  ): Promise<void> {
    return this.setSetting(
      'double_click_action',
      action,
      'Double click behavior in quilt list',
      tx
    );
  }

  /**
   * Get usage double click action
   */
  async getUsageDoubleClickAction(tx?: Tx): Promise<string | null> {
    return this.getSetting('usage_double_click_action', tx);
  }

  /**
   * Update usage double click action
   */
  async updateUsageDoubleClickAction(action: 'none' | 'view' | 'edit', tx?: Tx): Promise<void> {
    return this.setSetting(
      'usage_double_click_action',
      action,
      'Double click behavior in usage record list',
      tx
    );
  }

  /**
   * Get Azure OpenAI Configuration
   */
  async getAzureOpenAIConfig(tx?: Tx) {
    const [apiKey, endpoint, deployment] = await Promise.all([
      this.getSetting('azure_openai_api_key', tx),
      this.getSetting('azure_openai_endpoint', tx),
      this.getSetting('azure_openai_deployment', tx),
    ]);

    return {
      apiKey,
      endpoint,
      deployment,
    };
  }

  /**
   * Update Azure OpenAI Configuration
   */
  async updateAzureOpenAIConfig(
    config: { apiKey: string; endpoint: string; deployment: string },
    tx?: Tx
  ): Promise<void> {
    await Promise.all([
      this.setSetting('azure_openai_api_key', config.apiKey, 'Azure OpenAI API Key', tx),
      this.setSetting('azure_openai_endpoint', config.endpoint, 'Azure OpenAI Endpoint', tx),
      this.setSetting(
        'azure_openai_deployment',
        config.deployment,
        'Azure OpenAI Deployment Name',
        tx
      ),
    ]);
  }
  /**
   * Get eBay API Configuration
   */
  async getEbayApiConfig(tx?: Tx) {
    const [appId, certId, devId] = await Promise.all([
      this.getSetting('ebay_app_id', tx),
      this.getSetting('ebay_cert_id', tx),
      this.getSetting('ebay_dev_id', tx),
    ]);

    return {
      appId,
      certId,
      devId,
    };
  }

  /**
   * Update eBay API Configuration
   */
  async updateEbayApiConfig(
    config: { appId: string; certId: string; devId?: string },
    tx?: Tx
  ): Promise<void> {
    const promises = [
      this.setSetting('ebay_app_id', config.appId, 'eBay App ID (Client ID)', tx),
      this.setSetting('ebay_cert_id', config.certId, 'eBay Cert ID (Client Secret)', tx),
    ];

    if (config.devId) {
      promises.push(this.setSetting('ebay_dev_id', config.devId, 'eBay Dev ID', tx));
    }

    await Promise.all(promises);
  }

  /**
   * Get Rapid API Key
   */
  async getRapidApiKey(tx?: Tx): Promise<string | null> {
    return this.getSetting('rapid_api_key', tx);
  }

  /**
   * Update Rapid API Key
   */
  async updateRapidApiKey(key: string, tx?: Tx): Promise<void> {
    return this.setSetting('rapid_api_key', key, 'Rapid API Key for API-NBA', tx);
  }
}

// Export singleton instance
export const systemSettingsRepository = new SystemSettingsRepository();
