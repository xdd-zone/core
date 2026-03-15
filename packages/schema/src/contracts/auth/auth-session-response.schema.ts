import { AuthSessionDataSchema } from "../../domains/auth/auth-session.schema";

export const AuthSessionSchema = AuthSessionDataSchema;

export type AuthSession = typeof AuthSessionSchema._output;
