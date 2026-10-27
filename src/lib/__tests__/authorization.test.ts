import { describe, expect, it } from "vitest";
import { assertOwnership, assertRole, AuthorizationError } from "@/lib/authorization";

describe("ownership authorization", () => {
  it("allows the owner", () => {
    expect(() => assertOwnership("user-a", "user-a")).not.toThrow();
  });

  it("rejects another user", () => {
    expect(() => assertOwnership("user-a", "user-b")).toThrow(AuthorizationError);
  });

  it("requires the admin role for admin actions", () => {
    expect(() => assertRole("USER", "ADMIN")).toThrow(AuthorizationError);
    expect(() => assertRole("ADMIN", "ADMIN")).not.toThrow();
  });
});
