pipeline {
  agent any
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Validate') {
      steps {
        bat 'node --version'
        bat 'npm --version'
      }
    }
    stage('Test') {
      steps { bat 'npm test' }
    }
    stage('Docker Build') {
      steps { bat 'docker build -t student-attendance-app:latest .' }
    }
  }
}
