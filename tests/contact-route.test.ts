import { beforeEach, describe, expect, it, vi } from "vitest";

const { create } = vi.hoisted(() => ({ create: vi.fn(async () => ({ id: "m1" })) }));
vi.mock("@/lib/db", () => ({ db: { contactMessage: { create } } }));

import { POST } from "@/app/api/contact/route";
import { publicFormLimiter } from "@/lib/rate-limit";

function request(body: unknown, ip = "10.0.0.1") {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const valid = { name: "سارة العتيبي", email: "sara@example.com", message: "أرغب في الاستفسار عن مواعيد الزيارة." };

describe("POST /api/contact", () => {
  beforeEach(() => {
    create.mockClear();
    publicFormLimiter.reset();
  });

  it("stores a valid message", async () => {
    const res = await POST(request(valid));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid input with field errors and stores nothing", async () => {
    const res = await POST(request({ name: "", email: "not-an-email", message: "x" }));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(Object.keys(json.errors).length).toBeGreaterThan(0);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const res = await POST(request("{not json"));
    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("rate limits repeated submissions from one address", async () => {
    let last = 0;
    for (let i = 0; i < 12; i++) last = (await POST(request(valid, "10.0.0.9"))).status;
    expect(last).toBe(429);
    expect(create.mock.calls.length).toBe(10);
  });
});
