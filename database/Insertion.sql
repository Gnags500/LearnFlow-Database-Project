INSERT INTO Users (User_ID, First_Name, Last_Name, Date_of_Birth, Email, Pass, Is_Student, Is_Instructor)
VALUES
   ('Usr-1', 'Dhruba', 'Kishore', '2001-01-01', 'dhruba62@gmail.com', '!2#4$3@1', true, false),
   ('Usr-2', 'Zahid', 'Brinto', '2001-03-29', 'brinto3187@gmail.com', '1@3$4#2!', true, false),
   ('Usr-3', 'Nafis', 'Hussain', '1985-03-22', 'nafisHsn@cse.buet.ac.bd', 'uue$$aa2', false, true),
   ('Usr-4', 'Majed', 'Sourov', '1986-03-12', 'majedsourov@math.du.ac.bd', '1*^$4!2!', false, true);
  
INSERT INTO Field (Field_ID, Field_Name, Field_Description, image_url) 
VALUES 
  ('Fld-1', 'Computer Science', 'Study of algorithms and computing' , '/images/html-system-website-concept_23-2150376770.avif'),
  ('Fld-2', 'Mathematics', 'Study of numbers, quantities, and shapes', '/images/download.jpg'),
  ('Fld-3', 'Development', 'Software development and programming practices', '/images/development.jpg'),
  ('Fld-4', 'Design', 'Graphic design, web design, and user experience design', '/images/design.jpg'),
  ('Fld-5', 'IT and Software', 'Information technology and software engineering', '/images/IT.jpg'),
  ('Fld-6', 'Business', 'Entrepreneurship, management, and business strategy', '/images/business.jpg'),
  ('Fld-7', 'Personal Development', 'Self-improvement and personal growth', '/images/personal.jpg');

INSERT INTO Course (Course_ID, Course_Title, Description, Offering_Date, Course_Point, Field, Course_Fee, Instructor_ID, Field_ID)
VALUES
    ('CS-106', 'Introduction to Programmingin C++', 'Learn the basics of C++', '2024-02-01', 3, 'Computer Science', 640, 'INS-1', 'Fld-1'),
    ('MATH-02', 'Mathematics Fundamentals', 'Foundational math concepts', '2024-03-15', 4, 'Mathematics', 499.99, 'INS-2', 'Fld-2');

INSERT INTO Student (Student_ID, Profile_Points, User_ID)
VALUES
    ('Stdn-1', 0, 'Usr-1'),
    ('Stdn-2', 0, 'Usr-2');

INSERT INTO Instructor (Instructor_ID, Joining_Date, Bank_Account, User_Id)
VALUES
    ('INS-1', '2017-05-10', 'AC-DBBL_3312', 'Usr-3'),
    ('INS-2', '2019-11-08', 'AC-DBBL_3312', 'Usr-4');

INSERT INTO assignment  (Assignment_ID, Course_ID, Assignment_Name, Deadline, Description)
VALUES
    ('Asgn-1', 'CS-106', 'Finding prime numbers', '2024-01-10 08:30:00.000' , 'http://hijibiji'),
    ('Asgn-2', 'MATH-02', 'Quadratic equation', '2024-01-12 08:30:00.000', 'http://hijibiji');

INSERT INTO Enroll (Student_ID, Course_ID, Enrollment_Date)
VALUES
    ('Stdn-1', 'MATH-02', '2023-01-25'),
    ('Stdn-2', 'CS-106', '2023-02-10');

INSERT INTO Payment (Payment_ID, Payment_Method, Payment_Time, Student_ID, Course_ID)
VALUES
    ('Pay-1', 'Credit Card', '2024-01-26 08:30:00', 'Stdn-2', 'CS-106'),
    ('Pay-2', 'PayPal', '2024-02-15 12:45:00', 'Stdn-1', 'MATH-02');

INSERT INTO Question (Question_ID, Description, Student_ID, Course_ID)
VALUES
    ('Q-1', 'What is the syntax of a while loop?', 'Stdn-2', 'CS-106'),
    ('Q-2', 'What are the key concepts of calculus?', 'Stdn-1', 'MATH-02');

INSERT INTO Answer (Answer_ID, Description, User_ID, Question_ID)
VALUES
    ('A-1', 'while(conditions){code}', 'Usr-3', 'Q-1'),
    ('A-2', 'Calculus involves the study of limits, derivatives, and integrals.', 'Usr-4', 'Q-2');

INSERT INTO Feedback (Feedback_ID, Rating, Status)
VALUES
    (601, 4, 'Approved'),
    (602, 3, 'Pending');
