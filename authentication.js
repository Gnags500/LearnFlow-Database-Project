const pool = require("./db"); 

async function authenticateUserByEmailAndPassword(email, password) {
  try {
    const query = "SELECT * FROM Users WHERE Email = $1 AND Pass = $2";
    const result = await pool.query(query, [email, password]);
    if (result.rows.length > 0) {
      return result.rows[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error occurred during user authentication:", error);
    return null;
  }
}

module.exports = { authenticateUserByEmailAndPassword };
