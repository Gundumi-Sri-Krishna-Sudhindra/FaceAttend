import { http } from './http';

export type LoginInput = { username: string; password: string };
export type LoginResponse = { token: string; user: { id: string; name: string; username: string } };

export async function loginApi(data: LoginInput): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>('/api/auth/login', data);
  return res.data;
}

export type RegisterInput = { name: string; email: string; username: string; password: string };
export async function registerApi(data: RegisterInput): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>('/api/auth/register', data);
  return res.data;
}

export type UpdateProfileInput = { name: string; email: string; username: string };
export type UpdateProfileResponse = { user: { id: string; name: string; username: string; email?: string } };

export async function updateProfileApi(data: UpdateProfileInput): Promise<UpdateProfileResponse> {
  const res = await http.put<UpdateProfileResponse>('/api/auth/profile', data);
  return res.data;
}

export async function getProfileApi(): Promise<UpdateProfileResponse> {
  const res = await http.get<UpdateProfileResponse>('/api/auth/profile');
  return res.data;
}

export async function changePasswordApi(data: { oldPassword: string; newPassword: string; confirmPassword: string }): Promise<{ message: string }> {
  const res = await http.post<{ message: string }>('/api/auth/change-password', data);
  return res.data;
}


