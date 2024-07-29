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
app.engine('mustache', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'mustache');

// Rota para criar página
app.post('/create-page', [
    check('url').matches(/^[\w\/\-]+$/),
    check('content').notEmpty(),
    check('tags').optional().isString() // Validação opcional para tags
], authenticate, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send('Erro de validação: ' + JSON.stringify(errors.array()));
    }

    const { url, content, tags } = req.body;
    const fileName = url.replace(/\//g, '-') + '.txt';
    const tagsFileName = url.replace(/\//g, '-') + '.json'; // Armazenando tags em JSON

    // Salvar o conteúdo da página em um arquivo de texto
    fs.writeFile(path.join(__dirname, 'pages', fileName), content, (err) => {
        if (err) {
            console.error('Erro ao salvar o arquivo:', err);
            res.status(500).send('Erro ao salvar o arquivo');
            return;
        }

        // Salvar as tags em um arquivo JSON
        fs.writeFile(path.join(__dirname, 'pages', tagsFileName), JSON.stringify({ tags: tags.split(',').map(tag => tag.trim()) }), (err) => {
            if (err) {
                console.error('Erro ao salvar as tags:', err);
                res.status(500).send('Erro ao salvar as tags');
                return;
            }

            res.send(`Página criada com sucesso! URL: ${url}`);
        });
    });
});


//edição das páginas
// Rota para exibir o formulário de edição de uma página
app.get('/edit/:url', authenticate, (req, res) => {
    const { url } = req.params;
    const fileName = url.replace(/\//g, '-') + '.txt';
    const tagsFileName = url.replace(/\//g, '-') + '.json';
    const filePath = path.join(__dirname, 'pages', fileName);
    const tagsFilePath = path.join(__dirname, 'pages', tagsFileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Página não encontrada');
    }

    fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
            console.error('Erro ao ler o arquivo:', err);
            return res.status(500).send('Erro ao ler o arquivo');
        }

        let tags = '';
        if (fs.existsSync(tagsFilePath)) {
            const tagsData = fs.readFileSync(tagsFilePath, 'utf8');
            const tagsJson = JSON.parse(tagsData);
            tags = tagsJson.tags.join(', ');
        }

        res.render('edit', { url, content, tags });
    });
});

app.post('/edit-page/:url', [
    check('content').notEmpty(),
    check('tags').optional().isString()
], authenticate, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send('Erro de validação: ' + JSON.stringify(errors.array()));
    }

    const { content, tags } = req.body;
    const { url } = req.params;
    const fileName = url.replace(/\//g, '-') + '.txt';
    const tagsFileName = url.replace(/\//g, '-') + '.json';
    const filePath = path.join(__dirname, 'pages', fileName);
    const tagsFilePath = path.join(__dirname, 'pages', tagsFileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Página não encontrada');
    }

    // Atualizar o conteúdo da página
    fs.writeFile(filePath, content, (err) => {
        if (err) {
            console.error('Erro ao salvar o conteúdo do arquivo:', err);
            return res.status(500).send('Erro ao salvar o conteúdo do arquivo');
        }

        // Atualizar as tags se fornecidas
        if (tags !== undefined) {
            fs.writeFile(tagsFilePath, JSON.stringify({ tags: tags.split(',').map(tag => tag.trim()) }), (err) => {
                if (err) {
                    console.error('Erro ao salvar as tags:', err);
                    return res.status(500).send('Erro ao salvar as tags');
                }

                res.send(`Página ${url} editada com sucesso`);
            });
        } else {
            // Se não houver tags, apenas confirme a atualização do conteúdo
            res.send(`Página ${url} editada com sucesso`);
        }
    });
});




// Rota para excluir página
app.post('/delete-page/:url', authenticate, (req, res) => {
    const { url } = req.params;
    const fileName = url.replace(/\//g, '-') + '.txt'; // Corrigido para .txt
    const filePath = path.join(__dirname, 'pages', fileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Página não encontrada');
    }

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Erro ao excluir o arquivo: ', err);
            res.status(500).send('Erro ao excluir o arquivo');
        } else {
            res.send(`Página ${url} excluída com sucesso`);
        }
    });
});


// Rota para visualizar o conteúdo das páginas (não é necessário estar logado)
app.get('/pages/:url', (req, res) => {
    const { url } = req.params;
    const fileName = url.replace(/\//g, '-') + '.txt';
    const tagsFileName = url.replace(/\//g, '-') + '.json';
    const filePath = path.join(__dirname, 'pages', fileName);
    const tagsFilePath = path.join(__dirname, 'pages', tagsFileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Página não encontrada');
    }

    fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
            console.error('Erro ao ler o arquivo:', err);
            return res.status(500).send('Erro ao ler o arquivo');
        }

        let tags = [];
        if (fs.existsSync(tagsFilePath)) {
            const tagsData = fs.readFileSync(tagsFilePath, 'utf8');
            tags = JSON.parse(tagsData).tags;
        }

        res.send(`
            <html>
                <head>
                    <title>${url}</title>
                </head>
                <body>
                    <h1>${url}</h1>
                    <p>${content}</p>
                    <p><strong>Tags:</strong> ${tags.join(', ')}</p>
                </body>
            </html>
        `);
    });
});


app.get('/', (req, res) => {
    const pagesDirectory = path.join(__dirname, 'pages');
    fs.readdir(pagesDirectory, (err, files) => {
        if (err) {
            console.error('Erro ao ler o diretório de páginas:', err);
            res.status(500).send('Erro ao ler o diretório de páginas');
            return;
        }

        const txtFiles = files.filter(file => file.endsWith('.txt'));

        const pages = txtFiles.map(file => {
            return { url: path.basename(file, path.extname(file)) };
        });

        res.render('home', { pages });
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

// Rotas relacionadas à administração
app.get('/admin', authenticate, (req, res) => {
    const pagesDirectory = path.join(__dirname, 'pages');
    fs.readdir(pagesDirectory, (err, files) => {
        if (err) {
            console.error('Erro ao ler o diretório de páginas:', err);
            res.status(500).send('Erro ao ler o diretório de páginas');
            return;
        }
        
        const txtFiles = files.filter(file => file.endsWith('.txt'));
        
        const pages = txtFiles.map(file => {
            return { url: path.basename(file, path.extname(file)) };
        });

        res.render('admin', { pages });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Rodando na porta ${PORT}`);
});
