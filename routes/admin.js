const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Middleware de autenticação
function authenticate(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Rota para a administração (apenas acessível para administradores)
router.get('/', authenticate, (req, res) => {
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

        res.render('admin', { pages });
    });
});

module.exports = router;
