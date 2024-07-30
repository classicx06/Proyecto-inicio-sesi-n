const express = require('express');
const app = express();
const port = 3000;

// Get the client BD
const mysql = require('mysql2/promise');
const cors = require('cors');
const session = require('express-session');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(session({
  secret: 'dsd214545r4e12dsf45s2124dfs15ef4s2d1',
  resave: false,
  saveUninitialized: true
}));
app.use(express.json()); // Para analizar el cuerpo de las solicitudes en formato JSON

// Create the connection to database BD
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'nuevo_user',
});

// Función login para manejar el login
async function login(req, res) {
  const datos = req.query;
  const [filas] = await connection.query("SELECT * FROM `registro_user` WHERE `nickname` = ? AND `contrasena`= ?", [datos.nickname, datos.contrasena]);

  if (filas.length > 0) {
    req.session.nickname = datos.nickname;
    res.json({logueado: true});
  } else {
    res.status(401).json({error: 'Usuario o contraseña incorrecta'});
  }
}

app.get('/login', login); //petición login

// Función para manejar el registro de mandriles
async function registrarMandriles(req, res) {
  const { referencia, cantidad, tipo } = req.body;

  try {
    // Iniciar transacción
    const connection = await mysql.createConnection({ host: 'localhost', user: 'root', database: 'nuevo_user' });
    await connection.beginTransaction();

    // Registrar transacción en registro_mandriles
    await connection.query(
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

    await connection.query(query, [cantidad, referencia]);

    // Confirmar transacción
    await connection.commit();
    res.status(201).json({ message: 'Registro de mandriles exitoso' });
  } catch (error) {
    // Revertir transacción en caso de error
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({ error: 'Error en el registro de mandriles' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

app.post('/registrar-mandriles', registrarMandriles); //petición Registro

app.get('/validar', (req, res) => {
  if (req.session.nickname) {
    res.status(200).send('Sesión Validada');
  } else {
    res.status(401).send('No autorizado');
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
