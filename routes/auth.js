const express = require('express');
const router = express.Router();

// Rota para exibir o formulário de login
router.get('/login', (req, res) => {
    res.render('login', {});
});

// Rota para processar o login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.USER && password === process.env.PASSWORD) {
        req.session.authenticated = true;
        res.redirect('/admin');
    } else {
        res.send('Credenciais inválidas');
    }
});

// Rota para logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
        } else {
            res.redirect('/login');
        }
    });
});

module.exports = router;
