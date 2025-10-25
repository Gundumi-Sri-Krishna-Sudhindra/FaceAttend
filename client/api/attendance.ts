import { http } from './http';

export type StartAttendanceSessionInput = {
  subject: string;
  section: string;
  sessionType: 'Lecture' | 'Tutorial' | 'Practical' | 'Skill';
  hours: number[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  };
};

export type StartAttendanceSessionResponse = {
  message: string;
  sessionId: string;
  totalStudents: number;
  students: Array<{
    id: string;
    name: string;
    rollNumber: string;
    hasFaceDescriptor: boolean;
  }>;
  // For existing sessions
  presentStudents?: number;
  absentStudents?: number;
};

export type MarkAttendanceInput = {
  sessionId: string;
  faceDescriptor?: number[];
  faceImageBase64?: string;
};

export type MarkAttendanceResponse = {
  message: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    confidence: number;
  };
  attendance: {
    present: number;
    absent: number;
    total: number;
  };
};

export type AttendanceSessionResponse = {
  session: {
    id: string;
    subject: string;
    section: string;
    sessionType: string;
    hours: number[];
    date: string;
    totalStudents: number;
    presentStudents: number;
    absentStudents: number;
    createdAt: string;
    updatedAt: string;
  };
  records: Array<{
    studentId: string;
    studentName: string;
    rollNumber: string;
    isPresent: boolean;
    markedAt: string;
    confidence?: number;
  }>;
};

export type AttendanceReportsResponse = {
  sessions: Array<{
    id: string;
    subject: string;
    section: string;
    sessionType: string;
    hours: number[];
    date: string;
    totalStudents: number;
    presentStudents: number;
    absentStudents: number;
    attendancePercentage: number;
    createdAt: string;
  }>;
};

export type AttendanceStatusResponse = {
  hasAttendance: boolean;
  sessionId?: string;
  totalStudents?: number;
  presentStudents?: number;
  absentStudents?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

// Start new attendance session
export async function startAttendanceSessionApi(data: StartAttendanceSessionInput): Promise<StartAttendanceSessionResponse> {
  const res = await http.post<StartAttendanceSessionResponse>('/api/attendance/start', data);
  return res.data;
}

// Mark attendance using face detection
export async function markAttendanceApi(data: MarkAttendanceInput): Promise<MarkAttendanceResponse> {
  const res = await http.post<MarkAttendanceResponse>('/api/attendance/mark', data);
  return res.data;
}

// Get attendance session details
export async function getAttendanceSessionApi(sessionId: string): Promise<AttendanceSessionResponse> {
  const res = await http.get<AttendanceSessionResponse>(`/api/attendance/session/${sessionId}`);
  return res.data;
}

// Get attendance reports
export async function getAttendanceReportsApi(params?: {
  subject?: string;
  section?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AttendanceReportsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.subject) queryParams.append('subject', params.subject);
  if (params?.section) queryParams.append('section', params.section);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  
  const url = `/api/attendance/reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const res = await http.get<AttendanceReportsResponse>(url);
  return res.data;
}

// Check if attendance has been taken for today's session
export async function checkAttendanceStatusApi(subject: string, section: string, sessionType: string): Promise<AttendanceStatusResponse> {
  const res = await http.get<AttendanceStatusResponse>(`/api/attendance/status?subject=${encodeURIComponent(subject)}&section=${encodeURIComponent(section)}&sessionType=${encodeURIComponent(sessionType)}`);
  return res.data;
}

// Get student attendance data for a specific subject/section/sessionType
export type StudentAttendanceData = {
  studentId: string;
  name: string;
  rollNumber: string;
  totalSessions: number;
  presentSessions: number;
  absentSessions: number;
  attendancePercentage: number;
  lastAttendanceDate: string | null;
};

export type StudentAttendanceResponse = {
  students: StudentAttendanceData[];
  totalSessions: number;
  dateRange: {
    from: string;
    to: string;
  } | null;
};

export async function getStudentAttendanceDataApi(subject: string, section: string, sessionType: string): Promise<StudentAttendanceResponse> {
  const res = await http.get<StudentAttendanceResponse>(`/api/attendance/student-data?subject=${encodeURIComponent(subject)}&section=${encodeURIComponent(section)}&sessionType=${encodeURIComponent(sessionType)}`);
  return res.data;
}
