const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config({ path: './env/.env' });

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT // Usar el puerto de la variable de entorno
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Error de conexión a la base de datos:', err);
        return;
    }
    console.log('✅ Conectado a la base de datos MySQL en el puerto', process.env.DB_PORT);
});

module.exports = connection;