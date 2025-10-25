# FaceAttend – Face Recognition Attendance System

FaceAttend is a modern attendance management solution designed for educational institutions. The app leverages advanced face recognition technology to automatically identify and mark student attendance, eliminating the need for manual roll calls and preventing proxy attendance. With its intuitive mobile interface and secure kiosk mode, FaceAttend streamlines the attendance process while maintaining data integrity and security.

It consists of:
- A mobile client (React Native + Expo)
- A Node.js/Express backend with MongoDB
- A Python/Flask FaceNet microservice for high-accuracy embeddings

## The Problem
Manual attendance is time-consuming, error-prone, and susceptible to proxy attendance. Institutions need a fast, secure, and contactless solution that integrates with their schedule and generates reliable reports.

## The Solution
FaceAttend captures live frames from a kiosk-mode device, generates a robust FaceNet embedding server-side, matches against enrolled students for the current class session, and updates attendance in real time with clear feedback to the operator.

## 📱 Kiosk Mode for Secure Attendance
FaceAttend is designed specifically for faculty to take classroom attendance using their mobile device. In many classrooms, faculty temporarily hand their phone to a student (or a student representative) to capture attendance. To prevent misuse while the device is out of the instructor's hands, FaceAttend includes a kiosk mode. Kiosk mode restricts access to the device to only the attendance capture flow — it prevents students from opening other apps, accessing device settings, or navigating away from the attendance screen while recording attendance.

## 🚀 Features
- Face recognition attendance with FaceNet embeddings (Python microservice)
- Real-time live camera detection with 0.5s capture loop (silent)
- Student enrollment with face capture and subject/section association
- Faculty dashboard with current-session detection and one-tap "Take Attendance"
- Timetable setup and editing (supports hours 1–12+)
- Attendance sessions and detailed reports
- Secure kiosk mode for dedicated devices (Android orientation lock, UI blocking, back button handling)
- JWT authentication and protected APIs
- Settings & Profile Management: Camera permissions, faculty profile updates, password management
- Student Management: View, edit, and delete student records with real-time filtering

## 🏗️ Architecture
### Client (React Native / Expo)
```
client/
├── app/                       # Routing and screens
│   ├── index.tsx              # Welcome/login
│   ├── take-attendance.tsx    # Attendance capture screen
│   └── student-registration.tsx
├── components/
│   ├── dashboard.tsx          # Faculty dashboard (current session)
│   ├── live-attendance.tsx    # Live detection UI (status banners)
│   ├── camera-view.tsx        # Silent 0.5s capture loop
│   ├── hour-select-modal.tsx  # Hour picker
│   └── styles/
├── api/                       # Axios-based API clients
├── contexts/                  # Kiosk context
├── utils/                     # Face utils (forces server-side processing)
└── hooks/
```

### Server (Node.js / Express / TypeScript)
```
server/
├── src/
│   ├── controllers/
│   │   ├── attendance.controller.ts
│   │   ├── auth.controller.ts
│   │   └── student.controller.ts
│   ├── models/
│   │   ├── Attendance.ts
│   │   ├── Student.ts
│   │   └── Faculty.ts
│   ├── routes/
│   ├── services/
│   │   └── facenet.service.ts   # Bridge to Python service
│   ├── middleware/
│   └── config/
```

### FaceNet Microservice (Python / Flask)
```
facenet_service/
├── face_recognition_service.py   # Flask API for embeddings
├── 
└──requirements.txt
```

## 🤖 FaceNet Recognition Service

The FaceNet service is a Python Flask microservice that provides high-accuracy face recognition using pre-trained FaceNet embeddings.

### Features
- **High Accuracy**: Uses pre-trained FaceNet model for face recognition
- **REST API**: Simple HTTP interface for integration
- **Face Detection**: Automatic face detection and cropping using MTCNN
- **512D Embeddings**: Generates 512-dimensional face embeddings
- **Health Check**: Built-in health monitoring endpoint

### Installation
1. **Install Python Dependencies**:
   ```bash
   cd facenet_service
   pip install -r requirements.txt
   ```

2. **Start the Service**:
   ```bash
   python face_recognition_service.py
   ```
   The service will start on `http://localhost:5001`

### API Endpoints

#### POST `/api/recognize`
Extract face embedding from an uploaded image.

**Request**:
- Method: POST
- Content-Type: multipart/form-data
- Body: Form field `image` containing the image file

**Response**:
```json
{
  "success": true,
  "embedding": [0.1, 0.2, ...], // 512-dimensional array
  "embedding_size": 512
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "No face detected"
}
```

#### GET `/health`
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "service": "facenet-recognition"
}
```

### Model Information
- **Face Detection**: MTCNN (Multi-task CNN)
- **Face Recognition**: InceptionResnetV1 pre-trained on VGGFace2
- **Embedding Size**: 512 dimensions
- **Similarity**: Cosine similarity recommended (threshold ~0.6)

### Integration
The Node.js backend automatically communicates with this service using the `facenet.service.ts` module. The service is configured via the `FACENET_SERVICE_URL` environment variable.

## ⚙️ Settings & Student Management

### Settings Module
A dedicated section within the app for faculty and administrators to manage app-level preferences and permissions.

**Features:**
- **Camera Permissions Management** – Allows checking and re-requesting permissions directly within the app for smoother kiosk setup.  
- **Profile Management** – Update faculty profile details such as name, email, and password securely via JWT-protected endpoints.  
- **Forgot Password Flow** – Supports secure password reset through email verification or admin reset (depending on role).  
- **Device Settings (Kiosk Mode)** – Optional device lock, orientation lock, and inactivity timeout to prevent misuse in kiosk environments.

### Student Management
Integrated tools to manage student data efficiently from the faculty dashboard or settings panel.

**Capabilities:**
- **Fetch All Students** – Retrieve students dynamically filtered by course, section, or component.  
- **Update Student Data** – Edit student details including name, roll number, and associated subjects/sections.  
- **Delete Student Records** – Securely remove students from the system with backend validation and confirmation prompts.  
- **Bulk Sync** *(optional future enhancement)* – CSV upload or batch API sync for onboarding large groups.

**Endpoints:**
- `GET /api/students?course=...&section=...&component=...`
- `PUT /api/students/:id` – Update student data  
- `DELETE /api/students/:id` – Delete student  
---

## ⚙️ Tech Stack & Key Packages

### Client (React Native / Expo)
**Core Framework:**
- React Native 0.81.4, Expo ~54.0.1, TypeScript 5.9.2

**Navigation & UI:**
- expo-router ~6.0.7 (file-based routing)
- @react-navigation/native ~7.1.8, @react-navigation/native-stack ~7.3.16
- @react-navigation/bottom-tabs ~7.4.0, @react-navigation/elements ~2.6.3
- react-native-safe-area-context ~5.6.0, react-native-screens ~4.16.0

**Camera & Media:**
- expo-camera ~17.0.8 (face capture)
- expo-image ~3.0.8, expo-image-manipulator ~14.0.7
- @expo/image-utils ^0.8.7

**State Management & Data:**
- @reduxjs/toolkit ^2.9.0, react-redux ^9.2.0
- @tanstack/react-query ^5.87.4 (server state)
- @react-native-async-storage/async-storage ^1.24.0

**Networking & Security:**
- axios ^1.11.0 (HTTP client)
- react-native-keychain ^8.1.3 (secure storage)

**Development & Utilities:**
- expo-dev-client ^6.0.13, expo-constants ~18.0.9
- expo-file-system ~19.0.17, react-native-fs ^2.20.0
- papaparse ^5.5.3 (CSV parsing)
- tailwind-react-native-classnames ^1.5.1 (styling)
- @expo/vector-icons ^15.0.2 (icon library)
- react-native-vector-icons ^10.3.0 (additional icons)

**UI & Animation:**
- react-native-reanimated ~4.1.0 (animations)
- react-native-worklets 0.5.1 (background processing)
- expo-haptics ~15.0.7 (tactile feedback)
- expo-splash-screen ~31.0.10 (splash screen)

**Additional Features:**
- expo-print ~15.0.7 (PDF generation)
- expo-sharing ~14.0.7 (file sharing)
- expo-web-browser ~15.0.7 (in-app browser)
- expo-linking ~8.0.8 (deep linking)

**Development Dependencies:**
- @types/papaparse ^5.3.16 (TypeScript types)
- @types/react ~19.1.0 (React types)
- eslint ^9.25.0 (code linting)
- eslint-config-expo ~10.0.0 (Expo linting config)
- typescript ~5.9.2 (TypeScript compiler)

**Kiosk Mode & Device Control:**
- expo-screen-orientation ^9.0.7 (orientation lock)
- expo-system-ui ^6.0.7 (UI blocking)
- expo-haptics ~15.0.7 (feedback)

### Server (Node.js / Express / TypeScript)
**Core Framework:**
- Node.js, Express ^5.1.0, TypeScript 5.9.2

**Database & ODM:**
- mongoose ^8.18.1 (MongoDB integration)

**Authentication & Security:**
- jsonwebtoken ^9.0.2 (JWT tokens)
- bcryptjs ^3.0.2 (password hashing)
- helmet ^8.1.0 (security headers)
- cors ^2.8.5 (CORS handling)

**Image Processing & AI:**
- @tensorflow/tfjs ^4.22.0 (face processing fallback)
- canvas ^3.2.0 (image manipulation)
- jpeg-js ^0.4.4 (image encoding)

**HTTP & Communication:**
- axios ^1.12.2 (HTTP client)
- form-data ^4.0.4 (multipart form data)

**Development & Monitoring:**
- morgan ^1.10.1 (HTTP logging)
- dotenv ^17.2.2 (environment variables)
- ts-node-dev ^2.0.0 (development server)
- @typescript-eslint/eslint-plugin ^8.43.0 (linting)
- @typescript-eslint/parser ^8.43.0 (TypeScript linting)
- eslint ^9.35.0 (code quality)

### FaceNet Service (Python / Flask)
**Core Framework:**
- Flask 2.3.3 (web framework)

**AI & Computer Vision:**
- facenet-pytorch 2.5.3 (face recognition)
- torch 2.7.0, torchvision 0.22.0 (PyTorch)
- opencv-python 4.10.0.84 (computer vision)

**Image Processing:**
- pillow 11.0.0 (image manipulation)
- numpy 2.1.2 (numerical computing)

## 🔄 End-to-End Flow
1) Login
- Client: `POST /api/auth/login` → stores JWT in AsyncStorage; axios adds `Authorization` header.

2) Timetable
- Faculty configures sessions (subject, section, type, hours). Server validates `hours` (min 1, max 20).
- Dashboard computes “current session” based on time using `TIME_SLOTS` (now includes hour 12).

3) Student Registration
- Client captures face image (base64) and calls `POST /api/students/register`.
- Server calls Python `/api/recognize`, stores FaceNet embedding on `Student` (`faceDescriptor` legacy + `embeddings` array).

4) Start Attendance
- Client: `POST /api/attendance/start` with subject/section/type/hours.
- Server creates an attendance session with records for enrolled students.

5) Live Attendance
- `live-attendance.tsx` runs a silent frame capture every 0.5–3s and sends base64 frames to `POST /api/attendance/mark`.
- Server requests embedding from Python, matches by cosine similarity vs enrolled students; threshold defaults to 0.6.
- UI shows banners near the Start/Pause button:
  - Green: attendance marked
  - Yellow: already marked
  - Red: not found/error

6) Reports
- Client queries `GET /api/attendance/reports` and `GET /api/attendance/session/:id` for details.

## 🗂️ Schema Designs (Server)
### Faculty
```ts
// server/src/models/Faculty.ts
const SessionSchema = new Schema({
  subject: { type: String, required: true, trim: true },
  sessionType: { type: String, required: true, enum: ['Lecture','Tutorial','Practical','Skill'] },
  section: { type: String, required: true, trim: true },
  roomNumber: { type: String, required: true, trim: true },
  hours: [{ type: Number, required: true, min: 1, max: 20 }], // supports hour 12+
});
```

### Student
```ts
// server/src/models/Student.ts
{
  name: String,
  rollNumber: String,
  enrollments: [{ subject, section, facultyId }],
  faceDescriptor: [Number],       // legacy single vector
  embeddings: [[Number]],         // FaceNet embeddings array
}
```

### Attendance Session
```ts
// server/src/models/Attendance.ts
{
  facultyId,
  subject, section, sessionType, hours, date,
  totalStudents, presentStudents, absentStudents,
  records: [{
    studentId, studentName, rollNumber,
    isPresent, markedAt, confidence
  }]
}
```

## 🔌 API Overview

### Authentication & Profile
- POST `/api/auth/register` - Faculty registration
- POST `/api/auth/login` - Faculty login
- PUT `/api/auth/profile` - Update faculty profile
- GET `/api/auth/profile` - Get faculty profile
- GET `/api/auth/faculty-subjects` - Get faculty subjects/sections

### Student Management
- POST `/api/students/register` - Register student with face image
- GET `/api/students?subject=...&section=...` - Get students by class
- DELETE `/api/students/:id` - Delete student record

### Attendance System
- POST `/api/attendance/start` - Start attendance session
- POST `/api/attendance/mark` - Mark attendance (face recognition)
- GET `/api/attendance/session/:id` - Get session details
- GET `/api/attendance/reports` - Get attendance reports

### Timetable Management
- GET `/api/timetable/:facultyId` - Get faculty timetable
- PUT `/api/timetable/:facultyId` - Update faculty timetable

### FaceNet Service (Python)
- POST `/api/recognize` - Extract face embedding (multipart: `image`)
- GET `/health` - Service health check

## 🧪 Matching & Recognition Details
- Python service uses MTCNN + InceptionResnetV1 (VGGFace2). Tuned for better recall:
  - MTCNN thresholds: `[0.5, 0.6, 0.7]`
  - margin: `40`, min_face_size: `20`
  - Augmentations: rotations (±15°), horizontal flip; average embeddings
- Server matches via cosine similarity; default threshold is `0.6`.

## ⚙️ Configuration & Environment
### Client Environment
**Required Environment Variables:**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Optional Configuration:**
- Supports comma-separated URLs for failover: `http://localhost:3000,http://backup:3000`
- Development mode: Uses Expo dev client for hot reloading
- Production mode: Uses standalone APK with embedded assets

### Server Environment
**Required Environment Variables:**
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/face-attend
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FACENET_SERVICE_URL=http://localhost:5001
```

**Optional Configuration:**
```env
ALLOW_LAN_8081=true
NODE_ENV=development
```

**Note:** CORS is configured to allow all origins (`*`) by default. Set `ALLOW_LAN_8081=true` for mobile device testing on the same network.

### Python Service Environment
**Default Configuration:**
- Port: `5001`
- Host: `0.0.0.0` (all interfaces)
- Debug mode: `True` (development)

**Model Configuration:**
- Face detection: MTCNN with thresholds `[0.5, 0.6, 0.7]`
- Face recognition: InceptionResnetV1 (VGGFace2)
- Embedding size: 512 dimensions
- Similarity threshold: 0.6 (configurable)

**Performance Notes:**
- First run downloads models (~100MB)
- GPU acceleration available with CUDA
- Restart required after changing thresholds/margins

## 🧭 Setup & Run

### Quick Start (One Command)
   ```bash
./start-services.sh
```
Starts: Python FaceNet (5001), Node.js Server (3000), Expo dev server.

### Manual Setup

#### 1) Python FaceNet Service
   ```bash
cd facenet_service
pip install -r requirements.txt
python face_recognition_service.py
   ```
   - Runs on `http://localhost:5001`
   - Downloads models on first run (~100MB)

#### 2) Node.js Server
   ```bash
cd server
npm install
npm run dev
   ```
   - Runs on `http://localhost:3000`
   - Auto-reloads on file changes

#### 3) React Native Client
   ```bash
cd client
npm install
npm start
   ```
   - Expo dev server starts
   - Scan QR code with Expo Go app

### Production Deployment

#### Android APK Build
   ```bash
cd client
npx expo run:android --variant release
   ```

#### Kiosk Mode Setup
   ```bash
cd client
chmod +x setup-device-owner.sh
./setup-device-owner.sh
   ```
   - Sets up device owner mode
   - Locks orientation and UI
   - Prevents unauthorized access

## 🛠️ Troubleshooting & Tuning

### General Issues
- Face not detected: ensure good lighting, frontal face; Python service logs "No face detected".
- Poor recall: adjust threshold in server (`FACE_MATCH_THRESHOLD = 0.6`) and Python MTCNN params.
- Timetable hour 12+ not showing: ensure client `TIME_SLOTS` includes hour, server `hours.max` allows (currently 20).
- Network fallbacks: set `EXPO_PUBLIC_API_URL` with multiple URLs (comma-separated) for failover.
- Kiosk overlap: status banners in `live-attendance.tsx` render above/below the Start/Pause button.

### FaceNet Service Issues
1. **"FaceNet service is not running"**: Make sure the Python service is started on port 5001
2. **"No face detected"**: Ensure the uploaded image contains a clear, well-lit face
3. **Import errors**: Run `pip install -r requirements.txt` to install all dependencies
4. **Connection refused**: Check if the service is running and accessible at `http://localhost:5001`
5. **Model loading errors**: Ensure all required model files are downloaded and accessible

## 🔒 Security
- JWT auth, password hashing (bcryptjs), protected routes
- Helmet, CORS

## 📈 Roadmap / Future Enhancements
- On-device face quality checks and liveness hints
- Batch enrollment quality scoring
- Role-based access for admins
- Export reports (CSV/PDF)

## 📝 License
MIT License - see [LICENSE](LICENSE).

---
FaceAttend – Kiosk-grade attendance made simple.
