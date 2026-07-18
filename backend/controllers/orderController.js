const { SalesOrder, Contact, User } = require('../models');

const autoTagContact = async (workspaceId, contact) => {
  try {
    const orderCount = await SalesOrder.count({
      where: {
        workspaceId,
        phone: contact.phone,
        status: ['Confirmed', 'Processing', 'Dispatched', 'Delivered']
      }
    });

    const tags = contact.tags ? contact.tags.split(',').map(t => t.trim()) : [];
    
    if (orderCount >= 2 && !tags.includes('Repeat Customer')) {
      tags.push('Repeat Customer');
    }
    
    const totalRev = parseFloat(contact.totalPurchaseValue || 0);
    if ((totalRev >= 10000 || orderCount >= 3) && !tags.includes('VIP')) {
      tags.push('VIP');
    }

    if (orderCount > 0) {
      const avgValue = totalRev / orderCount;
      if (avgValue > 5000 && !tags.includes('Wholesale')) {
        tags.push('Wholesale');
      }
    }

    contact.tags = tags.filter(Boolean).join(', ');
    
    if (tags.includes('VIP')) {
      contact.leadScore = 'Hot';
    }
    
    await contact.save();
  } catch (err) {
    console.error('Error during auto-tagging contact:', err);
  }
};

exports.getOrders = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const orders = await SalesOrder.findAll({
      where: { workspaceId },
      order: [['createdAt', 'DESC']]
    });

    const parsedOrders = orders.map(order => {
      const orderJson = order.toJSON();
      try { orderJson.items = JSON.parse(orderJson.items || '[]'); } catch(e) { orderJson.items = []; }
      try { orderJson.timeline = JSON.parse(orderJson.timeline || '[]'); } catch(e) { orderJson.timeline = []; }
      return orderJson;
    });

    return res.json(parsedOrders);
  } catch (error) {
    console.error('getOrders error:', error);
    return res.status(500).json({ error: 'Server error retrieving orders' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { customerName, phone, city, items, totalValue, chatId } = req.body;

    if (!customerName || !phone || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Customer details and items are required' });
    }

    const orderJid = chatId || `${phone.replace(/[^\d]/g, '')}@c.us`;

    const timeline = [{
      status: 'New Order',
      timestamp: new Date(),
      user: req.userName || 'System'
    }];

    const order = await SalesOrder.create({
      workspaceId,
      chatId: orderJid,
      customerName,
      phone: phone.replace(/[^\d]/g, ''),
      totalValue: totalValue || 0.00,
      status: 'New Order',
      city,
      items: JSON.stringify(items),
      timeline: JSON.stringify(timeline)
    });

    try {
      const webhookService = require('../services/webhookService');
      webhookService.trigger(workspaceId, 'order.created', order.toJSON());
    } catch (whErr) {
      console.error('Error triggering order.created webhook:', whErr);
    }

    return res.json({ success: true, order });
  } catch (error) {
    console.error('createOrder error:', error);
    return res.status(500).json({ error: 'Server error creating order' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await SalesOrder.findOne({ where: { id: orderId, workspaceId } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Append to timeline
    let timeline = [];
    try { timeline = JSON.parse(order.timeline || '[]'); } catch (e) {}
    timeline.push({
      status,
      timestamp: new Date(),
      user: req.userName || 'Agent'
    });

    order.status = status;
    order.timeline = JSON.stringify(timeline);
    await order.save();

    // CRM integration: if order transitions to Confirmed or Delivered, check/update totalPurchaseValue
    if (status === 'Confirmed' || status === 'Delivered') {
      const cleanPhone = order.phone.replace(/[^\d]/g, '');
      const contact = await Contact.findOne({ where: { workspaceId, phone: cleanPhone } });
      if (contact) {
        // Calculate all confirmed/delivered orders total
        const allOrders = await SalesOrder.findAll({
          where: {
            workspaceId,
            phone: cleanPhone,
            status: ['Confirmed', 'Processing', 'Dispatched', 'Delivered']
          }
        });
        const total = allOrders.reduce((sum, o) => sum + parseFloat(o.totalValue || 0), 0);
        contact.totalPurchaseValue = total;
        contact.lastPurchaseDate = new Date();
        await contact.save();
        await autoTagContact(workspaceId, contact);
      }
    }

    return res.json({ success: true, order });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return res.status(500).json({ error: 'Server error updating order status' });
  }
};

exports.approveDraftOrder = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { orderId } = req.params;
    
    const order = await SalesOrder.findOne({ where: { id: orderId, workspaceId } });
    if (!order) {
      return res.status(404).json({ error: 'Order draft not found' });
    }

    // Approve the order draft: transition to Confirmed
    let timeline = [];
    try { timeline = JSON.parse(order.timeline || '[]'); } catch (e) {}
    timeline.push({
      status: 'Confirmed',
      timestamp: new Date(),
      user: req.userName || 'Sales Assistant (AI Approved)'
    });

    order.status = 'Confirmed';
    order.timeline = JSON.stringify(timeline);
    await order.save();

    // Update customer spend aggregates
    const cleanPhone = order.phone.replace(/[^\d]/g, '');
    let contact = await Contact.findOne({ where: { workspaceId, phone: cleanPhone } });
    
    if (!contact) {
      // Auto create contact in CRM if doesn't exist
      contact = await Contact.create({
        workspaceId,
        name: order.customerName,
        phone: cleanPhone,
        city: order.city,
        tags: 'Customer,WhatsApp'
      });
    }

    const allOrders = await SalesOrder.findAll({
      where: {
        workspaceId,
        phone: cleanPhone,
        status: ['Confirmed', 'Processing', 'Dispatched', 'Delivered']
      }
    });
    const total = allOrders.reduce((sum, o) => sum + parseFloat(o.totalValue || 0), 0);
    contact.totalPurchaseValue = total;
    contact.lastPurchaseDate = new Date();
    await contact.save();
    await autoTagContact(workspaceId, contact);

    return res.json({ success: true, message: 'Draft order approved and customer spend updated.', order });
  } catch (error) {
    console.error('approveDraftOrder error:', error);
    return res.status(500).json({ error: 'Server error approving draft order' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { orderId } = req.params;

    const order = await SalesOrder.findOne({ where: { id: orderId, workspaceId } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.destroy();
    return res.json({ success: true, message: 'Order deleted.' });
  } catch (error) {
    console.error('deleteOrder error:', error);
    return res.status(500).json({ error: 'Server error deleting order' });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { orderId } = req.params;

    const order = await SalesOrder.findOne({ where: { id: orderId, workspaceId } });
    if (!order) {
      return res.status(404).send('<h1>Order not found</h1>');
    }

    const items = JSON.parse(order.items || '[]');
    const dateStr = new Date(order.createdAt).toLocaleDateString();
    const invoiceNum = order.invoiceNumber || `INV-2026-${order.id.slice(0, 4).toUpperCase()}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceNum}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; margin: 40px; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); border-radius: 8px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #25D366; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #128C7E; }
          .title { text-align: right; }
          .details { margin-top: 30px; display: flex; justify-content: space-between; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 40px; }
          .items-table th { background-color: #f7f7f7; text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
          .items-table td { padding: 10px; border-bottom: 1px solid #eee; }
          .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 30px; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
          .print-btn { display: inline-block; padding: 10px 20px; background-color: #25D366; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; margin-bottom: 20px; border: none; cursor: pointer; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <div style="text-align: center;">
          <button class="print-btn" onclick="window.print()">Print Invoice</button>
        </div>
        <div class="invoice-box">
          <div class="header">
            <div class="logo">Cusman CRM</div>
            <div class="title">
              <h2>INVOICE</h2>
              <strong>Date:</strong> ${dateStr}<br/>
              <strong>Invoice #:</strong> ${invoiceNum}
            </div>
          </div>
          <div class="details">
            <div>
              <strong>Vendor:</strong><br/>
              Amudhasurabiy Organics<br/>
              Chennai, Tamil Nadu<br/>
              support@amudhasurabiy.com
            </div>
            <div>
              <strong>Bill To:</strong><br/>
              ${order.customerName}<br/>
              Phone: +${order.phone}<br/>
              City: ${order.city || 'N/A'}
            </div>
          </div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity} ${item.unit || 'pcs'}</td>
                  <td>₹${parseFloat(item.price).toFixed(2)}</td>
                  <td>₹${parseFloat(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            Grand Total: ₹${parseFloat(order.totalValue).toFixed(2)}
          </div>
          <div class="footer">
            Thank you for your business!<br/>
            Generated securely by Cusman Enterprise CRM
          </div>
        </div>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    console.error('getInvoice error:', error);
    return res.status(500).send('Server error compiling invoice');
  }
};

exports.getDeliverySlip = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { orderId } = req.params;

    const order = await SalesOrder.findOne({ where: { id: orderId, workspaceId } });
    if (!order) {
      return res.status(404).send('<h1>Order not found</h1>');
    }

    const items = JSON.parse(order.items || '[]');
    const dateStr = new Date(order.createdAt).toLocaleDateString();
    const slipNum = `SLIP-2026-${order.id.slice(0, 4).toUpperCase()}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Delivery Slip ${slipNum}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; margin: 40px; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 8px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #FF9900; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #FF9900; }
          .title { text-align: right; }
          .details { margin-top: 30px; display: flex; justify-content: space-between; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 40px; }
          .items-table th { background-color: #f7f7f7; text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
          .items-table td { padding: 10px; border-bottom: 1px solid #eee; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
          .sign-block { margin-top: 40px; display: flex; justify-content: space-between; }
          .sign-line { width: 200px; border-top: 1px solid #333; text-align: center; padding-top: 5px; font-size: 12px; }
          .print-btn { display: inline-block; padding: 10px 20px; background-color: #FF9900; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; margin-bottom: 20px; border: none; cursor: pointer; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <div style="text-align: center;">
          <button class="print-btn" onclick="window.print()">Print Delivery Slip</button>
        </div>
        <div class="invoice-box">
          <div class="header">
            <div class="logo">Cusman CRM</div>
            <div class="title">
              <h2>DELIVERY SLIP</h2>
              <strong>Date:</strong> ${dateStr}<br/>
              <strong>Slip #:</strong> ${slipNum}
            </div>
          </div>
          <div class="details">
            <div>
              <strong>Shipper:</strong><br/>
              Amudhasurabiy Organics<br/>
              Chennai, Tamil Nadu<br/>
              support@amudhasurabiy.com
            </div>
            <div>
              <strong>Ship To:</strong><br/>
              ${order.customerName}<br/>
              Phone: +${order.phone}<br/>
              Destination City: ${order.city || 'N/A'}
            </div>
          </div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity Ordered</th>
                <th>Quantity Shipped</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity} ${item.unit || 'pcs'}</td>
                  <td>__________</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="sign-block">
            <div class="sign-line">
              Prepared By
            </div>
            <div class="sign-line">
              Receiver's Signature
            </div>
          </div>
          <div class="footer">
            Delivering organic values securely.
          </div>
        </div>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    console.error('getDeliverySlip error:', error);
    return res.status(500).send('Server error compiling delivery slip');
  }
};

exports.getPaymentLink = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { orderId } = req.params;

    const order = await SalesOrder.findOne({ where: { id: orderId, workspaceId } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Return a mock Stripe checkout link
    const paymentLink = `https://checkout.stripe.com/pay/mock_cusmancrm_session_${order.id}`;
    
    // Save paymentLink back to order for tracking
    order.paymentLink = paymentLink;
    await order.save();

    return res.json({ paymentLink });
  } catch (error) {
    console.error('getPaymentLink error:', error);
    return res.status(500).json({ error: 'Server error generating payment link' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const id = req.params.id || req.params.orderId;
    const { customerName, phone, city, items, totalValue, status } = req.body;

    const order = await SalesOrder.findOne({ where: { id, workspaceId } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (customerName !== undefined) order.customerName = customerName;
    if (phone !== undefined) order.phone = phone.replace(/[^\d]/g, '');
    if (city !== undefined) order.city = city;
    if (totalValue !== undefined) order.totalValue = totalValue;
    if (items !== undefined) order.items = typeof items === 'string' ? items : JSON.stringify(items);
    
    if (status !== undefined && status !== order.status) {
      let timeline = [];
      try { timeline = JSON.parse(order.timeline || '[]'); } catch (e) {}
      timeline.push({
        status,
        timestamp: new Date(),
        user: req.userName || 'API Client'
      });
      order.status = status;
      order.timeline = JSON.stringify(timeline);

      // CRM updates if order transitioned to Confirmed/Delivered
      if (status === 'Confirmed' || status === 'Delivered') {
        const cleanPhone = order.phone.replace(/[^\d]/g, '');
        const contact = await Contact.findOne({ where: { workspaceId, phone: cleanPhone } });
        if (contact) {
          const allOrders = await SalesOrder.findAll({
            where: {
              workspaceId,
              phone: cleanPhone,
              status: ['Confirmed', 'Processing', 'Dispatched', 'Delivered']
            }
          });
          const total = allOrders.reduce((sum, o) => sum + parseFloat(o.totalValue || 0), 0);
          contact.totalPurchaseValue = total;
          contact.lastPurchaseDate = new Date();
          await contact.save();
        }
      }
    }

    await order.save();
    return res.json({ success: true, order });
  } catch (error) {
    console.error('updateOrder error:', error);
    return res.status(500).json({ error: 'Server error updating order' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const id = req.params.id || req.params.orderId;
    const order = await SalesOrder.findOne({ where: { id, workspaceId } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const orderJson = order.toJSON();
    try { orderJson.items = JSON.parse(orderJson.items || '[]'); } catch(e) { orderJson.items = []; }
    try { orderJson.timeline = JSON.parse(orderJson.timeline || '[]'); } catch(e) { orderJson.timeline = []; }
    return res.json(orderJson);
  } catch (error) {
    console.error('getOrderById error:', error);
    return res.status(500).json({ error: 'Server error retrieving order' });
  }
};
