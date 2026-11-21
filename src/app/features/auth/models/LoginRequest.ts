import { UserRole } from "./UserRole";

export interface LoginPayload {
  email: string;
  passwordHash: string; 
  userRole: UserRole; 
}