const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

app.use(express.json());

// Middleware para registrar rutas
app.use((req, res, next) => {
    console.log(`Ruta consultada: ${req.path}`);
    next();
});

// Ruta GET /joyas
app.get('/joyas', async (req, res) => {
    try {
        const { limits, page, order_by } = req.query;
        const limit = limits ? `LIMIT ${parseInt(limits)}` : '';
        const offset = page ? `OFFSET ${(parseInt(page) - 1) * parseInt(limits)}` : '';
        const orderBy = order_by ? `ORDER BY ${order_by.replace('_', ' ')}` : '';

        const query = `SELECT * FROM inventario ${orderBy} ${limit} ${offset}`;
        const result = await pool.query(query);

        const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;
        const links = {
            self: `${baseUrl}?limits=${limits}&page=${page}&order_by=${order_by}`,
            next: `${baseUrl}?limits=${limits}&page=${parseInt(page) + 1}&order_by=${order_by}`,
            previous: `${baseUrl}?limits=${limits}&page=${parseInt(page) - 1}&order_by=${order_by}`,
        };

        res.json({ data: result.rows, links });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta GET /joyas/filtros
app.get('/joyas/filtros', async (req, res) => {
    try {
        const { precio_max, precio_min, categoria, metal } = req.query;

        const query = `
            SELECT * FROM inventario
            WHERE precio <= $1 AND precio >= $2 AND categoria = $3 AND metal = $4
        `;

        const result = await pool.query(query, [precio_max, precio_min, categoria, metal]);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para manejar errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
