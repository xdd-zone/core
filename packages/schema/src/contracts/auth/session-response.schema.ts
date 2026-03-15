import { SessionDataSchema } from "../../domains/auth/auth-session.schema";

export const SessionSchema = SessionDataSchema;

export type Session = typeof SessionSchema._output;
