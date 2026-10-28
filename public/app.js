const $ = id => document.getElementById(id);
const today = new Date().toISOString().slice(0,10);
$('attendanceDate').value = today; $('filterDate').value = today;
async function api(url, options={}) {
  const res = await fetch(url, {headers:{'Content-Type':'application/json'}, ...options});
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function rows(target, list, cols) {
  $(target).innerHTML = list.length ? list.map(item=>`<tr>${cols(item)}</tr>`).join('') : `<tr><td colspan="6" class="empty">No records to display</td></tr>`;
}
async function refresh() {
  const q = $('search').value.trim();
  const [students, records, report] = await Promise.all([
    api('/api/students?q='+encodeURIComponent(q)),
    api('/api/attendance?date='+encodeURIComponent($('filterDate').value)),
    api('/api/attendance/report')
  ]);
  const allStudents = await api('/api/students');
  $('studentCount').textContent = allStudents.length;
  $('recordCount').textContent = report.reduce((n,s)=>n+s.totalDays,0);
  $('average').textContent = report.length ? Math.round(report.reduce((n,s)=>n+s.percentage,0)/report.length)+'%' : '0%';
  $('studentSelect').innerHTML = allStudents.length ? '<option value="">Select student</option>'+allStudents.map(s=>`<option value="${esc(s.id)}">${esc(s.rollNo)} — ${esc(s.name)}</option>`).join('') : '<option value="">Register a student first</option>';
  rows('students', students, s=>`<td>${esc(s.rollNo)}</td><td>${esc(s.name)}</td><td>${esc(s.department)}</td>`);
  rows('attendance', records, r=>`<td>${esc(r.student?.rollNo||'Unknown')}</td><td>${esc(r.student?.name||'Unknown')}</td><td>${esc(r.date)}</td><td><span class="pill ${esc(r.status)}">${esc(r.status)}</span></td>`);
  rows('reports', report, s=>`<td>${esc(s.rollNo)}</td><td>${esc(s.name)}</td><td>${s.presentDays}</td><td>${s.totalDays}</td><td><strong>${s.percentage}%</strong></td>`);
}
$('studentForm').addEventListener('submit', async e=>{
  e.preventDefault(); const form=new FormData(e.target);
  try {await api('/api/students',{method:'POST',body:JSON.stringify(Object.fromEntries(form))}); $('studentMessage').textContent='Student registered successfully.'; e.target.reset(); await refresh();}
  catch(err){$('studentMessage').textContent=err.message;}
});
$('attendanceForm').addEventListener('submit', async e=>{
  e.preventDefault(); const form=new FormData(e.target);
  try {await api('/api/attendance',{method:'POST',body:JSON.stringify(Object.fromEntries(form))}); $('attendanceMessage').textContent='Attendance saved successfully.'; await refresh();}
  catch(err){$('attendanceMessage').textContent=err.message;}
});
$('search').addEventListener('input',()=>refresh().catch(console.error));
$('filterDate').addEventListener('change',()=>refresh().catch(console.error));
$('export').addEventListener('click',()=>{window.location.href='/api/attendance/export';});
refresh().catch(err=>console.error(err));
