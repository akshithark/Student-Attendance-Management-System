const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'attendance.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

function ensureData() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ students: [], attendance: [] }, null, 2));
}
function readData() {
  ensureData();
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { students: [], attendance: [] }; }
}
function writeData(data) {
  ensureData();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function send(res, status, payload, type='application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' });
  res.end(type.startsWith('application/json') ? JSON.stringify(payload) : payload);
}
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 1e6) reject(new Error('Request too large')); });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}
function dateToday() { return new Date().toISOString().slice(0, 10); }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { status: 'ok' });
    if (req.method === 'GET' && url.pathname === '/api/students') {
      const data = readData();
      const q = (url.searchParams.get('q') || '').toLowerCase();
      return send(res, 200, data.students.filter(s => `${s.rollNo} ${s.name} ${s.department}`.toLowerCase().includes(q)));
    }
    if (req.method === 'POST' && url.pathname === '/api/students') {
      const input = await body(req);
      const rollNo = String(input.rollNo || '').trim();
      const name = String(input.name || '').trim();
      const department = String(input.department || '').trim();
      if (!rollNo || !name || !department) return send(res, 400, { error: 'Roll number, name, and department are required' });
      const data = readData();
      if (data.students.some(s => s.rollNo.toLowerCase() === rollNo.toLowerCase())) return send(res, 409, { error: 'Roll number already exists' });
      const student = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), rollNo, name, department };
      data.students.push(student); writeData(data);
      return send(res, 201, student);
    }
    if (req.method === 'GET' && url.pathname === '/api/attendance') {
      const data = readData();
      const date = url.searchParams.get('date');
      const records = data.attendance.filter(a => !date || a.date === date).map(a => ({
        ...a, student: data.students.find(s => s.id === a.studentId) || null
      }));
      return send(res, 200, records);
    }
    if (req.method === 'POST' && url.pathname === '/api/attendance') {
      const input = await body(req);
      const studentId = String(input.studentId || '');
      const date = String(input.date || dateToday());
      const status = String(input.status || '');
      if (!studentId || !['Present', 'Absent', 'Late'].includes(status) || !/^\d{4}-\d{2}-\d{2}$/.test(date))
        return send(res, 400, { error: 'Valid student, date (YYYY-MM-DD), and status are required' });
      const data = readData();
      if (!data.students.some(s => s.id === studentId)) return send(res, 404, { error: 'Student not found' });
      const existing = data.attendance.find(a => a.studentId === studentId && a.date === date);
      if (existing) return send(res, 409, { error: 'Attendance already recorded for this student and date' });
      const record = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), studentId, date, status };
      data.attendance.push(record); writeData(data);
      return send(res, 201, record);
    }
    if (req.method === 'GET' && url.pathname === '/api/attendance/report') {
      const data = readData();
      const report = data.students.map(student => {
        const records = data.attendance.filter(a => a.studentId === student.id);
        const present = records.filter(a => a.status === 'Present' || a.status === 'Late').length;
        return { ...student, totalDays: records.length, presentDays: present,
          absentDays: records.filter(a => a.status === 'Absent').length,
          percentage: records.length ? Math.round(present / records.length * 100) : 0 };
      });
      return send(res, 200, report);
    }
    if (req.method === 'GET' && url.pathname === '/api/attendance/export') {
      const data = readData();
      const lines = ['Roll Number,Name,Department,Date,Status'];
      for (const a of data.attendance) {
        const s = data.students.find(st => st.id === a.studentId);
        if (s) lines.push([s.rollNo, s.name, s.department, a.date, a.status].map(v => `"${String(v).replaceAll('"','""')}"`).join(','));
      }
      return send(res, 200, lines.join('\r\n'), 'text/csv; charset=utf-8');
    }
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname.startsWith('/'))) {
      const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
      const target = path.resolve(PUBLIC_DIR, relative);
      if (!target.startsWith(path.resolve(PUBLIC_DIR) + path.sep) && target !== path.join(PUBLIC_DIR, 'index.html'))
        return send(res, 403, { error: 'Forbidden' });
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return send(res, 404, { error: 'Not found' });
      const ext = path.extname(target);
      const type = ext === '.css' ? 'text/css; charset=utf-8' : ext === '.js' ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8';
      return send(res, 200, fs.readFileSync(target, 'utf8'), type);
    }
    return send(res, 404, { error: 'Not found' });
  } catch (err) {
    return send(res, 500, { error: 'Internal server error', detail: err.message });
  }
});
if (require.main === module) {
  ensureData();
  server.listen(PORT, '0.0.0.0', () => console.log(`Student Attendance Management System running on http://localhost:${PORT}`));
}
module.exports = { server };
