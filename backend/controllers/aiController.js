const aiService = require('../services/aiService');

exports.analyzeChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message body is required' });
    }

    const workspaceId = req.workspaceId;

    // Run analysis
    const analysis = await aiService.analyzeMessage(message, workspaceId);
    
    // Check product intelligence explicitly
    const prodIntel = await aiService.checkProductIntelligence(message, workspaceId);

    let intent = 'general';
    if (analysis.leadIntent === 'Product Enquiry') intent = 'product_inquiry';
    else if (analysis.leadIntent === 'Price Enquiry') intent = 'price_inquiry';
    else if (analysis.orderIntent === 'New Order') intent = 'order_placement';
    else if (analysis.orderIntent === 'Payment Sent') intent = 'payment_confirmation';
    else if (analysis.leadIntent === 'Not Interested') intent = 'uninterested';

    return res.json({
      intent,
      product: prodIntel && prodIntel.detected ? prodIntel.product.name : null,
      confidence: prodIntel && prodIntel.detected ? 95 : 75
    });
  } catch (error) {
    console.error('analyzeChat error:', error);
    return res.status(500).json({ error: 'Server error analyzing chat' });
  }
};

exports.suggestReply = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message body is required' });
    }

    const workspaceId = req.workspaceId;
    const analysis = await aiService.analyzeMessage(message, workspaceId);

    return res.json({
      suggestedReply: analysis.suggestedReply
    });
  } catch (error) {
    console.error('suggestReply error:', error);
    return res.status(500).json({ error: 'Server error generating reply suggestion' });
  }
};
