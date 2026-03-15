import { createPaginatedListSchema } from "../../shared/models/paginated-list.schema";
import { UserSchema } from "./user-response.schema";

export const UserListSchema = createPaginatedListSchema(UserSchema);

export type UserList = typeof UserListSchema._output;
