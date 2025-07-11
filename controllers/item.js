const connection = require('../config/database');

exports.getAllItems = (req, res) => {
    const sql = `
        SELECT i.*, s.*, c.description AS category 
        FROM item i
        INNER JOIN stock s ON i.item_id = s.item_id
        INNER JOIN category c ON i.category_id = c.category_id
    `;
    try {
        connection.query(sql, (err, rows, fields) => {
            if (err instanceof Error) {
                console.log(err);
                return;
            }

            return res.status(200).json({
                rows,
            });
        });
    } catch (error) {
        console.log(error);
    }
};


exports.getSingleItem = (req, res) => {
    const sql = `
        SELECT i.*, s.*, c.description AS category 
        FROM item i
        INNER JOIN stock s ON i.item_id = s.item_id
        INNER JOIN category c ON i.category_id = c.category_id
        WHERE i.item_id = ?
    `;
    const values = [parseInt(req.params.id)];
    try {
        connection.execute(sql, values, (err, result, fields) => {
            if (err instanceof Error) {
                console.log(err);
                return;
            }

            return res.status(200).json({
                success: true,
                result
            });
        });
    } catch (error) {
        console.log(error);
    }
};

exports.createItem = (req, res, next) => {
    const { item_name, description, cost_price, sell_price, category_id, quantity } = req.body;
    const images = req.files; // this is an array of files
    let imagePaths = [];

    // Validate required fields
    if (!item_name || !description || !cost_price || !sell_price || !category_id || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert item
    const sql = 'INSERT INTO item (item_name, description, cost_price, sell_price, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())';
    const values = [item_name, description, cost_price, sell_price, category_id];

    connection.execute(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error inserting item', details: err });
        }

        const itemId = result.insertId;

        // Insert stock
        const stockSql = 'INSERT INTO stock (item_id, quantity) VALUES (?, ?)';
        const stockValues = [itemId, quantity];

        connection.execute(stockSql, stockValues, (stockErr) => {
            if (stockErr) {
                console.error(stockErr);
                return res.status(500).json({ error: 'Error inserting stock', details: stockErr });
            }

            // Insert multiple image paths
            if (images && images.length > 0) {
                const imageSql = 'INSERT INTO item_images (item_id, image_path, created_at, updated_at) VALUES (?, ?, NOW(), NOW())';
                let imageInsertErrors = [];
                let completed = 0;

                images.forEach((file) => {
                    const imagePath = file.path.replace(/\\/g, "/");
                    imagePaths.push(imagePath);

                    connection.execute(imageSql, [itemId, imagePath], (imgErr) => {
                        if (imgErr) {
                            imageInsertErrors.push(imgErr);
                        }
                        completed++;

                        if (completed === images.length) {
                            if (imageInsertErrors.length > 0) {
                                return res.status(500).json({ error: 'Error saving images', details: imageInsertErrors });
                            }
                            return res.status(201).json({
                                success: true,
                                itemId,
                                quantity,
                                images: imagePaths
                            });
                        }
                    });
                });
            } else {
                // No images uploaded
                return res.status(201).json({
                    success: true,
                    itemId,
                    quantity,
                    images: []
                });
            }
        });
    });
};


exports.updateItem = (req, res, next) => {
    const id = req.params.id;
    const { item_name, category_id, description, cost_price, sell_price, quantity } = req.body;

    if (!item_name || !category_id || !quantity || !description || !cost_price || !sell_price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update item table
    const itemSql = `
        UPDATE item 
        SET item_name = ?, category_id = ?, description = ?, cost_price = ?, sell_price = ?, updated_at = NOW()
        WHERE item_id = ? AND deleted_at IS NULL`;
    const itemValues = [item_name, category_id, description, cost_price, sell_price, id];

    connection.execute(itemSql, itemValues, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error updating item', details: err });
        }

        // Update stock
        const stockSql = `UPDATE stock SET quantity = ? WHERE item_id = ? AND deleted_at IS NULL`;
        const stockValues = [quantity, id];

        connection.execute(stockSql, stockValues, (err) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Error updating stock', details: err });
            }

            // If new images are uploaded
            if (req.files && req.files.length > 0) {
                const imageSql = `
                    INSERT INTO item_images (item_id, image_path, created_at, updated_at)
                    VALUES ?`;

                const imageValues = req.files.map(file => [
                    id,
                    file.path.replace(/\\/g, '/'),
                    new Date(),
                    new Date()
                ]);

                connection.query(imageSql, [imageValues], (err) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ error: 'Error saving images', details: err });
                    }

                    return res.status(200).json({ success: true, message: 'Item updated with images' });
                });
            } else {
                // No new images
                return res.status(200).json({ success: true, message: 'Item updated' });
            }
        });
    });
};



exports.deleteItem = (req, res) => {
    const id = req.params.id;

    // Delete from item_images
    const deleteImagesSql = 'DELETE FROM item_images WHERE item_id = ?';
    connection.execute(deleteImagesSql, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error deleting item images', details: err });
        }

        // Delete from stock
        const deleteStockSql = 'DELETE FROM stock WHERE item_id = ?';
        connection.execute(deleteStockSql, [id], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Error deleting stock', details: err });
            }

            // Delete from item
            const deleteItemSql = 'DELETE FROM item WHERE item_id = ?';
            connection.execute(deleteItemSql, [id], (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: 'Error deleting item', details: err });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Item and related records deleted'
                });
            });
        });
    });
};


// exports.deleteItem = (req, res) => {
//     const id = req.params.id;

//     const now = new Date();

//     // Soft delete from item_images
//     const archiveImagesSql = 'UPDATE item_images SET deleted_at = ? WHERE item_id = ?';
//     connection.execute(archiveImagesSql, [now, id], (err) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).json({ error: 'Error archiving item images', details: err });
//         }

//         // Soft delete from stock
//         const archiveStockSql = 'UPDATE stock SET deleted_at = ? WHERE item_id = ?';
//         connection.execute(archiveStockSql, [now, id], (err) => {
//             if (err) {
//                 console.log(err);
//                 return res.status(500).json({ error: 'Error archiving stock', details: err });
//             }

//             // Soft delete from item
//             const archiveItemSql = 'UPDATE item SET deleted_at = ? WHERE item_id = ?';
//             connection.execute(archiveItemSql, [now, id], (err) => {
//                 if (err) {
//                     console.log(err);
//                     return res.status(500).json({ error: 'Error archiving item', details: err });
//                 }

//                 return res.status(200).json({
//                     success: true,
//                     message: 'Item archived (soft deleted) successfully'
//                 });
//             });
//         });
//     });
// };
