const { AutoReplyRule, Product } = require('../models');
const { Op } = require('sequelize');

const resolveProductInDB = async (productQuery, workspaceId) => {
  if (!productQuery) return null;
  try {
    const products = await Product.findAll({ where: { workspaceId } });
    const queryLower = productQuery.toLowerCase().trim();
    // Check if query contains product name or product name contains query
    for (const p of products) {
      const pName = p.name.toLowerCase();
      if (queryLower.includes(pName) || pName.includes(queryLower)) {
        return p;
      }
    }
  } catch (err) {
    console.error('Error resolving product in DB:', err);
  }
  return null;
};

const checkProductIntelligence = async (text, workspaceId) => {
  try {
    const products = await Product.findAll({ where: { workspaceId } });
    const textLower = text.toLowerCase();
    
    for (const p of products) {
      const pName = p.name.toLowerCase();
      if (textLower.includes(pName) || (p.sku && textLower.includes(p.sku.toLowerCase()))) {
        const priceVal = p.offerPrice ? p.offerPrice : p.price;
        
        // Dynamic Recommendations: suggest Beetroot Malt / Nendran Banana Malt or other products in DB
        const otherProducts = products.filter(item => item.id !== p.id).slice(0, 2);
        let recNames = otherProducts.map(item => item.name).join(', ');
        if (!recNames) {
          if (pName.includes('abc malt')) {
            recNames = 'Beetroot Malt, Nendran Banana Malt';
          } else {
            recNames = 'Premium Spices, Organic Tea';
          }
        }
        
        const reply = `📦 *PRODUCT CARD: ${p.name.toUpperCase()}*\n` +
          `-------------------------------\n` +
          `💰 Price: ₹${parseFloat(priceVal).toFixed(2)}\n` +
          `✨ Benefits: ${p.benefits || '100% Organic, Natural & Healthy'}\n` +
          `🧪 Ingredients: ${p.ingredients || 'Natural organic extracts'}\n` +
          `📦 Stock Status: ${p.stock > 0 ? p.stock + ' ' + p.unit + ' available' : 'Out of stock'}\n` +
          `📝 Description: ${p.description || 'Premium quality selection.'}\n` +
          (p.specifications ? `🔬 Specs: ${p.specifications}\n` : '') +
          `-------------------------------\n` +
          `💡 *AI Recommendation:* Based on this interest, we recommend: *${recNames}*.\n` +
          (p.productUrl ? `🔗 Order Link: ${p.productUrl}\n` : '') +
          (p.cataloguePdfUrl ? `📄 Catalog: ${p.cataloguePdfUrl}` : '');

        return {
          detected: true,
          product: p,
          reply
        };
      }
    }
  } catch (err) {
    console.error('checkProductIntelligence error:', err);
  }
  return null;
};

// Extract draft order items using regular expressions
const parseHeuristicOrder = (text) => {
  // Matches "I want 5 ABC Malt", "need 10 packets of xyz", "send 2 cartons"
  const regexes = [
    /(?:need|want|send|buy|order|request)\s+(\d+)\s*(cartons?|packets?|boxes?|pkts?|pcs|units?|bottles?|jars?)?\s*(?:of)?\s*([a-zA-Z0-9\s\-]{3,30})/i,
    /(\d+)\s*(cartons?|packets?|boxes?|pkts?|pcs|units?|bottles?|jars?)\s*(?:of)?\s*([a-zA-Z0-9\s\-]{3,30})/i
  ];

  for (const regex of regexes) {
    const match = text.match(regex);
    if (match) {
      const quantity = parseInt(match[1], 10);
      let unit = match[2] ? match[2].trim() : 'pcs';
      let productName = match[3] ? match[3].trim() : 'General Product';
      
      productName = productName.replace(/^(please|now|immediately|to|for)\s+/i, '');

      return {
        productName: productName,
        quantity: quantity,
        price: 15.00, // Default fallback price, resolved from DB dynamically in whatsappService
        unit: unit
      };
    }
  }

  return null;
};

// Heuristic Intent Analysis fallback
const parseHeuristicIntent = (text) => {
  const t = text.toLowerCase();
  
  // 1. Sentiment
  let sentiment = 'Neutral';
  const posCount = (t.match(/(good|great|nice|perfect|yes|thanks|thank you|awesome|interested|excellent|ok|yep|sure)/g) || []).length;
  const negCount = (t.match(/(no|not|bad|expensive|stop|cancel|uninterested|cheap|poor|delayed|slow)/g) || []).length;
  if (posCount > negCount) sentiment = 'Positive';
  else if (negCount > posCount) sentiment = 'Negative';

  // 2. Lead Intent
  let leadIntent = 'None';
  if (t.includes('how much') || t.includes('price') || t.includes('rate') || t.includes('cost') || t.includes('quote')) {
    leadIntent = 'Price Enquiry';
  } else if (t.includes('product') || t.includes('details') || t.includes('info') || t.includes('specification') || t.includes('catalogue') || t.includes('catalog') || t.includes('brochure') || t.includes('sheet') || t.includes('what is')) {
    leadIntent = 'Product Enquiry';
  } else if (t.includes('again') || t.includes('repeat') || t.includes('last time') || t.includes('previous') || t.includes('order before')) {
    leadIntent = 'Repeat Customer';
  } else if (t.includes('not interested') || t.includes('no thanks') || t.includes('stop') || t.includes('unsubscribe')) {
    leadIntent = 'Not Interested';
  } else if (t.includes('yes') || t.includes('want to buy') || t.includes('place order') || t.includes('interested')) {
    leadIntent = 'Interested';
  }

  // 3. Order Intent
  let orderIntent = 'None';
  if (t.match(/(need|want|send|buy|order|request)\s+\d+/i) || t.includes('i need') || t.includes('i want') || t.includes('send me') || t.includes('order draft')) {
    orderIntent = 'New Order';
  } else if (t.includes('confirm') || t.includes('perfect') || t.includes('ok send') || t.includes('place it')) {
    orderIntent = 'Order Confirmation';
  } else if (t.includes('change') || t.includes('modify') || t.includes('cancel') || t.includes('instead') || t.includes('update quantity')) {
    orderIntent = 'Order Modification';
  } else if (t.includes('paid') || t.includes('payment') || t.includes('receipt') || t.includes('sent money') || t.includes('transferred')) {
    orderIntent = 'Payment Sent';
  } else if (t.includes('when') || t.includes('dispatch') || t.includes('status') || t.includes('ship') || t.includes('track') || t.includes('delivery')) {
    orderIntent = 'Dispatch Enquiry';
  }

  // 4. Suggested Smart Reply
  let suggestedReply = 'Thank you for your message. A sales representative will be with you shortly.';
  if (leadIntent === 'Price Enquiry') {
    suggestedReply = 'Thank you for your interest! Could you please specify which product and quantity you require so we can prepare a quote?';
  } else if (leadIntent === 'Product Enquiry') {
    suggestedReply = 'We would be glad to share more details! Let us know if you require our catalogue or specific product sheets.';
  } else if (orderIntent === 'New Order') {
    const orderData = parseHeuristicOrder(text);
    if (orderData) {
      suggestedReply = `Great! I've drafted an order for ${orderData.quantity} ${orderData.unit} of "${orderData.productName}". Can you please confirm your shipping details?`;
    } else {
      suggestedReply = 'Thank you. I have initiated a draft order request. Please let us know your delivery location.';
    }
  } else if (orderIntent === 'Payment Sent') {
    suggestedReply = 'Thank you for the payment confirmation. We will verify the receipt and dispatch your items shortly.';
  } else if (t.includes('catalogue') || t.includes('catalog')) {
    suggestedReply = 'I have automatically queued our catalog PDF for you. Please let us know if you require any specific product pricing.';
  }

  return {
    leadIntent,
    orderIntent,
    sentiment,
    suggestedReply
  };
};

const analyzeMessage = async (messageText, workspaceId) => {
  if (!messageText || typeof messageText !== 'string' || messageText.trim() === '') {
    return {
      leadIntent: 'None',
      orderIntent: 'None',
      sentiment: 'Neutral',
      suggestedReply: 'Hello! How can we assist you today?'
    };
  }

  // Check Product Intelligence first
  const prodIntel = await checkProductIntelligence(messageText, workspaceId);
  if (prodIntel && prodIntel.detected) {
    return {
      leadIntent: 'Product Enquiry',
      orderIntent: 'None',
      sentiment: 'Positive',
      suggestedReply: prodIntel.reply
    };
  }

  // Check if Gemini API is configured
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a WhatsApp Sales Assistant. Analyze the customer message: "${messageText}".
                  Respond strictly in valid JSON format matching this schema:
                  {
                    "leadIntent": "Interested" | "Price Enquiry" | "Product Enquiry" | "Repeat Customer" | "Hot Lead" | "Not Interested" | "None",
                    "orderIntent": "New Order" | "Order Confirmation" | "Order Modification" | "Payment Sent" | "Dispatch Enquiry" | "None",
                    "sentiment": "Positive" | "Neutral" | "Negative",
                    "suggestedReply": "Draft of suggested next response to customer"
                  }
                  Keep suggestedReply helpful, natural, and business-focused.`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned status code ${response.status}`);
      }

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        text = text.trim();
        if (text.startsWith('```')) {
          text = text.replace(/^```json\s*/i, '').replace(/```\s*$/g, '').trim();
        }
        const result = JSON.parse(text);
        return {
          leadIntent: result.leadIntent || 'None',
          orderIntent: result.orderIntent || 'None',
          sentiment: result.sentiment || 'Neutral',
          suggestedReply: result.suggestedReply || 'Thank you for your message.'
        };
      }
    } catch (apiErr) {
      console.error('[AI Service] Gemini API error, falling back to heuristics:', apiErr.message);
    }
  }

  // Check if OpenAI is configured (legacy fallback)
  if (process.env.OPENAI_API_KEY) {
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a WhatsApp Sales Assistant. Analyze the customer message.
            Respond strictly in valid JSON format matching this schema:
            {
              "leadIntent": "Interested" | "Price Enquiry" | "Product Enquiry" | "Repeat Customer" | "Hot Lead" | "Not Interested" | "None",
              "orderIntent": "New Order" | "Order Confirmation" | "Order Modification" | "Payment Sent" | "Dispatch Enquiry" | "None",
              "sentiment": "Positive" | "Neutral" | "Negative",
              "suggestedReply": "Draft of suggested next response to customer"
            }
            Keep suggestedReply helpful, natural, and business-focused.`
          },
          { role: 'user', content: messageText }
        ],
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        leadIntent: result.leadIntent || 'None',
        orderIntent: result.orderIntent || 'None',
        sentiment: result.sentiment || 'Neutral',
        suggestedReply: result.suggestedReply || 'Thank you for your message.'
      };
    } catch (apiErr) {
      console.error('[AI Service] OpenAI API error, falling back to heuristics:', apiErr.message);
    }
  }

  // Heuristic Fallback
  return parseHeuristicIntent(messageText);
};

// Check for Keyword matches in database or code
const checkAutoReply = async (messageText, workspaceId) => {
  const cleanText = messageText.trim().toLowerCase();
  
  // Check DB rules
  const rule = await AutoReplyRule.findOne({
    where: {
      workspaceId,
      keyword: cleanText
    }
  });

  if (rule) {
    return {
      response: rule.response,
      mediaUrl: rule.mediaUrl,
      mediaType: rule.mediaType
    };
  }

  // Default Fallbacks matching prompt constraints
  if (cleanText === 'price') {
    return {
      response: 'Please tell us the product name and quantity.'
    };
  } else if (cleanText === 'catalogue' || cleanText === 'catalog') {
    // If catalogue rule is found, use it, else mock return
    return {
      response: 'Please find our catalogue attached below.',
      mediaUrl: '/uploads/catalogue.pdf',
      mediaType: 'application/pdf'
    };
  }

  return null;
};

const autoMapSchema = async (samplePayloadText, platformHint) => {
  if (!samplePayloadText || typeof samplePayloadText !== 'string' || samplePayloadText.trim() === '') {
    return {
      name: '',
      sku: '',
      price: '',
      stock: '',
      customerName: '',
      phone: '',
      city: '',
      catalogueUrl: '',
      suggestedPlatform: 'Custom REST APIs',
      suggestedName: 'Custom API Integration'
    };
  }

  // Check if Gemini API is configured
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an API Integration Expert. Analyze this sample JSON response payload or description of an external SaaS platform API:
"${samplePayloadText}"
${platformHint ? `Target Platform Hint: ${platformHint}` : ''}

Determine the JSON keys or JSON path identifiers mapping to these standardized fields:
1. name (product name field, e.g. "title", "name", "product_name")
2. sku (SKU identifier field, e.g. "sku", "product_code", "variant_sku")
3. price (price field, e.g. "price", "amount", "unit_price", "cost", "offerPrice")
4. stock (stock inventory count, e.g. "stock", "quantity", "inventory_quantity", "qty")
5. customerName (customer name field, e.g. "customerName", "customer_name", "first_name", "display_name")
6. phone (customer phone number, e.g. "phone", "mobile", "telephone", "contact_number")
7. city (customer city, e.g. "city", "shipping_city", "billing_city", "location")
8. catalogueUrl (catalog url/link, e.g. "catalog_url", "link", "url", "product_url")

Respond strictly in valid JSON format matching this schema:
{
  "name": "key_or_path_for_product_name",
  "sku": "key_or_path_for_sku",
  "price": "key_or_path_for_price",
  "stock": "key_or_path_for_stock",
  "customerName": "key_or_path_for_customer_name",
  "phone": "key_or_path_for_phone",
  "city": "key_or_path_for_city",
  "catalogueUrl": "key_or_path_for_catalogue_url",
  "suggestedPlatform": "Name of the platform matching one of these options: Shopify, WooCommerce, Zoho, HubSpot, Salesforce, Odoo, ERPNext, QuickBooks, Custom REST APIs, Custom GraphQL APIs",
  "suggestedName": "A descriptive connection name, e.g. 'Shopify ERP Connection' or 'HubSpot CRM'"
}

If a field is not found or not applicable, provide an empty string "" for that field.`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned status code ${response.status}`);
      }

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        text = text.trim();
        if (text.startsWith('```')) {
          text = text.replace(/^```json\s*/i, '').replace(/```\s*$/g, '').trim();
        }
        const result = JSON.parse(text);
        return {
          name: result.name || '',
          sku: result.sku || '',
          price: result.price || '',
          stock: result.stock || '',
          customerName: result.customerName || '',
          phone: result.phone || '',
          city: result.city || '',
          catalogueUrl: result.catalogueUrl || '',
          suggestedPlatform: result.suggestedPlatform || 'Custom REST APIs',
          suggestedName: result.suggestedName || 'Custom API Integration'
        };
      }
    } catch (apiErr) {
      console.error('[AI Service] Gemini API error in autoMapSchema:', apiErr.message);
    }
  }

  // Fallback Heuristics
  const cleanInput = samplePayloadText.toLowerCase();
  
  const findKey = (candidates) => {
    for (const c of candidates) {
      if (cleanInput.includes(`"${c}"`) || cleanInput.includes(`'${c}'`)) {
        return c;
      }
    }
    for (const c of candidates) {
      if (cleanInput.includes(c)) {
        return c;
      }
    }
    return '';
  };

  const nameKey = findKey(['product_name', 'title', 'name', 'label']);
  const skuKey = findKey(['sku_code', 'sku', 'product_code', 'variant_sku', 'code']);
  const priceKey = findKey(['offerPrice', 'price', 'amount', 'unit_price', 'cost', 'retail_price']);
  const stockKey = findKey(['stock_count', 'stock', 'quantity', 'inventory_quantity', 'qty', 'balance']);
  const custNameKey = findKey(['customer_name', 'customerName', 'first_name', 'display_name', 'fullname', 'name']);
  const phoneKey = findKey(['phone_number', 'phone', 'mobile', 'telephone', 'contact_number', 'whatsapp']);
  const cityKey = findKey(['shipping_city', 'billing_city', 'city', 'location', 'town']);
  const catUrlKey = findKey(['catalog_url', 'catalogueUrl', 'link', 'url', 'product_url', 'pdfUrl']);

  let suggestedPlatform = 'Custom REST APIs';
  if (cleanInput.includes('shopify')) suggestedPlatform = 'Shopify';
  else if (cleanInput.includes('woocommerce')) suggestedPlatform = 'WooCommerce';
  else if (cleanInput.includes('zoho')) suggestedPlatform = 'Zoho';
  else if (cleanInput.includes('hubspot')) suggestedPlatform = 'HubSpot';

  return {
    name: nameKey || 'name',
    sku: skuKey || 'sku',
    price: priceKey || 'price',
    stock: stockKey || 'stock',
    customerName: custNameKey || '',
    phone: phoneKey || '',
    city: cityKey || '',
    catalogueUrl: catUrlKey || 'catalogueUrl',
    suggestedPlatform,
    suggestedName: suggestedPlatform !== 'Custom REST APIs' ? `${suggestedPlatform} Integration` : 'ERP custom API connection'
  };
};

module.exports = {
  analyzeMessage,
  parseHeuristicOrder,
  checkAutoReply,
  resolveProductInDB,
  checkProductIntelligence,
  autoMapSchema
};
