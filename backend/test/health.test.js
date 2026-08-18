import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("GET /api/health", () => {
  it("returns an ok status while database credentials remain supplied by the environment", async () => {
    const server = await new Promise((resolve) => {
      const listener = app.listen(0, () => resolve(listener));
    });

    try {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);

      expect(process.env.POSTGRES_PASSWORD).toBeTruthy();
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ status: "ok" });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
