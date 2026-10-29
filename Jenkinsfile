
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate') {
            steps {
                bat '"C:\\Program Files\\nodejs\\node.exe" --version'
                bat '"C:\\Program Files\\nodejs\\npm.cmd" --version'
            }
        }

        stage('Test') {
            steps {
                bat '"C:\\Program Files\\nodejs\\npm.cmd" test'
            }
        }

        stage('Docker Build') {
            steps {
                bat '"C:\\Users\\HP\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe" build -t student-attendance-app:latest .'
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
