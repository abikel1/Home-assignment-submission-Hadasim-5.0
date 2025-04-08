const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const SupplierModel = require('../models/supplierModel');

// צעד 1: מציג את הטופס הרשמה (רק הגדרה אחת)
router.get('/register', (req, res) => {
    res.render('pages/supplier-register');
});

// צעד 2: קבלת שמות הספקים
router.get('/names', (req, res) => {
    supplierController.getSupplierNames(req, res);
});

// צעד 3: ביצוע הרשמה
router.post('/register', (req, res) => {
    supplierController.registerSupplier(req, res);
});

// צעד 4: התחברות
router.post('/login', (req, res) => {
    supplierController.loginSupplier(req, res);
});

router.get('/dashboard', (req, res) => {
    res.render('pages/supplier-dashboard', {
        supplierId: req.session.supplierId,
        supplierName: req.session.companyName
    });
});

router.get('/:id/products', supplierController.getSupplierProducts);
router.get('/current-products', (req, res) => {
    const supplierId = req.session.supplierId;
    if (!supplierId) {
        return res.status(401).json({ error: 'יש להתחבר תחילה' });
    }
    
    supplierController.getSupplierProducts({
        params: { id: supplierId }
    }, res);
});

// הוספת מוצר לספק
router.post('/add-product', async (req, res) => {
    try {
        const supplierId = req.session.supplierId;

        if (!supplierId) {
            return res.status(401).json({
                success: false,
                message: 'יש להתחבר תחילה'
            });
        }

        const { products } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'לא התקבלו נתוני מוצרים תקינים'
            });
        }
        console.log('נתוני בקשה:', req.body);
        console.log('מזהה ספק:', req.session.supplierId);

        // קריאה לפונקציה במודל
        const result = await SupplierModel.addProductsToSupplier(supplierId, products);

        res.status(200).json(result);
    } catch (error) {
        console.error('שגיאה בהוספת מוצר:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בהוספת מוצר: ' + error.message,
            error: error.message
        });
    }
});

module.exports = router;