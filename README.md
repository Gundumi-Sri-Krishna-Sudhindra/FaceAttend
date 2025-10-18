# FaceAttend – Face Recognition Attendance System

FaceAttend is an end-to-end attendance system that uses face recognition to identify students and mark attendance automatically. It consists of:
- A mobile client (React Native + Expo)
- A Node.js/Express backend with MongoDB
- A Python/Flask FaceNet microservice for high-accuracy embeddings

## The Problem
Manual attendance is time-consuming, error-prone, and susceptible to proxy attendance. Institutions need a fast, secure, and contactless solution that integrates with their schedule and generates reliable reports.

## The Solution
FaceAttend captures live frames from a kiosk-mode device, generates a robust FaceNet embedding server-side, matches against enrolled students for the current class session, and updates attendance in real time with clear feedback to the operator.

## 🚀 Features
- Face recognition attendance with FaceNet embeddings (Python microservice)
- Real-time live camera detection with 0.5s capture loop (silent)
- Student enrollment with face capture and subject/section association
- Faculty dashboard with current-session detection and one-tap “Take Attendance”
- Timetable setup and editing (supports hours 1–12+)
- Attendance sessions and detailed reports
- Secure kiosk mode for dedicated devices (Android orientation lock, UI blocking)
- JWT authentication and protected APIs

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
├── requirements.txt
└── README.md
```

## ⚙️ Tech Stack & Key Packages
### Client
- React Native (Expo), TypeScript
- expo-camera, expo-image, expo-router
- @react-native-async-storage/async-storage
- axios
- @tensorflow/tfjs (initialized, but processing is intentionally server-side)

### Server
- Node.js, Express, TypeScript
- mongoose (MongoDB), jsonwebtoken, bcryptjs
- axios, form-data (POST images to FaceNet service)
- cors, helmet

### FaceNet Service (Python)
- Flask
- facenet-pytorch (InceptionResnetV1), MTCNN
- torch, numpy, pillow, certifi

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
### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`

### Students
- POST `/api/students/register` (requires `faceImageBase64`)

### Attendance
- POST `/api/attendance/start`
- POST `/api/attendance/mark`
- GET `/api/attendance/session/:id`
- GET `/api/attendance/reports`

### Timetable
- GET `/api/timetable/:facultyId`
- PUT `/api/timetable/:facultyId`

### FaceNet Service (Python)
- POST `/api/recognize` (multipart: `image`)
- GET `/health`

## 🧪 Matching & Recognition Details
- Python service uses MTCNN + InceptionResnetV1 (VGGFace2). Tuned for better recall:
  - MTCNN thresholds: `[0.5, 0.6, 0.7]`
  - margin: `40`, min_face_size: `20`
  - Augmentations: rotations (±15°), horizontal flip; average embeddings
- Server matches via cosine similarity; default threshold is `0.6`.

## ⚙️ Configuration & Environment
### Client `.env`
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```
Supports comma-separated URLs for failover.

### Server `.env`
   ```env
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/face-attend
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   FACENET_SERVICE_URL=http://localhost:5001
   ```

### Python Service
- Runs at `:5001` by default. Restart after changing thresholds/margins.

## 🧭 Setup & Run
### One command
   ```bash
./start-services.sh
```
Starts: Python (5001), Server (3000), Expo dev server.

### Manual
1) Python FaceNet
   ```bash
cd facenet_service && pip install -r requirements.txt
python face_recognition_service.py
   ```
2) Server
   ```bash
cd server && npm install
npm run dev
```
3) Client
   ```bash
cd client && npm install
   npm start
   ```

## 🛠️ Troubleshooting & Tuning
- Face not detected: ensure good lighting, frontal face; Python service logs “No face detected”.
- Poor recall: adjust threshold in server (`FACE_MATCH_THRESHOLD = 0.6`) and Python MTCNN params.
- Timetable hour 12+ not showing: ensure client `TIME_SLOTS` includes hour, server `hours.max` allows (currently 20).
- Network fallbacks: set `EXPO_PUBLIC_API_URL` with multiple URLs (comma-separated) for failover.
- Kiosk overlap: status banners in `live-attendance.tsx` render above/below the Start/Pause button.

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
