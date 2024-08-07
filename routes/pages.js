const express = require('express');
const fs = require('fs');
const path = require('path');
const { check, validationResult } = require('express-validator');
const router = express.Router();

// Middleware de autenticação
function authenticate(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Rota para criar uma nova página
router.post('/create-page', [
    check('url').matches(/^[\w\/\-]+$/), // Validação da URL
    check('content').notEmpty(),         // Validação do conteúdo
    check('tags').optional().isString()  // Validação opcional das tags
], authenticate, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send('Erro de validação: ' + JSON.stringify(errors.array()));
    }

    const { url, content, tags } = req.body;
    const fileName = url.replace(/\//g, '-') + '.txt';
    const tagsFileName = url.replace(/\//g, '-') + '.json';

    // salvar o conteúdo da página
    fs.writeFile(path.join(__dirname, '..', 'pages', fileName), content, (err) => {
        if (err) {
            console.error('Erro ao salvar o arquivo:', err);
            res.status(500).send('Erro ao salvar o arquivo');
            return;
        }

        // salvar as tags, se existirem
        fs.writeFile(path.join(__dirname, '..', 'pages', tagsFileName), JSON.stringify({ tags: tags.split(',').map(tag => tag.trim()) }), (err) => {
            if (err) {
                console.error('Erro ao salvar as tags:', err);
                res.status(500).send('Erro ao salvar as tags');
                return;
            }

            res.send(`Página criada com sucesso! URL: ${url}`);
        });
    });
});

// Rota para exibir o formulário de edição de uma página
router.get('/edit/:url', authenticate, (req, res) => {
    const { url } = req.params;
    const fileName = url.replace(/\//g, '-') + '.txt';
    const tagsFileName = url.replace(/\//g, '-') + '.json';
    const filePath = path.join(__dirname, '..', 'pages', fileName);
    const tagsFilePath = path.join(__dirname, '..', 'pages', tagsFileName);

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

// Rota para processar a edição da página
router.post('/edit-page/:url', [
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
    const filePath = path.join(__dirname, '..', 'pages', fileName);
    const tagsFilePath = path.join(__dirname, '..', 'pages', tagsFileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Página não encontrada');
    }

    // atualizar o conteúdo da página
    fs.writeFile(filePath, content, (err) => {
        if (err) {
            console.error('Erro ao salvar o conteúdo do arquivo:', err);
            return res.status(500).send('Erro ao salvar o conteúdo do arquivo');
        }

        // atualizar as tags se fornecidas
        if (tags !== undefined) {
            fs.writeFile(tagsFilePath, JSON.stringify({ tags: tags.split(',').map(tag => tag.trim()) }), (err) => {
                if (err) {
                    console.error('Erro ao salvar as tags:', err);
                    return res.status(500).send('Erro ao salvar as tags');
                }

                res.send(`Página ${url} editada com sucesso`);
            });
        } else {
            res.send(`Página ${url} editada com sucesso`);
        }
    });
});

// Rota para excluir uma página
router.post('/delete-page/:url', authenticate, (req, res) => {
    const { url } = req.params;
    const fileName = url.replace(/\//g, '-') + '.txt';
    const filePath = path.join(__dirname, '..', 'pages', fileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Página não encontrada');
    }

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Erro ao excluir o arquivo:', err);
            res.status(500).send('Erro ao excluir o arquivo');
        } else {
            res.send(`Página ${url} excluída com sucesso`);
        }
    });
});

// Rota para visualizar o conteúdo das páginas (não é necessário estar logado)
router.get('/pages/:url', (req, res) => {
    const { url } = req.params;
    const fileName = url.replace(/\//g, '-') + '.txt';
    const tagsFileName = url.replace(/\//g, '-') + '.json';
    const filePath = path.join(__dirname, '..', 'pages', fileName);
    const tagsFilePath = path.join(__dirname, '..', 'pages', tagsFileName);

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

        res.send(
            `<html>
                <head>
                    <title>${url}</title>
                </head>
                <body>
                    <h1>${url}</h1>
                    <p>${content}</p>
                    <p><strong>Tags:</strong> ${tags.join(', ')}</p>
                </body>
            </html>`
        );
    });
});

// Rota para a página inicial (listar páginas)
router.get('/', (req, res) => {
    const pagesDirectory = path.join(__dirname, '..', 'pages');
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

module.exports = router;
