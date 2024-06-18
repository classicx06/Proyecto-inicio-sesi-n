const express = require('express')
const app = express()
const port = 3000

// Get the client BD
const mysql = require('mysql2/promise');
const cors = require('cors')

app.use(cors())

// Create the connection to database BD
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'nuevo_user',
});


async function login(req, res) { // req=petición, res=respuesta
    const datos = req.query;
    const [filas] = await connection.query("SELECT * FROM `registro_user` WHERE `nickname` = '" + datos.nickname + "' AND `contrasena`= '" + datos.contrasena + "'")


    if (filas.length ==1) {
      res.status(200).json({logueado: true})
    } else {
      res.status(401).json({error: 'Usuario o contraseña incorrecta'})
    }
}



app.get('/login', login)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})