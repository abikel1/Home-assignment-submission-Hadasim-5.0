const sql = require('mssql');
const config = require('../config');
const mysql = require('mysql2');


class SupplierModel {
    // בדיקה אם הספק כבר קיים
    async checkSupplierExists(companyName, phoneNumber) {
        try {
            await sql.connect(config);
            const request = new sql.Request();

            request.input('companyName', sql.NVarChar, companyName);
            request.input('phoneNumber', sql.NVarChar, phoneNumber);

            const result = await request.query(
                'SELECT * FROM Suppliers WHERE CompanyName = @companyName OR PhoneNumber = @phoneNumber'
            );

            return result.recordset.length > 0;
        } catch (error) {
            throw new Error('שגיאה בבדיקת קיום ספק: ' + error.message);
        } finally {
            await sql.close();
        }
    }

    // אימות תקינות נתונים
    validateSupplierData(data) {
        const errors = [];

        // בדיקת שם חברה
        if (!data.companyName || data.companyName.trim().length < 2) {
            errors.push('שם החברה חייב להכיל לפחות 2 תווים');
        }

        // בדיקת מספר טלפון (בדיקה לפי פורמט ישראלי)
        const phoneRegex = /^0[5-9]\d{8}$/;
        if (!data.phoneNumber || !phoneRegex.test(data.phoneNumber)) {
            errors.push('מספר טלפון לא תקין');
        }

        // בדיקת שם נציג
        if (!data.representativeName || data.representativeName.trim().length < 2) {
            errors.push('שם נציג חייב להכיל לפחות 2 תווים');
        }

        // בדיקת סיסמה
        if (!data.password || data.password.length < 6) {
            errors.push('סיסמה חייבת להכיל לפחות 6 תווים');
        }

        // בדיקת אימות סיסמה
        if (data.password !== data.confirmPassword) {
            errors.push('הסיסמאות אינן תואמות');
        }

        return errors;
    }

    // הוספת ספק חדש
    async addSupplier(supplierData) {
        try {
            // בדיקה אם הספק כבר קיים
            const supplierExists = await this.checkSupplierExists(
                supplierData.companyName,
                supplierData.phoneNumber
            );
            if (supplierExists) {
                throw new Error('ספק עם שם חברה או מספר טלפון זהה כבר קיים במערכת');
            }

            // אימות נתונים
            const validationErrors = this.validateSupplierData(supplierData);
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
            }

            // התחברות למסד נתונים
            await sql.connect(config);
            const request = new sql.Request();

            // הוספת פרמטרים
            request.input('companyName', sql.NVarChar, supplierData.companyName);
            request.input('phoneNumber', sql.NVarChar, supplierData.phoneNumber);
            request.input('representativeName', sql.NVarChar, supplierData.representativeName);
            request.input('password', sql.NVarChar, supplierData.password);

            // ביצוע הוספה
            const result = await request.query(`
                INSERT INTO Suppliers (CompanyName, PhoneNumber, RepresentativeName, Password) 
                VALUES (@companyName, @phoneNumber, @representativeName, @password);
                SELECT SCOPE_IDENTITY() AS supplierId;
            `);

            const supplierId = result.recordset[0].supplierId;

            if (supplierData.products && supplierData.products.length > 0) {
                await this.addProductsToSupplier(supplierId, supplierData.products);
            }
            return {
                success: true,
                supplierId: result.recordset[0].supplierId
            };
        } catch (error) {
            throw error;
        } finally {
            await sql.close();
        }
    }

    async addProductsToSupplier(supplierId, products) {
        try {
            // בדיקת תקינות מוצרים
            const validationErrors = [];
            products.forEach((product, index) => {
                const productErrors = this.validateProductData(product);
                if (productErrors.length > 0) {
                    validationErrors.push(`מוצר ${index + 1}: ${productErrors.join(', ')}`);
                }
            });
    
            // זריקת שגיאות אם יש
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join('; '));
            }
    
            // התחברות למסד נתונים
            await sql.connect(config);
            
            // הוספת מוצרים
            const addedProducts = [];
            
            for (let i = 0; i < products.length; i++) {
                const product = products[i];
                
                // יצירת אובייקט request חדש לכל מוצר
                const request = new sql.Request();
                
                // שימוש בפרמטרים עם אינדקס למניעת התנגשות שמות
                request.input(`productName${i}`, sql.NVarChar, product.productName);
                request.input(`pricePerItem${i}`, sql.Decimal(10, 2), product.productPrice);
                request.input(`minimumQuantity${i}`, sql.Int, product.minQuantity);
                request.input(`supplierId${i}`, sql.Int, supplierId);
    
                const result = await request.query(`
                    INSERT INTO Products (ProductName, PricePerItem, MinimumQuantity, SupplierID) 
                    VALUES (@productName${i}, @pricePerItem${i}, @minimumQuantity${i}, @supplierId${i});
                    SELECT SCOPE_IDENTITY() AS productId;
                `);
    
                addedProducts.push({
                    productId: result.recordset[0].productId,
                    ...product
                });
            }
    
            return {
                success: true,
                products: addedProducts
            };
        } catch (error) {
            console.error("שגיאה בהוספת מוצרים:", error);
            throw error;
        } finally {
            await sql.close();
        }
    }

    validateProductData(productData) {
        const errors = [];

        // בדיקת שם מוצר
        if (!productData.productName) {
            errors.push('שם המוצר הוא שדה חובה');
        } else if (productData.productName.trim().length < 2) {
            errors.push('שם המוצר חייב להכיל לפחות 2 תווים');
        } else if (productData.productName.trim().length > 50) {
            errors.push('שם המוצר לא יכול להכיל יותר מ-50 תווים');
        }

        // בדיקת מחיר
        if (productData.productPrice === undefined || productData.productPrice === null) {
            errors.push('מחיר המוצר הוא שדה חובה');
        } else {
            const price = parseFloat(productData.productPrice);
            if (isNaN(price)) {
                errors.push('מחיר המוצר חייב להיות מספר');
            } else if (price <= 0) {
                errors.push('מחיר המוצר חייב להיות גדול מ-0');
            } else if (price > 10000) {
                errors.push('מחיר המוצר לא יכול להיות גבוה מ-10,000');
            }
        }

        // בדיקת כמות מינימלית
        if (productData.minQuantity === undefined || productData.minQuantity === null) {
            errors.push('כמות מינימלית היא שדה חובה');
        } else {
            const minQuantity = parseInt(productData.minQuantity);
            if (isNaN(minQuantity)) {
                errors.push('הכמות המינימלית חייבת להיות מספר');
            } else if (minQuantity < 1) {
                errors.push('הכמות המינימלית חייבת להיות לפחות 1');
            } else if (minQuantity > 1000) {
                errors.push('הכמות המינימלית לא יכולה להיות גבוהה מ-1,000');
            }
        }

        // בדיקת תווים מיוחדים בשם המוצר (אופציונלי)
    //    const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    //    if (productData.productName && specialCharsRegex.test(productData.productName)) {
    //        errors.push('שם המוצר לא יכול להכיל תווים מיוחדים');
    //    }

        return errors;
    }
    async loginSupplier(companyName, password) {
        try {
            await sql.connect(config);
            const request = new sql.Request();

            request.input('companyName', sql.NVarChar, companyName);
            request.input('password', sql.NVarChar, password);

            const result = await request.query(`
                SELECT * 
                FROM Suppliers 
                WHERE CompanyName = @companyName AND Password = @password
            `);

            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (error) {
            throw new Error('שגיאה בהתחברות ספק: ' + error.message);
        } finally {
            await sql.close();
        }
    }

    async getAllSupplierNames() {
        console.log('Model: getAllSupplierNames נקרא');
        try {
            // התחברות למסד נתונים
            await sql.connect(config);
            const request = new sql.Request();

            const query = "SELECT SupplierID, CompanyName FROM Suppliers ORDER BY CompanyName";
            console.log('Model: מריץ שאילתה:', query);

            const result = await request.query(query);
            console.log('Model: השאילתה הוחזרה בהצלחה, מספר תוצאות:', result.recordset.length);

            return result.recordset;
        } catch (error) {
            console.error('Model: שגיאה בשאילתה:', error);
            throw error;
        } finally {
            await sql.close();
        }
    }

    async getSupplierProducts(supplierId) {
        try {
            await sql.connect(config);
            const request = new sql.Request();

            request.input('supplierId', sql.Int, supplierId);

            const result = await request.query(`
            SELECT ProductID, ProductName, PricePerItem, MinimumQuantity 
            FROM Products 
            WHERE SupplierID = @supplierId
            ORDER BY ProductName
        `);

            return result.recordset;
        } catch (error) {
            console.error('Error fetching supplier products:', error);
            throw new Error('שגיאה בטעינת מוצרי הספק: ' + error.message);
        } finally {
            await sql.close();
        }
    }
}

module.exports = new SupplierModel();