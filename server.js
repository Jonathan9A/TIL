const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const banco = require("./src/config/database");
const usuarios = require("./src/models/Usuarios");

const app = express();
const PORT = 3000;

// Permite receber dados de formulários
app.use(express.urlencoded({ extended: true }));

// Permite receber dados em formato JSON
app.use(express.json());

// Disponibiliza os arquivos da pasta public
app.use(express.static(path.join(__dirname, "public")));

//
// ROTAS GET: ABRIR PAGINAS
//

// pagina inicial
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// login
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// cadastro
app.get("/cadastro", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "cadastro.html"));
});

// Rota da pagina do administrador
app.get("/adm", async (req, res) => {
    const listarUsuarios = await usuarios.listarTodos();

    const linhas = listarUsuarios.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.nome}</td>
            <td class="acoes">
                <a href="/usuarios/${u.id}">Ver</a>
                <a href="/usuarios/${u.id}/editar">Editar</a>
                <form method="POST" action="/usuarios/${u.id}/excluir"
                      onsubmit="return confirm('Tem certeza que quer excluir?')">
                    <button type="submit" class="btn-excluir">Excluir</button>
                </form>
            </td>
        </tr>
        `).join("");

    res.send(`
        <html>
        <head><link rel="stylesheet" href="/style.css"></head>
        <body class="pagina-admin">
            <div class="painel">
                <h1>Área do admin</h1>
                <p class="total-usuarios">Total de usuários cadastrados: ${listarUsuarios.length}</p>
                <table class="tabela-usuarios">
                    <tr><th>ID</th><th>Nome</th><th>Ações</th></tr>
                    ${linhas}
                </table>
                <a href="/">
                    <button>Início</button>
                </a>
            </div>
        </body>
        </html>
         `);
});

// Rota de detalhe: mostra id, nome, email e telefone, sem formulário nenhum
app.get("/usuarios/:id", async (req, res) => {
    const usuario = await usuarios.buscarPorId(req.params.id);

    if (!usuario) {
        return res.status(404).send(`
            <html>
            <head><link rel="stylesheet" href="/style.css"></head>
            <body class="pagina-admin">
                <div class="ficha nao-encontrado">
                    <h1>Usuário não encontrado</h1>
                    <p>Não existe nenhum usuário com o ID ${req.params.id}.</p>
                    <div class="voltar">
                        <a href="/adm">
                            <button>Voltar para a listagem</button>
                        </a>
                    </div>
                </div>
            </body>
            </html>
        `);
    }

    res.send(`
        <html>
        <head><link rel="stylesheet" href="/style.css"></head>
        <body class="pagina-admin">
            <div class="ficha">
                <h1>Usuário #${usuario.id}</h1>
                <p><strong>Nome:</strong> ${usuario.nome}</p>
                <p><strong>Email:</strong> ${usuario.email}</p>
                <p><strong>Telefone:</strong> ${usuario.telefone}</p>
                <div class="voltar">
                    <a href="/adm">
                        <button>Voltar para a listagem</button>
                    </a>
                </div>
            </div>
        </body>
        </html>
    `);
});

//
// ROTAS POST: RECEBER DADOS
//

//  Rota para receber o formulario de cadastro
app.post("/cadastro", async (req, res) => {
    const { nome, email, telefone, senha } = req.body;

    if (!nome || !email || !telefone || !senha) {
        return res.status(400).send(
            "Preencha todos os campos."
        );
    }

    if (senha.length < 6) {
        return res.status(400).send(
            "A senha deve ter pelo menos 6 caracteres."
        );
    }

    try {
        const emailFormatado = email.trim().toLowerCase();
        const senhaHash = await bcrypt.hash(senha, 10);

        const usuarioCriado = await usuarios.criar(
            nome,
            emailFormatado,
            telefone,
            senhaHash
        );

        console.log("Usuário cadastrado:", usuarioCriado);

        return res.redirect("/login");
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).send(
                "Este e-mail já está cadastrado."
            );
        }

        console.error("Erro ao cadastrar usuário:", erro);

        return res.status(500).send(
            "Não foi possível realizar o cadastro."
        );
    }
});

app.get("/usuarios/:id/editar", async (req, res) => {
    const usuario = await usuarios.buscarPorId(req.params.id);

    if (!usuario) {
        return res.status(404).send(`
            <html>
            <head><link rel="stylesheet" href="/style.css"></head>
            <body class="pagina-admin">
                <div class="ficha nao-encontrado">
                    <h1>Usuário não encontrado</h1>
                    <p>Não existe nenhum usuário com o ID ${req.params.id} para editar.</p>
                    <div class="voltar">
                        <a href="/adm">
                            <button>Voltar para a listagem</button>
                        </a>
                    </div>
                </div>
            </body>
            </html>
        `);
    }

    res.send(`
        <html>
            <head><link rel="stylesheet" href="/style.css"></head>
            <body>
                <h1 style="text-align:center; margin-bottom:20px;">Editar usuário</h1>
                <form method="POST" action="/usuarios/${usuario.id}/editar" class="formulario" style="margin: 0 auto 20px;">
                    <label>Nome:</label>
                    <input type="text" name="nome" value="${usuario.nome}" required>

                    <label>Email:</label>
                    <input type="email" name="email" value="${usuario.email}" required>

                    <label>Telefone:</label>
                    <input type="text" name="telefone" value="${usuario.telefone}" required>

                    <label>Nova senha (deixe em branco pra manter a atual):</label>
                    <input type="password" name="senha">

                    <button type="submit">Salvar</button>
                </form>
                <div style="text-align:center;">
                    <a href="/adm">
                        <button>Voltar para a listagem</button>
                    </a>
                </div>
            </body>
        </html>
        `);
});

app.post("/usuarios/:id/editar", async (req, res) => {
    const { nome, email, telefone, senha } = req.body;

    try {
        const senhaHash = senha ? await bcrypt.hash(senha, 10) : undefined;

        await usuarios.atualizar(req.params.id, nome, email, telefone, senhaHash);

        res.redirect("/adm");
    } catch (erro) {
        console.error("Erro ao editar: ", erro);
        res.redirect(`/usuarios/${req.params.id}/editar`);
    }
});

app.post("/usuarios/:id/excluir", async (req, res) => {
    await usuarios.excluir(req.params.id);
    res.redirect("/adm");
});

// Rota para receber o formulario de login
app.post("/login", async (req, res) => {
    const email = req.body.email;
    const senha = req.body.senha;

    try {
        const usuario = await usuarios.buscarPorEmail(email);

        if (!usuario) {
            return res.redirect("/login");
        }

        const senhaCorreta = await bcrypt.compare(
            senha, usuario.senha
        );

        if (!senhaCorreta) {
            return res.redirect("/login");
        }

        res.redirect("/adm");
    } catch (erro) {
        console.error(
            "erro ao fazer login: ", erro
        );

        res.redirect("/login");
    }
});

//
// TESTE DO BANCO
//

app.get("/teste-banco", async (req, res) => {
    try {
        const [resultado] = await banco.query("SELECT 1 AS conexao");

        return res.json({
            mensagem: "Conexão com o banco realizada com sucesso!",
            resultado
        });
    } catch (erro) {
        console.error("Erro na rota /teste-banco:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível conectar ao banco.",
            codigo: erro.code,
            erro: erro.message
        });
    }
});

// ==========================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});