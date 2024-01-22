require('dotenv').config();

const express = require("express");
const expressLayout = require("express-ejs-layouts");
const flash = require('connect-flash')
const session = require('express-session');
const methodOverride = require('method-override');
const passport = require('passport');

const app = express();
const PORT = 3009 || process.env.PORT;

// Passport config
require('./server/config/passport')(passport);

// connect to Database
const connectDB = require('./server/config/db')
connectDB();

// Bodyparser Middleware
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

// session express
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true 
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global Vars
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// stylish accept
app.use(express.static('public'));

// EJS Templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Routes From server
app.use('/', require('./server/router/main'));
app.use('/', require('./server/router/admin'));
app.use('/', require('./server/router/users'));

app.listen(PORT, () => {
    console.log(`App listening ${PORT}`)
});