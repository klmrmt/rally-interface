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

    await expect(page.getByRole("button", { name: "New rally" })).toBeVisible();
    await expect(page.getByPlaceholder("Join code")).toBeVisible();
  });

  test("2 - Create a new rally via wizard", async ({ page }) => {
    await authenticatePage(page, authToken);
    await page.goto("/create");

    // Step 1: Group name
    await expect(page.getByText("Step 1 of 4")).toBeVisible();
    await page.getByPlaceholder("Friday Night Crew").fill("E2E Test Hangout");
    await page.getByRole("button", { name: "Next" }).click();

    // Step 2: Date & time — pick tomorrow's date from the calendar
    await expect(page.getByText("Step 2 of 4")).toBeVisible();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayNumber = tomorrow.getDate().toString();
    await page.locator("button").filter({ hasText: new RegExp(`^${dayNumber}$`) }).first().click();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 3: Call to action — skip
    await expect(page.getByText("Step 3 of 4")).toBeVisible();
    await page.getByText("Skip for now").click();

    // Step 4: Location — skip, then create
    await expect(page.getByText("Step 4 of 4")).toBeVisible();
    await page.getByRole("button", { name: "Create Rally" }).click();

    // Should show share sheet with hex code
    await page.waitForSelector('text="Share"', { timeout: 15000 });
    const url = page.url();
    const match = url.match(/\/([A-Z0-9]{6})/i);
    if (match) {
      hexId = match[1];
    } else {
      const shareText = await page.textContent("body");
      const hexMatch = shareText?.match(/[A-Z0-9]{6}/);
      hexId = hexMatch?.[0] ?? "";
    }
    expect(hexId).toMatch(/^[A-Z0-9]{6}$/i);
  });

  test("3 - Join the rally", async ({ page }) => {
    await authenticatePage(page, authToken);
    await page.goto(`/${hexId}`);

    await expect(page.getByText("E2E Test Hangout")).toBeVisible();
    await expect(page.getByRole("button", { name: "Vote on what to do" })).toBeVisible();

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

    // Step 1: Budget
    await expect(page.getByText("Budget")).toBeVisible();
    await page.getByRole("button", { name: "$$", exact: true }).click();

    // Step 2: Vibe
    await expect(page.getByText("Vibe")).toBeVisible();
    await page.getByRole("button", { name: "Chill" }).click();

    // Step 3: Distance — scroll or wait for section
    await page.getByRole("button", { name: "Nearby" }).click();

    // Submit
    await page.getByRole("button", { name: "Lock it in" }).click();
    await page.waitForURL(`**/${hexId}/waiting`, { timeout: 10000 });
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

    // Owner sees the recommendation selection UI
    await expect(page.getByText("Choose the spot")).toBeVisible({ timeout: 10000 });

    await expect(page.getByText("The Test Cafe")).toBeVisible();
    await expect(page.getByText("Sunset Park Hangout")).toBeVisible();
    await expect(page.getByText("Jazz Lounge Downtown")).toBeVisible();

    // Select a recommendation
    await page.getByText("The Test Cafe").click();
    await page.getByRole("button", { name: "Choose this spot" }).click();

    // Confirm dialog
    await page.getByRole("button", { name: "Lock it in" }).click();

    await page.waitForURL(`**/${hexId}/result`, { timeout: 10000 });
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

    await expect(page.getByText("It's decided")).toBeVisible();
    await expect(page.getByText("The Test Cafe")).toBeVisible();
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

    // Thumbs up button (first button in the feedback area)
    const thumbButtons = page.locator("section").last().locator("button").first();
    await thumbButtons.click();

    await page.getByRole("button", { name: "Great vibe" }).click();
    await page.getByRole("button", { name: "Submit feedback" }).click();

    await expect(page.getByText("Thanks!")).toBeVisible({ timeout: 10000 });
  });

  test("8 - Rally appears on dashboard", async ({ page }) => {
    await authenticatePage(page, authToken);
    await page.goto("/dashboard");

    await expect(page.getByText("E2E Test Hangout").first()).toBeVisible({ timeout: 10000 });
  });
});
