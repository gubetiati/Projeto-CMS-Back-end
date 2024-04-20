const express = require('express')
const session = require('express-session')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')

dotenv.config()
const app = express()

//configurações de middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'chavesecreta321',
    resave: false,
    saveUninitialized: true
}));

// Rota para renderizar o formulário de login
app.get('/login', (req, res) => {
    res.render('login', {}); // Renderiza a página de login
});







//Porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Rodando na porta ${PORT}`);
});
