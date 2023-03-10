const express = require('express'); 
let mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const sessions = require('express-session');
const app = express();

app.use(cookieParser());

const timeExp = 1000 * 60 * 60 * 24;

app.use(sessions({
    secret: "rfghf66a76ythggi87au7td",
    saveUninitialized: true,
    cookie: { maxAge: timeExp },
    resave: false
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use('/public/', express.static('./public'));

const port = 10101;

const pool = mysql.createPool({
    connectionLimit : 100,
    host            : 'localhost',
    user            : 'root',
    password        : '1234',
    database        : 'proyecto',
    debug        : false
});

app.get('/', (req, res) => {
    // res.json('Conexión establecida correctamente')
    pool.query("select codigo, nombre, url from articulo", (error, data) => {
        if(error) throw error;

        if(data.length > 0){
            let session = req.session;

            if(session.correo){
                return res.render('index', {nombres: session.nombres, articulo: data});
            }
            return res.render('index', {nombres: undefined, articulo: data});
        }
    });
});

app.get('/registro-tendero', (req, res) => {
    return res.render('registro-t')
});

app.get('/registro-proveedor', (req, res) => {
    return res.render('registro-p')
});

app.post('/registro-t', (req, res) => {
    let correo = req.body.correo;
    let nombres = req.body.nombres;
    let apellidos = req.body.apellidos;
    let contrasenia = req.body.contrasenia;
    let telefono = req.body.telefono;

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);

    const hash = bcrypt.hashSync(contrasenia, salt);
    pool.query("insert into tendero values (?,?,?,?,?)", [correo, nombres, apellidos, hash, telefono],

    (error) => {
        if(error) throw error;
        // res.send('Registro éxitoso');
        return res.redirect('/login-tendero');
    });
});

app.post('/registro-p', (req, res) => {
    let correo = req.body.correo;
    let nombre = req.body.nombre;
    let contrasenia = req.body.contrasenia;
    let telefono = req.body.telefono;

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);

    const hash = bcrypt.hashSync(contrasenia, salt);
    pool.query("insert into proveedor values (?,?,?,?)", [correo, nombre, hash, telefono],

    (error) => {
        if(error) throw error;
        // res.send('Registro éxitoso');
        return res.redirect('/login-proveedor');
    });
});

app.get('/login-tendero', (req, res) => {
    return res.render('login-t')
});

app.get('/login-proveedor', (req, res) => {
    return res.render('login-p')
});

app.post('/login-t', (req, res) => {

    let correo          = req.body.correo;
    let contrasenia     = req.body.contrasena;

    pool.query("select contrasenia, nombres, apellidos from tendero where correo= ?", [correo], (error, data) => {

        if (error) throw error;

        if (data.length > 0){
            let contraseniaEncriptada = data[0].contrasenia;

            if(bcrypt.compareSync(contrasenia, contraseniaEncriptada)){
                // res.render('index')
                let session = req.session;

                session.correo = correo;

                session.nombres = `${data[0].nombres}`

                return res.redirect('/');
            }
            return res.send('Usuario o contraseña incorrecto');
            // return res.render('registro')
        }
        return res.send('Usuario o contraseña incorrecto');
        // return res.render('registro')
    })
});

app.post('/login-p', (req, res) => {

    let correo          = req.body.correo;
    let contrasenia     = req.body.contrasena;

    pool.query("select contrasenia, nombre from proveedor where correo= ?", [correo], (error, data) => {

        if (error) throw error;

        if (data.length > 0){
            let contraseniaEncriptada = data[0].contrasenia;

            if(bcrypt.compareSync(contrasenia, contraseniaEncriptada)){
                // res.render('index')
                let session = req.session;

                session.correo = correo;

                session.nombres = `${data[0].nombre}`

                return res.redirect('/');
            }
            return res.send('Usuario o contraseña incorrecto');
            // return res.render('registro')
        }
        return res.send('Usuario o contraseña incorrecto');
        // return res.render('registro')
    })
});

app.get('/tienda', (req, res) => {

    pool.query("select codigo, nombre, valor, url from articulo", (error, data) => {

        if(error) throw error;

        if(data.length > 0){
            let session = req.session;

            if(session.correo){
                return res.render('articulos', {nombres: session.nombres, articulo: data});
            }
            return res.render('articulos', {nombres: undefined, articulo: data});
        }
        return res.send('No hay artículos en este momento para visualizar');
    });
});

app.get('/detalle-producto/:codigo', (req, res) => {

    pool.query("select codigo, nombre, valor, descripcion, url from articulo where codigo = ?", [req.params.codigo], (error, data) => {
        if(error) throw error;
        console.log(data);

        if(data.length > 0){

            let session = req.session;

            if(session.correo){
                return res.render('detalle', {nombres: session.nombres, articulo: data});
            }
            return res.render('detalle', {nombres: undefined, articulo: data});
        }
        return res.send("Error al cargar la información");
    });
});

app.post('/comprar/:codigo', (req, res) => {

    let session = req.session;

    if(session.correo){
        let codigo = req.params.codigo;

        pool.query("insert into compras values (?, ?)", [session.correo, codigo], (error) => {
            if(error) throw error;
            
            return res.render('compra', {nombres: session.nombres});
        });
    }else{
        return res.send('Por favor inicie sesión para realizar la compra');
    }
});

app.get('/logout', (req, res) => {
    
    let session = req.session;

    if(session.correo){
        req.session.destroy();
        
        return res.redirect('/');
    } else {
        return res.send("Por favor inicie sesión")
    }
});

app.listen(port, () =>{
    console.log(`Conexión establecida en el puerto: ${port}`);
});

// Test

app.get('/test', (req, res) => {
    pool.query('select * from usuario', function (error, results, fields){
        if (error) throw error
        let nombres         = results[0].nombres;
        let apellidos       = results[0].apellidos;
        let correo          = results[0].correo;
        let contrasenia     = results[0].contrasenia;
        let edad            = results[0].edad;
        let telefono        = results[0].telefono;

        res.send(`Datos del usuario: ${nombres}, ${apellidos}, ${correo}, ${contrasenia}, ${edad}, ${telefono}`)
    })
})

app.get('/test-cookies', (req, res) => {

    let session = req.session;

    if (session.correo){
        res.send(`Usted tiene una sesion iniciada con el siguiente correo: ${session.correo}`);
    }else{
        res.send('Por favor inicie sesión')
    }
});