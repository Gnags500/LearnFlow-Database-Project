-- FOR GETTING THE TOP RATED COURSE (FUNCTION 1)
DROP FUNCTION IF EXISTS get_top_rated_courses();
CREATE OR REPLACE FUNCTION get_top_rated_courses()
RETURNS TABLE (
    course_id VARCHAR,
    course_title VARCHAR,
    average_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.Course_ID, c.Course_Title, round(COALESCE(AVG(cr.Rating), 0),2) AS average_rating
    FROM Course c
    LEFT JOIN Course_Ratings cr ON c.Course_ID = cr.Course_ID
    GROUP BY c.Course_ID, c.Course_Title
    ORDER BY average_rating DESC NULLS LAST
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- FOR GETTING THE TOP RATED INSTRUCTORS (FUNCTION 2)
DROP FUNCTION IF EXISTS get_top_rated_instructors();
CREATE OR REPLACE FUNCTION get_top_rated_instructors()
RETURNS TABLE (
    instructor_id VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    average_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT i.Instructor_ID, u.First_Name, u.Last_Name, round(COALESCE(AVG(cr.Rating), 0),2) AS average_rating
    FROM Instructor i
    JOIN Users u ON i.User_ID = u.User_ID
    LEFT JOIN Course c ON i.Instructor_ID = c.Instructor_ID
    LEFT JOIN Course_Ratings cr ON c.Course_ID = cr.Course_ID
    GROUP BY i.Instructor_ID, u.First_Name, u.Last_Name
    ORDER BY average_rating DESC NULLS LAST
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- FOR GETTING THE TOP RATED FIELDS (FUNCTION 3)
DROP FUNCTION IF EXISTS get_top_rated_fields();
CREATE OR REPLACE FUNCTION get_top_rated_fields()
RETURNS TABLE (
    field_id VARCHAR,
    field_name VARCHAR,
    average_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT f.Field_ID, f.Field_Name, round(COALESCE(AVG(cr.Rating), 0),2) AS average_rating
    FROM Field f
    LEFT JOIN Course c ON f.Field_ID = c.Field_ID
    LEFT JOIN Course_Ratings cr ON c.Course_ID = cr.Course_ID
    GROUP BY f.Field_ID, f.Field_Name
    ORDER BY average_rating DESC NULLS LAST
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- FOR GETTING THE TOP PERFORMING STUDENTS IN A SPECIFIC COURSE (FUNCTION 4)
DROP FUNCTION IF EXISTS GetTopStudentsInCourse(VARCHAR);
CREATE OR REPLACE FUNCTION GetTopStudentsInCourse(courseid VARCHAR(10)) 
RETURNS TABLE (
    Student_ID VARCHAR(10),
    Total_Grade DECIMAL(10, 2),
    Full_Name TEXT
) AS $$
BEGIN
    RETURN QUERY (
        SELECT s.Student_ID, 
               SUM(asub.Grade) AS Total_Grade,
               u.first_name || ' ' || u.last_name AS Full_Name
        FROM Assignment_Submission asub
        JOIN Student s ON asub.Student_ID = s.Student_ID
        JOIN users u ON s.user_id = u.user_id
        JOIN Assignment a ON asub.Assignment_ID = a.Assignment_ID
        WHERE a.Course_ID = courseid
        GROUP BY s.Student_ID, u.first_name, u.last_name
        ORDER BY Total_Grade DESC
        LIMIT 10
    );
END;
$$ LANGUAGE plpgsql;

-- FOR GETTING TOP COURSES BY REVENUE (FUNCTION 5)
DROP FUNCTION IF EXISTS GetTopCoursesByRevenue();
CREATE OR REPLACE FUNCTION GetTopCoursesByRevenue() 
RETURNS TABLE (
    Course_ID VARCHAR(10),
    Course_Title VARCHAR(100),
    Total_Revenue DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY (
        SELECT c.course_id, 
               c.course_title, 
               SUM(c.course_fee) AS total_revenue
        FROM course c
        JOIN enroll e ON c.course_id = e.course_id
        GROUP BY c.course_id, c.course_title
        ORDER BY total_revenue DESC
        LIMIT 10
    );
END;
$$ LANGUAGE plpgsql;

-- FOR GETTING TOP COURSES BY THE NUMBER OF STUDENTS (FUNCTION 6)
DROP FUNCTION IF EXISTS get_top_courses_by_students();
CREATE OR REPLACE FUNCTION get_top_courses_by_students()
RETURNS TABLE (
    Course_ID VARCHAR(10),
    Course_Title VARCHAR(100), 
    Number_of_Students BIGINT
) AS $$
BEGIN
    RETURN QUERY (
        SELECT c.course_id,
               c.course_title,
               COUNT(e.student_id) AS number_of_students
        FROM course c
        JOIN enroll e ON c.course_id = e.course_id
        GROUP BY c.course_id, c.course_title
        ORDER BY number_of_students DESC
        LIMIT 10
    );
END;
$$ LANGUAGE plpgsql;

-- FOR GENERATING RATING ID (FUNCTION 7)
DROP FUNCTION IF EXISTS generate_rating_id();
CREATE OR REPLACE FUNCTION generate_rating_id()
RETURNS VARCHAR AS $$
DECLARE
    rating_id VARCHAR;
BEGIN
    rating_id := md5(random()::TEXT || clock_timestamp()::TEXT)::VARCHAR(15);
    RETURN rating_id;
END;
$$ LANGUAGE plpgsql;

-- FOR GENERATING INSTRUCTOR ID (FUNCTION 8)
DROP FUNCTION IF EXISTS generate_instructor_id();
CREATE OR REPLACE FUNCTION generate_instructor_id() RETURNS VARCHAR AS $$
DECLARE
    instructor_count INT;
BEGIN
    SELECT COUNT(*) INTO instructor_count FROM Instructor;
    RETURN 'Ins-' || (instructor_count + 1);
END;
$$ LANGUAGE plpgsql;

-- FOR GENERATING STUDENT ID (FUNCTION 9)
DROP FUNCTION IF EXISTS generate_student_id();
CREATE OR REPLACE FUNCTION generate_student_id() RETURNS VARCHAR AS $$
DECLARE
    student_count INT;
BEGIN
    SELECT COUNT(*) INTO student_count FROM Student;
    RETURN 'Stdn-' || (student_count + 1);
END;
$$ LANGUAGE plpgsql;

-- FOR GENERATING USER ID (FUNCTION 10)
DROP FUNCTION IF EXISTS generate_user_id();
CREATE OR REPLACE FUNCTION generate_user_id() RETURNS VARCHAR AS $$
DECLARE
    user_count INT;
BEGIN
    SELECT COUNT(*) INTO user_count FROM Users;
    RETURN 'Usr-' || (user_count + 1);
END;
$$ LANGUAGE plpgsql;

-- FOR GENERATING COURSE ID (FUNCTION 11)
DROP FUNCTION IF EXISTS generate_course_id();
CREATE OR REPLACE FUNCTION generate_course_id() RETURNS VARCHAR AS $$
DECLARE
    course_count INT;
BEGIN
    SELECT COUNT(*) INTO course_count FROM course;
    RETURN 'Course-' || (course_count + 1);
END;
$$ LANGUAGE plpgsql;

-- FOR VALIDATING COURSE (FUNCTION 12)
DROP FUNCTION IF EXISTS validating_course(VARCHAR);
CREATE OR REPLACE FUNCTION validating_course(course_id VARCHAR) RETURNS INT AS $$
DECLARE
    count INT;
BEGIN
    SELECT COUNT(*) INTO count FROM course WHERE course_id = validating_course.course_id;
    RETURN count;
END;
$$ LANGUAGE plpgsql;

-- FOR GETTING TOP COURSES BY PERFORMANCE (FUNCTION 13)
DROP FUNCTION IF EXISTS get_top_courses_by_performance();
CREATE OR REPLACE FUNCTION get_top_courses_by_performance()
RETURNS TABLE (
    Course_ID VARCHAR(10),
    Course_Title VARCHAR(100),
    Average_Performance NUMERIC
) AS $$
BEGIN
    RETURN QUERY (
        SELECT c.course_id,
               c.course_title,
               ROUND(AVG(asub.grade), 2) AS average_performance
        FROM course c
        JOIN assignment a ON c.course_id = a.course_id
        JOIN assignment_submission asub ON a.assignment_id = asub.assignment_id
        WHERE asub.grade IS NOT NULL
        GROUP BY c.course_id, c.course_title
        ORDER BY average_performance DESC
        LIMIT 10
    );
END;
$$ LANGUAGE plpgsql;
