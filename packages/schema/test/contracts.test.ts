import { describe, expect, it } from "bun:test";
import {
  AuthSessionSchema,
  SessionSchema,
  SignUpEmailBodySchema,
} from "../src/contracts/auth";
import {
  CurrentUserPermissionsSchema,
  OperationResultSchema,
  PermissionListQuerySchema,
  PermissionListSchema,
  PermissionSchema,
  RoleDetailSchema,
  RoleListQuerySchema,
  RoleSchema,
  UserRolesSchema,
} from "../src/contracts/rbac";
import {
  UserListQuerySchema,
  UserListSchema,
  UserSchema,
} from "../src/contracts/user";
import { ApiErrorSchema } from "../src/shared";

describe("schema contracts", () => {
  it("coerces user list query number strings", () => {
    const parsed = UserListQuerySchema.parse({
      page: "2",
      pageSize: "50",
      keyword: "alice",
    });

    expect(parsed).toEqual({
      page: 2,
      pageSize: 50,
      keyword: "alice",
      includeDeleted: undefined,
    });
  });

  it("coerces booleanish query strings", () => {
    const parsed = UserListQuerySchema.parse({
      includeDeleted: "true",
    });

    expect(parsed.includeDeleted).toBe(true);
  });

  it("coerces booleanish rbac query strings", () => {
    const parsed = RoleListQuerySchema.parse({
      includeSystem: "false",
    });

    expect(parsed.includeSystem).toBe(false);
  });

  it("rejects invalid query edge cases", () => {
    expect(() => UserListQuerySchema.parse({ page: "0" })).toThrow();
    expect(() => UserListQuerySchema.parse({ pageSize: "0" })).toThrow();
    expect(() => UserListQuerySchema.parse({ pageSize: "-1" })).toThrow();
    expect(() => UserListQuerySchema.parse({ page: "abc" })).toThrow();
    expect(() => UserListQuerySchema.parse({ page: "1abc" })).toThrow();
    expect(() => UserListQuerySchema.parse({ page: "1.5" })).toThrow();
    expect(() =>
      UserListQuerySchema.parse({ includeDeleted: "abc" }),
    ).toThrow();
    expect(() =>
      RoleListQuerySchema.parse({ includeSystem: "FALSE" }),
    ).toThrow();
    expect(() => PermissionListQuerySchema.parse({ page: "abc" })).toThrow();
  });

  it("parses api error contracts", () => {
    const parsed = ApiErrorSchema.parse({
      code: 403,
      message: "权限不足",
      data: null,
      errorCode: "FORBIDDEN",
      details: { permission: "user:read:all" },
    });

    expect(parsed.errorCode).toBe("FORBIDDEN");
  });

  it("parses rbac response contracts", () => {
    const roles = UserRolesSchema.parse([
      {
        id: "assignment_1",
        roleId: "role_1",
        roleName: "admin",
        roleDisplayName: "Admin",
        assignedAt: "2026-03-13T00:00:00.000Z",
      },
    ]);

    const permissions = CurrentUserPermissionsSchema.parse({
      permissions: ["user:read:all"],
      roles: [
        {
          id: "role_1",
          name: "admin",
          displayName: "Admin",
        },
      ],
    });

    expect(roles).toHaveLength(1);
    expect(permissions.permissions).toContain("user:read:all");
  });

  it("parses role detail responses with full parent payload", () => {
    const roleDetail = RoleDetailSchema.parse({
      id: "role_2",
      name: "editor",
      displayName: "Editor",
      description: "content editor",
      parentId: "role_1",
      level: 1,
      isSystem: false,
      createdAt: "2026-03-13T00:00:00.000Z",
      updatedAt: "2026-03-13T00:00:00.000Z",
      parent: {
        id: "role_1",
        name: "admin",
        displayName: "Admin",
        description: "system admin",
        parentId: null,
        level: 0,
        isSystem: true,
        createdAt: "2026-03-13T00:00:00.000Z",
        updatedAt: "2026-03-13T00:00:00.000Z",
      },
      permissions: ["post:read:all"],
    });

    expect(roleDetail.parent?.description).toBe("system admin");
    expect(roleDetail.permissions).toContain("post:read:all");
  });

  it("accepts permission responses without updatedAt", () => {
    const permissionList = PermissionListSchema.parse({
      items: [
        {
          id: "perm_1",
          resource: "user",
          action: "read",
          scope: "all",
          displayName: "查看用户",
          description: null,
          createdAt: "2026-03-13T00:00:00.000Z",
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    });

    const permissionDetail = PermissionSchema.parse({
      id: "perm_1",
      resource: "user",
      action: "read",
      scope: "all",
      displayName: "查看用户",
      description: null,
      createdAt: "2026-03-13T00:00:00.000Z",
    });

    expect(permissionList.items[0]?.id).toBe("perm_1");
    expect(permissionDetail.resource).toBe("user");
  });

  it("parses operation responses with optional count", () => {
    const parsed = OperationResultSchema.parse({
      success: true,
      count: 3,
    });

    expect(parsed.count).toBe(3);
  });

  it("parses auth contracts", () => {
    const authResponse = AuthSessionSchema.parse({
      user: {
        id: "user_1",
        username: "alice",
        name: "Alice",
        email: "alice@example.com",
        emailVerified: true,
        emailVerifiedAt: "2026-03-13T00:00:00.000Z",
        introduce: null,
        image: null,
        phone: null,
        phoneVerified: null,
        phoneVerifiedAt: null,
        lastLogin: null,
        lastLoginIp: null,
        status: "ACTIVE",
        createdAt: "2026-03-13T00:00:00.000Z",
        updatedAt: "2026-03-13T00:00:00.000Z",
        deletedAt: null,
      },
      token: "token_1",
      session: null,
    });

    const sessionResponse = SessionSchema.parse({
      user: null,
      session: null,
      isAuthenticated: false,
    });

    expect(authResponse.user.id).toBe("user_1");
    expect(sessionResponse.isAuthenticated).toBe(false);
  });

  it("accepts auth responses with missing optional profile fields", () => {
    const authResponse = AuthSessionSchema.parse({
      user: {
        id: "user_1",
        name: "Alice",
        email: "alice@example.com",
        emailVerified: false,
        image: null,
        status: "active",
        createdAt: "2026-03-13T00:00:00.000Z",
        updatedAt: "2026-03-13T00:00:00.000Z",
      },
    });

    expect(authResponse.user.status).toBe("active");
    expect(authResponse.user.username).toBeUndefined();
  });

  it("validates sign-up password length", () => {
    expect(() =>
      SignUpEmailBodySchema.parse({
        email: "alice@example.com",
        password: "123",
        name: "Alice",
      }),
    ).toThrow();
  });

  it("parses user contracts", () => {
    const user = UserSchema.parse({
      id: "user_1",
      username: "alice",
      name: "Alice",
      email: "alice@example.com",
      emailVerified: true,
      emailVerifiedAt: "2026-03-13T00:00:00.000Z",
      introduce: null,
      image: null,
      phone: null,
      phoneVerified: null,
      phoneVerifiedAt: null,
      lastLogin: null,
      lastLoginIp: null,
      status: "ACTIVE",
      createdAt: "2026-03-13T00:00:00.000Z",
      updatedAt: "2026-03-13T00:00:00.000Z",
      deletedAt: null,
    });

    const userList = UserListSchema.parse({
      items: [user],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    });

    expect(userList.items[0]?.id).toBe("user_1");
  });

  it("keeps role schema available as a direct business schema", () => {
    const role = RoleSchema.parse({
      id: "role_1",
      name: "admin",
      displayName: "Admin",
      description: null,
      parentId: null,
      level: 0,
      isSystem: true,
      createdAt: "2026-03-13T00:00:00.000Z",
      updatedAt: "2026-03-13T00:00:00.000Z",
    });

    expect(role.name).toBe("admin");
  });
});
