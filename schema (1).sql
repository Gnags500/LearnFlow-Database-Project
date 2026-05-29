CREATE TABLE Course (
    Course_ID VARCHAR(10) PRIMARY KEY,
    Course_Title VARCHAR(100) NOT NULL,
    Description TEXT,
    Offering_Date DATE,
    Course_Point DECIMAL(10, 2),
    Field VARCHAR(50),
    Course_Fee DECIMAL(10, 2),
    Instructor_ID VARCHAR(10),
    Field_ID VARCHAR(10)
);

-- create table Field (
-- 	Field_ID VARCHAR(10),
-- 	Field_Name VARCHAR(30)
-- 	
-- );

CREATE TABLE Users (
    User_ID VARCHAR(10) PRIMARY KEY,
    First_Name VARCHAR(50) NOT NULL,
    Last_Name VARCHAR(50) NOT NULL,
    Date_of_Birth DATE,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Pass VARCHAR(25) NOT NULL,
    Is_Student BOOLEAN NOT NULL,
    Is_Instructor BOOLEAN NOT NULL,
    CHECK (
        (Is_Student AND not Is_Instructor) OR
        (not Is_Student AND Is_Instructor)
    )
);



-- CREATE TABLE FIELD (
--     Field_ID VARCHAR(10) PRIMARY KEY,
--     Field_Name VARCHAR(50) NOT NULL,
--     Field_Description TEXT
-- );
-- 
CREATE TABLE FIELD (
    Field_ID VARCHAR(10) PRIMARY KEY,
    Field_Name VARCHAR(50) NOT NULL,
    Field_Description TEXT,
    image_url VARCHAR(255) -- Add this column for storing image URLs
);


CREATE TABLE ATTEND (
    Student_ID VARCHAR(10) NOT NULL,
    Exam_ID VARCHAR(10) NOT NULL,
    Exam_Date DATE NOT NULL,
    Obtained_Marks DECIMAL(10, 2),
    PRIMARY KEY (Student_ID, Exam_ID)
);


CREATE TABLE Student (
    Student_ID VARCHAR(10) PRIMARY KEY,
    Profile_Points DECIMAL(10, 2)
);

CREATE TABLE Instructor (
    Instructor_ID VARCHAR(10) PRIMARY KEY,
    Joining_Date DATE,
    Bank_Account VARCHAR(50)
);
alter table instructor  
add column User_ID VARCHAR(10);

alter table instructor
add constraint fk_User_ID
foreign key (User_ID) references Users(User_ID);

CREATE TABLE Assignment (
    Assignment_ID SERIAL PRIMARY KEY,
    Course_ID VARCHAR(10),
    Assignment_Name VARCHAR(100),
    Deadline TIMESTAMP,
    Description  TEXT,
    FOREIGN KEY (Course_ID) REFERENCES Course(Course_ID)
);



CREATE TABLE Assignment_Submission (
    Submission_ID SERIAL PRIMARY KEY,
    Assignment_ID INT,
    Student_ID VARCHAR(10),
    Submission_Date TIMESTAMP,
    Is_Completed BOOLEAN DEFAULT false,
    Grade DECIMAL(5, 2),
    Submission_File VARCHAR(255),
    FOREIGN KEY (Assignment_ID) REFERENCES Assignment(Assignment_ID),
    FOREIGN KEY (Student_ID) REFERENCES Student(Student_ID)
);

CREATE TABLE Course_Materials (
    Material_ID VARCHAR(10) PRIMARY KEY,
    Note TEXT,
    Link_To_Resource VARCHAR(1000)
);

CREATE TABLE Payment (
    Payment_ID VARCHAR(10) PRIMARY KEY,
    Payment_Method VARCHAR(50) NOT NULL,
    Payment_Time TIMESTAMP NOT NULL,
    Student_ID VARCHAR(10),
    Course_ID VARCHAR(10),
    UNIQUE (Student_ID, Course_ID),
    FOREIGN KEY (Student_ID) REFERENCES Student(Student_ID),
    FOREIGN KEY (Course_ID) REFERENCES Course(Course_ID)
);


CREATE TABLE Enroll (
    Student_ID VARCHAR(10),
    Course_ID VARCHAR(10),
    Enrollment_Date DATE NOT NULL,
    PRIMARY KEY (Student_ID, Course_ID),
    FOREIGN KEY (Student_ID) REFERENCES Student(Student_ID),
    FOREIGN KEY (Course_ID) REFERENCES Course(Course_ID)
);

CREATE TABLE Course_Chapters (
    Chapter_ID VARCHAR(10) PRIMARY KEY,
    Chapter_Title VARCHAR(100) NOT NULL,
    Chapter_Description TEXT,
    Chapter_Order INT NOT NULL,
    Course_ID VARCHAR(10) NOT NULL,
    FOREIGN KEY (Course_ID) REFERENCES Course(Course_ID)
);

CREATE TABLE Course_Ratings (
    Rating_ID VARCHAR(10) PRIMARY KEY,
    Course_ID VARCHAR(10),
    User_ID VARCHAR(10),
    Rating INT,
    FOREIGN KEY (Course_ID) REFERENCES Course(Course_ID),
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
);



ALTER TABLE ATTEND
ADD CONSTRAINT fk_attend_student
FOREIGN KEY (Student_ID) REFERENCES Student(Student_ID);

ALTER TABLE Feedback_Of_Student
ADD CONSTRAINT fk_feedback_student
FOREIGN KEY (Student_ID) REFERENCES Student(Student_ID);

ALTER TABLE Feedback_Of_Student
ADD CONSTRAINT fk_feedback_course
FOREIGN KEY (Feedback_ID) REFERENCES Feedback(Feedback_ID);

alter table student 
add column User_ID VARCHAR(10);

alter table student 
add constraint fk_User_ID
foreign key (User_ID) references Users(User_ID);

ALTER TABLE Assignment
ADD COLUMN Course_ID VARCHAR(10);

ALTER TABLE Assignment
ADD CONSTRAINT FK_Course_Assignment
FOREIGN KEY (Course_ID) REFERENCES Course(Course_ID);

ALTER TABLE Course_Materials
ADD COLUMN Chapter_ID VARCHAR(10) REFERENCES Course_Chapters(Chapter_ID);

ALTER TABLE Course_Materials
ADD COLUMN material_type VARCHAR(10) ;

ALTER TABLE Student ALTER COLUMN Student_ID TYPE VARCHAR(20);

ALTER TABLE Course_Ratings
ALTER COLUMN Rating_ID TYPE VARCHAR(20); 


