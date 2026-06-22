const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Secure all super admin routes behind superadmin role check
router.use(protect);
router.use(requireRole(['superadmin']));

// Dashboard Stats & Analytics
router.get('/stats', superAdminController.getDashboardStats);

// Company Management
router.get('/companies', superAdminController.getCompanies);
router.put('/companies/:id', superAdminController.updateCompany);
router.delete('/companies/:id', superAdminController.deleteCompany);
router.post('/companies/:id/impersonate', superAdminController.impersonateCompany);

// Billing History
router.get('/billing', superAdminController.getBillingRecords);

// WhatsApp Monitoring
router.get('/whatsapp', superAdminController.getWhatsAppMonitoring);

// Support Center
router.get('/tickets', superAdminController.getSupportTickets);
router.post('/tickets/:id/reply', superAdminController.replySupportTicket);

// Global Settings
router.get('/settings', superAdminController.getSystemSettings);
router.post('/settings', superAdminController.updateSystemSettings);

// Audit Logs
router.get('/audit-logs', superAdminController.getAuditLogs);

module.exports = router;
