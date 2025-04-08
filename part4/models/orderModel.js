const sql = require('mssql');
const config = require('../config');

class OrderModel {
    async createOrder(orderData) {
        try {
            await sql.connect(config);
            const transaction = new sql.Transaction();
            await transaction.begin();

            try {
                const request = new sql.Request(transaction);

                // הוספת פרמטרים
                request.input('supplierId', sql.Int, orderData.supplierId);
                request.input('status', sql.NVarChar(20), 'ממתינה');

                const result = await request.query(`
                    INSERT INTO Orders (SupplierID, OrderDate, Status)
                    VALUES (@supplierId, GETDATE(), @status);
                    SELECT SCOPE_IDENTITY() AS orderId;
                `);
                console.log('Supplier ID:', orderData.supplierId);
                console.log('Status:', 'ממתינה');
                const checkQuery = await request.query(`
                    SELECT * FROM Orders WHERE OrderID = ${result.recordset[0].orderId}
                `);
                console.log('Inserted Order Details:', checkQuery.recordset);

                const orderId = result.recordset[0].orderId;

                // הוספת פריטי הזמנה
                for (const item of orderData.items) {
                    // צור request חדש לכל איטרציה
                    const itemRequest = new sql.Request(transaction);

                    itemRequest.input('orderId', sql.Int, orderId);
                    itemRequest.input('productId', sql.Int, item.productId);
                    itemRequest.input('quantity', sql.Int, item.quantity);

                    await itemRequest.query(`
                        INSERT INTO OrderItems (OrderID, ProductID, Quantity)
                        VALUES (@orderId, @productId, @quantity);
                    `);
                }

                await transaction.commit();

                return {
                    success: true,
                    orderId: orderId
                };
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            throw error;
        } finally {
            await sql.close();
        }
    }

    async getSupplierOrders(supplierId) {
        try {
            const pool = await sql.connect(config);

            // שאילתא ראשית להזמנות
            const query = `
                SELECT o.OrderID, o.OrderDate, o.Status,
                       (SELECT COUNT(*) FROM OrderItems WHERE OrderID = o.OrderID) AS ItemCount,
                       (SELECT SUM(oi.Quantity * p.PricePerItem) 
                        FROM OrderItems oi 
                        JOIN Products p ON oi.ProductID = p.ProductID 
                        WHERE oi.OrderID = o.OrderID) AS TotalAmount
                FROM Orders o
                WHERE o.SupplierID = @supplierId
                ORDER BY o.OrderDate DESC
            `;

            const result = await pool.request()
                .input('supplierId', sql.Int, supplierId)
                .query(query);

            // שליפת פריטים לכל הזמנה
            for (let order of result.recordset) {
                const itemsQuery = `
                    SELECT 
                        p.ProductName,
                        oi.Quantity,
                        p.PricePerItem
                    FROM OrderItems oi
                    JOIN Products p ON oi.ProductID = p.ProductID
                    WHERE oi.OrderID = @orderId
                `;

                const itemsResult = await pool.request()
                    .input('orderId', sql.Int, order.OrderID)
                    .query(itemsQuery);

                order.items = itemsResult.recordset;
            }

            return result.recordset;
        } catch (error) {
            console.error('שגיאה בשליפת הזמנות:', error);
            throw new Error('אירעה שגיאה בשליפת ההזמנות');
        }
    }

    async updateOrderStatus(orderId, supplierId, newStatus) {
        try {
            const pool = await sql.connect(config);

            // וידוא שההזמנה שייכת לספק
            const checkQuery = `
                SELECT OrderID FROM Orders 
                WHERE OrderID = @orderId AND SupplierID = @supplierId
            `;

            const checkResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .input('supplierId', sql.Int, supplierId)
                .query(checkQuery);

            if (checkResult.recordset.length === 0) {
                throw new Error('ההזמנה לא נמצאה או אינה שייכת לספק זה');
            }

            const updateQuery = `
            UPDATE Orders 
            SET Status = @newStatus
            WHERE OrderID = @orderId AND SupplierID = @supplierId
        `;

            await pool.request()
                .input('newStatus', sql.NVarChar(50), newStatus)
                .input('orderId', sql.Int, orderId)
                .input('supplierId', sql.Int, supplierId)
                .query(updateQuery);

            return true;
        } catch (error) {
            console.error('שגיאה בעדכון סטטוס הזמנה:', error);
            throw new Error('אירעה שגיאה בעדכון סטטוס ההזמנה');
        }
    }
    async getAllOrders() {
        try {
            const pool = await sql.connect(config);
            const query = `
                SELECT 
                    o.OrderID, 
                    o.OrderDate, 
                    o.Status,
                    s.SupplierID,
                    s.CompanyName AS SupplierName,
                    (SELECT COUNT(*) FROM OrderItems WHERE OrderID = o.OrderID) AS ItemCount,
                    (SELECT SUM(oi.Quantity * p.PricePerItem) 
                     FROM OrderItems oi 
                     JOIN Products p ON oi.ProductID = p.ProductID 
                     WHERE oi.OrderID = o.OrderID) AS TotalAmount,
                    (
                        SELECT p.ProductName, oi.Quantity, p.PricePerItem
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductID = p.ProductID
                        WHERE oi.OrderID = o.OrderID
                        FOR JSON PATH
                    ) AS Items
                FROM Orders o
                JOIN Suppliers s ON o.SupplierID = s.SupplierID
                ORDER BY o.OrderDate DESC
            `;

            const result = await pool.request().query(query);
            return result.recordset;
        } catch (error) {
            console.error('שגיאה בשליפת הזמנות:', error);
            throw error;
        }
    }
}

module.exports = new OrderModel();