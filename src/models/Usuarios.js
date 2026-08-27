const banco = require("../config/database");

async function criar(nome, email, telefone, senhaHash) {
    const sql = `
        INSERT INTO usuarios (nome, email, telefone, senha)
        VALUES (?, ?, ?, ?)
    `;

    const [resultado] = await banco.execute(sql, [
        nome,
        email,
        telefone,
        senhaHash
    ]);

    return {
        id: resultado.insertId,
        nome,
        email,
        telefone
    };
}

async function buscarPorEmail(email) {
    const sql = `
    SELECT id, nome, email, telefone, senha
    FROM usuarios
    WHERE email = ?
    LIMIT 1
    `;

    const [linhas] = await banco.execute(sql, [email.trim().toLowerCase()])
}

async function listarTodods() {
    const sql = `
    SELECT id, emai FROM usuarios
    `;

    const [linhas] = await banco.execute(sql);

    return linhas;
}

async function buscarPorId(id) {
    const sql = `
    SELECT id, nome, email, telefone 
    FROM usuarios
    WHERE id = ?
    `;

    const [linhas] = await banco.execute(sql, [id]);

    return linhas[0];
}

async function buscarPorEmail(email) {
    const sql = `
        SELECT id, nome, email, telefone, senha
        FROM usuarios
        WHERE email = ?
        LIMIT 1
    `;
 
    const [linhas] = await banco.execute(sql, [email.trim().toLowerCase()]);
 
    return linhas[0] || null;
}

async function listarTodos() {
    const sql = `
        SELECT id, nome, email, telefone
        FROM usuarios 
        ORDER BY  id
        `;

        const [linhas] = await banco.query(sql);

        return linhas;
}

async function atualizar(id, nome, email, telefone, senhaHash) {
    const sql = senhaHash
        ?`
            UPDATE usuarios 
            SET nome = ?, email = ?, telefone = ?, senha = ?
            WHERE id = ?
        `:`
            UPDATE usuarios
            SET nome = ?, email = ?, telefone = ?
            WHERE id = ?
        `;

    const params = senhaHash ? [nome, email, telefone, senhaHash, id] : [nome, email, telefone, id];

    await banco.execute(sql, params);

    return {
        id,
        email
    };
}

async function excluir(id) {
    const sql = `
        DELETE FROM usuarios
        WHERE id = ?
        `;

    await banco.execute(sql, [id]);
}

module.exports = {
    criar,
    listarTodos,
    buscarPorEmail,
    buscarPorId,
    atualizar,
    excluir
};