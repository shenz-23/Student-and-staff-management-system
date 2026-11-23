const API = 'http://localhost:8000/api/v1/portal';
const USERS = 'http://localhost:8000/api/v1/users';
const token = localStorage.getItem('token');
let user;
try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch { user = null; }
if (!token || !user || !['student','lecturer','admin'].includes(user.role)) location.replace('login.html');
const role = user?.role;
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sections = {
 student: ['Dashboard','Profile','Courses','Timetable','Assignments','Submissions','Grades','Attendance','Notifications','Materials'],
 lecturer: ['Dashboard','Profile','Modules','Students','Timetable','Assignments','Submissions','Grades','Attendance','Materials'],
 admin: ['Dashboard','Profile','Students','Lecturers','Courses','Modules','Enrollments','Learning','Teaching','Timetable','Notifications','Reports']
};
const fields = {
 courses:[['id','Course ID','number'],['name','Course name']],
 modules:[['id','Module ID','number'],['name','Module name'],['hours','Hours','number']],
 enrollments:[['studentId','Student ID','number'],['courseId','Course ID','number']],
 learning:[['studentId','Student ID','number'],['moduleId','Module ID','number']],
 teaching:[['lecturerId','Lecturer ID','number'],['moduleId','Module ID','number']],
 timetable:[['moduleId','Module ID','number'],['lecturerId','Lecturer ID','number'],['day','Day','day'],['startTime','Start time','time'],['endTime','End time','time'],['room','Room']],
 notifications:[['studentId','Student ID','number'],['title','Title'],['message','Message','textarea']],
 assignments:[['moduleId','Module ID','number'],['title','Title'],['description','Description','textarea'],['dueDate','Deadline','datetime-local']],
 attendance:[['studentId','Student ID','number'],['moduleId','Module ID','number'],['classDate','Class date','date'],['status','Status','status']],
 grades:[['studentId','Student ID','number'],['moduleId','Module ID','number'],['title','Assessment title'],['score','Score','number'],['maxScore','Maximum score','number'],['feedback','Feedback','textarea']],
 materials:[['moduleId','Module ID','number'],['title','Title'],['description','Description','textarea'],['file','File','file']],
 submissions:[['assignmentId','Assignment ID','number'],['note','Note','textarea'],['file','File','file']]
};
const createFor = {admin:new Set(['courses','modules','enrollments','learning','teaching','timetable','notifications']),lecturer:new Set(['assignments','attendance','grades','materials']),student:new Set(['submissions'])};
const endpoint = async (url,options={}) => {
 const res=await fetch(url,{...options,headers:{Authorization:`Bearer ${token}`,...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});
 let data;try{data=await res.json();}catch{data={message:'Unexpected server response'};}
 if(res.status===401){localStorage.removeItem('token');location.replace('login.html');throw Error('Session expired');}
 if(!res.ok)throw Error(data.message||`Request failed (${res.status})`);return data;
};
const notify=(message,error=false)=>{const n=$('#notice');n.textContent=message;n.className=error?'error':'';window.scrollTo({top:0,behavior:'smooth'});};
const fileData = file => new Promise((resolve,reject)=>{if(!file)return resolve(null);if(file.size>5*1024*1024)return reject(Error('Maximum file size is 5 MB'));const reader=new FileReader();reader.onload=()=>resolve({name:file.name,mime:file.type,base64:String(reader.result).split(',')[1]});reader.onerror=()=>reject(Error('Could not read file'));reader.readAsDataURL(file);});
const field = ([key,label,type='text'],value='') => {
 const attrs=`name="${esc(key)}" ${type==='file'?'':`value="${esc(value)}"`} ${type==='number'?'min="0" step="any"':''}`;
 if(type==='textarea')return `<label>${esc(label)}<textarea name="${esc(key)}">${esc(value)}</textarea></label>`;
 if(type==='day'||type==='status')return `<label>${esc(label)}<select name="${esc(key)}">${(type==='day'?['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']:['Present','Absent','Late']).map(v=>`<option ${v===value?'selected':''}>${v}</option>`).join('')}</select></label>`;
 return `<label>${esc(label)}<input type="${type}" ${attrs} ${type==='file'?'accept=".pdf,.docx,.txt,.png,.jpg"':''}></label>`;
};
const form = (type,action='Create') => `<section class="panel"><h2>${action} ${esc(type)}</h2><form id="createForm">${fields[type].map(f=>field(f)).join('')}<button type="submit">Save ${esc(type)}</button></form></section>`;
const viewRow = (item,type) => {
 const cells=Object.entries(item).map(([k,v])=>`<td>${esc(typeof v==='string'&&/date|At$/i.test(k)&&!Number.isNaN(Date.parse(v))?new Date(v).toLocaleString():v)}</td>`).join('');
 let buttons='';
 if(type==='notifications'&&role==='student'&&!item.isRead)buttons+=`<button data-action="read" data-id="${item.id}">Mark read</button>`;
 if(type==='submissions'&&role==='lecturer')buttons+=`<button data-action="grade" data-id="${item.id}">Grade</button>`;
 if(['materials','submissions'].includes(type)&&item.fileName)buttons+=`<button data-action="download" data-id="${item.id}">Download</button>`;
 if(role==='admin'&&['students','lecturers','courses','modules'].includes(type))buttons+=`<button data-action="edit" data-id="${item.id}">Edit</button>${["students","lecturers"].includes(type)?`<button data-action="status" data-id="${item.id}">${item.status==="Active"?"Deactivate":"Activate"}</button>`:""}<button class="danger" data-action="delete" data-id="${item.id}">Delete</button>`;
 if(role==='lecturer'&&type==='assignments')buttons+=`<button data-action="edit" data-id="${item.id}">Edit</button>${["students","lecturers"].includes(type)?`<button data-action="status" data-id="${item.id}">${item.status==="Active"?"Deactivate":"Activate"}</button>`:""}<button class="danger" data-action="delete" data-id="${item.id}">Delete</button>`;
 if(role==='lecturer'&&type==='materials')buttons+=`<button class="danger" data-action="delete" data-id="${item.id}">Delete</button>`;
 if(role==='admin'&&type==='timetable')buttons+=`<button class="danger" data-action="delete" data-id="${item.id}">Delete</button>`;
 if(role==='admin'&&['enrollments','learning','teaching'].includes(type))buttons+=`<button class="danger" data-action="unlink" data-first="${item.studentId??item.lecturerId}" data-second="${item.courseId??item.moduleId}">Unlink</button>`;
 return `<tr>${cells}<td><div class="actions">${buttons||'<span class="muted">—</span>'}</div></td></tr>`;
};
let active='Dashboard',current=[];
const records = async type => {
 const data=await endpoint(`${API}/records/${type}`);current=data.records;
 let html=(createFor[role].has(type)?form(type):'');
 if(type==='students'&&role==='admin')html+=`<section class="panel"><h2>Create student account</h2><p class="muted">Admin account creation uses the existing secure API.</p>${accountForm('student')}</section>`;
 if(type==='lecturers'&&role==='admin')html+=`<section class="panel"><h2>Create lecturer account</h2>${accountForm('lecturer')}</section>`;
 html+=`<section class="panel"><h2>${esc(type)} <span class="pill">${current.length}</span></h2>${current.length?`<div class="table-wrap"><table><thead><tr>${Object.keys(current[0]).map(k=>`<th>${esc(k)}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${current.map(i=>viewRow(i,type)).join('')}</tbody></table></div>`:'<p class="muted">No records yet.</p>'}</section>`;
 $('#content').innerHTML=html;
 $('#createForm')?.addEventListener('submit',async e=>{e.preventDefault();const btn=e.target.querySelector('button[type="submit"]');btn.disabled=true;try{const body=Object.fromEntries(new FormData(e.target));if(body.file instanceof File){body.file=await fileData(body.file.size?body.file:null);}await endpoint(`${API}/records/${type}`,{method:'POST',body:JSON.stringify(body)});notify('Saved successfully');await records(type);}catch(err){notify(err.message,true);}finally{btn.disabled=false;}});
 $('#accountForm')?.addEventListener('submit',async e=>{e.preventDefault();try{const b=Object.fromEntries(new FormData(e.target));await endpoint(`${USERS}/accounts`,{method:'POST',body:JSON.stringify(b)});notify('Account created');await records(type);}catch(err){notify(err.message,true);}});
 $('#content').querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>handle(type,b)));
};
const accountForm = role => `<form id="accountForm"><input type="hidden" name="role" value="${role}">${[['id','ID','number'],['firstName','First name'],['lastName','Last name'],['email','Email','email'],['password','Initial password','password'],['bod','Date of birth','date'],['age','Age','number'],['contactNo','Contact number'],['nic','NIC'],['address','Address','textarea'],...(role==='lecturer'?[['qualification','Qualification'],['salary','Salary','number']]:[])].map(f=>field(f)).join('')}<button>Create ${role}</button></form>`;
const handle = async (type,button) => {
 const action=button.dataset.action,recordId=Number(button.dataset.id),item=current.find(x=>x.id===recordId);
 try {
  if(action==='download'){
   const r=await fetch(`${API}/download/${type}/${recordId}`,{headers:{Authorization:`Bearer ${token}`}});if(!r.ok)throw Error((await r.json()).message||'Download failed');const blob=await r.blob(),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=item.fileName||'download';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
  }
  if(action==='delete'){if(!confirm('Delete this record? Linked records may prevent deletion.'))return;await endpoint(`${API}/records/${type}/${recordId}`,{method:'DELETE'});}
  if(action==='read')await endpoint(`${API}/records/notifications/${recordId}`,{method:'PUT',body:JSON.stringify({})});
  if(action==='unlink'){if(!confirm('Remove this relationship?'))return;const b=type==='enrollments'?{studentId:Number(button.dataset.first),courseId:Number(button.dataset.second)}:type==='teaching'?{lecturerId:Number(button.dataset.first),moduleId:Number(button.dataset.second)}:{studentId:Number(button.dataset.first),moduleId:Number(button.dataset.second)};await endpoint(`${API}/unlink/${type}`,{method:'POST',body:JSON.stringify(b)});}
  if(action==='status') {const status=item.status==='Active'?'Inactive':'Active';if(!confirm(`Set account to ${status}?`))return;await endpoint(`${API}/records/${type}/${recordId}`,{method:'PUT',body:JSON.stringify({status})});notify('Account status updated');await records(type);return;}
  if(action==='grade'){const value=prompt('Grade (0 to 100)',item.grade??'');if(value===null)return;const feedback=prompt('Feedback',item.feedback||'');if(feedback===null)return;await endpoint(`${API}/records/submissions/${recordId}`,{method:'PUT',body:JSON.stringify({grade:value,feedback})});}
  if(action==='edit'){
   const editable=type==='students'?[['firstName','First name'],['lastName','Last name'],['email','Email','email'],['contactNo','Contact'],['bod','Date of birth','date'],['age','Age','number'],['nic','NIC'],['address','Address','textarea']]:type==='lecturers'?[['firstName','First name'],['lastName','Last name'],['email','Email','email'],['contactNo','Contact'],['bod','Date of birth','date'],['age','Age','number'],['nic','NIC'],['address','Address','textarea'],['qualification','Qualification'],['salary','Salary','number']]:type==='courses'?[['name','Name']]:type==='modules'?[['name','Name'],['hours','Hours','number']]:[['title','Title'],['description','Description'],['dueDate','Deadline','datetime-local']];
   const area=document.createElement('section');area.className='panel';area.innerHTML=`<h2>Edit ${esc(type)} #${recordId}</h2><form id="editForm">${editable.map(f=>field(f,typeof item[f[0]]==='string'&&f[2]==='datetime-local'?item[f[0]].slice(0,16):item[f[0]]??'')).join('')}<button>Save changes</button></form>`;$('#content').prepend(area);area.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();try{await endpoint(`${API}/records/${type}/${recordId}`,{method:'PUT',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});notify('Updated');await records(type);}catch(err){notify(err.message,true);}});return;
  }
  notify('Saved successfully');await records(type);
 }catch(err){notify(err.message,true);}
};
const profile = async () => {const data=await endpoint(`${API}/overview`);$('#content').innerHTML=`<section class="panel"><h2>My profile</h2><div class="table-wrap"><table><tbody>${Object.entries(data.user).map(([k,v])=>`<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table></div></section>`;};
const dashboard=async()=>{const data=await endpoint(`${API}/overview`);const name=data.user.F_Name||data.user.Name||'User';$('#identity').textContent=`${name} · ${role}`;const stats=Object.entries(data.stats);$('#content').innerHTML=`<section class="panel"><h2>Welcome, ${esc(name)}</h2><p class="muted">Your information is loaded from MySQL. Choose a section from the sidebar to view or manage records.</p>${stats.length?`<div class="grid">${stats.map(([k,v])=>`<div class="stat">${esc(k)}<strong>${esc(v)}</strong></div>`).join('')}</div>`:''}</section>`;};
const show = async label => {active=label;$('#pageTitle').textContent=label;$('#notice').textContent='';document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.textContent===label));$('#content').innerHTML='<section class="panel">Loading…</section>';try{if(label==='Dashboard')await dashboard();else if(label==='Profile')await profile();else if(label==='Reports'){const types=['students','lecturers','courses','modules','logs'];const values=await Promise.all(types.map(t=>endpoint(`${API}/records/${t}`)));$('#content').innerHTML=`<section class="panel"><h2>System report</h2><div class="grid">${types.map((t,i)=>`<div class="stat">${esc(t)}<strong>${values[i].records.length}</strong></div>`).join('')}</div></section>`;const logs=values.at(-1).records;$('#content').innerHTML+=`<section class="panel"><h2>Recent system activity</h2><div class="table-wrap"><table>${logs.map(l=>`<tr><td>${esc(l.createdAt)}</td><td>${esc(l.role)}</td><td>${esc(l.action)}</td><td>${esc(l.details)}</td></tr>`).join('')}</table></div></section>`;}else if(label==='Modules'&&role==='lecturer'){const d=await endpoint(`${API}/catalog`);$('#content').innerHTML=`<section class="panel"><h2>My assigned modules</h2>${d.modules.map(m=>`<p>${esc(m.id)} — ${esc(m.name)}</p>`).join('')||'<p>No modules assigned. Ask an admin to assign you a module.</p>'}</section>`;}else if(label==='Courses'&&role==='student'){const d=await endpoint(`${API}/catalog`);$('#content').innerHTML=`<section class="panel"><h2>Enrolled courses</h2>${d.courses.map(c=>`<p>${esc(c.id)} — ${esc(c.name)}</p>`).join('')||'<p>No courses enrolled.</p>'}</section>`;}else await records(label.toLowerCase());}catch(err){$('#content').innerHTML='<section class="panel">Unable to load this section.</section>';notify(err.message,true);}};
$('#role').textContent=role+' portal';$('#nav').innerHTML=sections[role].map(s=>`<button type="button">${esc(s)}</button>`).join('');$('#nav').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>show(b.textContent)));$('#logout').onclick=()=>{localStorage.removeItem('token');localStorage.removeItem('user');location.replace('login.html');};show('Dashboard');
