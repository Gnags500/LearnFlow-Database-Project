const express = require("express");
const pool = require("./db"); // Assuming this is where you create your Pool instance
const isAuthenticated = require("./isLoggedIn");
const profileUpdateRouter = express.Router();
profileUpdateRouter.post("/update/student", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).send("User not logged in");
    }
    const { First_Name, Last_Name, Date_of_Birth, Email } = req.body;
    const updateStudentQuery = `
      UPDATE Student
      SET First_Name = $1,
          Last_Name = $2,
          Date_of_Birth = $3,
          Email = $4
      FROM Users
      WHERE Student.User_ID = $5
      AND Users.User_ID = $6
    `;
    await pool.query(updateStudentQuery, [First_Name, Last_Name, Date_of_Birth, Email, userId, userId]);
    res.send("Student profile updated successfully!");
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).send("An error occurred while updating student profile.");
  }
});

profileUpdateRouter.post("/update/instructor", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).send("User not logged in");
    }
    const { Bank_Account, Email } = req.body;
    const updateInstructorQuery = `
      UPDATE Instructor
      SET Bank_Account = $1,
          Email = $2
      FROM Users
      WHERE Instructor.User_ID = $3
      AND Users.User_ID = $4
    `;
    await pool.query(updateInstructorQuery, [Bank_Account, Email, userId, userId]);
    res.send("Instructor profile updated successfully!");
  } catch (error) {
    console.error("Error updating instructor profile:", error);
    res.status(500).send("An error occurred while updating instructor profile.");
  }
});

module.exports = profileUpdateRouter;
