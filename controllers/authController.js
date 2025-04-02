const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const conexion = require('../database/db');
const { promisify } = require('util');

// Procedimiento para registrarnos
exports.register = async (req, res) => {
    try {
        const { name, lastname, email, address, password } = req.body;

        // Verificar si algún campo está vacío
        if (!name || !lastname || !email || !address || !password) {
            return res.render('register', {
                alert: true,
                alertTitle: "Advertencia",
                alertMessage: "Todos los campos son obligatorios",
                alertIcon: "warning",
                showConfirmButton: true,
                timer: false,
                ruta: "register"
            });
        }

        let passHash = await bcryptjs.hash(password, 8);
        
        conexion.query(
            'INSERT INTO users SET ?',
            { name, lastname, email, address, password: passHash },
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.render('register', {
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "Hubo un problema con el registro",
                        alertIcon: "error",
                        showConfirmButton: true,
                        timer: false,
                        ruta: "register"
                    });
                }

                return res.render('register', {
                    alert: true,
                    alertTitle: "Registro Exitoso",
                    alertMessage: "¡Te has registrado correctamente!",
                    alertIcon: "success",
                    showConfirmButton: false,
                    timer: 1500,
                    ruta: "login"
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.render('register', {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Hubo un problema en el servidor",
            alertIcon: "error",
            showConfirmButton: true,
            timer: false,
            ruta: "register"
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.render('login', {
                alert: true,
                alertTitle: "Advertencia",
                alertMessage: "Ingrese un correo y contraseña",
                alertIcon: 'info',
                showConfirmButton: true,
                timer: false,
                ruta: 'login'
            });
        }

        conexion.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
            if (results.length == 0 || !(await bcryptjs.compare(password, results[0].password))) {
                return res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Correo y/o contraseña incorrectas",
                    alertIcon: 'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login'
                });
            }
            
            // Inicio de sesión OK
            const id = results[0].id;
            const token = jwt.sign({ id: id }, process.env.JWT_SECRETO, {
                expiresIn: process.env.JWT_TIEMPO_EXPIRA
            });
            
            console.log("TOKEN: " + token + " para el USUARIO: " + email);
            
            const cookiesOptions = {
                expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                httpOnly: true
            };
            res.cookie('jwt', token, cookiesOptions);
            res.render('login', {
                alert: true,
                alertTitle: "Conexión exitosa",
                alertMessage: "¡LOGIN CORRECTO!",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 800,
                ruta: ''
            });
        });
    } catch (error) {
        console.log(error);
    }
};

exports.isAuthenticated = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            const decodificada = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRETO);
            conexion.query('SELECT * FROM users WHERE id = ?', [decodificada.id], (error, results) => {
                if (!results) { return next(); }
                req.user = results[0];
                return next();
            });
        } catch (error) {
            console.log(error);
            return next();
        }
    } else {
        res.redirect('/login');
    }
};

exports.logout = (req, res) => {
    res.clearCookie('jwt');
    return res.redirect('/');
};
