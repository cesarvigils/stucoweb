require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

// Conectar a la base de datos
db.connect(err => {
    if (err) {
        console.error('❌ Error al conectar a la base de datos:', err);
    } else {
        console.log('✅ Conexión exitosa a la base de datos MySQL');
    }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'source')));

// Rutas para servir las páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'source', 'index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'source', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'source', 'login.html'));
});

app.get('/portal', (req, res) => {
    res.sendFile(path.join(__dirname, 'source', 'portal.html'));
});

// Ruta para manejar el registro de usuarios
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, results) => {
        if (err) {
            console.error('❌ Error en la consulta SELECT:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }

        if (results.length > 0) {
            return res.status(409).json({ success: false, message: 'Username o Email ya existen' });
        }

        const hashedPassword = password;

        db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword], (err) => {
            if (err) {
                console.error('❌ Error al insertar el usuario:', err);
                return res.status(500).json({ success: false, message: 'Error al registrar el usuario' });
            }
            console.log('✅ Usuario registrado exitosamente');
            res.status(201).json({ success: true, message: 'Registro exitoso' });
        });
    });
});

// Ruta para manejar el inicio de sesión
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('❌ Error en la consulta SELECT:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const user = results[0];
        const hashedPassword = password;

        if (hashedPassword === user.password) {
            const token = crypto.randomBytes(16).toString('hex');
            console.log(`✅ Inicio de sesión exitoso para: ${username}`);

            return res.status(200).json({
                success: true,
                message: 'Inicio de sesión exitoso',
                token,
                username: user.username,
                redirect: '/portal'
            });
        } else {
            console.log('❌ Contraseña incorrecta para el usuario:', username);
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }
    });
});

// Ruta para manejar el logout
app.post('/logout', (req, res) => {
    console.log('🛑 Logout solicitado por el usuario en:', new Date().toISOString());
    res.status(200).json({ success: true, message: 'Logout exitoso' });
});

// Ruta para guardar tickets
app.post('/tickets', (req, res) => {
    const { email, motivo, descripcion, prioridad } = req.body;

    if (!email || !motivo || !descripcion || !prioridad) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    const query = `
        INSERT INTO tickets (email, motivo, descripcion, prioridad, createdAt)
        VALUES (?, ?, ?, ?, NOW())
    `;

    db.query(query, [email, motivo, descripcion, prioridad], (err, results) => {
        if (err) {
            console.error('❌ Error al guardar el ticket:', err);
            return res.status(500).json({ success: false, message: 'Error al guardar el ticket' });
        }

        console.log('✅ Ticket guardado exitosamente');
        res.status(201).json({ success: true, message: 'Ticket creado exitosamente', ticketId: results.insertId });
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`🌐 Servidor ejecutándose en http://localhost:${port}`);
});
