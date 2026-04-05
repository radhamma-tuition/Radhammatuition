/* ============================================================
   FIREBASE CONFIGURATION & INITIALIZATION
   ============================================================
   Your project credentials from the Firebase Console.
   These are safe to include in frontend code — security is
   enforced by Firestore Security Rules in the Firebase Console.
   ============================================================ */
const firebaseConfig = {
  apiKey:            "AIzaSyAnQtAwk6nON-lm72yxUnoICgII6crmTrk",
  authDomain:        "radhamma-tuition-3bed3.firebaseapp.com",
  projectId:         "radhamma-tuition-3bed3",
  storageBucket:     "radhamma-tuition-3bed3.firebasestorage.app",
  messagingSenderId: "901453876627",
  appId:             "1:901453876627:web:9aedb4e055599013f32c66",
  measurementId:     "G-J45ZMBY9DX"
};

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);

// Firebase services we'll use throughout the app
const auth      = firebase.auth();       // For login / register / logout
const db        = firebase.firestore();  // Firestore database (replaces localStorage)
const analytics = firebase.analytics();  // Google Analytics (auto-tracks page views)

/* ============================================================
   FIRESTORE COLLECTION HELPERS
   ============================================================
   Collections in Firestore are like tables in a database.
   We use these shorthand references to keep code readable.

   Structure:
     tuition/                        ← root document (config)
     tuition/meta/teachers           ← teachers sub-collection
     tuition/meta/students           ← students sub-collection
     tuition/meta/attendance         ← attendance records
     tuition/meta/marks              ← test marks
     tuition/meta/fees               ← fee payments
     tuition/meta/notifications      ← notices
     tuition/meta/feedback           ← feedback
   ============================================================ */
const col = name => db.collection(name); // Shortcut: col('students')

/* ============================================================
   IN-MEMORY CACHE
   ============================================================
   Firestore reads cost money at scale. We cache each collection
   locally after the first fetch so pages render instantly on
   subsequent visits within the same session.
   ============================================================ */
const cache = {};

/**
 * Load a collection from Firestore (or from cache if available).
 * Returns an array of objects, each with its Firestore doc ID as `id`.
 */
async function load(colName, forceRefresh = false) {
  if (cache[colName] && !forceRefresh) return cache[colName];
  try {
    const snap = await col(colName).get();
    cache[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return cache[colName];
  } catch (e) {
    console.warn(`Firestore read failed for ${colName}:`, e.message);
    return [];
  }
}

/**
 * Add a new document to a Firestore collection.
 * If `id` is provided, it becomes the document ID; otherwise Firestore auto-generates one.
 */
async function fsAdd(colName, data, id = null) {
  delete cache[colName]; // Invalidate cache so next load() fetches fresh data
  if (id) {
    await col(colName).doc(id).set(data);
    return id;
  } else {
    const ref = await col(colName).add(data);
    return ref.id;
  }
}

/**
 * Update specific fields in an existing Firestore document.
 */
async function fsUpdate(colName, id, data) {
  delete cache[colName];
  await col(colName).doc(id).update(data);
}

/**
 * Delete a document from Firestore.
 */
async function fsDel(colName, id) {
  delete cache[colName];
  await col(colName).doc(id).delete();
}

/* ============================================================
   UTILITIES
   ============================================================ */
const genId  = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const today  = () => new Date().toISOString().slice(0,10);
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '-';
const getGrade = p => {
  if(p>=90) return{g:'A+',cls:'badge-success'}; if(p>=75) return{g:'A',cls:'badge-success'};
  if(p>=60) return{g:'B',cls:'badge-info'};      if(p>=50) return{g:'C',cls:'badge-warning'};
  return{g:'F',cls:'badge-danger'};
};


/* ============================================================
   LOADER OVERLAY HELPERS
   ============================================================ */
function showLoader(msg='Loading...'){
  let el=document.getElementById('fbLoader');
  if(!el){el=document.createElement('div');el.id='fbLoader';el.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(255,251,245,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;backdrop-filter:blur(4px)';el.innerHTML=`<div style="width:44px;height:44px;border:3px solid var(--saffron-light);border-top-color:var(--saffron);border-radius:50%;animation:spin .8s linear infinite"></div><p style="font-family:\'Playfair Display\',serif;color:var(--ink-soft)" id="fbLoaderMsg">${msg}</p><style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;document.body.appendChild(el);}
  document.getElementById('fbLoaderMsg').textContent=msg;
}
function hideLoader(){const el=document.getElementById('fbLoader');if(el)el.remove();}

/* ============================================================
   SEED DEFAULT DATA INTO FIRESTORE
   ============================================================
   Only runs once — when Firestore collections are empty.
   Uses Firestore batch writes for efficiency.
   ============================================================ */
async function seedData(){
  showLoader('Connecting to Firebase…');

  const teachers=await load('teachers');
  if(!teachers.length){
    await fsAdd('teachers',{name:'Radhamma Devi',username:'admin',password:'admin123',role:'teacher',secQ:"What is your favourite teacher's name?",secA:'radha',email:'admin@radhamma.edu'},'T1');
  }

  const students=await load('students');
  if(!students.length){
    const seed=[
      {name:'Arjun Kumar',  studentClass:'Class 9', phone:'9876543210',parent:'Ravi Kumar',   fee:1500,username:'student1',password:'pass123',secQ:"What city were you born in?",secA:'hyderabad',active:true,address:'Hyderabad'},
      {name:'Priya Sharma', studentClass:'Class 10',phone:'9876543211',parent:'Ramesh Sharma',fee:2000,username:'student2',password:'pass123',secQ:"What city were you born in?",secA:'hyderabad',active:true,address:'Secunderabad'},
      {name:'Rahul Verma',  studentClass:'Class 8', phone:'9876543212',parent:'Suresh Verma', fee:1200,username:'student3',password:'pass123',secQ:"What city were you born in?",secA:'hyderabad',active:true,address:'Kukatpally'},
      {name:'Sneha Reddy',  studentClass:'Class 9', phone:'9876543213',parent:'Kishore Reddy',fee:1500,username:'student4',password:'pass123',secQ:"What city were you born in?",secA:'hyderabad',active:true,address:'Banjara Hills'},
      {name:'Kiran Babu',   studentClass:'Class 7', phone:'9876543214',parent:'Naresh Babu',  fee:1000,username:'student5',password:'pass123',secQ:"What city were you born in?",secA:'hyderabad',active:true,address:'LB Nagar'},
    ];
    const ids=['S1','S2','S3','S4','S5'];
    for(let i=0;i<seed.length;i++) await fsAdd('students',seed[i],ids[i]);
  }

  const att=await load('attendance');
  if(!att.length){
    showLoader('Seeding attendance data…');
    const dates=['2024-12-02','2024-12-03','2024-12-04','2024-12-05','2024-12-06','2024-12-09','2024-12-10','2024-12-11','2024-12-12','2024-12-13'];
    const studs=await load('students');
    // Firestore batch: max 500 ops per batch
    const batch=db.batch();
    for(const s of studs) for(const d of dates) batch.set(col('attendance').doc(),{studentId:s.id,date:d,status:Math.random()>.2?'present':'absent'});
    await batch.commit(); delete cache['attendance'];
  }

  const marks=await load('marks');
  if(!marks.length){
    const sm=[
      {studentId:'S1',subject:'Mathematics',test:'Unit Test 1',obtained:85,total:100,date:'2024-12-05'},
      {studentId:'S1',subject:'Science',    test:'Unit Test 1',obtained:78,total:100,date:'2024-12-06'},
      {studentId:'S1',subject:'English',    test:'Unit Test 1',obtained:82,total:100,date:'2024-12-07'},
      {studentId:'S2',subject:'Mathematics',test:'Unit Test 1',obtained:92,total:100,date:'2024-12-05'},
      {studentId:'S2',subject:'English',    test:'Unit Test 1',obtained:88,total:100,date:'2024-12-06'},
      {studentId:'S3',subject:'Mathematics',test:'Unit Test 1',obtained:65,total:100,date:'2024-12-05'},
      {studentId:'S4',subject:'Science',    test:'Unit Test 1',obtained:74,total:100,date:'2024-12-06'},
      {studentId:'S5',subject:'Mathematics',test:'Unit Test 1',obtained:45,total:100,date:'2024-12-05'},
    ];
    for(const m of sm) await fsAdd('marks',m);
  }

  const fees=await load('fees');
  if(!fees.length){
    const sf=[
      {studentId:'S1',month:'2024-11',amount:1500,paidOn:'2024-11-05',status:'Paid'},
      {studentId:'S2',month:'2024-11',amount:2000,paidOn:'2024-11-03',status:'Paid'},
      {studentId:'S3',month:'2024-11',amount:1200,paidOn:null,        status:'Pending'},
      {studentId:'S4',month:'2024-11',amount:1500,paidOn:'2024-11-10',status:'Paid'},
      {studentId:'S5',month:'2024-11',amount:1000,paidOn:null,        status:'Pending'},
    ];
    for(const f of sf) await fsAdd('fees',f);
  }

  const notifs=await load('notifications');
  if(!notifs.length){
    await fsAdd('notifications',{to:'all',subject:'📅 Year-end Exams',message:'Year-end exams scheduled Jan 15–25. Prepare well!',priority:'important',date:today(),read:[]});
    await fsAdd('notifications',{to:'all',subject:'🎉 Annual Day',   message:'Annual Day on Jan 10. All students must attend.',priority:'normal',date:today(),read:[]});
    await fsAdd('notifications',{to:'S3', subject:'💰 Fee Reminder',  message:'November fee is pending. Please pay at the earliest.',priority:'urgent',date:today(),read:[]});
  }

  const fb=await load('feedback');
  if(!fb.length){
    await fsAdd('feedback',{studentId:'S1',rating:'⭐⭐⭐⭐⭐ Excellent',subject:'Teaching Quality',message:'Teaching is very clear and helpful. I improved a lot in Maths!',date:today()});
    await fsAdd('feedback',{studentId:'S2',rating:'⭐⭐⭐⭐ Good',      subject:'Environment',      message:'Nice and calm study environment.',date:today()});
  }

  hideLoader();
}

/* ============================================================
   AUTH — LOGIN / REGISTER / FORGOT PASSWORD
   All reads/writes now go to Firestore instead of localStorage
   ============================================================ */
let currentUser=null, currentRole='teacher';

function showAuth(v){
  ['loginView','registerView','forgotView'].forEach(id=>document.getElementById(id).classList.add('hidden'));
  document.getElementById(v+'View').classList.remove('hidden');
  if(v==='forgot'){
    document.getElementById('fpStep1').classList.remove('hidden');
    document.getElementById('fpStep2').classList.add('hidden');
    document.getElementById('fpStep3').classList.add('hidden');
  }
}
function switchRole(r){
  currentRole=r;
  document.querySelectorAll('.auth-tab').forEach((t,i)=>t.classList.toggle('active',(r==='teacher'&&i===0)||(r==='student'&&i===1)));
}

// LOGIN — query Firestore for matching username + password
async function doLogin(){
  const u=document.getElementById('loginUser').value.trim();
  const p=document.getElementById('loginPass').value.trim();
  if(!u||!p){showToast('Enter username and password','error');return;}
  showLoader('Signing in…');
  try{
    if(currentRole==='teacher'){
      const teachers=await load('teachers');
      const t=teachers.find(t=>t.username===u&&t.password===p);
      if(t){currentUser={...t,role:'teacher'};hideLoader();startApp();}
      else{hideLoader();showToast('Invalid teacher credentials','error');}
    }else{
      const students=await load('students');
      const s=students.find(s=>s.username===u&&(s.password||'pass123')===p);
      if(s){currentUser={...s,role:'student'};hideLoader();startApp();}
      else{hideLoader();showToast('Invalid student credentials','error');}
    }
  }catch(e){hideLoader();showToast('Login failed: '+e.message,'error');}
}

// LOGOUT — clear session, go back to auth screen
function doLogout(){
  currentUser=null; Object.keys(cache).forEach(k=>delete cache[k]); // Clear cache on logout
  sessionStorage.removeItem('currentUser');
  document.getElementById('app').style.display='none';
  document.getElementById('authScreen').style.display='flex';
  document.getElementById('loginUser').value='';
  document.getElementById('loginPass').value='';
  showAuth('login');
}

/* ---- REGISTRATION ---- */
async function doRegister(){
  const name   = document.getElementById('rName').value.trim();
  const cls    = document.getElementById('rClass').value;
  const phone  = document.getElementById('rPhone').value.trim();
  const parent = document.getElementById('rParent').value.trim();
  const addr   = document.getElementById('rAddr').value.trim();
  const user   = document.getElementById('rUser').value.trim();
  const pass   = document.getElementById('rPass').value;
  const secQ   = document.getElementById('rSecQ').value;
  const secA   = document.getElementById('rSecA').value.trim();

  // Validate all required fields
  if(!name||!phone||!parent||!user||!secA){
    showToast('Please fill all required fields','error'); return;
  }
  if(!/^\d{10}$/.test(phone)){
    showToast('Enter a valid 10-digit phone number','error'); return;
  }
  if(pass.length<6){
    showToast('Password must be at least 6 characters','error'); return;
  }

  showLoader('Checking username…');
  // Check username is unique across students + teachers
  const [allStudents,allTeachers]=await Promise.all([load('students'),load('teachers')]);
  if([...allStudents,...allTeachers].find(u=>u.username===user)){
    hideLoader(); showToast('Username already taken — try another','error'); return;
  }

  showLoader('Creating your account…');
  try{
    await fsAdd('students',{
      name, studentClass:cls, phone, parent, address:addr,
      username:user, password:pass,
      secQ, secA:secA.toLowerCase(),
      fee:1500, active:true
    });
    hideLoader();
    showToast(`Welcome ${name}! Registration successful 🎉`,'success');
    // Pre-fill login and switch to student tab
    document.getElementById('loginUser').value=user;
    currentRole='student'; switchRole('student');
    showAuth('login');
  }catch(e){hideLoader(); showToast('Registration failed: '+e.message,'error');}
}

function checkStrength(v){
  const f=document.getElementById('strengthFill'),l=document.getElementById('strengthLabel');
  let s=0;if(v.length>=6)s++;if(v.length>=10)s++;if(/[A-Z]/.test(v))s++;if(/[0-9]/.test(v))s++;if(/[^A-Za-z0-9]/.test(v))s++;
  const colors=['#EF4444','#F97316','#EAB308','#22C55E','#15803D'],labels=['Too Weak','Weak','Fair','Strong','Very Strong'];
  f.style.width=(s/5*100)+'%';f.style.background=colors[Math.max(0,s-1)];
  l.textContent=labels[Math.max(0,s-1)];l.style.color=colors[Math.max(0,s-1)];
}

/* ---- FORGOT PASSWORD — verifies via Firestore security Q&A ---- */
let fpUser=null;
async function fpNext(){
  const username=document.getElementById('fpUser').value.trim();
  const role=document.getElementById('fpRole').value;
  showLoader('Looking up account…');
  const pool=await load(role==='teacher'?'teachers':'students');
  fpUser=pool.find(u=>u.username===username);
  hideLoader();
  if(!fpUser||!fpUser.secQ){showToast('Account not found or no security question set','error');return;}
  document.getElementById('fpSecQLabel').textContent=fpUser.secQ;
  document.getElementById('fpStep1').classList.add('hidden');
  document.getElementById('fpStep2').classList.remove('hidden');
}
function fpVerify(){
  if(document.getElementById('fpSecAns').value.trim().toLowerCase()!==fpUser.secA){showToast('Incorrect answer. Try again.','error');return;}
  document.getElementById('fpStep2').classList.add('hidden');
  document.getElementById('fpStep3').classList.remove('hidden');
}
async function fpReset(){
  const np=document.getElementById('fpNewPass').value,cp=document.getElementById('fpConfPass').value;
  if(np.length<6){showToast('Password must be at least 6 characters','error');return;}
  if(np!==cp){showToast('Passwords do not match','error');return;}
  showLoader('Updating password…');
  try{
    const colName=document.getElementById('fpRole').value==='teacher'?'teachers':'students';
    await fsUpdate(colName,fpUser.id,{password:np}); // Update only the password field in Firestore
    hideLoader();
    showToast('Password reset successfully! Please login.','success');
    showAuth('login');
  }catch(e){hideLoader();showToast('Reset failed: '+e.message,'error');}
}

/* ============================================================
   APP START
   ============================================================ */
async function startApp(){
  document.getElementById('authScreen').style.display='none';
  document.getElementById('app').style.display='block';
  document.getElementById('teacherNav').classList.toggle('hidden',currentUser.role==='student');
  document.getElementById('studentNav').classList.toggle('hidden',currentUser.role==='teacher');
  document.getElementById('userName').textContent=currentUser.name;
  document.getElementById('userRole').textContent=currentUser.role==='teacher'?'👩‍🏫 Teacher':'👨‍🎓 Student';
  document.getElementById('userAvatar').textContent=currentUser.name[0].toUpperCase();
  document.getElementById('globalSearch').classList.toggle('hidden',currentUser.role==='student');
  sessionStorage.setItem('currentUser',JSON.stringify(currentUser));
  // Log login event to Firebase Analytics
  analytics.logEvent('login',{role:currentUser.role,name:currentUser.name});
  await showPage('dashboard');
  updateNotifBadge();
}

/* ============================================================
   NAVIGATION
   ============================================================ */
const pageTitles={dashboard:'🏠 Dashboard',students:'👨‍🎓 Students',attendance:'📋 Attendance',
  marks:'📊 Test Marks',fees:'💰 Fee Tracking',notifications:'🔔 Notifications',feedback:'💬 Feedback',
  charts:'📈 Group Charts',aiagent:'🤖 AI Agent',library:'📚 Book Library',
  myAttendance:'📋 My Attendance',myMarks:'📊 My Marks',myFees:'💰 My Fees',
  myNotifications:'🔔 Notices',submitFeedback:'💬 Feedback'};

const pageRenderers={dashboard:renderDashboard,students:renderStudents,attendance:renderAttendance,
  marks:renderMarks,fees:renderFees,notifications:renderNotifications,feedback:renderFeedback,
  charts:renderCharts,library:renderLibrary,
  myAttendance:renderMyAttendance,myMarks:renderMyMarks,myFees:renderMyFees,myNotifications:renderMyNotifications};

async function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
  const pg=document.getElementById('page-'+id);
  if(pg)pg.classList.remove('hidden');
  document.getElementById('pageTitle').textContent=pageTitles[id]||id;
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  // Log page view to Firebase Analytics
  try{ analytics.logEvent('page_view',{page:id,role:currentUser?.role}); }catch(_){}
  if(pageRenderers[id]) await pageRenderers[id]();
  if(window.innerWidth<=768)closeSidebar();
}
function toggleSidebar(){const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');s.classList.toggle('open');o.classList.toggle('hidden',!s.classList.contains('open'));}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebarOverlay').classList.add('hidden');}

/* ============================================================
   DASHBOARD
   ============================================================ */
async function renderDashboard(){
  const [students,fees,attendance,marks,notifs]=await Promise.all([load('students'),load('fees'),load('attendance'),load('marks'),load('notifications')]);
  if(currentUser.role==='teacher'){
    const pendingFees=fees.filter(f=>f.status==='Pending').length;
    const todayAtt=attendance.filter(a=>a.date===today());
    const presentToday=todayAtt.filter(a=>a.status==='present').length;
    const thisMonth=new Date().toISOString().slice(0,7);
    const collected=fees.filter(f=>f.month===thisMonth&&f.status==='Paid').reduce((s,f)=>s+Number(f.amount),0);
    document.getElementById('statsGrid').innerHTML=`
      <div class="stat-card orange"><div class="stat-icon">👨‍🎓</div><div class="stat-value">${students.length}</div><div class="stat-label">Total Students</div></div>
      <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-value">${presentToday}</div><div class="stat-label">Present Today</div></div>
      <div class="stat-card maroon"><div class="stat-icon">⚠️</div><div class="stat-value">${pendingFees}</div><div class="stat-label">Fee Pending</div></div>
      <div class="stat-card gold"><div class="stat-icon">💰</div><div class="stat-value">₹${collected.toLocaleString('en-IN')}</div><div class="stat-label">Collected</div></div>`;
    document.getElementById('quickActions').innerHTML=`
      <div class="quick-action" onclick="showPage('students')"><div class="qa-icon">👨‍🎓</div><p>Students</p></div>
      <div class="quick-action" onclick="showPage('attendance')"><div class="qa-icon">📋</div><p>Attendance</p></div>
      <div class="quick-action" onclick="showPage('marks')"><div class="qa-icon">📊</div><p>Marks</p></div>
      <div class="quick-action" onclick="showPage('fees')"><div class="qa-icon">💰</div><p>Fees</p></div>
      <div class="quick-action" onclick="showPage('charts')"><div class="qa-icon">📈</div><p>Charts</p></div>
      <div class="quick-action" onclick="showPage('aiagent')"><div class="qa-icon">🤖</div><p>AI Agent</p></div>
      <div class="quick-action" onclick="showPage('library')"><div class="qa-icon">📚</div><p>Library</p></div>
      <div class="quick-action" onclick="showPage('notifications')"><div class="qa-icon">🔔</div><p>Notices</p></div>`;
    document.getElementById('recentStudentsTbody').innerHTML=students.slice(0,5).map(s=>{
      const sAtt=attendance.filter(a=>a.studentId===s.id);
      const pct=sAtt.length?Math.round(sAtt.filter(a=>a.status==='present').length/sAtt.length*100):0;
      const sFee=fees.find(f=>f.studentId===s.id&&f.status==='Pending');
      return`<tr><td><strong>${s.name}</strong></td><td>${s.studentClass}</td>
        <td><div style="display:flex;align-items:center;gap:.4rem">
          <div class="progress-bar" style="width:70px"><div class="progress-fill" style="width:${pct}%;background:${pct>=75?'var(--success)':pct>=50?'var(--gold)':'var(--danger)'}"></div></div>
          <span style="font-size:.78rem">${pct}%</span></div></td>
        <td><span class="badge ${sFee?'badge-danger':'badge-success'}">${sFee?'Pending':'Paid'}</span></td></tr>`;
    }).join('');
  }else{
    const s=students.find(st=>st.id===currentUser.id)||currentUser;
    const sAtt=attendance.filter(a=>a.studentId===s.id);
    const pct=sAtt.length?Math.round(sAtt.filter(a=>a.status==='present').length/sAtt.length*100):0;
    const sMarks=marks.filter(m=>m.studentId===s.id);
    const avg=sMarks.length?Math.round(sMarks.reduce((a,m)=>a+m.obtained/m.total*100,0)/sMarks.length):0;
    const pending=fees.filter(f=>f.studentId===s.id&&f.status==='Pending').length;
    document.getElementById('statsGrid').innerHTML=`
      <div class="stat-card orange"><div class="stat-icon">📋</div><div class="stat-value">${pct}%</div><div class="stat-label">Attendance</div></div>
      <div class="stat-card green"><div class="stat-icon">📊</div><div class="stat-value">${avg}%</div><div class="stat-label">Avg Marks</div></div>
      <div class="stat-card ${pending?'maroon':'gold'}"><div class="stat-icon">💰</div><div class="stat-value">${pending}</div><div class="stat-label">Pending Fees</div></div>
      <div class="stat-card purple"><div class="stat-icon">📚</div><div class="stat-value">${sMarks.length}</div><div class="stat-label">Tests Taken</div></div>`;
    document.getElementById('quickActions').innerHTML=`
      <div class="quick-action" onclick="showPage('myAttendance')"><div class="qa-icon">📋</div><p>Attendance</p></div>
      <div class="quick-action" onclick="showPage('myMarks')"><div class="qa-icon">📊</div><p>My Marks</p></div>
      <div class="quick-action" onclick="showPage('myFees')"><div class="qa-icon">💰</div><p>My Fees</p></div>
      <div class="quick-action" onclick="showPage('aiagent')"><div class="qa-icon">🤖</div><p>AI Tutor</p></div>
      <div class="quick-action" onclick="showPage('library')"><div class="qa-icon">📚</div><p>Books</p></div>
      <div class="quick-action" onclick="showPage('submitFeedback')"><div class="qa-icon">💬</div><p>Feedback</p></div>`;
    document.getElementById('recentStudentsTbody').innerHTML='<tr><td colspan="4" style="text-align:center;color:var(--ink-muted);padding:1rem">Login as teacher to see all students</td></tr>';
  }
  const notifContainer=document.getElementById('dashNotifications');
  const n=notifs.slice(-3).reverse();
  notifContainer.innerHTML=n.length?n.map(x=>`
    <div class="notif-item ${x.priority==='urgent'?'unread':''}">
      <div class="notif-dot" style="background:${x.priority==='urgent'?'var(--danger)':x.priority==='important'?'var(--gold)':'var(--success)'}"></div>
      <div><strong style="font-size:.86rem">${x.subject}</strong>
        <p style="font-size:.76rem;color:var(--ink-soft);margin-top:2px">${x.message.slice(0,65)}...</p>
        <p class="text-muted">${fmtDate(x.date)}</p></div>
    </div>`).join(''):'<p class="text-muted">No notices yet</p>';
}

/* ============================================================
   STUDENTS CRUD
   ============================================================ */
async function renderStudents(filter=''){
  let students=await load('students');
  if(filter)students=students.filter(s=>s.name.toLowerCase().includes(filter)||(s.studentClass||'').toLowerCase().includes(filter));
  document.getElementById('studentsTbody').innerHTML=students.map(s=>`
    <tr><td><span class="badge badge-info">${s.id}</span></td><td><strong>${s.name}</strong></td><td>${s.studentClass}</td>
      <td>${s.phone||'-'}</td><td>${s.parent||'-'}</td>
      <td><span class="badge ${s.active?'badge-success':'badge-danger'}">${s.active?'Active':'Inactive'}</span></td>
      <td><div style="display:flex;gap:.35rem">
        <button class="btn btn-secondary btn-sm" onclick="openEditStudentModal('${s.id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">🗑️</button>
      </div></td></tr>`).join('')||'<tr><td colspan="7" style="text-align:center;color:var(--ink-muted);padding:2rem">No students found</td></tr>';
}
function openAddStudentModal(){
  document.getElementById('studentModalTitle').textContent='Add New Student';
  document.getElementById('editStudentId').value='';
  ['sName','sPhone','sParent','sFee','sUsername','sAddress'].forEach(i=>document.getElementById(i).value='');
  openModal('studentModal');
}
async function openEditStudentModal(id){
  const students=await load('students');
  const s=students.find(st=>st.id===id);if(!s)return;
  document.getElementById('studentModalTitle').textContent='Edit Student';
  document.getElementById('editStudentId').value=id;
  document.getElementById('sName').value=s.name;document.getElementById('sClass').value=s.studentClass;
  document.getElementById('sPhone').value=s.phone||'';document.getElementById('sParent').value=s.parent||'';
  document.getElementById('sFee').value=s.fee||'';document.getElementById('sUsername').value=s.username||'';
  document.getElementById('sAddress').value=s.address||'';
  openModal('studentModal');
}
async function saveStudent(){
  const name=document.getElementById('sName').value.trim();if(!name){showToast('Name required','error');return;}
  const editId=document.getElementById('editStudentId').value;
  const data={name,studentClass:document.getElementById('sClass').value,phone:document.getElementById('sPhone').value.trim(),parent:document.getElementById('sParent').value.trim(),fee:Number(document.getElementById('sFee').value)||0,username:document.getElementById('sUsername').value.trim(),address:document.getElementById('sAddress').value.trim(),active:true};
  showLoader('Saving…');
  try{
    if(editId){await fsUpdate('students',editId,data);showToast(`${name} updated`,'success');}
    else{await fsAdd('students',{...data,password:'pass123'});showToast(`${name} added`,'success');}
    hideLoader();closeModal('studentModal');renderStudents();
  }catch(e){hideLoader();showToast('Save failed: '+e.message,'error');}
}
async function deleteStudent(id){
  if(!confirm('Delete this student? This cannot be undone.'))return;
  showLoader('Deleting…');
  try{await fsDel('students',id);hideLoader();renderStudents();showToast('Student deleted','info');}
  catch(e){hideLoader();showToast('Delete failed: '+e.message,'error');}
}

/* ============================================================
   ATTENDANCE
   ============================================================ */
async function renderAttendance(){
  const dateEl=document.getElementById('attDate');if(!dateEl.value)dateEl.value=today();
  const selDate=dateEl.value;
  const [students,attRecs]=await Promise.all([load('students'),load('attendance')]);
  document.getElementById('attMarkTbody').innerHTML=students.map(s=>{
    const ex=attRecs.find(a=>a.studentId===s.id&&a.date===selDate);
    const isP=ex?ex.status==='present':true;
    return`<tr><td><strong>${s.name}</strong></td><td>${s.studentClass}</td>
      <td><input type="radio" name="att_${s.id}" value="present" ${isP?'checked':''}> Present</td>
      <td><input type="radio" name="att_${s.id}" value="absent"  ${!isP?'checked':''}> Absent</td></tr>`;
  }).join('');
  document.getElementById('attSummaryGrid').innerHTML=students.map(s=>{
    const sAtt=attRecs.filter(a=>a.studentId===s.id);
    const total=sAtt.length,pres=sAtt.filter(a=>a.status==='present').length;
    const pct=total?Math.round(pres/total*100):0;
    const color=pct>=75?'var(--success)':pct>=50?'var(--gold)':'var(--danger)';
    return`<div class="att-card">
      <div style="width:50px;height:50px;border-radius:50%;border:3px solid ${color};display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span style="font-family:'Playfair Display',serif;font-size:.9rem;font-weight:700;color:${color}">${pct}%</span></div>
      <div><strong style="font-size:.88rem">${s.name}</strong><p class="text-muted">${s.studentClass}</p>
        <p style="font-size:.76rem;color:var(--ink-soft)">${pres}/${total} days</p>
        <div class="progress-bar mt-1" style="width:120px"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
      </div></div>`;
  }).join('');
}
document.getElementById('attDate').addEventListener('change',renderAttendance);
async function saveAttendance(){
  const selDate=document.getElementById('attDate').value;
  showLoader('Saving attendance…');
  try{
    // Delete existing records for this date first, then re-add
    const existing=await load('attendance',true);
    const toDelete=existing.filter(a=>a.date===selDate);
    const batch=db.batch();
    toDelete.forEach(a=>batch.delete(col('attendance').doc(a.id)));
    load('students').then(studs=>{ // use cached students
      studs.forEach(s=>{
        let status='present';
        document.querySelectorAll(`input[name="att_${s.id}"]`).forEach(r=>{if(r.checked)status=r.value;});
        batch.set(col('attendance').doc(),{studentId:s.id,date:selDate,status});
      });
      batch.commit().then(()=>{delete cache['attendance'];hideLoader();showToast(`Attendance saved for ${fmtDate(selDate)}`,'success');renderAttendance();});
    });
  }catch(e){hideLoader();showToast('Save failed: '+e.message,'error');}
}

/* ============================================================
   MARKS
   ============================================================ */
async function renderMarks(){
  const [marks,students]=await Promise.all([load('marks'),load('students')]);
  document.getElementById('marksTbody').innerHTML=marks.map(m=>{
    const s=students.find(st=>st.id===m.studentId);const pct=Math.round(m.obtained/m.total*100);const g=getGrade(pct);
    return`<tr><td><strong>${s?s.name:m.studentId}</strong></td><td><span style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-soft)">${m.subject}</span></td>
      <td>${m.test}</td><td>${m.obtained}<span class="text-muted">/${m.total}</span> <small>(${pct}%)</small></td>
      <td><span class="badge ${g.cls}">${g.g}</span></td><td>${fmtDate(m.date)}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteMark('${m.id}')">🗑️</button></td></tr>`;
  }).join('')||'<tr><td colspan="7" style="text-align:center;color:var(--ink-muted);padding:2rem">No marks yet</td></tr>';
}
async function openAddMarksModal(){
  const students=await load('students');
  document.getElementById('mStudent').innerHTML=students.map(s=>`<option value="${s.id}">${s.name} (${s.studentClass})</option>`).join('');
  document.getElementById('mDate').value=today();document.getElementById('mTest').value='';
  openModal('marksModal');
}
async function saveMark(){
  const ob=Number(document.getElementById('mObtained').value),tot=Number(document.getElementById('mTotal').value),test=document.getElementById('mTest').value.trim();
  if(!test||isNaN(ob)||isNaN(tot)||tot===0){showToast('Fill all fields','error');return;}
  if(ob>tot){showToast('Obtained cannot exceed total','error');return;}
  showLoader('Saving…');
  try{
    await fsAdd('marks',{studentId:document.getElementById('mStudent').value,subject:document.getElementById('mSubject').value,test,obtained:ob,total:tot,date:document.getElementById('mDate').value});
    hideLoader();closeModal('marksModal');showToast('Marks saved','success');renderMarks();
  }catch(e){hideLoader();showToast('Save failed: '+e.message,'error');}
}
async function deleteMark(id){
  if(!confirm('Delete this marks record?'))return;
  showLoader('Deleting…');
  try{await fsDel('marks',id);hideLoader();renderMarks();showToast('Deleted','info');}
  catch(e){hideLoader();showToast(e.message,'error');}
}

/* ============================================================
   FEES
   ============================================================ */
async function renderFees(){
  const [fees,students]=await Promise.all([load('fees'),load('students')]);
  document.getElementById('feesTbody').innerHTML=fees.map(f=>{
    const s=students.find(st=>st.id===f.studentId);
    const sc={Paid:'badge-success',Pending:'badge-danger',Partial:'badge-warning'}[f.status]||'badge-info';
    return`<tr><td><strong>${s?s.name:f.studentId}</strong></td>
      <td>${f.month?new Date(f.month+'-01').toLocaleDateString('en-IN',{month:'long',year:'numeric'}):'-'}</td>
      <td><strong>₹${Number(f.amount).toLocaleString('en-IN')}</strong></td>
      <td>${f.paidOn?fmtDate(f.paidOn):'-'}</td><td><span class="badge ${sc}">${f.status}</span></td>
      <td><div style="display:flex;gap:.35rem">${f.status!=='Paid'?`<button class="btn btn-success btn-sm" onclick="markFeePaid('${f.id}')">✓ Paid</button>`:''}<button class="btn btn-danger btn-sm" onclick="deleteFee('${f.id}')">🗑️</button></div></td></tr>`;
  }).join('')||'<tr><td colspan="6" style="text-align:center;color:var(--ink-muted);padding:2rem">No fee records</td></tr>';
}
async function openFeeModal(){
  const students=await load('students');
  document.getElementById('fStudent').innerHTML=students.map(s=>`<option value="${s.id}">${s.name} (${s.studentClass})</option>`).join('');
  document.getElementById('fMonth').value=today().slice(0,7);openModal('feeModal');
}
async function saveFee(){
  const month=document.getElementById('fMonth').value,amount=Number(document.getElementById('fAmount').value),status=document.getElementById('fStatus').value;
  if(!month||!amount){showToast('Fill month and amount','error');return;}
  showLoader('Saving…');
  try{
    await fsAdd('fees',{studentId:document.getElementById('fStudent').value,month,amount,paidOn:status==='Paid'?today():null,status});
    hideLoader();closeModal('feeModal');showToast('Fee saved','success');renderFees();
  }catch(e){hideLoader();showToast(e.message,'error');}
}
async function markFeePaid(id){
  showLoader('Updating…');
  try{await fsUpdate('fees',id,{status:'Paid',paidOn:today()});hideLoader();renderFees();showToast('Marked as paid ✓','success');}
  catch(e){hideLoader();showToast(e.message,'error');}
}
async function deleteFee(id){
  if(!confirm('Delete?'))return;
  showLoader('Deleting…');
  try{await fsDel('fees',id);hideLoader();renderFees();}
  catch(e){hideLoader();showToast(e.message,'error');}
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
async function renderNotifications(){
  const notifs=(await load('notifications')).reverse();
  document.getElementById('notifList').innerHTML=notifs.map(n=>{
    const pc={urgent:'var(--danger)',important:'var(--gold)',normal:'var(--success)'}[n.priority];
    return`<div class="notif-item ${n.priority==='urgent'?'unread':''}">
      <div class="notif-dot" style="background:${pc}"></div>
      <div style="flex:1"><div style="display:flex;align-items:center;gap:.45rem;flex-wrap:wrap">
        <strong style="font-size:.88rem">${n.subject}</strong>
        <span class="badge ${n.priority==='urgent'?'badge-danger':n.priority==='important'?'badge-warning':'badge-success'}">${n.priority}</span>
        <span style="font-size:.72rem;color:var(--ink-muted)">${n.to==='all'?'📢 All':'👤 Individual'}</span></div>
        <p style="font-size:.83rem;color:var(--ink-soft);margin-top:3px">${n.message}</p>
        <p class="text-muted">${fmtDate(n.date)}</p></div>
      <button class="btn btn-danger btn-sm" onclick="deleteNotif('${n.id}')">🗑️</button></div>`;
  }).join('')||'<p class="text-muted">No notifications yet</p>';
}
async function openNotifModal(){
  const students=await load('students');
  document.getElementById('nStudent').innerHTML='<option value="all">📢 All Students</option>'+students.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  document.getElementById('nSubject').value='';document.getElementById('nMessage').value='';
  openModal('notifModal');
}
async function sendNotification(){
  const subject=document.getElementById('nSubject').value.trim(),message=document.getElementById('nMessage').value.trim();
  if(!subject||!message){showToast('Subject and message required','error');return;}
  showLoader('Sending…');
  try{
    await fsAdd('notifications',{to:document.getElementById('nStudent').value,subject,message,priority:document.getElementById('nPriority').value,date:today(),read:[]});
    hideLoader();closeModal('notifModal');showToast('Notification sent!','success');renderNotifications();updateNotifBadge();
  }catch(e){hideLoader();showToast(e.message,'error');}
}
async function deleteNotif(id){
  try{await fsDel('notifications',id);renderNotifications();updateNotifBadge();showToast('Deleted','info');}
  catch(e){showToast(e.message,'error');}
}
async function updateNotifBadge(){const c=(await load('notifications')).length;document.getElementById('notifBadge').textContent=c;}

/* ============================================================
   FEEDBACK
   ============================================================ */
async function renderFeedback(){
  const [fbs,students]=await Promise.all([load('feedback'),load('students')]);
  document.getElementById('feedbackList').innerHTML=fbs.slice().reverse().map(f=>{
    const s=students.find(st=>st.id===f.studentId);
    return`<div class="feedback-card">
      <div style="display:flex;align-items:center;gap:.7rem;margin-bottom:.45rem">
        <div class="user-avatar" style="width:34px;height:34px;font-size:.82rem">${s?s.name[0]:'?'}</div>
        <div><strong style="font-size:.88rem">${s?s.name:'Unknown'}</strong><p class="text-muted">${fmtDate(f.date)}</p></div>
        <div style="margin-left:auto"><span class="stars">${f.rating.split(' ')[0]}</span></div></div>
      <p style="font-size:.8rem;font-weight:600;color:var(--saffron);margin-bottom:3px">${f.subject}</p>
      <p style="font-size:.86rem;color:var(--ink-soft)">${f.message}</p></div>`;
  }).join('')||'<p class="text-muted">No feedback yet</p>';
}
async function submitFeedback(){
  const message=document.getElementById('fbMessage').value.trim(),subject=document.getElementById('fbSubject').value.trim();
  if(!message||!subject){showToast('Fill all fields','error');return;}
  showLoader('Submitting…');
  try{
    await fsAdd('feedback',{studentId:currentUser.id,rating:document.getElementById('fbRating').value,subject,message,date:today()});
    hideLoader();document.getElementById('fbMessage').value='';document.getElementById('fbSubject').value='';
    showToast('Feedback submitted! Thank you 🙏','success');
  }catch(e){hideLoader();showToast(e.message,'error');}
}

/* ============================================================
   STUDENT PORTAL
   ============================================================ */
async function renderMyAttendance(){
  const allAtt=await load('attendance');
  const att=allAtt.filter(a=>a.studentId===currentUser.id);
  const total=att.length,pres=att.filter(a=>a.status==='present').length;
  const pct=total?Math.round(pres/total*100):0;const color=pct>=75?'var(--success)':pct>=50?'var(--gold)':'var(--danger)';
  document.getElementById('myAttBody').innerHTML=`
    <div style="display:flex;align-items:center;gap:1.4rem;margin-bottom:1.4rem;flex-wrap:wrap">
      <div style="width:85px;height:85px;border-radius:50%;border:4px solid ${color};display:flex;align-items:center;justify-content:center">
        <span style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;color:${color}">${pct}%</span></div>
      <div><h3 style="font-size:1.25rem">${pres}/${total} Days Present</h3><p class="text-muted">Overall Attendance</p>
        ${pct<75?'<p style="color:var(--danger);font-size:.83rem;margin-top:3px">⚠️ Below 75% threshold</p>':'<p style="color:var(--success);font-size:.83rem;margin-top:3px">✅ Good attendance!</p>'}
      </div></div>
    <table><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>
      ${att.sort((a,b)=>b.date.localeCompare(a.date)).map(a=>`<tr><td>${fmtDate(a.date)}</td><td><span class="badge ${a.status==='present'?'badge-success':'badge-danger'}">${a.status==='present'?'✅ Present':'❌ Absent'}</span></td></tr>`).join('')||'<tr><td colspan="2" class="text-muted" style="text-align:center;padding:1rem">No records yet</td></tr>'}
    </tbody></table>`;
}
async function renderMyMarks(){
  const marks=(await load('marks')).filter(m=>m.studentId===currentUser.id);
  document.getElementById('myMarksTbody').innerHTML=marks.map(m=>{
    const pct=Math.round(m.obtained/m.total*100),g=getGrade(pct);
    return`<tr><td><span style="font-size:.75rem;font-weight:700;text-transform:uppercase;color:var(--ink-soft)">${m.subject}</span></td><td>${m.test}</td>
      <td>${m.obtained}<span class="text-muted">/${m.total}</span> <small>(${pct}%)</small></td>
      <td><span class="badge ${g.cls}">${g.g}</span></td><td>${fmtDate(m.date)}</td></tr>`;
  }).join('')||'<tr><td colspan="5" style="text-align:center;color:var(--ink-muted);padding:2rem">No marks yet</td></tr>';
}
async function renderMyFees(){
  const fees=(await load('fees')).filter(f=>f.studentId===currentUser.id);
  document.getElementById('myFeesTbody').innerHTML=fees.map(f=>{
    const sc={Paid:'badge-success',Pending:'badge-danger',Partial:'badge-warning'}[f.status]||'badge-info';
    return`<tr><td>${f.month?new Date(f.month+'-01').toLocaleDateString('en-IN',{month:'long',year:'numeric'}):'-'}</td>
      <td><strong>₹${Number(f.amount).toLocaleString('en-IN')}</strong></td>
      <td>${f.paidOn?fmtDate(f.paidOn):'-'}</td><td><span class="badge ${sc}">${f.status}</span></td></tr>`;
  }).join('')||'<tr><td colspan="4" style="text-align:center;color:var(--ink-muted);padding:2rem">No fee records</td></tr>';
}
async function renderMyNotifications(){
  const notifs=(await load('notifications')).filter(n=>n.to==='all'||n.to===currentUser.id).reverse();
  document.getElementById('myNotifList').innerHTML=notifs.map(n=>{
    const pc={urgent:'var(--danger)',important:'var(--gold)',normal:'var(--success)'}[n.priority];
    return`<div class="notif-item"><div class="notif-dot" style="background:${pc}"></div>
      <div><strong style="font-size:.88rem">${n.subject}</strong>
        <p style="font-size:.83rem;color:var(--ink-soft);margin-top:3px">${n.message}</p>
        <p class="text-muted">${fmtDate(n.date)}</p></div></div>`;
  }).join('')||'<p class="text-muted">No notices yet</p>';
}

/* ============================================================
   GROUP CHARTS (Chart.js) — async Firestore loads
   ============================================================ */
const chartInstances={};
function destroyChart(id){if(chartInstances[id]){chartInstances[id].destroy();delete chartInstances[id];}}

async function renderCharts(){
  const [students,attendance,fees,marks]=await Promise.all([load('students'),load('attendance'),load('fees'),load('marks')]);

  // 1. Attendance Bar Chart
  destroyChart('attBar');
  const attLabels=students.map(s=>s.name.split(' ')[0]);
  const attData=students.map(s=>{const a=attendance.filter(x=>x.studentId===s.id);return a.length?Math.round(a.filter(x=>x.status==='present').length/a.length*100):0;});
  chartInstances['attBar']=new Chart(document.getElementById('chartAttBar'),{type:'bar',data:{labels:attLabels,datasets:[{label:'Attendance %',data:attData,backgroundColor:attData.map(v=>v>=75?'rgba(21,128,61,.7)':v>=50?'rgba(217,119,6,.7)':'rgba(220,38,38,.7)'),borderRadius:6,borderSkipped:false}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{min:0,max:100,ticks:{callback:v=>v+'%'},grid:{color:'rgba(0,0,0,.05)'}},x:{grid:{display:false}}}}});

  // 2. Fee Doughnut Chart
  destroyChart('feePie');
  const paid=fees.filter(f=>f.status==='Paid').length,pending=fees.filter(f=>f.status==='Pending').length,partial=fees.filter(f=>f.status==='Partial').length;
  chartInstances['feePie']=new Chart(document.getElementById('chartFeePie'),{type:'doughnut',data:{labels:['Paid','Pending','Partial'],datasets:[{data:[paid,pending,partial],backgroundColor:['rgba(21,128,61,.8)','rgba(220,38,38,.8)','rgba(217,119,6,.8)'],borderWidth:0,hoverOffset:6}]},options:{responsive:true,cutout:'65%',plugins:{legend:{position:'bottom'}}}});

  // 3. Subject Marks Radar
  destroyChart('marksRadar');
  const subjects=['Mathematics','Science','English','Hindi','Social Studies','Telugu'];
  const subAvg=subjects.map(sub=>{const sm=marks.filter(m=>m.subject===sub);return sm.length?Math.round(sm.reduce((a,m)=>a+m.obtained/m.total*100,0)/sm.length):0;});
  chartInstances['marksRadar']=new Chart(document.getElementById('chartMarksRadar'),{type:'radar',data:{labels:subjects,datasets:[{label:'Avg %',data:subAvg,backgroundColor:'rgba(249,115,22,.15)',borderColor:'rgba(249,115,22,.8)',pointBackgroundColor:'rgba(249,115,22,.9)',pointRadius:4}]},options:{responsive:true,scales:{r:{min:0,max:100,ticks:{display:false},grid:{color:'rgba(0,0,0,.07)'},pointLabels:{font:{size:11}}}},plugins:{legend:{display:false}}}});

  // 4. Students per Class Bar
  destroyChart('classBar');
  const classes=['Class 6','Class 7','Class 8','Class 9','Class 10'];
  const classData=classes.map(c=>students.filter(s=>s.studentClass===c).length);
  chartInstances['classBar']=new Chart(document.getElementById('chartClassBar'),{type:'bar',data:{labels:classes,datasets:[{label:'Students',data:classData,backgroundColor:'rgba(136,19,55,.65)',borderRadius:6,borderSkipped:false}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1},grid:{color:'rgba(0,0,0,.05)'}},x:{grid:{display:false}}}}});

  // 5. Trend Chart — populate student selector from Firestore
  const sel=document.getElementById('trendStudentSel');
  sel.innerHTML=students.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  // Store marks in closure for trend chart
  window._cachedMarksForTrend=marks;
  renderTrendChart();
}

function renderTrendChart(){
  destroyChart('trend');
  const sid=document.getElementById('trendStudentSel').value;
  // Use cached marks (fetched in renderCharts) to avoid extra reads
  const allMarks=window._cachedMarksForTrend||[];
  const marks=allMarks.filter(m=>m.studentId===sid).sort((a,b)=>a.date.localeCompare(b.date));
  const labels=marks.map(m=>m.subject.slice(0,4)+' - '+m.test.slice(-1));
  const data=marks.map(m=>Math.round(m.obtained/m.total*100));
  chartInstances['trend']=new Chart(document.getElementById('chartTrend'),{type:'line',data:{labels,datasets:[{label:'Score %',data,borderColor:'rgba(249,115,22,.9)',backgroundColor:'rgba(249,115,22,.1)',fill:true,tension:.4,pointBackgroundColor:'rgba(249,115,22,1)',pointRadius:5}]},options:{responsive:true,scales:{y:{min:0,max:100,ticks:{callback:v=>v+'%'},grid:{color:'rgba(0,0,0,.05)'}},x:{grid:{display:false}}},plugins:{legend:{display:false}}}});
}

/* ============================================================
   AI AGENT — context now built from Firestore cache
   ============================================================ */
let aiHistory=[];

async function buildContext(){
  const [students,attendance,marks,fees]=await Promise.all([load('students'),load('attendance'),load('marks'),load('fees')]);
  const attSummary=students.map(s=>{const a=attendance.filter(x=>x.studentId===s.id);const pct=a.length?Math.round(a.filter(x=>x.status==='present').length/a.length*100):0;return`${s.name}(${s.studentClass}): ${pct}% attendance`;}).join(', ');
  const marksSummary=students.map(s=>{const m=marks.filter(x=>x.studentId===s.id);const avg=m.length?Math.round(m.reduce((a,x)=>a+x.obtained/x.total*100,0)/m.length):0;return`${s.name}: ${avg}% avg`;}).join(', ');
  const pending=fees.filter(f=>f.status==='Pending').map(f=>{const s=students.find(x=>x.id===f.studentId);return s?s.name:'?';}).join(', ');
  return`You are Radha AI, a helpful assistant for RADHAMMA Tuition centre in Hyderabad, India. You help teachers and students with academic guidance, NCERT/CBSE curriculum, student performance insights, and tuition management.

Current live data from Firebase:
- Total students: ${students.length}
- Attendance: ${attSummary}
- Marks: ${marksSummary}
- Fee pending: ${pending||'None'}

Guidelines:
- Give actionable insights about student performance
- Explain NCERT/CBSE concepts clearly for Classes 6–10
- Help draft parent communication messages
- Suggest study plans and teaching strategies
- Be warm, encouraging, and use simple language with emojis
- Keep responses concise but helpful`;
}

async function sendAI(){
  const inp=document.getElementById('aiInput');
  const msg=inp.value.trim();if(!msg)return;
  inp.value='';
  appendAIMsg(msg,'user');
  aiHistory.push({role:'user',content:msg});
  showTyping();
  try{
    const systemCtx=await buildContext();
    const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:systemCtx,messages:aiHistory})});
    const data=await res.json();
    hideTyping();
    const reply=data.content?.map(c=>c.text||'').join('')||'Sorry, I could not process that. Please try again.';
    aiHistory.push({role:'assistant',content:reply});
    appendAIMsg(formatAIText(reply),'bot',true);
  }catch(e){hideTyping();appendAIMsg('⚠️ Connection error. Please check your internet connection and try again.','bot');}
}

function formatAIText(txt){
  return txt.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\n/g,'<br>');
}
function appendAIMsg(text,type,isHtml=false){
  const msgs=document.getElementById('aiMessages');
  const now=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  const div=document.createElement('div');div.className=`ai-msg ${type}`;
  div.innerHTML=`<div class="ai-bubble">${isHtml?text:escapeHtml(text)}</div><div class="ai-time">${now}</div>`;
  msgs.appendChild(div);msgs.scrollTop=msgs.scrollHeight;
}
function escapeHtml(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function showTyping(){const m=document.getElementById('aiMessages');const d=document.createElement('div');d.className='ai-msg bot';d.id='aiTyping';d.innerHTML='<div class="ai-bubble"><div class="ai-typing"><span></span><span></span><span></span></div></div>';m.appendChild(d);m.scrollTop=m.scrollHeight;}
function hideTyping(){const t=document.getElementById('aiTyping');if(t)t.remove();}
function aiQuick(msg){document.getElementById('aiInput').value=msg;sendAI();}

/* ============================================================
   BOOK LIBRARY
   ============================================================ */
const BOOKS=[
  // NCERT Books
  {id:'b1',board:'NCERT',cls:'Class 6',subject:'Mathematics',title:'Mathematics',subtitle:'Class 6 NCERT',emoji:'📘',color:'#DBEAFE',chapters:14,chList:['Knowing Our Numbers','Whole Numbers','Playing with Numbers','Basic Geometrical Ideas','Understanding Elementary Shapes','Integers','Fractions','Decimals','Data Handling','Mensuration','Algebra','Ratio and Proportion','Symmetry','Practical Geometry']},
  {id:'b2',board:'NCERT',cls:'Class 6',subject:'Science',title:'Science',subtitle:'Class 6 NCERT',emoji:'🔬',color:'#DCFCE7',chapters:16,chList:['Food: Where Does It Come From?','Components of Food','Fibre to Fabric','Sorting Materials into Groups','Separation of Substances','Changes Around Us','Getting to Know Plants','Body Movements','The Living Organisms','Motion and Measurement','Light, Shadows and Reflections','Electricity and Circuits','Fun with Magnets','Water','Air Around Us','Garbage In, Garbage Out']},
  {id:'b3',board:'NCERT',cls:'Class 7',subject:'Mathematics',title:'Mathematics',subtitle:'Class 7 NCERT',emoji:'📗',color:'#D1FAE5',chapters:15,chList:['Integers','Fractions and Decimals','Data Handling','Simple Equations','Lines and Angles','The Triangle and its Properties','Comparing Quantities','Rational Numbers','Perimeter and Area','Algebraic Expressions','Exponents and Powers','Symmetry','Visualising Solid Shapes']},
  {id:'b4',board:'NCERT',cls:'Class 8',subject:'Mathematics',title:'Mathematics',subtitle:'Class 8 NCERT',emoji:'📙',color:'#FEF3C7',chapters:16,chList:['Rational Numbers','Linear Equations in One Variable','Understanding Quadrilaterals','Data Handling','Squares and Square Roots','Cubes and Cube Roots','Comparing Quantities','Algebraic Expressions','Visualising Solid Shapes','Mensuration','Exponents and Powers','Direct and Inverse Proportions','Factorisation','Introduction to Graphs','Playing with Numbers']},
  {id:'b5',board:'NCERT',cls:'Class 9',subject:'Mathematics',title:'Mathematics',subtitle:'Class 9 NCERT',emoji:'📕',color:'#FEE2E2',chapters:15,chList:['Number Systems','Polynomials','Coordinate Geometry','Linear Equations in Two Variables','Euclid\'s Geometry','Lines and Angles','Triangles','Quadrilaterals','Areas of Parallelograms and Triangles','Circles','Constructions','Heron\'s Formula','Surface Areas and Volumes','Statistics','Probability']},
  {id:'b6',board:'NCERT',cls:'Class 9',subject:'Science',title:'Science',subtitle:'Class 9 NCERT',emoji:'⚗️',color:'#EDE9FE',chapters:15,chList:['Matter in Our Surroundings','Is Matter Around Us Pure?','Atoms and Molecules','Structure of the Atom','The Fundamental Unit of Life','Tissues','Diversity in Living Organisms','Motion','Force and Laws of Motion','Gravitation','Work and Energy','Sound','Why Do We Fall Ill?','Natural Resources','Improvement in Food Resources']},
  {id:'b7',board:'NCERT',cls:'Class 10',subject:'Mathematics',title:'Mathematics',subtitle:'Class 10 NCERT',emoji:'🧮',color:'#FEE2E2',chapters:15,chList:['Real Numbers','Polynomials','Pair of Linear Equations','Quadratic Equations','Arithmetic Progressions','Triangles','Coordinate Geometry','Introduction to Trigonometry','Applications of Trigonometry','Circles','Constructions','Areas Related to Circles','Surface Areas and Volumes','Statistics','Probability']},
  {id:'b8',board:'NCERT',cls:'Class 10',subject:'Science',title:'Science',subtitle:'Class 10 NCERT',emoji:'🔭',color:'#DCFCE7',chapters:16,chList:['Chemical Reactions and Equations','Acids, Bases and Salts','Metals and Non-metals','Carbon and its Compounds','Periodic Classification','Life Processes','Control and Coordination','How do Organisms Reproduce?','Heredity and Evolution','Light – Reflection and Refraction','The Human Eye and Colourful World','Electricity','Magnetic Effects','Sources of Energy','Our Environment','Sustainable Management']},
  // CBSE Books
  {id:'b9',board:'CBSE',cls:'Class 9',subject:'English',title:'Beehive',subtitle:'CBSE English Prose',emoji:'📖',color:'#FEF3C7',chapters:11,chList:['The Fun They Had','The Sound of Music','The Little Girl','A Truly Beautiful Mind','The Snake and the Mirror','My Childhood','Packing','Reach for the Top','The Bond of Love','Kathmandu','If I Were You']},
  {id:'b10',board:'CBSE',cls:'Class 10',subject:'English',title:'First Flight',subtitle:'CBSE English Class 10',emoji:'📖',color:'#FEE2E2',chapters:11,chList:['A Letter to God','Nelson Mandela','Two Stories About Flying','From the Diary of Anne Frank','The Hundred Dresses I','The Hundred Dresses II','Glimpses of India','Mijbil the Otter','Madam Rides the Bus','The Sermon at Benares','The Proposal']},
  {id:'b11',board:'CBSE',cls:'Class 9',subject:'Social Studies',title:'Contemporary India I',subtitle:'CBSE Geography',emoji:'🌍',color:'#DBEAFE',chapters:6,chList:['India – Size and Location','Physical Features of India','Drainage','Climate','Natural Vegetation and Wildlife','Population']},
  {id:'b12',board:'CBSE',cls:'Class 10',subject:'Social Studies',title:'Contemporary India II',subtitle:'CBSE Geography',emoji:'🗺️',color:'#D1FAE5',chapters:7,chList:['Resources and Development','Forest and Wildlife','Water Resources','Agriculture','Minerals and Energy Resources','Manufacturing Industries','Lifelines of National Economy']},
  {id:'b13',board:'NCERT',cls:'Class 8',subject:'Science',title:'Science',subtitle:'Class 8 NCERT',emoji:'🧪',color:'#EDE9FE',chapters:18,chList:['Crop Production and Management','Microorganisms: Friend and Foe','Synthetic Fibres and Plastics','Materials: Metals and Non-Metals','Coal and Petroleum','Combustion and Flame','Conservation of Plants and Animals','Cell Structure and Functions','Reproduction in Animals','Reaching the Age of Adolescence','Force and Pressure','Friction','Sound','Chemical Effects of Electric Current','Some Natural Phenomena','Light','Stars and the Solar System','Pollution of Air and Water']},
  {id:'b14',board:'NCERT',cls:'Class 7',subject:'Science',title:'Science',subtitle:'Class 7 NCERT',emoji:'🌿',color:'#DCFCE7',chapters:18,chList:['Nutrition in Plants','Nutrition in Animals','Fibre to Fabric','Heat','Acids, Bases and Salts','Physical and Chemical Changes','Weather, Climate and Adaptations','Winds, Storms and Cyclones','Soil','Respiration in Organisms','Transportation in Animals and Plants','Reproduction in Plants','Motion and Time','Electric Current and its Effects','Light','Water: A Precious Resource','Forests: Our Lifeline','Wastewater Story']},
];

let libFilter='all', libBoard='';
function renderLibrary(){
  const classes=['all','Class 6','Class 7','Class 8','Class 9','Class 10'];
  document.getElementById('libClassFilters').innerHTML=classes.map(c=>`
    <button class="lib-filter ${libFilter===c?'active':''}" onclick="setLibFilter('${c}')">${c==='all'?'📚 All Classes':c}</button>`).join('');
  filterBooks();
}
function setLibFilter(f){libFilter=f;renderLibrary();}
function filterBooks(){
  const q=(document.getElementById('libSearch')||{value:''}).value.toLowerCase();
  const board=(document.getElementById('libBoardFilter')||{value:''}).value;
  let books=BOOKS;
  if(libFilter!=='all')books=books.filter(b=>b.cls===libFilter);
  if(board)books=books.filter(b=>b.board===board);
  if(q)books=books.filter(b=>b.title.toLowerCase().includes(q)||b.subject.toLowerCase().includes(q)||b.cls.toLowerCase().includes(q));
  document.getElementById('booksGrid').innerHTML=books.map(b=>`
    <div class="book-card" onclick="openBook('${b.id}')">
      <div class="book-cover" style="background:${b.color}">
        <span style="position:relative;z-index:1">${b.emoji}</span>
        <span class="book-badge badge ${b.board==='NCERT'?'badge-success':'badge-info'}">${b.board}</span>
      </div>
      <div class="book-info">
        <h4>${b.title}</h4>
        <p>${b.cls} · ${b.subject}</p>
        <p style="font-size:.68rem;color:var(--ink-muted);margin-top:2px">${b.chapters} chapters</p>
      </div>
      <div class="book-actions">
        <button class="btn btn-secondary" onclick="event.stopPropagation();openBook('${b.id}')">View</button>
        <button class="btn btn-primary" onclick="event.stopPropagation();showToast('Opening official resource...','info')">Open</button>
      </div>
    </div>`).join('')||'<div style="grid-column:1/-1;text-align:center;color:var(--ink-muted);padding:2rem">No books found</div>';
}
function openBook(id){
  const b=BOOKS.find(x=>x.id===id);if(!b)return;
  document.getElementById('bkEmo').textContent=b.emoji;
  document.getElementById('bkTitle').textContent=b.title;
  document.getElementById('bkCover').textContent=b.emoji;
  document.getElementById('bkCover').style.background=b.color;
  document.getElementById('bkBoard').textContent=b.board;document.getElementById('bkBoard').className=`badge ${b.board==='NCERT'?'badge-success':'badge-info'}`;
  document.getElementById('bkClass').textContent=b.cls;
  document.getElementById('bkSubject').textContent=b.subject;
  document.getElementById('bkChapters').textContent=b.chapters+' chapters';
  document.getElementById('bkChapterList').innerHTML=b.chList.map((c,i)=>`<div style="padding:3px 0;border-bottom:1px solid var(--border)"><span style="color:var(--saffron);font-weight:700;font-size:.75rem;margin-right:.4rem">${String(i+1).padStart(2,'0')}.</span>${c}</div>`).join('');
  openModal('bookModal');
}

/* ============================================================
   SEARCH / MODALS / TOAST
   ============================================================ */
function handleSearch(v){const pg=document.querySelector('.page:not(.hidden)');if(pg&&pg.id==='page-students')renderStudents(v.toLowerCase());}
function openModal(id){document.getElementById(id).classList.remove('hidden');}
function closeModal(id){document.getElementById(id).classList.add('hidden');}
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.add('hidden');}));
function showToast(msg,type='info'){
  const icons={success:'✅',error:'❌',info:'ℹ️'};
  const t=document.createElement('div');t.className=`toast ${type}`;
  t.innerHTML=`<span>${icons[type]||'ℹ️'}</span> ${msg}`;
  document.getElementById('toastContainer').appendChild(t);setTimeout(()=>t.remove(),3500);
}

/* ============================================================
   INIT — runs on page load
   ============================================================ */
document.getElementById('attDate').value=today();

// Check if we have a saved session
const savedUser=sessionStorage.getItem('currentUser');

// Boot sequence: seed Firestore → restore session → show app
(async()=>{
  await seedData();           // Ensure Firestore has default data
  if(savedUser){             // Restore session without re-login
    currentUser=JSON.parse(savedUser);
    await startApp();
  }
})();
