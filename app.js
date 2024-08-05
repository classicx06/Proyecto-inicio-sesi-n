const express = require('express');
const app = express();
const port = 3000;
const mysql = require('mysql2/promise');
const cors = require('cors');
const session = require('express-session');

mysql://root:TzOntgEpVHfgUAEctJQOQtpOuoKYYDrO@monorail.proxy.rlwy.net:10795/railway

app.use(cors({
  origin: process.env.URLFRONTEND || 'http://localhost:5173',
  credentials: true
}));

app.use(session({
  secret: process.env.SECRETSESSION || 'dsd214545r4e12dsf45s2124dfs15ef4s2d1',
  
  proxy: process.env.NODE_ENV === 'production',
  resave: false,
  saveUninitialized: true,

  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none'
  }
}));

app.use(express.json()); // Para analizar el cuerpo de las solicitudes en formato JSON

// Crear la conexión a la base de datos
const connection = mysql.createPool({
  host: process.env.HOSTDB || 'localhost',
  user: process.env.USERDB || 'root',
  database: process.env.DB || 'nuevo_user',
  password: process.env.PASSWORDDB || '',
  port: process.env.PORTDB || 3306
});

// Verificar conexión a la base de datos
connection.getConnection()
  .then(conn => {
    console.log('Conexión a la base de datos exitosa');
    conn.release();
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos:', err);
  });

// Función para manejar el login
async function login(req, res) {
  const datos = req.query;
  const [filas] = await connection.query("SELECT * FROM `registro_user` WHERE `nickname` = ? AND `contrasena`= ?", [datos.nickname, datos.contrasena]);

  if (filas.length > 0) {
    req.session.nickname = datos.nickname;
    res.json({ logueado: true });
  } else {
    res.status(401).json({ error: 'Usuario o contraseña incorrecta' });
  }
}

app.get('/login', login); // Petición login

// Función para manejar el registro de usuarios
async function registerUser(req, res) {
  const {
    user_name,
    user_lastname,
    user_second_lastname,
    user_phone,
    user_id,
    user_nickname,
    user_mail,
    user_pass
  } = req.body;

  try {
    const [result] = await connection.query(
      "INSERT INTO `registro_user` (nombre, primer_apellido, segundo_apellido, telefono, documento_id, nickname, correo, contrasena) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [user_name, user_lastname, user_second_lastname, user_phone, user_id, user_nickname, user_mail, user_pass]
    );

    if (result.affectedRows > 0) {
      res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } else {
      res.status(500).json({ error: 'Error en el registro del usuario' });
    }
  } catch (error) {
    console.error('Error en el registro del usuario:', error);
    res.status(500).json({ error: 'Error en el registro del usuario' });
  }
}

app.post('/register', registerUser); // Petición de registro de usuarios

// Función para manejar el registro de mandriles
async function registrarMandriles(req, res) {
  const { referencia, cantidad, tipo } = req.body;

  try {
    // Iniciar transacción
    const conn = await connection.getConnection();
    await conn.beginTransaction();

    // Registrar transacción en registro_mandriles
    await conn.query(
      "INSERT INTO `registro_mandriles` (referencia, cantidad, tipo) VALUES (?, ?, ?)",
      [referencia, cantidad, tipo]
    );

    // Actualizar inventario
    let query;
    if (tipo === 'entrada') {
      query = "UPDATE inventario SET cantidad = cantidad + ? WHERE referencia = ?";
    } else {
      query = "UPDATE inventario SET cantidad = cantidad - ? WHERE referencia = ?";
    }

    await conn.query(query, [cantidad, referencia]);

    // Confirmar transacción
    await conn.commit();
    res.status(201).json({ message: 'Registro de mandriles exitoso' });
  } catch (error) {
    // Revertir transacción en caso de error
    if (connection) {
      await connection.rollback();
    }
    console.error('Error en el registro de mandriles:', error);
    res.status(500).json({ error: 'Error en el registro de mandriles' });
  }
}

app.post('/registrar-mandriles', registrarMandriles); // Petición de registro de mandriles

app.get('/validar', (req, res) => {
  if (req.session.nickname) {
    res.status(200).send('Sesión Validada');
  } else {
    res.status(401).send('No autorizado');
  }
});

app.get('/inventario', async (req, res) => {
  try {
    const [rows] = await connection.query("SELECT * FROM inventario");
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener el inventario:', error);
    res.status(500).json({ error: 'Error al obtener el inventario' });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
