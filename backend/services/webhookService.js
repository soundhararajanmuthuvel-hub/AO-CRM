const { Workspace } = require('../models');
const http = require('http');
const https = require('https');
const url = require('url');

const postWebhook = (webhookUrl, payload) => {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = url.parse(webhookUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const postData = JSON.stringify(payload);

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path || '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 5000 // 5 seconds timeout
      };

      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(postData);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
};

exports.trigger = async (workspaceId, event, data) => {
  try {
    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace || !workspace.webhookUrl) {
      return; // No webhook configured
    }

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      workspaceId,
      data
    };

    console.log(`[Webhook] Triggering "${event}" for workspace "${workspace.name}" -> ${workspace.webhookUrl}`);
    
    // Trigger in the background so it doesn't block the caller
    postWebhook(workspace.webhookUrl, payload)
      .then((res) => {
        console.log(`[Webhook] Success: Status ${res.statusCode} from ${workspace.webhookUrl}`);
      })
      .catch((err) => {
        console.error(`[Webhook] Failed to send webhook to ${workspace.webhookUrl}:`, err.message);
      });
  } catch (err) {
    console.error(`[Webhook] Error triggering webhook:`, err);
  }
};
