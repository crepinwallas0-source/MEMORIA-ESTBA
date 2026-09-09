import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("MEMORIA access control", () => {
  it("requires authentication to browse published resources", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.resources.list({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("prevents a student from using administrator procedures", async () => {
    const caller = appRouter.createCaller(createContext({
      id: 22,
      openId: "student-open-id",
      name: "Étudiant Test",
      email: "student@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));
    await expect(caller.admin.stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
