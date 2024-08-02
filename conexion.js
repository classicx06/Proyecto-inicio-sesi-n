// Create the connection to database BD
const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'nuevo_user',
  });

module.exports = connection;