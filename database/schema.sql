
CREATE DATABASE SSM_DB;
USE SSM_DB;


CREATE TABLE Admin (
    Admin_ID INT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE,
    Contact_No VARCHAR(15),
    Salary DECIMAL(10,2),
    Qualification VARCHAR(100)
);


CREATE TABLE Student (
    S_ID INT PRIMARY KEY,
    F_Name VARCHAR(50),
    L_Name VARCHAR(50),
    BOD DATE,
    Age INT,
    Email VARCHAR(100) UNIQUE,
    Contact_No VARCHAR(15),
    NIC VARCHAR(20) UNIQUE,
    Address VARCHAR(255),
    Admin_ID INT,
    FOREIGN KEY (Admin_ID) REFERENCES Admin(Admin_ID)
);


CREATE TABLE Course (
    C_ID INT PRIMARY KEY,
    C_Name VARCHAR(100),
    Admin_ID INT,
    FOREIGN KEY (Admin_ID) REFERENCES Admin(Admin_ID)
);


CREATE TABLE Module (
    M_ID INT PRIMARY KEY,
    M_Name VARCHAR(100),
    Hours INT
);


CREATE TABLE Lecturer (
    Lec_ID INT PRIMARY KEY,
    F_Name VARCHAR(50),
    L_Name VARCHAR(50),
    NIC VARCHAR(20) UNIQUE,
    Email VARCHAR(100) UNIQUE,
    Qualification VARCHAR(100),
    Contact_No VARCHAR(15),
    BOD DATE,
    Age INT,
    Salary DECIMAL(10,2),
    Address VARCHAR(255),
    Admin_ID INT,
    FOREIGN KEY (Admin_ID) REFERENCES Admin(Admin_ID)
);

CREATE TABLE Enroll (
    S_ID INT,
    C_ID INT,
    Timetable VARCHAR(255),
    PRIMARY KEY (S_ID, C_ID),
    FOREIGN KEY (S_ID) REFERENCES Student(S_ID),
    FOREIGN KEY (C_ID) REFERENCES Course(C_ID)
);

CREATE TABLE Learn (
    Student_ID INT,
    M_ID INT,
    PRIMARY KEY (Student_ID, M_ID),
    FOREIGN KEY (Student_ID) REFERENCES Student(S_ID),
    FOREIGN KEY (M_ID) REFERENCES Module(M_ID)
);


CREATE TABLE Teach (
    Lec_ID INT,
    M_ID INT,
    Timetable VARCHAR(255),
    PRIMARY KEY (Lec_ID, M_ID),
    FOREIGN KEY (Lec_ID) REFERENCES Lecturer(Lec_ID),
    FOREIGN KEY (M_ID) REFERENCES Module(M_ID)
);

CREATE TABLE Access (
    Student_ID INT,
    Lec_ID INT,
    Assignments TEXT,
    Study_Materials TEXT,
    Submission_Date DATE,
    PRIMARY KEY (Student_ID, Lec_ID),
    FOREIGN KEY (Student_ID) REFERENCES Student(S_ID),
    FOREIGN KEY (Lec_ID) REFERENCES Lecturer(Lec_ID)
);