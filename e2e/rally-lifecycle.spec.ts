import { test, expect, Page } from "@playwright/test";

const API = "http://localhost:3000/rally-api";

let authToken: string;
let userId: string;
let hexId: string;

async function seedTestUser(): Promise<{ token: string; userId: string }> {
  const res = await fetch(`${API}/test/seed-user`, { method: "POST" });
  const body = await res.json();
  if (!body.success) throw new Error("Failed to seed test user");
  return { token: body.data.token, userId: body.data.user.userId };
}

async function authenticatePage(page: Page, token: string) {
  await page.goto("/");
  await page.evaluate((t) => {
    localStorage.setItem("authToken", t.token);
    localStorage.setItem(
      "authUser",
      JSON.stringify({ userId: t.userId, displayName: "E2E Tester" })
    );
  }, { token, userId });
}

async function getParticipantToken(hex: string, displayName: string): Promise<string> {
  const res = await fetch(`${API}/session/${hex}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ displayName }),
  });
  const body = await res.json();
  if (body.data?.token) return body.data.token;
  return "";
}

async function injectManualRecommendations(hex: string): Promise<string[]> {
  const res = await fetch(`${API}/admin/${hex}/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      recommendations: [
        {
          name: "The Test Cafe",
          category: "Cafe",
          whyItFits: "Great for groups who want a chill vibe",
          distanceLabel: "5 min",
          priceLevel: "$$",
          rating: 4.5,
          mapsUrl: "https://maps.google.com/?q=test+cafe",
        },
        {
          name: "Sunset Park Hangout",
          category: "Outdoors",
          whyItFits: "Perfect outdoor spot for friend groups",
          distanceLabel: "10 min",
          priceLevel: "$",
          rating: 4.2,
        },
        {
          name: "Jazz Lounge Downtown",
          category: "Nightlife",
          whyItFits: "Live music and cocktails",
          distanceLabel: "15 min",
          priceLevel: "$$$",
          rating: 4.8,
          mapsUrl: "https://maps.google.com/?q=jazz+lounge",
        },
      ],
    }),
  });
  const body = await res.json();
  if (!body.success) throw new Error(`Failed to inject recommendations: ${body.message}`);
  return body.data.recommendations.map((r: { id: string }) => r.id);
}

test.describe.serial("Rally full lifecycle", () => {
  test.beforeAll(async () => {
    const user = await seedTestUser();
    authToken = user.token;
    userId = user.userId;
  });

  test("1 - Dashboard loads and shows create button", async ({ page }) => {
    await authenticatePage(page, authToken);
    await page.goto("/dashboard");

    await expect(page.getByText("Hey,")).toBeVisible();
    await expect(page.getByText("+ Create Rally")).toBeVisible();
  });

  test("2 - Create a new rally", async ({ page }) => {
    await authenticatePage(page, authToken);
    await page.goto("/create");

    await expect(page.getByText("Create a Rally")).toBeVisible();

    await page.getByPlaceholder("Friday Night Crew").fill("E2E Test Hangout");
    await page.getByPlaceholder("Bring your own snacks!").fill("Automated test rally");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);
    const dateStr = tomorrow.toISOString().slice(0, 16);
    await page.locator('input[type="datetime-local"]').fill(dateStr);

    await page.getByPlaceholder("Chicago, IL").fill("San Francisco, CA");

    await page.getByRole("button", { name: "Create Rally" }).click();

    await page.waitForURL(/\/[A-Z0-9]{6}$/i, { timeout: 15000 });
    hexId = page.url().split("/").pop()!;
    expect(hexId).toMatch(/^[A-Z0-9]{6}$/i);
  });

  test("3 - Join the rally", async ({ page }) => {
    await authenticatePage(page, authToken);
    await page.goto(`/${hexId}`);

    await expect(page.getByText("E2E Test Hangout")).toBeVisible();
    await expect(page.getByText("Vote on what to do")).toBeVisible();

    await page.getByRole("button", { name: "Vote on what to do" }).click();
    await page.waitForURL(`**/${hexId}/vote`, { timeout: 10000 });
  });

  test("4 - Submit preference votes", async ({ page }) => {
    const pt = await getParticipantToken(hexId, "E2E Voter");

    await authenticatePage(page, authToken);
    if (pt) {
      await page.evaluate((token) => {
        sessionStorage.setItem("participantToken", token);
      }, pt);
    }

    await page.goto(`/${hexId}/vote`);
    await expect(page.getByText("What's the vibe?")).toBeVisible();

    await page.getByRole("button", { name: "$$", exact: true }).click();
    await page.getByRole("button", { name: "Chill" }).click();
    await page.getByRole("button", { name: "Nearby" }).click();

    await page.getByRole("button", { name: "Submit my picks" }).click();
    await page.waitForURL(`**/${hexId}/waiting`, { timeout: 10000 });
    await expect(page.getByText("Finding the perfect plan")).toBeVisible();
  });

  test("5 - View recommendations after manual injection", async ({ page }) => {
    const recIds = await injectManualRecommendations(hexId);
    expect(recIds.length).toBe(3);

    const pt = await getParticipantToken(hexId, "E2E Picker");

    await authenticatePage(page, authToken);
    if (pt) {
      await page.evaluate((token) => {
        sessionStorage.setItem("participantToken", token);
      }, pt);
    }

    await page.goto(`/${hexId}/recommendations`);
    await expect(page.getByText("Perfect for your group")).toBeVisible();

    await expect(page.getByText("The Test Cafe")).toBeVisible();
    await expect(page.getByText("Sunset Park Hangout")).toBeVisible();
    await expect(page.getByText("Jazz Lounge Downtown")).toBeVisible();

    await page.getByText("The Test Cafe").click();
    await page.getByRole("button", { name: "Lock in my pick" }).click();

    await expect(page.getByText("Vote for your favorite")).toBeVisible();
    await expect(page.getByRole("button", { name: "See Results" })).toBeVisible();
  });

  test("6 - View result page", async ({ page }) => {
    const pt = await getParticipantToken(hexId, "E2E Viewer");

    await authenticatePage(page, authToken);
    if (pt) {
      await page.evaluate((token) => {
        sessionStorage.setItem("participantToken", token);
      }, pt);
    }

    await page.goto(`/${hexId}/result`);

    await expect(page.getByText("It's decided!")).toBeVisible();
    await expect(page.getByRole("heading", { name: "The Test Cafe" })).toBeVisible();
    await expect(page.getByText("Open in Maps")).toBeVisible();
  });

  test("7 - Submit feedback", async ({ page }) => {
    const pt = await getParticipantToken(hexId, "E2E Feedback");

    await authenticatePage(page, authToken);
    if (pt) {
      await page.evaluate((token) => {
        sessionStorage.setItem("participantToken", token);
      }, pt);
    }

    await page.goto(`/${hexId}/result`);
    await expect(page.getByText("How was it?")).toBeVisible();

    const experienceCircles = page.locator("h3:has-text('Overall experience') + div button");
    await experienceCircles.first().click();

    await page.getByRole("button", { name: "Great vibe" }).click();
    await page.getByRole("button", { name: "Submit feedback" }).click();

    await expect(page.getByText("Thanks for the feedback!")).toBeVisible({ timeout: 10000 });
  });

  test("8 - Rally appears on dashboard", async ({ page }) => {
    await authenticatePage(page, authToken);
    await page.goto("/dashboard");

    await expect(page.getByText("E2E Test Hangout").first()).toBeVisible({ timeout: 10000 });
  });
});
