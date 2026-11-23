-- SSMS migration for the supplied backend. Run after schema.sql and dataadd.sql.
USE SSM_DB;





SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='Admin' AND column_name='Password')=0, 'ALTER TABLE Admin ADD COLUMN Password VARCHAR(255) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='Student' AND column_name='Password')=0, 'ALTER TABLE Student ADD COLUMN Password VARCHAR(255) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='Lecturer' AND column_name='Password')=0, 'ALTER TABLE Lecturer ADD COLUMN Password VARCHAR(255) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='Student' AND column_name='Account_Status')=0, 'ALTER TABLE Student ADD COLUMN Account_Status VARCHAR(20) NOT NULL DEFAULT ''Active''', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='Lecturer' AND column_name='Account_Status')=0, 'ALTER TABLE Lecturer ADD COLUMN Account_Status VARCHAR(20) NOT NULL DEFAULT ''Active''', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

CREATE TABLE IF NOT EXISTS Class_Schedule (
    Schedule_ID INT AUTO_INCREMENT PRIMARY KEY,
    M_ID INT NOT NULL, Lec_ID INT NOT NULL,
    Class_Day VARCHAR(12) NOT NULL,
    Start_Time TIME NOT NULL, End_Time TIME NOT NULL,
    Room VARCHAR(120),
    FOREIGN KEY (M_ID) REFERENCES Module(M_ID),
    FOREIGN KEY (Lec_ID) REFERENCES Lecturer(Lec_ID)
);
CREATE TABLE IF NOT EXISTS Notification (
    Notification_ID INT AUTO_INCREMENT PRIMARY KEY,
    S_ID INT NOT NULL, Title VARCHAR(100) NOT NULL,
    Message TEXT NOT NULL, Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Is_Read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (S_ID) REFERENCES Student(S_ID)
);
CREATE TABLE IF NOT EXISTS Assignment (
    Assignment_ID INT AUTO_INCREMENT PRIMARY KEY,
    M_ID INT NOT NULL, Lec_ID INT NOT NULL,
    Title VARCHAR(150) NOT NULL, Description TEXT,
    Due_Date DATETIME NOT NULL,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (M_ID) REFERENCES Module(M_ID),
    FOREIGN KEY (Lec_ID) REFERENCES Lecturer(Lec_ID)
);
CREATE TABLE IF NOT EXISTS Assignment_Submission (
    Submission_ID INT AUTO_INCREMENT PRIMARY KEY,
    Assignment_ID INT NOT NULL, Student_ID INT NOT NULL,
    File_Name VARCHAR(255) NOT NULL, File_Path VARCHAR(255) NOT NULL,
    Note TEXT, Submitted_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY one_submission_per_student (Assignment_ID, Student_ID),
    FOREIGN KEY (Assignment_ID) REFERENCES Assignment(Assignment_ID),
    FOREIGN KEY (Student_ID) REFERENCES Student(S_ID)
);
