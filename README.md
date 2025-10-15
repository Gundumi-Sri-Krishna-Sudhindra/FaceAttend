# FaceAttend - AI-Powered Face Recognition Attendance System

FaceAttend is a comprehensive attendance management system that uses advanced face recognition technology to automatically mark student attendance. Built with React Native (Expo) for the mobile app and Node.js/Express for the backend, it provides a seamless, contactless attendance solution for educational institutions.

## 🚀 Features

### Core Functionality
- **Face Recognition Attendance**: Automatic student identification and attendance marking using AI-powered face detection
- **Real-time Processing**: Live camera feed with continuous face detection and instant attendance updates
- **Student Management**: Complete student registration with face enrollment and subject enrollment
- **Faculty Dashboard**: Comprehensive dashboard with current session detection and attendance management
- **Timetable Management**: Flexible timetable setup and management for different subjects and sessions
- **Attendance Reports**: Detailed attendance reports with analytics and export capabilities
- **Kiosk Mode**: Secure kiosk mode for dedicated attendance stations with password protection

### Technical Features
- **Cross-platform Mobile App**: Built with React Native/Expo for iOS and Android
- **RESTful API**: Node.js/Express backend with MongoDB database
- **JWT Authentication**: Secure authentication with JSON Web Tokens
- **FaceNet Recognition**: High-accuracy face recognition using Python microservice with FaceNet embeddings
- **Hybrid Architecture**: Python FaceNet service + Node.js backend for optimal performance
- **Real-time Updates**: Live attendance statistics and student recognition feedback
- **Offline Support**: Local storage for user sessions and offline functionality
- **Responsive Design**: Modern UI with smooth animations and intuitive user experience

## 🏗️ Architecture

### Client-Side (React Native/Expo)
```
client/
├── app/                    # Main app screens and routing
│   ├── index.tsx          # Welcome/login screen
│   ├── take-attendance.tsx # Attendance capture screen
│   └── student-registration.tsx # Student enrollment
├── components/            # Reusable UI components
│   ├── live-attendance.tsx # Real-time attendance interface
│   ├── camera-view.tsx    # Camera functionality
│   ├── dashboard.tsx     # Faculty dashboard
│   └── styles/           # Component styling
├── api/                  # API client functions
├── contexts/            # React contexts (Kiosk mode)
├── utils/               # Utility functions (face processing)
└── hooks/               # Custom React hooks
```

### Server-Side (Node.js/Express)
```
server/
├── src/
│   ├── controllers/      # Request handlers
│   │   ├── attendance.controller.ts
│   │   ├── auth.controller.ts
│   │   └── student.controller.ts
│   ├── models/          # Database schemas
│   │   ├── Attendance.ts
│   │   ├── Student.ts
│   │   └── Faculty.ts
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   │   ├── human.ts     # Legacy face recognition service
│   │   └── facenet.service.ts # FaceNet service bridge
│   ├── middleware/     # Authentication & validation
│   └── config/         # Database & environment config
```

### FaceNet Microservice (Python/Flask)
```
facenet_service/
├── face_recognition_service.py  # Flask API for face recognition
├── requirements.txt             # Python dependencies
└── README.md                   # Service documentation
```

## 🛠️ Technology Stack

### Frontend (Mobile App)
- **React Native** with Expo framework
- **TypeScript** for type safety
- **Expo Camera** for camera functionality
- **@tensorflow/tfjs** for client-side face processing
- **@vladmandic/human** for face detection
- **React Navigation** for screen navigation
- **AsyncStorage** for local data persistence
- **Redux Toolkit** for state management

### Backend (Server)
- **Node.js** with Express.js framework
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **axios** for HTTP requests to FaceNet service
- **form-data** for multipart form data
- **Canvas** for image processing
- **CORS** for cross-origin requests
- **Helmet** for security headers

### FaceNet Recognition Service (Python)
- **Python 3.8+** with Flask framework
- **FaceNet PyTorch** for face recognition
- **MTCNN** for face detection
- **PIL/Pillow** for image processing
- **NumPy** for numerical operations
- **OpenCV** for computer vision tasks

### Development Tools
- **ESLint** for code linting
- **TypeScript** for static type checking
- **Expo CLI** for mobile development
- **MongoDB Compass** for database management

## 📱 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Python 3.8+ with pip
- MongoDB (local or cloud instance)
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Quick Start (All Services)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FaceAttend
   ```

2. **Start all services with one command**
   ```bash
   ./start-services.sh
   ```

This script will:
- Start the Python FaceNet service on port 5001
- Start the Node.js backend on port 3000
- Start the React Native client on port 8081

### Manual Setup

#### FaceNet Service Setup

1. **Install Python dependencies**
   ```bash
   cd facenet_service
   pip install -r requirements.txt
   ```

2. **Start FaceNet service**
   ```bash
   python face_recognition_service.py
   ```

#### Backend Setup

1. **Install Node.js dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the server directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/face-attend
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   FACENET_SERVICE_URL=http://localhost:5001
   ```

3. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd ../client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the client directory:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/emulator**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web
   npm run web
   ```

## 🎯 Usage Guide

### For Faculty

1. **Registration/Login**
   - Create a faculty account or login with existing credentials
   - Complete profile setup with timetable configuration

2. **Student Registration**
   - Navigate to "Register Student" from the dashboard
   - Add student details (name, roll number)
   - Capture student's face for enrollment
   - Enroll students in specific subjects and sections

3. **Taking Attendance**
   - The dashboard shows current session based on timetable
   - Click "Take Attendance" for ongoing sessions
   - Camera opens in kiosk mode for secure attendance marking
   - Students look at the camera for automatic recognition
   - Real-time feedback shows attendance status

4. **Viewing Reports**
   - Access attendance reports from the dashboard
   - Filter by date range, subject, or section
   - Export reports for record keeping

### For Students

1. **Face Enrollment**
   - Students must be registered by faculty
   - Face capture during registration creates biometric profile
   - Multiple photos may be taken for better accuracy

2. **Attendance Marking**
   - Students approach the attendance station during class
   - Look directly at the camera
   - System automatically recognizes and marks attendance
   - Receive confirmation of successful attendance marking

## 🔧 Configuration

### Face Recognition Settings
- **Detection Threshold**: Configurable similarity threshold for face matching
- **Processing Mode**: Client-side or server-side face processing
- **Image Quality**: Adjustable camera quality settings
- **Detection Interval**: Configurable face detection frequency

### Kiosk Mode Settings
- **Password Protection**: Secure password-based exit from kiosk mode
- **Orientation Lock**: Portrait mode lock for consistent interface
- **System UI Control**: Hide/show system UI elements
- **Navigation Blocking**: Prevent unauthorized navigation

### Database Configuration
- **MongoDB Connection**: Configurable database connection strings
- **Indexing**: Optimized indexes for performance
- **Data Retention**: Configurable data retention policies

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **CORS Protection**: Configurable cross-origin request policies
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **Kiosk Mode Security**: Password-protected exit from kiosk mode

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Faculty registration
- `POST /api/auth/login` - Faculty login

### Student Management
- `POST /api/students/register` - Register new student
- `GET /api/students` - Get enrolled students
- `PUT /api/students/:id` - Update student information

### Attendance Management
- `POST /api/attendance/session/start` - Start attendance session
- `POST /api/attendance/mark` - Mark student attendance
- `GET /api/attendance/session/:id` - Get session details
- `GET /api/attendance/reports` - Get attendance reports

### Timetable Management
- `GET /api/timetable/:facultyId` - Get faculty timetable
- `PUT /api/timetable/:facultyId` - Update faculty timetable

## 🚀 Deployment

### Backend Deployment
1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to cloud platform** (Heroku, AWS, DigitalOcean)
   - Configure environment variables
   - Set up MongoDB Atlas or cloud database
   - Deploy using platform-specific instructions

### Mobile App Deployment
1. **Build for production**
   ```bash
   expo build:android
   expo build:ios
   ```

2. **Publish to app stores**
   - Follow Expo's publishing guidelines
   - Submit to Google Play Store and Apple App Store

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation for common solutions
- Contact the development team

## 🔮 Future Enhancements

- **Multi-language Support**: Internationalization for global use
- **Advanced Analytics**: Detailed attendance analytics and insights
- **Integration APIs**: Integration with existing school management systems
- **Offline Mode**: Enhanced offline functionality
- **Biometric Alternatives**: Support for fingerprint and other biometric methods
- **Cloud Storage**: Cloud-based face data storage and synchronization
- **Mobile App for Students**: Dedicated student mobile application

---

**FaceAttend** - Revolutionizing attendance management with AI-powered face recognition technology.
