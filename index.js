const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const mustacheExpress = require('mustache-express');

dotenv.config();

const engine = mustacheExpress()
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'chavesecreta321',
    resave: false,
    saveUninitialized: true
}));

function authenticate(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Configuração do mecanismo de template Mustache
app.engine('mustache', mustacheExpress());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'mustache');

// Rota para criar página
app.post('/create-page', [
    check('url').matches(/^[\w\/\-]+$/), // Permitindo letras, números, traços e barras na URL
    check('content').notEmpty()
], authenticate, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send('Erro de validação: ' + JSON.stringify(errors.array()));
    }
    
    const { url, content } = req.body;
    const fileName = url.replace(/\//g, '-') + '.txt'; // Usando a URL como nome do arquivo

    // Salvar o conteúdo da página em um arquivo de texto na pasta 'pages'
    fs.writeFile(path.join(__dirname, 'pages', fileName), content, (err) => {
        if (err) {
            console.error('Erro ao salvar o arquivo:', err);
            res.status(500).send('Erro ao salvar o arquivo');
        } else {
            res.send(`Página criada com sucesso! URL: ${url}`);
        }
    });
});

//edição das páginas
app.get('/edit/:url', authenticate, (req, res) => {
    const { url } = req.params;
    res.render('edit', { url });
});

app.post('/edit-page/:url', [
    check('content').notEmpty()
], authenticate, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send('Erro de validação: ' + JSON.stringify(errors.array()));
    }

    const { content } = req.body;
    const { url } = req.params;
    const fileName = url.replace(/\//g, '-') + '.html';

    const filePath = path.join(__dirname, 'pages', fileName);
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Página não encontrada');
    }

    fs.writeFile(filePath, content, (err) => {
        if (err) {
            console.error('Erro ao salvar o arquivo: ', err);
            res.status(500).send('Erro ao salvar o arquivo');
        } else {
            res.send(`Página ${url} editada com sucesso`);
        }
    });
});

app.get('/login', (req, res) => {
    res.render('login', {});
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.USER && password === process.env.PASSWORD) {
        req.session.authenticated = true;
        res.redirect('/admin');
    } else {
        res.send('Credenciais inválidas');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
        } else {
            res.redirect('/login');
        }
    });
});

app.get('/admin', authenticate, (req, res) => {
    res.render('admin', {});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Rodando na porta ${PORT}`);
});
