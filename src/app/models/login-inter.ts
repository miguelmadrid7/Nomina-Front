export interface LoginPayload {
  user: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  
}
