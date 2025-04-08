const express = require('express');
const OrderModel = require('../models/orderModel');

class orderController {
    async createOrder(req, res) {
        try {
            const { supplierId, items } = req.body;

            // בדיקות תיקוף
            if (!supplierId || !items || items.length === 0) {
                return res.status(400).json({
                    message: 'נתונים לא תקינים',
                    error: 'חסרים פרטי הזמנה'
                });
            }

            // בדיקת תקינות הזמנה
            for (const item of items) {
                if (!item.productId || !item.quantity || item.quantity <= 0) {
                    return res.status(400).json({
                        message: 'נתוני מוצר לא תקינים',
                        error: `מוצר ${item.productId} לא תקין`
                    });
                }
            }

            // יצירת הזמנה
            const result = await OrderModel.createOrder({
                supplierId,
                items
            });

            res.status(201).json({
                message: 'ההזמנה נוצרה בהצלחה',
                orderId: result.orderId
            });
        } catch (error) {
            console.error('שגיאה ביצירת הזמנה:', error);
            res.status(500).json({
                message: 'שגיאה ביצירת הזמנה',
                error: error.message
            });
        }
    }
    /**
   * מחזיר את כל ההזמנות של הספק
   */
    async getSupplierOrders(req, res) {
        try {
            console.log('Session details:', req.session);
            const supplierId = req.session.supplierId;

            console.log('Supplier ID from session:', supplierId);

            if (!supplierId) {
                console.error('No supplier ID in session');
                return res.status(401).json({
                    success: false,
                    message: 'לא מחובר כספק',
                    sessionDetails: req.session
                });
            }

            console.log('Attempting to fetch orders for supplier ID:', supplierId);

            const orders = await OrderModel.getSupplierOrders(supplierId);

            console.log('Orders retrieved:', orders);

            return res.json({
                success: true,
                orders
            });
        } catch (error) {
            console.error('שגיאה מלאה בשליפת הזמנות:', error);
            return res.status(500).json({
                success: false,
                message: 'אירעה שגיאה בשליפת הזמנות',
                errorDetails: error.toString()
            });
        }
    }
    // שליפת כל ההזמנות
    async getAllOrders(req, res) {
        try {
            const orders = await OrderModel.getAllOrders();

            res.json({
                success: true,
                orders: orders
            });
        } catch (error) {
            console.error('שגיאה בשליפת הזמנות:', error);
            res.status(500).json({
                success: false,
                message: 'אירעה שגיאה בשליפת ההזמנות'
            });
        }
    }

    // אישור הזמנה
    async completeOrder(req, res) {
        try {
            const { orderId, supplierId } = req.body;

            await OrderModel.updateOrderStatus(orderId, supplierId, 'הושלמה');

            res.json({
                success: true,
                message: 'ההזמנה אושרה בהצלחה'
            });
        } catch (error) {
            console.error('שגיאה בעדכון סטטוס הזמנה:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'אירעה שגיאה בעדכון סטטוס ההזמנה'
            });
        }
    }

    async updateOrderStatus(req, res) {
        try {
            const { orderId } = req.params;
            const { status } = req.body;
            const supplierId = req.session.supplierId;

            if (!supplierId) {
                return res.status(401).json({ success: false, message: 'לא מחובר כספק' });
            }

            if (!orderId || isNaN(orderId)) {
                return res.status(400).json({ success: false, message: 'מזהה הזמנה לא תקין' });
            }

            if (!status || !['ממתינה', 'בתהליך', 'בוטלה', 'הושלמה'].includes(status)) {
                return res.status(400).json({ success: false, message: 'סטטוס לא תקין' });
            }

            const result = await OrderModel.updateOrderStatus(orderId, supplierId, status);

            return res.json({
                success: true,
                message: 'סטטוס ההזמנה עודכן בהצלחה'
            });
        } catch (error) {
            console.error('שגיאה בעדכון סטטוס הזמנה:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'אירעה שגיאה בעדכון סטטוס ההזמנה'
            });
        }
    }
}

module.exports = new orderController();