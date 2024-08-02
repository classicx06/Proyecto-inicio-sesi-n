const connection = require("./conexion");

const login = async function login(req, res) {
    const datos = req.query;
    const [filas] = await connection.query("SELECT * FROM `registro_user` WHERE `nickname` = ? AND `contrasena`= ?", [datos.nickname, datos.contrasena]);
  
    if (filas.length > 0) {
      req.session.nickname = datos.nickname;
      res.json({logueado: true});
    } else {
      res.status(401).json({error: 'Usuario o contraseña incorrecta'});
    }
}

module.exports = login;