const express = require('express')
const session = require('express-session')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const mustacheExpress = require('mustache-express');
const path = require('path')

dotenv.config()
console.log(process.env);



const engine = mustacheExpress()
const app = express()

//configurações de middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'chavesecreta321',
    resave: false,
    saveUninitialized: true
}));

// Função de middleware para autenticação
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

// Rota para renderizar o formulário de login
app.get('/login', (req, res) => {
    res.render('login', {}); // Renderiza a página de login
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



//Porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Rodando na porta ${PORT}`);
});
