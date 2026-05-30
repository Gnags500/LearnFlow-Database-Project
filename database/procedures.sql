CREATE OR REPLACE PROCEDURE register_user(
    IN First_Name VARCHAR,
    IN Last_Name VARCHAR,
    IN Date_of_Birth DATE,
    IN Email VARCHAR,
    IN Pass VARCHAR,
    IN User_Type VARCHAR,
    IN Bank_Account VARCHAR 
)
LANGUAGE plpgsql
AS $$
DECLARE
    email_count INT;
    user_id INT;
    errors TEXT[] := '{}';
BEGIN
    
    SELECT COUNT(*) INTO email_count FROM Users WHERE Email = register_user.Email;

    IF email_count > 0 THEN
        errors := array_append(errors, 'This email is already registered');
    END IF;
   
    IF Email IS NULL THEN
        errors := array_append(errors, 'Email is required.');
    END IF;
    
    IF array_length(errors, 1) > 0 THEN
        RAISE EXCEPTION 'Invalid registration: %', errors;
    END IF;
    
    BEGIN
        
        user_id := generate_user_id()::INT;
        INSERT INTO Users (User_id, First_Name, Last_Name, Date_of_Birth, Email, Pass, Is_Student, Is_Instructor)
        VALUES (user_id::VARCHAR, First_Name, Last_Name, Date_of_Birth, Email, Pass, 
                CASE WHEN User_Type = 'student' THEN TRUE ELSE FALSE END,
                CASE WHEN User_Type = 'instructor' THEN TRUE ELSE FALSE END);
   
        COMMIT;
    EXCEPTION
        WHEN others THEN
            ROLLBACK;
            RAISE;
    END;
END;
$$;
