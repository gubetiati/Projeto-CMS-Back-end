const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const mustacheExpress = require('mustache-express');

dotenv.config();

const engine = mustacheExpress();
const app = express();

// Middleware para parsear corpos de requisições URL-encoded
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração de sessões
app.use(session({
    secret: 'chavesecreta321',
    resave: false,
    saveUninitialized: true
}));

// Configuração do mecanismo de template Mustache
app.engine('mustache', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'mustache');

// Servir arquivos estáticos da pasta 'assets'
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Importa e usa as rotas
const routes = require('./routes/index');
app.use(routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Rodando na porta ${PORT}`);
});
