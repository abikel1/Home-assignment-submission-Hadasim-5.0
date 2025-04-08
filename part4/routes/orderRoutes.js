const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController'); // שים לב לכתיב

router.post('/create', orderController.createOrder);
router.get('/orders', orderController.getSupplierOrders);
router.put('/order/:orderId/status', orderController.updateOrderStatus);
// בראוטר
router.get('/all-orders', orderController.getAllOrders);
router.put('/complete', orderController.completeOrder);

// בקונטרולר
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await OrderModel.getAllOrders();
        res.json({ success: true, orders });
    } catch (error) {
        console.error('שגיאה בשליפת הזמנות:', error);
        res.status(500).json({ success: false, message: 'אירעה שגיאה בשליפת ההזמנות' });
    }
};

exports.completeOrder = async (req, res) => {
    try {
        const { orderId, supplierId } = req.body;

        await OrderModel.updateOrderStatus(orderId, supplierId, 'הושלמה');

        res.json({ success: true });
    } catch (error) {
        console.error('שגיאה בעדכון סטטוס הזמנה:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'אירעה שגיאה בעדכון סטטוס ההזמנה'
        });
    }
};
// router.get('/test-orders', (req, res) => {
//     console.log('Test orders route accessed');
//     console.log('Session:', req.session);

//     res.json({
//         success: true,
//         supplierId: req.session.supplierId,
//         sessionDetails: req.session
//     });
// });
module.exports = router;
