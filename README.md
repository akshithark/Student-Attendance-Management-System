# Student Attendance Management System using DevOps Tools

A web-based student attendance tracker built with Node.js, HTML, CSS, and JavaScript. DevOps components include Git/GitHub, automated tests, Docker, Jenkins, and Kubernetes.

## Features
- Register students using roll number, name, and department.
- Record Present, Absent, or Late attendance for a date.
- Prevent duplicate roll numbers and duplicate attendance entries for the same student/date.
- Search the student directory.
- Calculate attendance percentage (Present and Late count as attended).
- Filter attendance by date and export records as CSV.
- Persist records to JSON in the configured data directory.

## Requirements
- Node.js 22.5+ (Node.js 24 LTS is suitable)
- Git
- Docker Desktop
- Optional: Jenkins and Docker Desktop Kubernetes

## Run locally (PowerShell)
```powershell
npm test
npm start
```
Open http://localhost:3000.

## GitHub
Create an empty GitHub repository, then:
```powershell
git init
git branch -M main
git add .
git commit -m "Student Attendance Management System"
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

## Docker
```powershell
docker build -t student-attendance-app:latest .
docker run -d --name student-attendance -p 3001:3000 -v attendance-data:/app/data student-attendance-app:latest
docker ps
```
Open http://localhost:3001.

## Kubernetes (Docker Desktop Kubernetes)
Ensure Kubernetes is enabled in Docker Desktop and the local image is available to the cluster.
```powershell
kubectl get nodes
kubectl apply -f k8s/attendance.yaml
kubectl get pods -n student-attendance
kubectl get svc -n student-attendance
kubectl port-forward -n student-attendance service/attendance-service 3002:3000
```
Open http://localhost:3002. Keep port-forward running.

If the pod reports `ImagePullBackOff` or `ErrImageNeverPull`, inspect `kubectl describe pod -n student-attendance POD_NAME` and confirm the local image is available to Docker Desktop Kubernetes.

## Jenkins
The included Jenkinsfile assumes a Windows Jenkins agent with Git, Node.js/npm, and Docker available. Configure a Pipeline job from SCM using the GitHub repository URL. Jenkins setup and job execution are not automatic; run the job and verify the console output.

## Important
The application is intended for a local academic demonstration and does not implement authentication or production-grade security. Do not use real sensitive student data.
