
pipeline {
    agent any

    environment {
        PATH = "C:\\Program Files\\nodejs;C:\\Users\\HP\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin;${env.PATH}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate') {
            steps {
                bat 'node --version'
                bat 'npm --version'
                bat 'docker --version'
            }
        }

        stage('Test') {
            steps {
                bat 'npm test'
            }
        }

        stage('Docker Build') {
            steps {
                bat 'docker build -t student-attendance-app:latest .'
            }
        }
    }

    post {
        success {
            echo 'Student Attendance Management System pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed. Check Console Output for details.'
        }
    }
}
