
const formatDateForSQL = (date) => {

    const opciones = {
        timeZone: 'America/Bogota',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    };

    // Esto genera un string en formato: "dd/mm/yyyy, hh:mm:ss" en hora de Colombia
    const formateador = new Intl.DateTimeFormat('es-CO', opciones).format(date||new Date());

    // Lo reacomodamos rápido para que MySQL lo entienda (YYYY-MM-DD HH:MM:SS)
    const [fecha, hora] = formateador.split(', ');
    const [dia, mes, año] = fecha.split('/');
    const fechaHoraParaSQL = `${año}-${mes}-${dia} ${hora}`;

    return fechaHoraParaSQL;
    // Resultado: "2026-05-23 02:46:00" (Exactamente la hora de Colombia)
};

const parseExcelRow = (row = {}) => {
    // Packaging / sale_unit logic omitted for now
    // const contenido = Number(row['contenido por presentacion'] || 1);

    return {
        codigo: row.codigo != null ? String(row.codigo).trim() : '',
        nombre: row.nombre != null ? String(row.nombre).trim() : '',
        cantidad: Number(row.cantidad || 0),
        // costo: Number(row.costo || 0), // previous packaging cost column
        costoUnitario: Number(row['costo unitario'] || 0),
        precio: Number(row.precio || 0),
        // presentacion: String(row.presentacion || 'UNIDAD').trim(),
        // contenido: Number.isFinite(contenido) && contenido > 0 ? contenido : 1,
        presentacion: '',
        contenido: 0,
    };
};

const buildEntryRecord = (excProduct, businessId, productId) => {
    const row = parseExcelRow(excProduct);
    // Packaging / sale_unit logic omitted for now
    // const packaging_type = row.presentacion;
    // const units_per_packaging = packaging_type.toUpperCase() === 'UNIDAD' ? 1 : row.contenido;
    const packaging_type = '';
    const units_per_packaging = 0;
    // const packaging_cost = row.costo;
    // const total_cost = packaging_cost * quantity;
    // const unit_cost = units_per_packaging > 0
    //     ? packaging_cost / units_per_packaging
    //     : packaging_cost;
    const packaging_cost = 0;
    const quantity = row.cantidad;
    const unit_cost = row.costoUnitario;
    const total_cost = unit_cost * quantity;

    const entry = {
        business_id: businessId,
        product_id: productId,
        quantity,
        packaging_type,
        units_per_packaging,
        packaging_cost,
        total_cost,
        unit_cost,
        created_at: formatDateForSQL(new Date()),
        stock_before: 0,
        stock_after: 0,
    };

    return entry;
};

const computeStockAfter = (stockBefore, saleUnit, entry) => {
    // Packaging / sale_unit logic omitted for now
    // const saleUnitNormalized = String(saleUnit || '').toUpperCase();
    // const packagingNormalized = String(entry.packaging_type || '').toUpperCase();
    //
    // if (saleUnitNormalized === 'UNIDAD' && packagingNormalized !== 'UNIDAD') {
    //     return Number(stockBefore) + (Number(entry.quantity) * Number(entry.units_per_packaging));
    // }

    return Number(stockBefore) + Number(entry.quantity);
};

const buildProductFromExcel = (excProduct, businessId, stock) => {
    const row = parseExcelRow(excProduct);

    return {
        custom_code: row.codigo,
        business_id: businessId,
        name: row.nombre,
        stock: Number(stock) || 0,
        // Packaging / sale_unit logic omitted for now
        // sale_unit: row.presentacion,
        // unit_factor: row.presentacion.toUpperCase() === 'UNIDAD' ? 1 : row.contenido,
        // cost: row.contenido > 0 ? row.costo / (row.presentacion.toUpperCase() === 'UNIDAD' ? 1 : row.contenido) : row.costo,
        sale_unit: '',
        unit_factor: 0,
        price: row.precio,
        // cost: row.costo, // previous packaging cost column
        cost: row.costoUnitario,
        description: null,
    };
};

module.exports = {
    buildEntryRecord,
    buildProductFromExcel,
    computeStockAfter,
    formatDateForSQL,
    parseExcelRow,
};
