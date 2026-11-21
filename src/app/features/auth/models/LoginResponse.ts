import { UserRole } from "./UserRole";

export interface LoginResponse {
    token: string;
    email: string;
    role: UserRole; 
    userId: string;
}