#!/usr/bin/env node

/**
 * AB Tasty Decision API - Example Script (JavaScript)
 * 
 * This script demonstrates how to call the AB Tasty Decision API
 * to retrieve campaigns, feature flags, and track activations.
 * 
 * Self-contained: Uses only native Node.js APIs (https module)
 * 
 * Prerequisites:
 * - Node.js 14+
 * - Set AB_TASTY_ENV_ID environment variable
 * - Set AB_TASTY_API_KEY environment variable
 * 
 * Usage:
 *   node call-decision-api.js
 */

const https = require('https');

class DecisionAPIClient {
  constructor(config) {
    this.config = {
      api_url: 'https://decision.flagship.io/v2',
      timeout: 5000,
      ...config,
    };

    const url = new URL(this.config.api_url);
    this.hostname = url.hostname;
    this.basePath = url.pathname;
  }

  /**
   * Make an HTTPS request using native Node.js https module
   */
  request(method, path, data) {
    return new Promise((resolve, reject) => {
      const postData = data ? JSON.stringify(data) : undefined;

      const options = {
        hostname: this.hostname,
        port: 443,
        path: this.basePath + path,
        method,
        headers: {
          'x-api-key': this.config.api_key,
          'Content-Type': 'application/json',
          ...(postData && { 'Content-Length': Buffer.byteLength(postData) }),
        },
        timeout: this.config.timeout,
      };

      const req = https.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              resolve(body);
            }
          } else {
            reject(
              new Error(
                `HTTP ${res.statusCode}: ${res.statusMessage || 'Request failed'}\n${body}`
              )
            );
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${this.config.timeout}ms`));
      });

      if (postData) {
        req.write(postData);
      }

      req.end();
    });
  }

  /**
   * Get all campaigns for a visitor
   */
  async getCampaigns(request) {
    try {
      return await this.request('POST', `/${this.config.env_id}/campaigns`, {
        visitor_id: request.visitor_id,
        context: request.context || {},
        trigger_hit: request.trigger_hit || false,
      });
    } catch (error) {
      throw new Error(`Failed to get campaigns: ${error.message}`);
    }
  }

  /**
   * Get feature flags in key-value format
   */
  async getFlags(request) {
    try {
      const campaignsResponse = await this.getCampaigns(request);
      const flags = {};

      for (const campaign of campaignsResponse.campaigns || []) {
        if (campaign.variation?.modifications?.value) {
          const modifications = campaign.variation.modifications.value;
          Object.assign(flags, modifications);
        }
      }

      return flags;
    } catch (error) {
      throw new Error(`Failed to get flags: ${error.message}`);
    }
  }

  /**
   * Get a specific campaign by ID
   */
  async getCampaign(visitor_id, campaign_id, context, trigger_hit = false) {
    try {
      const response = await this.getCampaigns({
        visitor_id,
        context,
        trigger_hit,
      });

      const campaign = response.campaigns?.find((c) => c.id === campaign_id);
      return campaign || null;
    } catch (error) {
      throw new Error(`Failed to get campaign: ${error.message}`);
    }
  }

  /**
   * Activate a campaign (send activation hit)
   */
  async activateCampaign(visitor_id, variation_group_id, variation_id) {
    try {
      await this.request('POST', `/${this.config.env_id}/activate`, {
        vid: visitor_id,
        caid: variation_group_id,
        vaid: variation_id,
      });
    } catch (error) {
      throw new Error(`Failed to activate campaign: ${error.message}`);
    }
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

async function main() {
  // 1. Initialize the client with your credentials
  const config = {
    env_id: process.env.AB_TASTY_ENV_ID || 'your-environment-id',
    api_key: process.env.AB_TASTY_API_KEY || 'your-api-key',
  };

  if (config.env_id === 'your-environment-id' || config.api_key === 'your-api-key') {
    console.error('❌ Error: Missing required environment variables\n');
    console.error('This script requires AB Tasty credentials to run.\n');
    console.error('Please set the following environment variables:');
    console.error('  AB_TASTY_ENV_ID    - Your AB Tasty Environment ID');
    console.error('  AB_TASTY_API_KEY   - Your AB Tasty API Key\n');
    console.error('Find these in: AB Tasty account → Settings → Feature Experimentation → Environment settings\n');
    console.error('Example:');
    console.error('  export AB_TASTY_ENV_ID="your-env-id"');
    console.error('  export AB_TASTY_API_KEY="your-api-key"');
    console.error('  node scripts/call-decision-api.js');
    process.exit(1);
  }

  const client = new DecisionAPIClient(config);

  console.log('🚀 AB Tasty Decision API Examples\n');

  // 2. Define visitor context
  const visitorId = 'user-' + Date.now();
  const context = {
    country: 'US',
    plan: 'premium',
    isVIP: true,
    fs_all_users: true, // Target all users/visitors
  };

  console.log(`👤 Visitor ID: ${visitorId}`);
  console.log(`📝 Context: ${JSON.stringify(context, null, 2)}\n`);

  // -------------------------------------------------------------------------
  // Example 1: Get all campaigns
  // -------------------------------------------------------------------------
  try {
    console.log('📋 Example 1: Getting all campaigns...');
    const campaigns = await client.getCampaigns({
      visitor_id: visitorId,
      context,
      trigger_hit: false,
    });

    console.log(`✅ Found ${campaigns.campaigns?.length || 0} campaigns`);
    console.log(JSON.stringify(campaigns, null, 2));
    console.log('');
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
  }

  // -------------------------------------------------------------------------
  // Example 2: Get feature flags (simplified)
  // -------------------------------------------------------------------------
  try {
    console.log('🎯 Example 2: Getting feature flags...');
    const flags = await client.getFlags({
      visitor_id: visitorId,
      context,
      trigger_hit: false,
    });

    console.log(`✅ Retrieved ${Object.keys(flags).length} flags`);
    console.log(JSON.stringify(flags, null, 2));
    console.log('');
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
  }

  // -------------------------------------------------------------------------
  // Example 3: Get specific campaign
  // -------------------------------------------------------------------------
  try {
    console.log('🔍 Example 3: Getting specific campaign...');
    const campaignId = 'your-campaign-id'; // Replace with actual campaign ID
    const campaign = await client.getCampaign(
      visitorId,
      campaignId,
      context,
      false
    );

    if (campaign) {
      console.log(`✅ Found campaign: ${campaign.id}`);
      console.log(JSON.stringify(campaign, null, 2));
    } else {
      console.log(`ℹ️  Campaign ${campaignId} not found or not targeted`);
    }
    console.log('');
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
  }

  // -------------------------------------------------------------------------
  // Example 4: Activate campaign
  // -------------------------------------------------------------------------
  try {
    console.log('✨ Example 4: Activating campaign...');

    // First get campaigns to get variation IDs
    const campaignsResponse = await client.getCampaigns({
      visitor_id: visitorId,
      context,
      trigger_hit: false,
    });

    if (campaignsResponse.campaigns && campaignsResponse.campaigns.length > 0) {
      const firstCampaign = campaignsResponse.campaigns[0];

      await client.activateCampaign(
        visitorId,
        firstCampaign.variationGroupId,
        firstCampaign.variation.id
      );

      console.log(`✅ Campaign activated successfully`);
      console.log(`   Variation Group: ${firstCampaign.variationGroupId}`);
      console.log(`   Variation: ${firstCampaign.variation.id}`);
    } else {
      console.log('ℹ️  No campaigns to activate');
    }
    console.log('');
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
  }

  // -------------------------------------------------------------------------
  // Example 5: Context-based targeting
  // -------------------------------------------------------------------------
  try {
    console.log('🎭 Example 5: Testing different contexts...');

    const contexts = [
      { country: 'US', plan: 'free' },
      { country: 'FR', plan: 'premium' },
      { country: 'US', plan: 'premium', isVIP: true },
    ];

    for (const testContext of contexts) {
      const result = await client.getFlags({
        visitor_id: `test-${Date.now()}`,
        context: testContext,
        trigger_hit: false,
      });

      console.log(`Context: ${JSON.stringify(testContext)}`);
      console.log(`Flags: ${JSON.stringify(result)}`);
      console.log('---');
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
  }

  console.log('\n✅ All examples completed!');
}

// Run the examples
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { DecisionAPIClient };
