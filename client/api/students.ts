import { http } from './http';

export type RegisterStudentInput = {
  name: string;
  rollNumber: string;
  subject: string;
  section: string;
  sessionType: 'Lecture' | 'Tutorial' | 'Practical' | 'Skill';
  faceDescriptor?: number[]; // Client-processed face descriptor (preferred)
  faceImageBase64?: string; // Fallback: base64 image for server processing
};

export type Student = {
  id: string;
  name: string;
  rollNumber: string;
  subject: string;
  section: string;
  sessionType: string;
  createdAt: string;
};

export type GetStudentsResponse = {
  students: Student[];
};

export async function getStudentsApi(subject: string, section: string): Promise<GetStudentsResponse> {
  const res = await http.get<GetStudentsResponse>(`/api/students?subject=${encodeURIComponent(subject)}&section=${encodeURIComponent(section)}`);
  return res.data;
}

export async function deleteStudentApi(studentId: string): Promise<{ message: string }> {
  const res = await http.delete<{ message: string }>(`/api/students/${studentId}`);
  return res.data;
}

export type UpdateStudentInput = {
  name?: string;
  rollNumber?: string;
  faceImageBase64?: string;
};

export async function registerStudentApi(input: RegisterStudentInput): Promise<{ message: string; student: Student }> {
  const res = await http.post<{ message: string; student: Student }>('/api/students/register', input);
  return res.data;
}

export async function updateStudentApi(studentId: string, input: UpdateStudentInput): Promise<{ message: string }> {
  const res = await http.put<{ message: string }>(`/api/students/${studentId}`, input);
  return res.data;
}

