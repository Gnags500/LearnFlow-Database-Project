const express = require("express");
const path = require("path");
const app = express();
const Port = process.env.Port || 3000;
const bodyParser = require("body-parser");
const { generateUserID, generateRatingId } = require("./utility-file");
const { generatePaymentID } = require("./utility-file");
const { extractSrcFromIframe } = require("./utility-file");
const { authenticateUserByEmailAndPassword } = require("./authentication");
const pool = require("./db");
const session = require('express-session');
const isAuthenticated = require("./isLoggedIn");
const { generate_user_id } = require('./utility-file');
const { generate_student_id } = require('./utility-file');
const { generate_instructor_id } = require('./utility-file');
const { generate_course_id } = require('./utility-file');
const { generateRatingID } = require('./utility-file');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Serve uploaded files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const profileUpdateRouter = require("./routes/profileUpdateRouter");

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));


app.get("/", async (req, res) => {
    res.render("homepage");
});

app.get("/users/login", async (req, res) => {
    if (req.session && req.session.userId)
        return res.render("logout");
    else
        res.render("login");
});

app.post("/users/login", async (req, res) => {

    const { email, password } = req.body;
    const user = await authenticateUserByEmailAndPassword(email, password);

    if (user) {
        req.session.userId = user.user_id;
        res.redirect("/profile");
        console.log("user logged in successfully");
    } else {
        res.render("invalidLogin", { errorMessage: "Invalid email or password" });
    }
});

app.get('/users/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('An error occurred during logout.');
        } else {
            res.redirect('/users/login');
        }
    });
});



app.get("/users/register", async (req, res) => {
    if (req.session && req.session.userId)
        return res.render("logout");
    const errorMessage = req.query.error || "";
    res.render("register", { errorMessage });
});



app.post("/users/register", async (req, res) => {
    try {

        const { First_Name, Last_Name, Date_of_Birth, Email, Pass, User_Type, Bank_Account, user_id } = req.body;
        const errors = [];
        const emailCheckQuery = "SELECT COUNT(*) FROM Users WHERE Email = $1";
        const emailCheckResult = await pool.query(emailCheckQuery, [Email]);
        const emailCount = parseInt(emailCheckResult.rows[0].count);
        if (emailCount > 0) {
            errors.push("This email is already registered");
        }
        if (!Email) {
            errors.push("Email is required.");
        }
        if (errors.length > 0) {
            return res.render("invalidRegister", { errors: errors });
        }

        const User_ID = await generate_user_id();
        const insertUserQuery = "INSERT INTO Users ( User_id,First_Name, Last_Name, Date_of_Birth, Email, Pass, Is_Student, Is_Instructor) VALUES ( $1,$2, $3, $4, $5, $6, $7,$8)";
        await pool.query(insertUserQuery, [User_ID, First_Name, Last_Name, Date_of_Birth, Email, Pass, User_Type === 'student', User_Type === 'instructor']);


        if (User_Type === 'student') {

            const Student_ID = await generate_student_id();
            console.log(Student_ID);
            console.log(User_ID);
            console.log(Student_ID);
            const insertStudentQuery = "INSERT INTO Student ( student_id,Profile_Points, User_ID) VALUES ( $1,$2,$3 )";
            await pool.query(insertStudentQuery, [Student_ID, 0, User_ID]);
        } else if (User_Type === 'instructor') {
            const Instructor_ID = await generate_instructor_id();
            console.log(User_ID);
            console.log(Instructor_ID);
            const insertInstructorQuery = "INSERT INTO Instructor (Instructor_ID, Joining_Date, Bank_Account, User_ID) VALUES ( CURRENT_DATE, $1, $2,$3)";
            await pool.query(insertInstructorQuery, [Instructor_ID, Bank_Account, User_ID]);
        }

        await pool.query('COMMIT');

        res.redirect("/users/login");
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error("Error occurred during user registration:", error);

        if (error.code === '23505' && error.constraint === 'users_email_key') {
            const errorMessage = "This email is already registered.";
            return res.render("register", { errorMessage });
        } else {
            return res.status(500).send('An error occurred during user registration.');
        }
    }
});

app.get("/profile", async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.redirect("/users/login");
        }

        const userQuery = "SELECT * FROM Users WHERE User_ID = $1";
        const result = await pool.query(userQuery, [userId]);
        const user = result.rows[0];

        if (!user) {
            return res.redirect("/users/login");
        }

        const isStudent = user.is_student;
        const isInstructor = user.is_instructor;
        let profileDetails;
        let courses;
        let fieldNames;

        if (isStudent) {
            const studentQuery = "SELECT * FROM Student WHERE User_ID = $1";
            const studentResult = await pool.query(studentQuery, [userId]);
            profileDetails = studentResult.rows[0];
            const enrolledCoursesQuery = `
        SELECT * FROM Enroll e
        JOIN Course c ON e.Course_ID = c.Course_ID
        WHERE e.Student_ID = $1;
      `;
            const enrolledCoursesResult = await pool.query(enrolledCoursesQuery, [profileDetails.student_id]);
            courses = enrolledCoursesResult.rows;
        } else if (isInstructor) {
            const instructorQuery = "SELECT * FROM Instructor WHERE User_ID = $1";
            const instructorResult = await pool.query(instructorQuery, [userId]);
            profileDetails = instructorResult.rows[0];
            const launchedCoursesQuery = 'SELECT * FROM Course WHERE Instructor_ID = $1';
            const launchedCoursesResult = await pool.query(launchedCoursesQuery, [profileDetails.instructor_id]);
            courses = launchedCoursesResult.rows;
            const fieldNamesQuery = "SELECT field_name FROM field";
            const { rows: fieldNamesResult } = await pool.query(fieldNamesQuery);
            fieldNames = fieldNamesResult;
        }

        if (isStudent) {
            console.log(user);
            res.render("studentProfile", { user, profileDetails, courses });

        } else if (isInstructor) {
            console.log(user);
            res.render("instructorProfile", { user, profileDetails, courses, fieldNames });
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).send("An error occurred while fetching user profile.");
    }
});


app.get("/fields", async (req, res) => {
    try {
        const query = "SELECT * FROM FIELD";
        const { rows } = await pool.query(query);
        res.render("fields", { fields: rows });
    }
    catch (error) {
        console.error("Error fetching fields of courses:", error);
        res.status(500).send("An error occurred while fetching fields of courses.");
    }
});

app.get("/fields/:fieldId/courses", async (req, res) => {
    try {
        const fieldId = req.params.fieldId;
        const query = `
      SELECT c.*, round(COALESCE(AVG(cr.rating), 0),2) AS average_rating
      FROM Course c 
      LEFT JOIN Course_Ratings cr ON c.Course_ID = cr.Course_ID
      WHERE c.Field_ID = $1
      GROUP BY c.Course_ID
      ORDER BY average_rating DESC NULLS LAST
    `;
        const { rows: courses } = await pool.query(query, [fieldId]);
        res.render("fieldCourses", { courses });
    } catch (error) {
        console.error("Error fetching courses for field:", error);
        res.status(500).send("An error occurred while fetching courses for field.");
    }
});


app.get("/fields/:fieldId", async (req, res) => {
    res.redirect(`/fields/${req.params.fieldId}/courses`);
});

app.get("/course/:courseId/details", async (req, res) => {
    try {

        const userId = req.session.userId;

        const courseId = req.params.courseId;
        req.session.courseId = courseId;
        const ifEnrolledQuery = `
      SELECT *
      FROM Student s
      JOIN Enroll e ON s.Student_ID = e.Student_ID
      WHERE s.User_ID = $1
      AND e.Course_ID = $2
    `;
        const { rows: enrolled } = await pool.query(ifEnrolledQuery, [userId, courseId]);
        if (enrolled.length > 0) {
            return res.redirect(`/course/${courseId}/premium`);
        }
        const ifinstruct = `SELECT *
     FROM course c
     JOIN instructor i ON c.instructor_id = i.instructor_id
      WHERE i.user_id = $1 AND c.course_id = $2 `;
        const { rows: instruct } = await pool.query(ifinstruct, [userId, courseId]);
        if (instruct.length > 0) {
            return res.redirect(`/course/${courseId}/premium`);
        }
        const courseQuery = `
    SELECT C.*, I.Instructor_ID, U.First_Name, U.Last_Name,
    ROUND(COALESCE(AVG(CR.Rating), 0), 2) AS average_rating
    FROM COURSE C  
    JOIN INSTRUCTOR I ON C.Instructor_ID = I.Instructor_ID 
    JOIN Users U ON I.User_ID = U.User_ID
    LEFT JOIN Course_Ratings CR ON C.Course_ID = CR.Course_ID
    WHERE C.COURSE_ID = $1
    GROUP BY C.Course_ID, I.Instructor_ID, U.First_Name, U.Last_Name;
  `;
        const { rows } = await pool.query(courseQuery, [courseId]);
        const course = rows[0];
        if (!course) {
            return res.status(404).send("Course not found.");
        }

        const enrollmentQuery = "SELECT * FROM Enroll WHERE Student_ID = $1 AND Course_ID = $2";
        const { rowCount: enrollmentCount } = await pool.query(enrollmentQuery, [userId, courseId]);
        const enrollmentCountQuery = "SELECT COUNT(*) AS count FROM Enroll WHERE Course_ID = $1";
        const { rows: enrollmentCountRows } = await pool.query(enrollmentCountQuery, [courseId]);
        const enrollmentCount2 = enrollmentCountRows[0].count;
        const instructorQuery = "SELECT * FROM INSTRUCTOR WHERE Instructor_ID = $1";
        const { rows: instructorRows } = await pool.query(instructorQuery, [course.Instructor_ID]);
        const instructor = instructorRows[0];
        res.render("courseDetails", { course, instructor, enrolled: enrollmentCount > 0, enrollmentCount2, averageRating: course.average_rating, });
    } catch (error) {
        console.error("Error fetching course details:", error);
        res.status(500).send("An error occurred while fetching course details.");
    }
});

app.get("/course/:courseId/premium", async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect("/users/login");
        }
        const userQuery = "SELECT * FROM Users WHERE User_ID = $1";
        const { rows: users } = await pool.query(userQuery, [userId]);

        if (!users.length) {
            return res.status(404).send("User not found.");
        }

        const user = users[0];

        const courseId = req.params.courseId;

        const courseQuery = `
    SELECT C.*, I.Instructor_ID, U.First_Name, U.Last_Name,
    ROUND(COALESCE(AVG(CR.Rating), 0), 2) AS average_rating
    FROM COURSE C  
    JOIN INSTRUCTOR I ON C.Instructor_ID = I.Instructor_ID 
    JOIN Users U ON I.User_ID = U.User_ID
    LEFT JOIN Course_Ratings CR ON C.Course_ID = CR.Course_ID
    WHERE C.COURSE_ID = $1
    GROUP BY C.Course_ID, I.Instructor_ID, U.First_Name, U.Last_Name;
  `;

        const { rows: courses } = await pool.query(courseQuery, [courseId]);

        if (!courses.length) {
            return res.status(404).send("Course not found.");
        }

        const course = courses[0];

        const chaptersQuery = "SELECT * FROM Course_Chapters WHERE Course_ID = $1";
        const { rows: chapters } = await pool.query(chaptersQuery, [courseId]);

        if (!chapters.length) {
            console.log("No chapters available for this course.");
        }

        return res.render("premiumStudentCourse", { courseId, course, chapters, user, });

    } catch (error) {
        console.error("Error rendering premium course content:", error);
        res.status(500).send("An error occurred while rendering the premium course content.");
    }
});

app.post("/submit-rating", isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const courseId = req.body.courseId;
        const rating = req.body.rating;

        const existingRatingQuery = "SELECT rating_id FROM Course_Ratings WHERE User_ID = $1 AND Course_ID = $2";
        const existingRatingResult = await pool.query(existingRatingQuery, [userId, courseId]);

        if (existingRatingResult.rows.length > 0) {
            const ratingId = existingRatingResult.rows[0].rating_id;
            const updateRatingQuery = "UPDATE Course_Ratings SET Rating = $1 WHERE Rating_ID = $2";
            await pool.query(updateRatingQuery, [rating, ratingId]);
        } else {
            const ratingId = await generateRatingId();
            const insertRatingQuery = "INSERT INTO Course_Ratings (Rating_ID, User_ID, Course_ID, Rating) VALUES ($1, $2, $3, $4)";
            await pool.query(insertRatingQuery, [ratingId, userId, courseId, rating]);
        }

        res.redirect(`/course/${courseId}/details`);
    } catch (error) {
        console.error("Error submitting rating:", error);
        res.status(500).send("An error occurred while submitting the rating.");
    }
});

app.get('/course/:courseId/chapter/:chapterId', async (req, res) => {
    try {
        const userId = req.session.userId;
        const userQuery = "SELECT * FROM Users WHERE User_ID = $1";
        const { rows: users } = await pool.query(userQuery, [userId]);

        if (!users.length) {
            return res.status(404).send("User not found.");
        }
        const user = users[0];
        const { courseId, chapterId } = req.params;
        const materialsQuery = "SELECT * FROM Course_Materials WHERE Chapter_ID = $1";
        const { rows: materials } = await pool.query(materialsQuery, [chapterId]);
        res.render('chapter', { materials, courseId, chapterId, user });
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).send('An error occurred while fetching materials.');
    }
});

app.post("/course/:courseId/addChapter", async (req, res) => {
    try {
        const userId = req.session.userId;
        const userQuery = "SELECT * FROM Users WHERE User_ID = $1";
        const { rows: users } = await pool.query(userQuery, [userId]);

        if (!users.length) {
            return res.status(404).send("User not found.");
        }
        const { chapterTitle, chapterDescription } = req.body;
        const courseId = req.params.courseId;
        const chapterIdQuery = "SELECT COUNT(*) FROM Course_Chapters";
        const result = await pool.query(chapterIdQuery);
        const count = parseInt(result.rows[0].count) + 1;
        const chapterId = `Chap-${count}`;

        const insertChapterQuery = "INSERT INTO Course_Chapters (Chapter_ID, Chapter_Title, Chapter_Description, Chapter_Order, Course_ID) VALUES ($1, $2, $3, $4, $5)";
        await pool.query(insertChapterQuery, [chapterId, chapterTitle, chapterDescription, count, courseId]);

        res.redirect(`/course/${courseId}/details`);
    } catch (error) {
        console.error("Error adding chapter:", error);
        res.status(500).send("An error occurred while adding chapter.");
    }
});

app.post("/course/:courseId/chapter/:chapterId/addMaterial", async (req, res) => {
    try {
        const { material_description, material_type, link_to_resource } = req.body;
        const courseId = req.params.courseId;
        const chapterId = req.params.chapterId;
        console.log(material_description, material_type, link_to_resource);
        const src = await extractSrcFromIframe(link_to_resource);

        const materialIdQuery = "SELECT COUNT(*) FROM Course_Materials ";
        const result = await pool.query(materialIdQuery);
        const count = parseInt(result.rows[0].count) + 1;
        const materialId = `Mat-${count}`;
        console.log(materialId);

        const insertMaterialQuery = "INSERT INTO Course_Materials (Material_ID,note, link_to_resource, Chapter_ID, material_type) VALUES ($1, $2, $3, $4, $5)";
        await pool.query(insertMaterialQuery, [materialId, material_description, src, chapterId, material_type]);

        return res.redirect(`/course/${courseId}/chapter/${chapterId}`);

    } catch (error) {
        console.error("Error adding material to chapter:", error);
        res.status(500).send("An error occurred while adding material to chapter.");
    }
});

app.post("/profile/addCourse", async (req, res) => {
    try {
        const { Course_ID, Course_Title, Description, Course_Point, Field_Name, Offering_Date, Course_Fee } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect("/users/login");
        }

        const { rows } = await pool.query('SELECT validating_course($1) AS total_count', [Course_ID]);
        const total_count = rows[0].total_count;

        if (total_count > 0) {
            return res.status(400).json({ message: 'Course ID already exists' });
        }

        const instructorQuery = `
      SELECT instructor_id FROM instructor i 
      JOIN users u ON u.user_id = i.user_id
      WHERE u.user_id = $1`;

        const { rows: insIds } = await pool.query(instructorQuery, [userId]);
        const instructorId = insIds[0].instructor_id;

        const fieldQuery = "SELECT field_id FROM field WHERE field_name = $1";
        const { rows: fieldIds } = await pool.query(fieldQuery, [Field_Name]);

        if (fieldIds.length === 0) {
            return res.status(404).json({ message: 'Field not found' });
        }

        const fieldId = fieldIds[0].field_id;
        const insertCourseQuery = `
      INSERT INTO course (course_id, course_title, description, course_point, field_id,field, instructor_id, offering_date, course_fee)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9)`;

        await pool.query(insertCourseQuery, [Course_ID, Course_Title, Description, Course_Point, fieldId, Field_Name, instructorId, Offering_Date, Course_Fee]);

        res.redirect(`/course/${Course_ID}/details`);
    } catch (error) {
        console.log("An error occurred:", error);
        res.status(500).send(error);
    }
});

app.get('/search', async (req, res) => {
    try {
        const searchTerm = req.query.q;
        const query = `
      SELECT c.*, round(COALESCE(AVG(cr.rating), 0),2) AS average_rating
      FROM Course c
      LEFT JOIN Course_Ratings cr ON c.course_id = cr.course_id
      WHERE c.Course_Title ILIKE $1
      GROUP BY c.course_id
      ORDER BY average_rating DESC NULLS LAST;`;
        const { rows: courses } = await pool.query(query, [`%${searchTerm}%`]);
        console.log(courses);
        res.render("searchCourses", { courses });
    } catch (error) {
        console.error("Error searching course :", error);
        res.status(500).send("An error occurred while searching course.");
    }
});

app.get("/course/:courseId", async (req, res) => {
    res.redirect(`/course/${req.params.courseId}/details`);
});

app.post("/enroll", isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect("/users/login");
        }
        const courseId = req.body.courseId;
        const enrollmentQuery = "SELECT * FROM Enroll WHERE Student_ID = $1 AND Course_ID = $2";
        const { rowCount: enrollmentCount } = await pool.query(enrollmentQuery, [userId, courseId]);

        if (enrollmentCount > 0) {
            return res.redirect(`/course/${courseId}/premium`);
        } else {
            return res.redirect("/payment");
        }
    } catch (error) {
        console.error("Error enrolling in course:", error);
        res.status(500).send("An error occurred while enrolling in the course.");
    }
});


app.get("/payment", isAuthenticated, async (req, res) => {
    try {
        const courseId = req.session.courseId;
        console.log("couse id is");
        console.log(courseId);
        res.render("payment", { courseId });
    } catch (error) {
        console.error("Error rendering payment page:", error);
        res.status(500).send("An error occurred while rendering the payment page.");
    }
});


app.post("/payment", isAuthenticated, async (req, res) => {
    try {
        const { paymentMethod, courseId } = req.body;
        const userId = req.session.userId;
        await pool.query('BEGIN');

        const stdquery = "SELECT * FROM STUDENT WHERE USER_ID = $1";
        const { rows } = await pool.query(stdquery, [userId]);
        const studentId = rows[0].student_id;
        const paymentId = await generatePaymentID();
        const paymentQuery = "INSERT INTO Payment (Payment_ID, Payment_Method, Payment_Time, Student_ID, Course_ID) VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)";
        await pool.query(paymentQuery, [paymentId, paymentMethod, studentId, courseId]);
        const enrollQuery = "INSERT INTO Enroll (Student_ID, Course_ID, Enrollment_Date) VALUES ($1, $2, CURRENT_DATE)";
        await pool.query(enrollQuery, [studentId, courseId]);
        await pool.query('COMMIT');
        res.redirect(`/course/${courseId}/premium`);
    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).send("An error occurred while processing the payment.");
    }
});

app.use("/profile/update", profileUpdateRouter);
app.post('/profile/update', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.redirect('/users/login');
        }

        const userQuery = 'UPDATE Users SET First_Name = $1, Last_Name = $2, Email = $3 WHERE User_ID = $4 RETURNING *';
        const result = await pool.query(userQuery, [req.body.first_name, req.body.last_name, req.body.email, userId]);
        const user = result.rows[0];

        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).send('An error occurred while updating profile.');
    }
});

app.get('/topratedCourses', async (req, res) => {
    try {
        const topRatedCourses = await pool.query('SELECT * FROM get_top_rated_courses()');
        res.render('topratedCourses', { topRatedCourses });
    } catch (error) {
        console.error('Error rendering statistics page:', error);
        res.status(500).send('An error occurred while rendering the statistics page.');
    }
});

app.get('/topCoursesByRevenue', async (req, res) => {
    try {
        const topCoursesByRevenue = await pool.query('SELECT * FROM GetTopCoursesByRevenue() ');
        res.render('topCoursesByRevenue', { topCoursesByRevenue: topCoursesByRevenue.rows });
    } catch (error) {
        console.error('Error rendering statistics page:', error);
        res.status(500).send('An error occurred while rendering the statistics page.');
    }
});

app.get('/topCoursesByStudentNumbers', async (req, res) => {
    try {
        const topCoursesByStudentNumbers = await pool.query('SELECT * FROM get_top_courses_by_students() ');
        res.render('topCoursesByStudentNumbers', { topCoursesByStudentNumbers: topCoursesByStudentNumbers.rows });
    } catch (error) {
        console.error('Error rendering statistics page:', error);
        res.status(500).send('An error occurred while rendering the statistics page.');
    }
});

app.get('/topCoursesByStudentPerformance', async (req, res) => {
    try {
        const topCoursesByStudentPerformance = await pool.query('SELECT * FROM get_top_courses_by_performance() ');
        res.render('topCoursesByStudentPerformance', { topCoursesByStudentPerformance: topCoursesByStudentPerformance.rows });
    } catch (error) {
        console.error('Error rendering statistics page:', error);
        res.status(500).send('An error occurred while rendering the statistics page.');
    }
});

app.get('/topratedfields', async (req, res) => {
    try {
        const topRatedFields = await pool.query('SELECT * FROM get_top_rated_fields()');
        res.render('topratedFields', { topRatedFields });
    } catch (error) {
        console.error('Error rendering statistics page:', error);
        res.status(500).send('An error occurred while rendering the statistics page.');
    }
});

app.get('/topratedInstructors', async (req, res) => {
    try {
        const topRatedInstructorsResult = await pool.query('SELECT * FROM get_top_rated_instructors()');
        const topRatedInstructors = topRatedInstructorsResult.rows;
        res.render('topratedInstructors', { topRatedInstructors });
    } catch (error) {
        console.error('Error rendering statistics page:', error);
        res.status(500).send('An error occurred while rendering the statistics page.');
    }
});

app.get("/statistics", async (req, res) => {
    res.render("statistics");
});

app.get("/course/:courseId/assignments", async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.session.userId;

        const userQuery = "SELECT * FROM users WHERE user_id = $1";
        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];

            if (user.is_student) {
                const studentQuery = "SELECT student_id FROM student WHERE user_id = $1";
                const students = await pool.query(studentQuery, [userId]);

                if (students.rows.length > 0) {
                    const studentId = students.rows[0].student_id;
                    const assignmentsNotSubmitted = await pool.query(`
            SELECT a.*
            FROM assignment a
            LEFT JOIN assignment_submission s 
            ON a.assignment_id = s.assignment_id AND s.student_id = $1
            WHERE a.course_id = $2 AND ( s.grade is NULL AND (s.is_completed is NULL or s.is_completed=false ))
          `, [studentId, courseId]);
                    const gradedAssignments = await pool.query(`
          SELECT a.Assignment_Name, s.Grade
          FROM Assignment a
          JOIN Assignment_Submission s ON a.Assignment_ID = s.Assignment_ID
          WHERE a.Course_ID = $1 AND s.Student_ID = $2 AND s.Grade IS NOT NULL
      `, [courseId, studentId]);
                    console.log(assignmentsNotSubmitted.rows);
                    res.render("assignmentsforStudents", { courseId, assignments: assignmentsNotSubmitted.rows, gradedAssignments: gradedAssignments.rows });
                } else {
                    res.status(404).send("Student not found");
                }
            } else if (user.is_instructor) {

                const assignmentsWithSubmissions = await pool.query(`
          SELECT a.*, s.*
          FROM assignment a
          LEFT JOIN assignment_submission s ON a.assignment_id = s.assignment_id
          WHERE a.course_id = $1 AND s.grade IS NULL
        `, [courseId]);

                const assignments = assignmentsWithSubmissions.rows || [];
                res.render("assignmentsForInstructors", { courseId, assignmentsWithSubmissions: assignments });
            }
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        console.error("Error fetching assignments:", error);
        res.status(500).send("An error occurred while fetching assignments.");
    }
});

app.get("/course/:courseId/assignment/:assignmentId/submit", (req, res) => {
    res.render("submitAssignment", { courseId: req.params.courseId, assignmentId: req.params.assignmentId });
});

app.post("/course/:courseId/assignment/:assignmentId/submit", upload.single('submissionFile'), async (req, res) => {
    try {
        const userId = req.session.userId;
        const assignmentId = parseInt(req.params.assignmentId);
        const submissionDate = new Date();
        const submissionFile = req.file;
        console.log("user is $1", userId);
        console.log("assignmentid is $1", assignmentId);
        console.log("submissionfile is $1", submissionFile);
        if (!userId || !assignmentId || !submissionFile) {
            throw new Error("Missing required parameters.");
        }
        const studentQuery = "SELECT student_id FROM student WHERE user_id = $1";
        const students = await pool.query(studentQuery, [userId]);
        const studentId = students.rows[0].student_id;

        await pool.query(
            "INSERT INTO Assignment_Submission (Assignment_ID, Student_ID, Submission_Date, Is_Completed, Grade, Submission_File) VALUES ($1, $2, $3, $4, $5, $6)",
            [assignmentId, studentId, submissionDate, true, null, submissionFile.filename]
        );

        res.redirect(`/course/${req.params.courseId}/assignments`);
    } catch (error) {
        console.error("Error submitting assignment:", error);
        res.status(500).send("An error occurred while submitting the assignment.");
    }
});

app.post("/course/:courseId/assignment/:assignmentId/evaluate", async (req, res) => {
    try {
        await pool.query("UPDATE Assignment_Submission SET grade = $1 WHERE submission_id = $2", [req.body.grade, req.body.submissionId]);
        res.redirect(`/course/${req.params.courseId}/assignments`);
    } catch (error) {
        console.error("Error evaluating submissions:", error);
        res.status(500).send("An error occurred while evaluating submissions.");
    }
});

app.get("/course/:courseId/addAssignment", (req, res) => {
    res.render("addAssignment", { courseId: req.params.courseId });
});

app.post("/course/:courseId/addAssignment", async (req, res) => {
    try {
        await pool.query("INSERT INTO Assignment (Course_ID, Assignment_Name, Description) VALUES ($1, $2, $3)",
            [req.params.courseId, req.body.title, req.body.description]);
        res.redirect(`/course/${req.params.courseId}/assignments`);
    } catch (error) {
        console.error("Error adding assignment:", error);
        res.status(500).send("An error occurred while adding the assignment.");
    }
});

app.get("/course/:courseId/getTopRatedStudentInCourse", async (req, res) => {
    try {
        const courseId = req.params.courseId;

        const topStudentsResult = await pool.query(`SELECT * FROM GetTopStudentsInCourse($1)`, [courseId]);

        const topStudents = topStudentsResult.rows;

        res.render("topRatedStudents", { courseId, topRatedStudents: topStudents });
    } catch (error) {
        console.error("Error fetching top rated students:", error);
        res.status(500).send("An error occurred while fetching top rated students.");
    }
});

app.listen(Port, () => {
    console.log(`Server started on port ${Port}`);
});
