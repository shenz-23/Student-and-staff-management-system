import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import connectDB from "../config/database.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();
const storage = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");
const allowedMime = new Map([["application/pdf",".pdf"],["image/png",".png"],["image/jpeg",".jpg"],["text/plain",".txt"],["application/vnd.openxmlformats-officedocument.wordprocessingml.document",".docx"]]);
const requireRole = (...roles) => (req,res,next) => roles.includes(req.user.role) ? next() : res.status(403).json({message:"Access denied"});
const id = v => Number.isSafeInteger(Number(v)) && Number(v)>0 ? Number(v) : null;
const fail = (res,e) => { console.error(e); return res.status(e.status || (e.code === "ER_DUP_ENTRY" ? 409 : e.code === "ER_ROW_IS_REFERENCED_2" ? 409 : 500)).json({message:e.code === "ER_DUP_ENTRY" ? "Duplicate record" : e.code === "ER_ROW_IS_REFERENCED_2" ? "Record is referenced by other data" : "Database operation failed"}); };
const run = async (res,fn) => { let db; try { db=await connectDB(); await fn(db); } catch(e){ if(!res.headersSent)fail(res,e); } finally { if(db) await db.end(); } };
const query = (db,sql,values=[])=>db.execute(sql,values).then(([rows])=>rows);
const audit = (db,u,action,details='')=>query(db,"INSERT INTO System_Log (Actor_Role,Actor_ID,Action,Details) VALUES (?,?,?,?)",[u.role,u.user_id,action,String(details)]);
const owns = async(db,lecturer,moduleId) => (await query(db,"SELECT 1 FROM Teach WHERE Lec_ID=? AND M_ID=?",[lecturer,moduleId])).length>0;
const learns = async(db,student,moduleId) => (await query(db,"SELECT 1 FROM Learn WHERE Student_ID=? AND M_ID=?",[student,moduleId])).length>0;
const validDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const saveFile = async (data) => {
 if(!data || typeof data.base64!=="string" || !allowedMime.has(data.mime) || !/^[a-zA-Z0-9_. ()-]{1,150}$/.test(data.name||"")) throw Object.assign(new Error("Invalid file"),{status:400});
 const raw=Buffer.from(data.base64,"base64");
 if(raw.length===0 || raw.length>5*1024*1024 || Buffer.from(raw).toString("base64").replace(/=+$/,'')!==data.base64.replace(/=+$/,'')) throw Object.assign(new Error("File must be 1 byte to 5 MB"),{status:400});
 const ext=path.extname(data.name).toLowerCase(); if(ext!==allowedMime.get(data.mime)) throw Object.assign(new Error("Invalid extension"),{status:400});
 await fs.mkdir(storage,{recursive:true}); const name=crypto.randomUUID()+ext; await fs.writeFile(path.join(storage,name),raw,{flag:"wx"}); return {name:data.name,path:name};
};
router.use(verifyToken);
router.get('/overview', (req,res)=>run(res,async db=>{
 const role=req.user.role,uid=req.user.user_id;
 const table=role==='student'?'Student':role==='lecturer'?'Lecturer':'Admin', key=role==='student'?'S_ID':role==='lecturer'?'Lec_ID':'Admin_ID';
 const rows=await query(db,`SELECT * FROM ${table} WHERE ${key}=?`,[uid]);
 if(!rows.length)return res.status(404).json({message:'Account not found'});
 const user=rows[0];delete user.Password;delete user.NIC;delete user.Salary;
 const stats=role==='admin' ? {students:(await query(db,'SELECT COUNT(*) n FROM Student'))[0].n,lecturers:(await query(db,'SELECT COUNT(*) n FROM Lecturer'))[0].n,courses:(await query(db,'SELECT COUNT(*) n FROM Course'))[0].n,modules:(await query(db,'SELECT COUNT(*) n FROM Module'))[0].n} : {};
 res.json({user,stats});
}));
router.get('/catalog',(req,res)=>run(res,async db=>{
 const u=req.user, role=u.role;
 const modules=await query(db,role==='student'?'SELECT m.M_ID id,m.M_Name name FROM Module m JOIN Learn l ON l.M_ID=m.M_ID WHERE l.Student_ID=?':role==='lecturer'?'SELECT m.M_ID id,m.M_Name name FROM Module m JOIN Teach t ON t.M_ID=m.M_ID WHERE t.Lec_ID=?':'SELECT M_ID id,M_Name name FROM Module ORDER BY M_ID',role==='admin'?[]:[u.user_id]);
 const courses=await query(db,role==='student'?'SELECT c.C_ID id,c.C_Name name FROM Course c JOIN Enroll e ON e.C_ID=c.C_ID WHERE e.S_ID=?':'SELECT C_ID id,C_Name name FROM Course ORDER BY C_ID',role==='student'?[u.user_id]:[]);
 const lecturers=role==='admin'?await query(db,'SELECT Lec_ID id,CONCAT(F_Name," ",L_Name) name FROM Lecturer ORDER BY Lec_ID'):[];
 const students=role==='admin'?await query(db,'SELECT S_ID id,CONCAT(F_Name," ",L_Name) name FROM Student ORDER BY S_ID'):[];
 res.json({modules,courses,lecturers,students});
}));
router.get('/records/:type',(req,res)=>run(res,async db=>{
 const u=req.user,role=u.role,t=req.params.type,uid=u.user_id;
 const defs={
 students:['SELECT S_ID id,F_Name firstName,L_Name lastName,Email email,Contact_No contactNo,DATE_FORMAT(BOD,"%Y-%m-%d") bod,Age age,NIC nic,Address address,Account_Status status FROM Student ORDER BY S_ID',[],['admin']],
 lecturers:['SELECT Lec_ID id,F_Name firstName,L_Name lastName,Email email,Contact_No contactNo,DATE_FORMAT(BOD,"%Y-%m-%d") bod,Age age,NIC nic,Address address,Qualification qualification,Salary salary,Account_Status status FROM Lecturer ORDER BY Lec_ID',[],['admin']],
 courses:['SELECT C_ID id,C_Name name FROM Course ORDER BY C_ID',[],['admin']],
 modules:['SELECT M_ID id,M_Name name,Hours hours FROM Module ORDER BY M_ID',[],['admin']],
 enrollments:['SELECT S_ID studentId,C_ID courseId FROM Enroll ORDER BY S_ID',[],['admin']],
 assignments:['SELECT a.Assignment_ID id,a.M_ID moduleId,m.M_Name module,a.Lec_ID lecturerId,a.Title title,a.Description description,a.Due_Date dueDate FROM Assignment a JOIN Module m ON m.M_ID=a.M_ID '+(role==='student'?'JOIN Learn l ON l.M_ID=a.M_ID WHERE l.Student_ID=?':role==='lecturer'?'WHERE a.Lec_ID=?':'')+' ORDER BY a.Due_Date',[...(role==='admin'?[]:[uid])],['student','lecturer','admin']],
 timetable:['SELECT c.Schedule_ID id,c.M_ID moduleId,m.M_Name module,c.Lec_ID lecturerId,c.Class_Day day,c.Start_Time startTime,c.End_Time endTime,c.Room room FROM Class_Schedule c JOIN Module m ON m.M_ID=c.M_ID '+(role==='student'?'JOIN Learn l ON l.M_ID=c.M_ID WHERE l.Student_ID=?':role==='lecturer'?'WHERE c.Lec_ID=?':'')+' ORDER BY FIELD(c.Class_Day,"Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"),c.Start_Time',role==='admin'?[]:[uid],['student','lecturer','admin']],
 notifications:['SELECT Notification_ID id,Title title,Message message,Is_Read isRead,Created_At createdAt FROM Notification WHERE S_ID=? ORDER BY Created_At DESC',[uid],['student']],
 submissions:['SELECT s.Submission_ID id,s.Assignment_ID assignmentId,a.Title assignment,s.Student_ID studentId,s.File_Name fileName,s.Note note,s.Submitted_At submittedAt,s.Grade grade,s.Feedback feedback FROM Assignment_Submission s JOIN Assignment a ON a.Assignment_ID=s.Assignment_ID '+(role==='student'?'WHERE s.Student_ID=?':role==='lecturer'?'WHERE a.Lec_ID=?':'')+' ORDER BY s.Submitted_At DESC',role==='admin'?[]:[uid],['student','lecturer','admin']],
 attendance:['SELECT a.Attendance_ID id,a.Student_ID studentId,a.M_ID moduleId,m.M_Name module,a.Class_Date classDate,a.Status status FROM Attendance a JOIN Module m ON m.M_ID=a.M_ID '+(role==='student'?'WHERE a.Student_ID=?':role==='lecturer'?'WHERE a.Marked_By=?':'')+' ORDER BY a.Class_Date DESC',role==='admin'?[]:[uid],['student','lecturer','admin']],
 grades:['SELECT g.Grade_ID id,g.Student_ID studentId,g.M_ID moduleId,m.M_Name module,g.Title title,g.Score score,g.Max_Score maxScore,g.Feedback feedback FROM Grade g JOIN Module m ON m.M_ID=g.M_ID '+(role==='student'?'WHERE g.Student_ID=?':role==='lecturer'?'WHERE g.Lec_ID=?':'')+' ORDER BY g.Updated_At DESC',role==='admin'?[]:[uid],['student','lecturer','admin']],
 materials:['SELECT s.Material_ID id,s.M_ID moduleId,m.M_Name module,s.Lec_ID lecturerId,s.Title title,s.Description description,s.File_Name fileName,s.Created_At createdAt FROM Study_Material s JOIN Module m ON m.M_ID=s.M_ID '+(role==='student'?'JOIN Learn l ON l.M_ID=s.M_ID WHERE l.Student_ID=?':role==='lecturer'?'WHERE s.Lec_ID=?':'')+' ORDER BY s.Created_At DESC',role==='admin'?[]:[uid],['student','lecturer','admin']],
 teaching:['SELECT Lec_ID lecturerId,M_ID moduleId FROM Teach ORDER BY Lec_ID',[],['admin']],
 learning:['SELECT Student_ID studentId,M_ID moduleId FROM Learn ORDER BY Student_ID',[],['admin']],
 logs:['SELECT Log_ID id,Actor_Role role,Actor_ID actor,Action action,Details details,Created_At createdAt FROM System_Log ORDER BY Log_ID DESC LIMIT 200',[],['admin']]
 };
 if(t==='students'&&role==='lecturer') {const rows=await query(db,'SELECT DISTINCT s.S_ID id,s.F_Name firstName,s.L_Name lastName,s.Email email FROM Student s JOIN Learn l ON l.Student_ID=s.S_ID JOIN Teach t ON t.M_ID=l.M_ID WHERE t.Lec_ID=? ORDER BY s.S_ID',[uid]);return res.json({records:rows});}
 const def=defs[t];if(!def||!def[2].includes(role))return res.status(403).json({message:'Not permitted'});
 res.json({records:await query(db,def[0],def[1])});
}));
router.post('/records/:type',(req,res)=>run(res,async db=>{
 const u=req.user,role=u.role,b=req.body||{},t=req.params.type;
 const num=(v)=>id(v);const bad=(message)=>res.status(400).json({message});
 if(role==='admin'){
  if(t==='courses'&&num(b.id)&&b.name?.trim())await query(db,'INSERT INTO Course(C_ID,C_Name,Admin_ID) VALUES (?,?,?)',[num(b.id),b.name.trim(),u.user_id]);
  else if(t==='modules'&&num(b.id)&&b.name?.trim())await query(db,'INSERT INTO Module(M_ID,M_Name,Hours) VALUES (?,?,?)',[num(b.id),b.name.trim(),Number(b.hours)||0]);
  else if(t==='enrollments'&&num(b.studentId)&&num(b.courseId))await query(db,'INSERT INTO Enroll(S_ID,C_ID) VALUES (?,?)',[num(b.studentId),num(b.courseId)]);
  else if(t==='learning'&&num(b.studentId)&&num(b.moduleId))await query(db,'INSERT INTO Learn(Student_ID,M_ID) VALUES (?,?)',[num(b.studentId),num(b.moduleId)]);
  else if(t==='teaching'&&num(b.lecturerId)&&num(b.moduleId))await query(db,'INSERT INTO Teach(Lec_ID,M_ID) VALUES (?,?)',[num(b.lecturerId),num(b.moduleId)]);
  else if(t==='timetable'&&num(b.moduleId)&&num(b.lecturerId)&&['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].includes(b.day)&&/^\d\d:\d\d$/.test(b.startTime||'')&&/^\d\d:\d\d$/.test(b.endTime||'')&&b.startTime<b.endTime)await query(db,'INSERT INTO Class_Schedule(M_ID,Lec_ID,Class_Day,Start_Time,End_Time,Room) VALUES (?,?,?,?,?,?)',[num(b.moduleId),num(b.lecturerId),b.day,b.startTime,b.endTime,String(b.room||'').slice(0,50)]);
  else if(t==='notifications'&&num(b.studentId)&&b.title?.trim()&&b.message?.trim())await query(db,'INSERT INTO Notification(S_ID,Title,Message) VALUES (?,?,?)',[num(b.studentId),b.title.trim(),b.message.trim()]);
  else return bad('Invalid or unsupported data');
 } else if(role==='lecturer'){
  if(t==='assignments'&&num(b.moduleId)&&await owns(db,u.user_id,num(b.moduleId))&&b.title?.trim()&&b.dueDate&& !Number.isNaN(Date.parse(b.dueDate)))await query(db,'INSERT INTO Assignment(M_ID,Lec_ID,Title,Description,Due_Date) VALUES (?,?,?,?,?)',[num(b.moduleId),u.user_id,b.title.trim(),String(b.description||''),b.dueDate.replace('T',' ').slice(0,19)]);
  else if(t==='attendance'&&num(b.studentId)&&num(b.moduleId)&&validDate(b.classDate)&&['Present','Absent','Late'].includes(b.status)&&await owns(db,u.user_id,num(b.moduleId))&&await learns(db,num(b.studentId),num(b.moduleId)))await query(db,'INSERT INTO Attendance(Student_ID,M_ID,Class_Date,Status,Marked_By) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE Status=VALUES(Status),Marked_By=VALUES(Marked_By)',[num(b.studentId),num(b.moduleId),b.classDate,b.status,u.user_id]);
  else if(t==='grades'&&num(b.studentId)&&num(b.moduleId)&&await owns(db,u.user_id,num(b.moduleId))&&await learns(db,num(b.studentId),num(b.moduleId))&&b.title?.trim()&&Number.isFinite(Number(b.score))&&Number.isFinite(Number(b.maxScore))&&Number(b.maxScore)>0&&Number(b.score)>=0&&Number(b.score)<=Number(b.maxScore))await query(db,'INSERT INTO Grade(Student_ID,M_ID,Title,Score,Max_Score,Feedback,Lec_ID) VALUES (?,?,?,?,?,?,?)',[num(b.studentId),num(b.moduleId),b.title.trim(),Number(b.score),Number(b.maxScore),String(b.feedback||''),u.user_id]);
  else if(t==='materials'&&num(b.moduleId)&&await owns(db,u.user_id,num(b.moduleId))&&b.title?.trim()&&b.file){let file;try{file=await saveFile(b.file);}catch(e){return bad(e.message)}await query(db,'INSERT INTO Study_Material(M_ID,Lec_ID,Title,Description,File_Name,File_Path) VALUES (?,?,?,?,?,?)',[num(b.moduleId),u.user_id,b.title.trim(),String(b.description||''),file.name,file.path]);}
  else return bad('Invalid data or module not assigned to you');
 } else if(role==='student'){
  if(t==='submissions'&&num(b.assignmentId)&&b.file){const rows=await query(db,'SELECT a.M_ID FROM Assignment a JOIN Learn l ON l.M_ID=a.M_ID WHERE a.Assignment_ID=? AND l.Student_ID=? AND a.Due_Date>=NOW()',[num(b.assignmentId),u.user_id]);if(!rows.length)return bad('Assignment not available or deadline passed');let file;try{file=await saveFile(b.file);}catch(e){return bad(e.message)}await query(db,'INSERT INTO Assignment_Submission(Assignment_ID,Student_ID,File_Name,File_Path,Note) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE File_Name=VALUES(File_Name),File_Path=VALUES(File_Path),Note=VALUES(Note),Submitted_At=CURRENT_TIMESTAMP',[num(b.assignmentId),u.user_id,file.name,file.path,String(b.note||'')]);}
  else return bad('Invalid submission');
 } else return res.status(403).json({message:'Not permitted'});
 await audit(db,u,'CREATE '+t,JSON.stringify({...b,file:b.file?'[uploaded]':undefined}).slice(0,400));res.status(201).json({message:'Saved successfully'});
}));
router.put('/records/:type/:recordId',(req,res)=>run(res,async db=>{
 const u=req.user,b=req.body||{},rid=id(req.params.recordId),t=req.params.type;
 if(!rid)return res.status(400).json({message:'Invalid ID'});
 let result;
 if(u.role==='admin'){
  if(t==='students'&&b.firstName?.trim()&&b.lastName?.trim()&&b.email?.trim())result=await query(db,'UPDATE Student SET F_Name=?,L_Name=?,Email=?,Contact_No=?,BOD=?,Age=?,NIC=?,Address=? WHERE S_ID=?',[b.firstName.trim(),b.lastName.trim(),b.email.trim(),b.contactNo||null,b.bod||null,b.age===''||b.age==null?null:Number(b.age),b.nic||null,b.address||null,rid]);
  else if(t==='lecturers'&&b.firstName?.trim()&&b.lastName?.trim()&&b.email?.trim())result=await query(db,'UPDATE Lecturer SET F_Name=?,L_Name=?,Email=?,Contact_No=?,BOD=?,Age=?,NIC=?,Address=?,Qualification=?,Salary=? WHERE Lec_ID=?',[b.firstName.trim(),b.lastName.trim(),b.email.trim(),b.contactNo||null,b.bod||null,b.age===''||b.age==null?null:Number(b.age),b.nic||null,b.address||null,b.qualification||null,b.salary===''||b.salary==null?null:Number(b.salary),rid]);
  else if(t==='courses'&&b.name?.trim())result=await query(db,'UPDATE Course SET C_Name=? WHERE C_ID=?',[b.name.trim(),rid]);
  else if(t==='modules'&&b.name?.trim())result=await query(db,'UPDATE Module SET M_Name=?,Hours=? WHERE M_ID=?',[b.name.trim(),Number(b.hours)||0,rid]);
  else if(['students','lecturers'].includes(t)&&['Active','Inactive'].includes(b.status))result=await query(db,`UPDATE ${t==='students'?'Student':'Lecturer'} SET Account_Status=? WHERE ${t==='students'?'S_ID':'Lec_ID'}=?`,[b.status,rid]);
 } else if(u.role==='lecturer'){
  if(t==='submissions'&&Number.isFinite(Number(b.grade))&&Number(b.grade)>=0&&Number(b.grade)<=100){result=await query(db,'UPDATE Assignment_Submission s JOIN Assignment a ON a.Assignment_ID=s.Assignment_ID SET s.Grade=?,s.Feedback=?,s.Graded_At=NOW() WHERE s.Submission_ID=? AND a.Lec_ID=?',[Number(b.grade),String(b.feedback||''),rid,u.user_id]);}
  else if(t==='assignments'&&b.title?.trim()&&b.dueDate&&!Number.isNaN(Date.parse(b.dueDate)))result=await query(db,'UPDATE Assignment SET Title=?,Description=?,Due_Date=? WHERE Assignment_ID=? AND Lec_ID=?',[b.title.trim(),String(b.description||''),b.dueDate.replace('T',' ').slice(0,19),rid,u.user_id]);
 } else if(u.role==='student'&&t==='notifications')result=await query(db,'UPDATE Notification SET Is_Read=1 WHERE Notification_ID=? AND S_ID=?',[rid,u.user_id]);
 if(!result)return res.status(400).json({message:'Invalid or unauthorized update'});
 if(!result.affectedRows)return res.status(404).json({message:'Record not found'});
 await audit(db,u,'UPDATE '+t,rid);res.json({message:'Updated successfully'});
}));
router.delete('/records/:type/:recordId',(req,res)=>run(res,async db=>{
 const u=req.user,rid=id(req.params.recordId),t=req.params.type;
 if(!rid)return res.status(400).json({message:'Invalid ID'});
 const admin={students:['Student','S_ID'],lecturers:['Lecturer','Lec_ID'],courses:['Course','C_ID'],modules:['Module','M_ID'],timetable:['Class_Schedule','Schedule_ID'],enrollments:['Enroll','S_ID'],teaching:['Teach','Lec_ID'],learning:['Learn','Student_ID']};
 let result;
 if(u.role==='admin'&&admin[t]&&!['enrollments','teaching','learning'].includes(t))result=await query(db,`DELETE FROM ${admin[t][0]} WHERE ${admin[t][1]}=?`,[rid]);
 else if(u.role==='lecturer'&&t==='assignments')result=await query(db,'DELETE FROM Assignment WHERE Assignment_ID=? AND Lec_ID=?',[rid,u.user_id]);
 else if(u.role==='lecturer'&&t==='materials')result=await query(db,'DELETE FROM Study_Material WHERE Material_ID=? AND Lec_ID=?',[rid,u.user_id]);
 else return res.status(403).json({message:'Not permitted'});
 if(!result.affectedRows)return res.status(404).json({message:'Record not found'});
 await audit(db,u,'DELETE '+t,rid);res.json({message:'Deleted successfully'});
}));
router.post('/unlink/:type',(req,res)=>run(res,async db=>{
 if(req.user.role!=='admin')return res.status(403).json({message:'Not permitted'});
 const {type}=req.params,b=req.body||{};
 const defs={enrollments:['Enroll','S_ID','C_ID','studentId','courseId'],teaching:['Teach','Lec_ID','M_ID','lecturerId','moduleId'],learning:['Learn','Student_ID','M_ID','studentId','moduleId']};const d=defs[type];
 if(!d||!id(b[d[3]])||!id(b[d[4]]))return res.status(400).json({message:'Invalid relationship'});
 const r=await query(db,`DELETE FROM ${d[0]} WHERE ${d[1]}=? AND ${d[2]}=?`,[id(b[d[3]]),id(b[d[4]])]);await audit(db,req.user,'UNLINK '+type,JSON.stringify(b));res.json({deleted:r.affectedRows});
}));
router.get('/download/:type/:recordId',(req,res)=>run(res,async db=>{
 const u=req.user,t=req.params.type,rid=id(req.params.recordId);if(!rid||!['materials','submissions'].includes(t))return res.status(400).json({message:'Invalid file'});
 let rows;
 if(t==='materials')rows=await query(db,'SELECT s.File_Name name,s.File_Path file,s.M_ID moduleId,s.Lec_ID lecturerId FROM Study_Material s WHERE s.Material_ID=?',[rid]);
 else rows=await query(db,'SELECT s.File_Name name,s.File_Path file,s.Student_ID studentId,a.Lec_ID lecturerId FROM Assignment_Submission s JOIN Assignment a ON a.Assignment_ID=s.Assignment_ID WHERE s.Submission_ID=?',[rid]);
 if(!rows.length)return res.status(404).json({message:'File not found'});const r=rows[0];
 const ok=u.role==='admin'||(t==='materials'&&(u.role==='lecturer'&&r.lecturerId===u.user_id||u.role==='student'&&await learns(db,u.user_id,r.moduleId)))||(t==='submissions'&&(u.role==='student'&&r.studentId===u.user_id||u.role==='lecturer'&&r.lecturerId===u.user_id));
 if(!ok)return res.status(403).json({message:'Not permitted'});
 if(!/^[a-f0-9-]{36}\.(pdf|png|jpg|txt|docx)$/.test(r.file||''))return res.status(404).json({message:'File missing'});
 try{await fs.access(path.join(storage,r.file));}catch{return res.status(404).json({message:'File missing'});}
 res.download(path.join(storage,r.file),r.name);
}));
export default router;
