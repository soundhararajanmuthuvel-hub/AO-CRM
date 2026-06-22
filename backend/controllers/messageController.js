const { MessageQueue, Product } = require('../models');

exports.sendMessage = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { phone, message, product_id, productId, priority = 0 } = req.body;
    
    const targetPhone = phone;
    const targetProductId = product_id || productId;

    if (!targetPhone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    let finalMessage = message || '';
    let finalFileUrl = null;
    let finalFileType = null;

    // 1. If product_id is provided, automatically query product details and compile the card
    if (targetProductId) {
      const product = await Product.findOne({ where: { id: targetProductId, workspaceId } });
      if (!product) {
        return res.status(404).json({ error: 'Product not found.' });
      }

      const priceVal = product.offerPrice ? product.offerPrice : product.price;
      const specifications = product.specifications || '';
      let weight = '';
      const weightMatch = specifications.match(/weight:\s*([^\n,]+)/i);
      if (weightMatch) {
        weight = weightMatch[1].trim();
      }

      finalMessage = `📦 *PRODUCT CARD: ${product.name.toUpperCase()}*\n` +
        `-------------------------------\n` +
        `💰 Price: ₹${parseFloat(priceVal).toFixed(2)}\n` +
        (weight ? `⚖ Weight: ${weight}\n` : '') +
        `🌟 Benefits: ${product.benefits || '100% Organic, Natural & Healthy'}\n` +
        `📋 Ingredients: ${product.ingredients || 'Natural organic extracts'}\n` +
        `📑 Specifications: ${product.specifications || 'N/A'}\n` +
        `🔗 Website Link: ${product.websiteUrl || product.productUrl || 'N/A'}\n` +
        (product.catalogueUrl || product.cataloguePdfUrl ? `📄 Catalogue PDF: ${product.catalogueUrl || product.cataloguePdfUrl}\n` : '') +
        `-------------------------------`;

      let imageUrl = product.imageUrl;
      let imageType = 'image/jpeg';
      if (!imageUrl && product.imageUrls) {
        try {
          const urls = JSON.parse(product.imageUrls);
          if (Array.isArray(urls) && urls.length > 0) {
            imageUrl = urls[0];
          }
        } catch (err) {}
      }
      if (imageUrl) {
        imageType = imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
      }

      finalFileUrl = imageUrl;
      finalFileType = imageType;
    }

    if (!finalMessage) {
      return res.status(400).json({ error: 'Message body or product_id is required.' });
    }

    // 2. Insert message into MessageQueue database before sending (guarantees reliability)
    const queueItem = await MessageQueue.create({
      workspaceId,
      phone: targetPhone,
      message: finalMessage,
      fileUrl: finalFileUrl,
      fileType: finalFileType,
      status: 'Pending',
      priority: parseInt(priority) || 0
    });

    // 3. Immediately return success with queue entry ID (do not block for WhatsApp sending)
    return res.json({
      success: true,
      queue_id: queueItem.id
    });

  } catch (error) {
    console.error('API send queue message error:', error);
    return res.status(500).json({ error: 'Failed to schedule queue message' });
  }
};
