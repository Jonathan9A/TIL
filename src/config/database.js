const mysql = require("mysql2/promise");

const banco = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "BD_TIL",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = banco;