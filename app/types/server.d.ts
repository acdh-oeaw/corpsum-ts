import type { JWTPayload } from "jose";

export interface AuthPayload extends JWTPayload {
	username: string;
}
