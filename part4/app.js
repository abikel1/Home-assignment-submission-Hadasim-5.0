const express = require('express')
const path = require('path')
const app = express()
const port = 3000
const supplierRoutes = require('./routes/supplierRoutes');
const orderRoutes = require('./routes/orderRoutes');
const session = require('express-session');

app.use(session({
    secret: 'your_secret_key', // מפתח סודי לחתימת העוגייה
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // שים true אם אתה משתמש HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 24 שעות
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'))
app.use(express.static("public"));
app.set("view engine", "ejs"); // הגדרת EJS כתבנית

app.get('/', (req, res) => {
    res.render('pages/main-entrance');
});

app.use('/api/suppliers', supplierRoutes);

app.use('/supplier', supplierRoutes);

app.use('/order', orderRoutes);

app.get('/supplier-login', (req, res) => {
    res.render('pages/supplier-login')
})
app.get('/grocer-login', (req, res) => {
    res.render('pages/grocer-login')
})

app.get('/grocery/dashboard', (req, res) => {
    res.render('pages/grocer-dashboard');
});


app.get('/main-entrance', (req, res) => {
    res.render('pages/main-entrance');
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})