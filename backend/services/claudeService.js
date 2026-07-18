const axios = require('axios');
const { Product, WhatsAppMessage } = require('../models');

/**
 * Invokes the Claude API to analyze the conversation and construct an auto-reply.
 * Returns a decision: { reply: string, escalate: boolean, confidence: number, reason: string }
 */
const generateAiAutoReply = async (workspaceId, chatId, contact, incomingText) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('[Claude Service] ANTHROPIC_API_KEY is not configured in .env. Falling back to draft escalation.');
      return {
        reply: 'Sorry, AI response engine configuration is missing.',
        escalate: true,
        confidence: 0.0,
        reason: 'Missing API key'
      };
    }

    // 1. Fetch active products for catalogue context
    let catalogueContext = 'No active catalog items listed in DB.';
    try {
      const products = await Product.findAll({ where: { workspaceId } });
      if (products.length > 0) {
        catalogueContext = products.map(p => 
          `- Product: ${p.name}\n  SKU: ${p.sku || 'N/A'}\n  Price: ₹${p.offerPrice || p.price}\n  Stock: ${p.stock} ${p.unit || 'units'}\n  Benefits: ${p.benefits || 'Organic product'}\n  Ingredients: ${p.ingredients || 'Natural ingredients'}`
        ).join('\n\n');
      }
    } catch (err) {
      console.error('[Claude Service] Error fetching catalogue context:', err);
    }

    // 2. Fetch conversation history (last 10 messages)
    let formattedHistory = [];
    try {
      const history = await WhatsAppMessage.findAll({
        where: { workspaceId, chatId },
        order: [['timestamp', 'DESC']],
        limit: 10
      });
      // Reverse to chronological order
      const reversedHistory = history.reverse();
      formattedHistory = reversedHistory.map(m => 
        `${m.fromMe ? 'Assistant' : 'Customer'}: ${m.body}`
      ).join('\n');
    } catch (err) {
      console.error('[Claude Service] Error fetching chat history:', err);
    }

    // 3. Construct System Prompt
    const systemPrompt = `You are a helpful, professional, and friendly sales assistant representing Amudhasurabiy Organics, a premium organic health products brand.
Your goal is to answer queries about our organic product catalog, explain product health benefits, check prices, and draft orders.

Here is the current catalog snapshot:
${catalogueContext}

Policies:
- We sell 100% natural, preservative-free ABC Malt, Beetroot Malt, Nendran Banana Malt, and premium organic products.
- Delivery is via courier (UPI or Cash on Delivery options). Refund or cancellation inquiries must be escalated to support.
- NEVER make medical claims (do NOT say a product cures diseases, heals, or acts as a guarantee for health issues).

Your response must be formatted strictly as a single JSON object. Do not include markdown code block formatting (like \`\`\`json) or extra text. Output exactly this JSON structure:
{
  "reply": "friendly customer response text to send back to the user on WhatsApp",
  "confidence": 0.95, 
  "intent": "refund" | "cancellation" | "complaint" | "negotiation" | "customQuote" | "none",
  "safetyWarning": false
}

If you detect the customer wants a refund, cancellation, is complaining, or is attempting to negotiate prices, set "intent" accordingly and flag confidence or set the message as an escalation.
NEVER generate medical/legal/guarantee claims. If the customer asks for a guarantee or medical cure, set "safetyWarning" to true.

Conversation history for context:
${formattedHistory}
Customer profile: Name is ${contact.name}, Tags are: ${contact.tags || 'none'}
Incoming customer message to answer: "${incomingText}"`;

    // 4. Send request to Claude API
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: systemPrompt }
        ]
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const contentText = response.data.content[0].text.trim();
    
    // Parse JSON safely
    let parsedResult;
    try {
      // Handle optional markdown block wrappers
      const jsonStr = contentText.replace(/^```json/i, '').replace(/```$/s, '').trim();
      parsedResult = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('[Claude Service] Error parsing Claude response:', contentText, parseErr);
      return {
        reply: contentText,
        escalate: true,
        confidence: 0.5,
        reason: 'Claude JSON parsing error'
      };
    }

    // 5. Hardcoded Safety Regex filter check (Second-layer verification)
    const unsafeWords = [
      /\bcure\b/i, 
      /\bheal\b/i, 
      /\bguarantee\b/i, 
      /\bpromise\b/i, 
      /\blegal\b/i, 
      /\bmedical\b/i,
      /\bcancer\b/i,
      /\bdisease\b/i
    ];
    const hasUnsafeClaims = unsafeWords.some(rx => rx.test(parsedResult.reply));

    let escalate = false;
    let escalationReason = null;

    if (parsedResult.intent && parsedResult.intent !== 'none') {
      escalate = true;
      escalationReason = `Customer Intent: ${parsedResult.intent}`;
    } else if (parsedResult.safetyWarning || hasUnsafeClaims) {
      escalate = true;
      escalationReason = 'Safety filter: Unverified medical/legal/guarantee claim blocked';
    }

    return {
      reply: parsedResult.reply,
      escalate,
      confidence: parsedResult.confidence || 1.0,
      reason: escalationReason
    };

  } catch (error) {
    console.error('[Claude Service] Error calling Claude API:', error.message);
    return {
      reply: 'An error occurred while generating response suggestion.',
      escalate: true,
      confidence: 0.0,
      reason: `Claude API failure: ${error.message}`
    };
  }
};

module.exports = {
  generateAiAutoReply
};
