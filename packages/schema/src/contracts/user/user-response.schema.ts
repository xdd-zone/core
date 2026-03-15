import { UserBaseSchema } from "../../domains/auth/user-base.schema";

export const UserSchema = UserBaseSchema;

export type User = typeof UserSchema._output;
