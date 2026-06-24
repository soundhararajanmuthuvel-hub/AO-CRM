const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', orderController.getOrders);
router.post('/', orderController.createOrder);
router.get('/:orderId', orderController.getOrderById);
router.put('/:id', orderController.updateOrder);
router.put('/:orderId/status', orderController.updateOrderStatus);
router.post('/:orderId/approve', orderController.approveDraftOrder);
router.delete('/:orderId', orderController.deleteOrder);

router.get('/:orderId/invoice', orderController.getInvoice);
router.get('/:orderId/delivery-slip', orderController.getDeliverySlip);
router.get('/:orderId/payment-link', orderController.getPaymentLink);

module.exports = router;
