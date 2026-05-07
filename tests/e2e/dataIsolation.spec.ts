import { test, expect } from "@playwright/test";

test.describe("Data isolation — client cannot access other clients' projects", () => {
  test("API: client cannot access a project they are not assigned to", async ({ request }) => {
    // George (user_client_george) is assigned to Kifisia Residence (proj_kifisia) only
    // He should NOT be able to access Vouliagmeni Penthouse (proj_vouliagmeni)
    const res = await request.get("/api/projects/proj_vouliagmeni", {
      headers: {
        "x-demo-user-id": "user_client_george",
        "x-demo-role": "CLIENT",
      },
    });
    expect(res.status()).toBe(403);
  });

  test("API: client can access their own assigned project", async ({ request }) => {
    const res = await request.get("/api/projects/proj_kifisia", {
      headers: {
        "x-demo-user-id": "user_client_george",
        "x-demo-role": "CLIENT",
      },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("proj_kifisia");
  });

  test("API: client cannot edit a project (role escalation)", async ({ request }) => {
    const res = await request.put("/api/projects/proj_kifisia", {
      headers: {
        "x-demo-user-id": "user_client_george",
        "x-demo-role": "CLIENT",
        "Content-Type": "application/json",
      },
      data: { status: "COMPLETED" },
    });
    expect(res.status()).toBe(403);
  });

  test("API: client cannot update stage progress", async ({ request }) => {
    const res = await request.put("/api/projects/proj_kifisia/stages", {
      headers: {
        "x-demo-user-id": "user_client_george",
        "x-demo-role": "CLIENT",
        "Content-Type": "application/json",
      },
      data: { stageId: "p2_stage_1", progress: 0 },
    });
    expect(res.status()).toBe(403);
  });

  test("API: unauthenticated request is rejected", async ({ request }) => {
    const res = await request.get("/api/projects");
    expect(res.status()).toBe(401);
  });
});
