const xlsx = require('xlsx');
const { Router } = require('express');
const upload = require('../multerconfig');
const {
    buildEntryRecord,
    buildProductFromExcel,
    computeStockAfter,
    formatDateForSQL,
    parseExcelRow,
} = require('../utils');

const router = Router();

const db = require('../databse/index')
const { authenticateToken, authorizeRoles, ROLES } = require('../middleware/Auth');

router.post('/bulk', authenticateToken, authorizeRoles(ROLES.ADMIN), upload.single('archivo_excel'), async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).send('Archivo requerido para cargar productos.');
        }
       
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const excelProducts = xlsx.utils.sheet_to_json(worksheet);

        const codes = excelProducts
            .map((product) => parseExcelRow(product).codigo)
            .filter(Boolean);

        const { data: existingProductsinDb } = await db.products.getProductsByCode(
            req.user.businessId,
            codes
        );

        const existingProductsMap = new Map(
            existingProductsinDb.map((p) => [String(p.custom_code).trim(), p])
        );

        const entriesOperations = [];
        const newProductsOperations = [];

        for (const excProduct of excelProducts) {
            const row = parseExcelRow(excProduct);

            if (!row.codigo) {
                continue;
            }

            const dbProduct = existingProductsMap.get(row.codigo);

            if (dbProduct) {
                const entry = buildEntryRecord(excProduct, req.user.businessId, dbProduct.id);
                entry.stock_before = Number(dbProduct.stock) || 0;
                // Packaging / sale_unit logic omitted for now
                // entry.stock_after = computeStockAfter(
                //     entry.stock_before,
                //     dbProduct.sale_unit,
                //     entry
                // );
                entry.stock_after = computeStockAfter(entry.stock_before, '', entry);

                const productUpdated = {
                    business_id: req.user.businessId,
                    product_id: dbProduct.id,
                    custom_code: dbProduct.custom_code,
                    stock: entry.stock_after,
                };

                entriesOperations.push({ entry, productUpdated });
            } else {
                const entry = buildEntryRecord(excProduct, req.user.businessId, -1);
                const product = buildProductFromExcel(excProduct, req.user.businessId, 0);

                entry.stock_before = 0;
                // Packaging / sale_unit logic omitted for now
                // entry.stock_after = computeStockAfter(0, product.sale_unit, entry);
                entry.stock_after = computeStockAfter(0, '', entry);
                product.stock = entry.stock_after;

                newProductsOperations.push({ product, entry });
            }
        }

        if (newProductsOperations.length > 0) {
           const dbresponse = await db.products.insertProductsAsTransaction(newProductsOperations);

            if (dbresponse.error) {
                console.log(dbresponse.error)
                return res.status(500).json({ok: false})
            }
        }

        if (entriesOperations.length > 0) {
            const dbresponse = await db.products.insertEntriesTransactions(entriesOperations);
            if (dbresponse.error) {
                console.log(dbresponse.error)
                return res.status(500).json({ok: false})
            }
        }

        return res.json({
            ok: true,
            createdProducts: newProductsOperations.length,
            createdEntries: entriesOperations.length + newProductsOperations.length,
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ok: false})
    }   
});


router.post('/', authenticateToken, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
        const { user, body } = req;
        const customCode = String(body?.customCode || '').trim();
        const quantity = Number(body?.quantity || 0);
        const unitCost = Number(body?.unitCost || 0);

        if (!customCode) {
            return res.status(400).json({
                ok: false,
                message: 'Código de producto es requerido',
            });
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
            return res.status(400).json({
                ok: false,
                message: 'Cantidad inválida',
            });
        }

        if (!Number.isFinite(unitCost) || unitCost < 0) {
            return res.status(400).json({
                ok: false,
                message: 'Costo unitario inválido',
            });
        }

        const { data: existingProducts } = await db.products.getProductsByCode(
            user.businessId,
            [customCode]
        );

        const dbProduct = existingProducts?.[0];

        if (!dbProduct) {
            return res.status(404).json({
                ok: false,
                message: 'No existe un producto con ese código',
            });
        }

        const stockBefore = Number(dbProduct.stock) || 0;
        const stockAfter = stockBefore + quantity;

        const entry = {
            business_id: user.businessId,
            product_id: dbProduct.id,
            quantity,
            packaging_type: '',
            units_per_packaging: 0,
            packaging_cost: 0,
            unit_cost: unitCost,
            total_cost: unitCost * quantity,
            created_at: formatDateForSQL(new Date()),
            stock_before: stockBefore,
            stock_after: stockAfter,
        };

        const productUpdated = {
            business_id: user.businessId,
            product_id: dbProduct.id,
            custom_code: dbProduct.custom_code,
            stock: stockAfter,
        };

        const dbResponse = await db.products.insertEntriesTransactions([
            { entry, productUpdated },
        ]);

        if (dbResponse.error) {
            console.log(dbResponse.error);
            return res.status(500).json({ ok: false, message: 'Error registrando la entrada' });
        }

        return res.status(201).json({
            ok: true,
            entry: {
                productId: dbProduct.id,
                customCode: dbProduct.custom_code,
                quantity,
                unitCost,
                stockBefore,
                stockAfter,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false });
    }
});

router.get('/', authenticateToken, authorizeRoles(ROLES.ADMIN), async (req, res) => {

    try {


        const { user, query } = req;
        const page      = Number(query.page || 1);
        const pageSize  = Number(query.pageSize || 10);

        if (pageSize > 100) {
            return res.status(400).json({ ok: false, message: 'no se retorna mas de 100 items por pagina' });
        }

        const dbResponse = await db.entries.getEntries(
            user.businessId,
            Number(page),
            Number(pageSize),
            query.search
        );
        if(dbResponse.error) {
            throw new Error('Error getting the last entries')
        }


        return res.status(200).json({
            ok: true,
            entries: dbResponse.data,
            page,
            pageSize,
            totalRows: dbResponse.totalRows,
            pages: dbResponse.totalPages,
        });
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({ok: false});
    }   

});



module.exports = router;
