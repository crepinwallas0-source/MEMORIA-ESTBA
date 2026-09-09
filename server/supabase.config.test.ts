import { describe, expect, it } from "vitest";

describe("Supabase configuration", () => {
  it("reaches the configured REST endpoint with the publishable key", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    expect(url).toBeTruthy();
    expect(key).toBeTruthy();
    const response = await fetch(`${url}/rest/v1/institutions?select=id&limit=1`, {
      headers: { apikey: key as string, Authorization: `Bearer ${key}` },
    });
    expect(response.ok).toBe(true);
  }, 15_000);
});
