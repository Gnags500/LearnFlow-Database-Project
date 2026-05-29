--FOR PREVENTING DUPLICATE ENROLLMENT(TRIGGER 1)
CREATE OR REPLACE FUNCTION prevent_duplicate_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM Enroll
        WHERE Student_ID = NEW.Student_ID AND Course_ID = NEW.Course_ID
    ) THEN
        RAISE EXCEPTION 'Student is already enrolled in this course.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_duplicate_enrollment
BEFORE INSERT ON Enroll
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_enrollment();


--FOR ENSURING ONE SUBMSSION OF ASSIGNMENT(TRIGGER 2)
CREATE OR REPLACE FUNCTION enforce_unique_assignment_submission()
RETURNS TRIGGER AS $$
BEGIN

    IF EXISTS (
        SELECT 1 FROM Assignment_Submission
        WHERE Assignment_ID = NEW.Assignment_ID AND Student_ID = NEW.Student_ID
    ) THEN
        RAISE EXCEPTION 'Student has already submitted this assignment.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_unique_assignment_submission
BEFORE INSERT ON Assignment_Submission
FOR EACH ROW
EXECUTE FUNCTION enforce_unique_assignment_submission();


--FOR ENSURING THE COURSE RATER IS A STUDENT(TRIGGER 3)
CREATE OR REPLACE FUNCTION enforce_student_rating()
RETURNS TRIGGER AS $$
DECLARE
    is_student BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM Student
        WHERE User_ID = NEW.User_ID
    ) INTO is_student;
    IF NOT is_student THEN
        RAISE EXCEPTION 'User is not a student.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--FOR PREVENTING STUDENT FROM ENROLLING IN MORE THAN 5 COURSES(TRIGGER 4)
CREATE OR REPLACE FUNCTION enforce_max_course_enrollment()
RETURNS TRIGGER AS $$
DECLARE
    course_count INT;
BEGIN
 
    SELECT COUNT(*) INTO course_count
    FROM Enroll
    WHERE Student_ID = NEW.Student_ID;

    IF course_count >= 5 THEN
        RAISE EXCEPTION 'Student cannot enroll in more than 5 courses.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_max_course_enrollment
BEFORE INSERT ON Enroll
FOR EACH ROW
EXECUTE FUNCTION enforce_max_course_enrollment();

--FOR PREVENTING INSTRUCTOR FROM LAUNCHING MORE THAN 8 COURSES(TRIGGER 5)
CREATE OR REPLACE FUNCTION enforce_max_course_launch()
RETURNS TRIGGER AS $$
DECLARE
    course_count INT;
BEGIN
 
    SELECT COUNT(*) INTO course_count
    FROM Course
    WHERE Instructor_ID = NEW.Instructor_ID;
    IF course_count >= 8 THEN
        RAISE EXCEPTION 'Instructor cannot launch more than 8 courses.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_max_course_launch
BEFORE INSERT ON Course
FOR EACH ROW
EXECUTE FUNCTION enforce_max_course_launch();


--FOR PREVENTING ADDING TWO VIDEOS PER CHAPTER(TRIGGER 6)
CREATE OR REPLACE FUNCTION enforce_max_videos_per_chapter()
RETURNS TRIGGER AS $$
DECLARE
    video_count INT;
BEGIN
 
    SELECT COUNT(*) INTO video_count
    FROM Course_Materials
    WHERE Chapter_ID = NEW.Chapter_ID AND material_type = 'video';

    IF video_count >= 2 THEN
        RAISE EXCEPTION 'Not more than 2 videos are allowed in a specific chapter.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_max_videos_per_chapter
BEFORE INSERT ON Course_Materials
FOR EACH ROW
WHEN (NEW.material_type = 'video')
EXECUTE FUNCTION enforce_max_videos_per_chapter();


--FOR ENSURING EVERY COURSE HAS ATMOST 10 ASSIGNMENTS(TRIGGER 7)
CREATE OR REPLACE FUNCTION enforce_assignment_limit()
RETURNS TRIGGER AS $$
DECLARE
    assignment_count INTEGER;
BEGIN
 
    SELECT COUNT(*) INTO assignment_count
    FROM Assignment
    WHERE Course_ID = NEW.Course_ID;

    IF assignment_count >= 10 THEN
        RAISE EXCEPTION 'Assignment limit exceeded for this course';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_assignment_limit
BEFORE INSERT ON Assignment
FOR EACH ROW
EXECUTE FUNCTION enforce_assignment_limit();


--FOR ENSURING GRADE IS DONE FOR 10 MARKS (TRIGGER 8)
CREATE OR REPLACE FUNCTION enforce_max_grade()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.grade > 10 THEN
        RAISE EXCEPTION 'Grade cannot exceed 10.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_max_grade
BEFORE INSERT OR UPDATE ON assignment_submission
FOR EACH ROW
EXECUTE FUNCTION enforce_max_grade();


--FOR UPDATING STUDENT POINTS ACCORDING TO THE COURSE POINTS AFTER ENROLLMENT  (TRIGGER 9)
CREATE OR REPLACE FUNCTION update_student_points()
RETURNS TRIGGER AS $$
DECLARE
    coursePoints DECIMAL;
BEGIN
    SELECT Course_Point INTO coursePoints
    FROM Course
    WHERE Course_ID = NEW.Course_ID;

    SET Profile_Points = Profile_Points + coursePoints
    WHERE Student_ID = NEW.Student_ID;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enroll_trigger
AFTER INSERT ON Enroll
FOR EACH ROW
EXECUTE FUNCTION update_student_points();