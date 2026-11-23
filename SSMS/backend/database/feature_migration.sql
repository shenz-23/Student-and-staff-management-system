-- ADDITIVE migration. Back up your database first. Never import the individual DROP TABLE dumps over live data.
USE ssm_db;
CREATE TABLE IF NOT EXISTS Assignment_Submission (
 Submission_ID INT AUTO_INCREMENT PRIMARY KEY, Assignment_ID INT NOT NULL, Student_ID INT NOT NULL,
 File_Name VARCHAR(255), File_Path VARCHAR(255), Note TEXT, Submitted_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 Grade DECIMAL(5,2), Feedback TEXT, Graded_At DATETIME,
 UNIQUE KEY uq_assignment_student (Assignment_ID,Student_ID),
 FOREIGN KEY (Assignment_ID) REFERENCES Assignment(Assignment_ID),
 FOREIGN KEY (Student_ID) REFERENCES Student(S_ID));
CREATE TABLE IF NOT EXISTS Attendance (
 Attendance_ID INT AUTO_INCREMENT PRIMARY KEY, Student_ID INT NOT NULL, M_ID INT NOT NULL,
 Class_Date DATE NOT NULL, Status ENUM('Present','Absent','Late') NOT NULL,
 Marked_By INT NOT NULL, UNIQUE KEY uq_attendance (Student_ID,M_ID,Class_Date),
 FOREIGN KEY (Student_ID) REFERENCES Student(S_ID), FOREIGN KEY (M_ID) REFERENCES Module(M_ID),
 FOREIGN KEY (Marked_By) REFERENCES Lecturer(Lec_ID));
CREATE TABLE IF NOT EXISTS Study_Material (
 Material_ID INT AUTO_INCREMENT PRIMARY KEY, M_ID INT NOT NULL, Lec_ID INT NOT NULL,
 Title VARCHAR(150) NOT NULL, Description TEXT, File_Name VARCHAR(255), File_Path VARCHAR(255),
 Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (M_ID) REFERENCES Module(M_ID), FOREIGN KEY (Lec_ID) REFERENCES Lecturer(Lec_ID));
CREATE TABLE IF NOT EXISTS Grade (
 Grade_ID INT AUTO_INCREMENT PRIMARY KEY, Student_ID INT NOT NULL, M_ID INT NOT NULL,
 Title VARCHAR(150) NOT NULL, Score DECIMAL(5,2) NOT NULL, Max_Score DECIMAL(5,2) NOT NULL,
 Feedback TEXT, Lec_ID INT NOT NULL, Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (Student_ID) REFERENCES Student(S_ID), FOREIGN KEY (M_ID) REFERENCES Module(M_ID),
 FOREIGN KEY (Lec_ID) REFERENCES Lecturer(Lec_ID));
CREATE TABLE IF NOT EXISTS System_Log (
 Log_ID INT AUTO_INCREMENT PRIMARY KEY, Actor_Role VARCHAR(20) NOT NULL, Actor_ID INT NOT NULL,
 Action VARCHAR(100) NOT NULL, Details TEXT, Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
-- Existing Teach table links lecturers to modules. Populate using the admin portal.
-- If the previous integrated migration already created Assignment_Submission,
-- add grading fields without deleting existing submissions.
SET @q = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='Assignment_Submission' AND column_name='Grade')=0,'ALTER TABLE Assignment_Submission ADD COLUMN Grade DECIMAL(5,2) NULL','SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;
SET @q = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='Assignment_Submission' AND column_name='Feedback')=0,'ALTER TABLE Assignment_Submission ADD COLUMN Feedback TEXT NULL','SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;
SET @q = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='Assignment_Submission' AND column_name='Graded_At')=0,'ALTER TABLE Assignment_Submission ADD COLUMN Graded_At DATETIME NULL','SELECT 1');
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;
