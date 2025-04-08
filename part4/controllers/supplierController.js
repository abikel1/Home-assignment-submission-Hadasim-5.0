const express = require('express');
const SupplierModel = require('../models/supplierModel');

class SupplierController {
    // פונקציית הרשמה של ספק חדש
    async registerSupplier(req, res) {
        try {
            // בדיקה אם קיים body
            if (!req.body) {
                return res.status(400).json({
                    message: 'לא התקבלו נתונים',
                    error: 'Body is undefined'
                });
            }

            console.log('נתונים שהתקבלו:', req.body);

            const {
                companyName,
                phoneNumber,
                representativeName,
                password,
                confirmPassword,
                products
            } = req.body;

            // הוספת ספק באמצעות המודל
            const result = await SupplierModel.addSupplier({
                companyName,
                phoneNumber,
                representativeName,
                password,
                confirmPassword,
                products // העברת המוצרים אם קיימים
            });

            // תגובה להצלחה
            res.status(201).json({
                success: true,
                message: 'ספק נוסף בהצלחה',
                supplierId: result.supplierId
            });
        } catch (error) {
            console.error('שגיאה בהרשמת ספק:', error);

            // טיפול בשגיאות
            res.status(400).json({
                success: false,
                message: 'שגיאה בהוספת ספק',
                error: error.message
            });
        }
    }

    async loginSupplier(req, res) {
        try {
            const { companyName, password } = req.body;
    
            // אימות נתונים 
            if (!companyName || !password) {
                return res.status(400).json({ message: 'שם החברה והסיסמה הם שדות חובה' });
            }
    
            const supplier = await SupplierModel.loginSupplier(companyName, password);
    
            if (supplier) {
                req.session.supplierId = supplier.SupplierID;
                req.session.companyName = supplier.CompanyName;
                // אם ההתחברות מוצלחת, שלח סטטוס מיוחד
                res.status(200).json({
                    success: true,
                    redirectUrl: '/supplier/dashboard'
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: 'שם החברה או הסיסמה שגויים'
                });
            }
        } catch (error) {
            console.error('שגיאה בהתחברות ספק:', error);
            res.status(500).json({ message: 'שגיאה בהתחברות ספק', error: error.message });
        }
    }

    async getSupplierNames(req, res) {
        try {
            console.log('Controller: מנסה לקבל נתונים מהמודל');
            const suppliers = await SupplierModel.getAllSupplierNames();
            console.log('Controller: המודל החזיר נתונים:', suppliers);
            res.status(200).json(suppliers);
        } catch (error) {
            console.error('Error fetching supplier names:', error);
            res.status(500).json({ error: 'אירעה שגיאה בעת טעינת רשימת הספקים' });
        }
    }

    // פונקציית הצגת טופס הרשמה
    showRegistrationForm(req, res) {
        res.render('pages/supplier-register', {
            errors: null,
            formData: {}
        });
    }
    async getSupplierProducts(req, res) {
        try {
            const supplierId = parseInt(req.params.id);

            if (isNaN(supplierId)) {
                return res.status(400).json({ error: 'מזהה ספק לא תקין' });
            }

            const products = await SupplierModel.getSupplierProducts(supplierId);
            res.status(200).json(products);
        } catch (error) {
            console.error('Error fetching supplier products:', error);
            res.status(500).json({ error: error.message });
        }
    }


}

module.exports = new SupplierController();