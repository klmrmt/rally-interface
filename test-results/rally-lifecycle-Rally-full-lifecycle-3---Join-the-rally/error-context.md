# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rally-lifecycle.spec.ts >> Rally full lifecycle >> 3 - Join the rally
- Location: e2e/rally-lifecycle.spec.ts:123:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('E2E Test Hangout')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('E2E Test Hangout')

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - button "← Back" [ref=e7]
    - heading "Create a Rally" [level=1] [ref=e8]
    - paragraph [ref=e9]: Set up a hangout and invite your friends to vote.
  - generic [ref=e10]:
    - generic [ref=e11]:
      - generic [ref=e12]: Group Name *
      - textbox "Friday Night Crew" [active] [ref=e13]
    - generic [ref=e14]:
      - generic [ref=e15]: Call to Rally
      - textbox "Bring your own snacks!" [ref=e16]
      - paragraph [ref=e17]: Optional message your group will see
    - generic [ref=e18]:
      - generic [ref=e19]: Date & Time *
      - textbox [ref=e20]
    - generic [ref=e21]:
      - generic [ref=e22]: Location
      - textbox "Chicago, IL" [ref=e23]
      - paragraph [ref=e24]: General area for activity recommendations
    - button "Create Rally" [disabled] [ref=e25]
```

# Test source

```ts
  27  | async function getParticipantToken(hex: string, displayName: string): Promise<string> {
  28  |   const res = await fetch(`${API}/session/${hex}/join`, {
  29  |     method: "POST",
  30  |     headers: {
  31  |       "Content-Type": "application/json",
  32  |       Authorization: `Bearer ${authToken}`,
  33  |     },
  34  |     body: JSON.stringify({ displayName }),
  35  |   });
  36  |   const body = await res.json();
  37  |   if (body.data?.token) return body.data.token;
  38  |   return "";
  39  | }
  40  | 
  41  | async function injectManualRecommendations(hex: string): Promise<string[]> {
  42  |   const res = await fetch(`${API}/admin/${hex}/recommendations`, {
  43  |     method: "POST",
  44  |     headers: {
  45  |       "Content-Type": "application/json",
  46  |       Authorization: `Bearer ${authToken}`,
  47  |     },
  48  |     body: JSON.stringify({
  49  |       recommendations: [
  50  |         {
  51  |           name: "The Test Cafe",
  52  |           category: "Cafe",
  53  |           whyItFits: "Great for groups who want a chill vibe",
  54  |           distanceLabel: "5 min",
  55  |           priceLevel: "$$",
  56  |           rating: 4.5,
  57  |           mapsUrl: "https://maps.google.com/?q=test+cafe",
  58  |         },
  59  |         {
  60  |           name: "Sunset Park Hangout",
  61  |           category: "Outdoors",
  62  |           whyItFits: "Perfect outdoor spot for friend groups",
  63  |           distanceLabel: "10 min",
  64  |           priceLevel: "$",
  65  |           rating: 4.2,
  66  |         },
  67  |         {
  68  |           name: "Jazz Lounge Downtown",
  69  |           category: "Nightlife",
  70  |           whyItFits: "Live music and cocktails",
  71  |           distanceLabel: "15 min",
  72  |           priceLevel: "$$$",
  73  |           rating: 4.8,
  74  |           mapsUrl: "https://maps.google.com/?q=jazz+lounge",
  75  |         },
  76  |       ],
  77  |     }),
  78  |   });
  79  |   const body = await res.json();
  80  |   if (!body.success) throw new Error(`Failed to inject recommendations: ${body.message}`);
  81  |   return body.data.recommendations.map((r: { id: string }) => r.id);
  82  | }
  83  | 
  84  | test.describe.serial("Rally full lifecycle", () => {
  85  |   test.beforeAll(async () => {
  86  |     const user = await seedTestUser();
  87  |     authToken = user.token;
  88  |     userId = user.userId;
  89  |   });
  90  | 
  91  |   test("1 - Dashboard loads and shows create button", async ({ page }) => {
  92  |     await authenticatePage(page, authToken);
  93  |     await page.goto("/dashboard");
  94  | 
  95  |     await expect(page.getByText("Hey,")).toBeVisible();
  96  |     await expect(page.getByText("+ Create Rally")).toBeVisible();
  97  |   });
  98  | 
  99  |   test("2 - Create a new rally", async ({ page }) => {
  100 |     await authenticatePage(page, authToken);
  101 |     await page.goto("/create");
  102 | 
  103 |     await expect(page.getByText("Create a Rally")).toBeVisible();
  104 | 
  105 |     await page.getByPlaceholder("Friday Night Crew").fill("E2E Test Hangout");
  106 |     await page.getByPlaceholder("Bring your own snacks!").fill("Automated test rally");
  107 | 
  108 |     const tomorrow = new Date();
  109 |     tomorrow.setDate(tomorrow.getDate() + 1);
  110 |     tomorrow.setHours(19, 0, 0, 0);
  111 |     const dateStr = tomorrow.toISOString().slice(0, 16);
  112 |     await page.locator('input[type="datetime-local"]').fill(dateStr);
  113 | 
  114 |     await page.getByPlaceholder("Chicago, IL").fill("San Francisco, CA");
  115 | 
  116 |     await page.getByRole("button", { name: "Create Rally" }).click();
  117 | 
  118 |     await page.waitForURL(/\/[A-Z0-9]{6}$/i, { timeout: 15000 });
  119 |     hexId = page.url().split("/").pop()!;
  120 |     expect(hexId).toMatch(/^[A-Z0-9]{6}$/i);
  121 |   });
  122 | 
  123 |   test("3 - Join the rally", async ({ page }) => {
  124 |     await authenticatePage(page, authToken);
  125 |     await page.goto(`/${hexId}`);
  126 | 
> 127 |     await expect(page.getByText("E2E Test Hangout")).toBeVisible();
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  128 |     await expect(page.getByText("Vote on what to do")).toBeVisible();
  129 | 
  130 |     await page.getByRole("button", { name: "Vote on what to do" }).click();
  131 |     await page.waitForURL(`**/${hexId}/vote`, { timeout: 10000 });
  132 |   });
  133 | 
  134 |   test("4 - Submit preference votes", async ({ page }) => {
  135 |     const pt = await getParticipantToken(hexId, "E2E Voter");
  136 | 
  137 |     await authenticatePage(page, authToken);
  138 |     if (pt) {
  139 |       await page.evaluate((token) => {
  140 |         sessionStorage.setItem("participantToken", token);
  141 |       }, pt);
  142 |     }
  143 | 
  144 |     await page.goto(`/${hexId}/vote`);
  145 |     await expect(page.getByText("What's the vibe?")).toBeVisible();
  146 | 
  147 |     await page.getByRole("button", { name: "$$", exact: true }).click();
  148 |     await page.getByRole("button", { name: "Chill" }).click();
  149 |     await page.getByRole("button", { name: "Nearby" }).click();
  150 | 
  151 |     await page.getByRole("button", { name: "Submit my picks" }).click();
  152 |     await page.waitForURL(`**/${hexId}/waiting`, { timeout: 10000 });
  153 |     await expect(page.getByText("Finding the perfect plan")).toBeVisible();
  154 |   });
  155 | 
  156 |   test("5 - View recommendations after manual injection", async ({ page }) => {
  157 |     const recIds = await injectManualRecommendations(hexId);
  158 |     expect(recIds.length).toBe(3);
  159 | 
  160 |     const pt = await getParticipantToken(hexId, "E2E Picker");
  161 | 
  162 |     await authenticatePage(page, authToken);
  163 |     if (pt) {
  164 |       await page.evaluate((token) => {
  165 |         sessionStorage.setItem("participantToken", token);
  166 |       }, pt);
  167 |     }
  168 | 
  169 |     await page.goto(`/${hexId}/recommendations`);
  170 |     await expect(page.getByText("Perfect for your group")).toBeVisible();
  171 | 
  172 |     await expect(page.getByText("The Test Cafe")).toBeVisible();
  173 |     await expect(page.getByText("Sunset Park Hangout")).toBeVisible();
  174 |     await expect(page.getByText("Jazz Lounge Downtown")).toBeVisible();
  175 | 
  176 |     await page.getByText("The Test Cafe").click();
  177 |     await page.getByRole("button", { name: "Lock in my pick" }).click();
  178 | 
  179 |     await expect(page.getByText("Vote for your favorite")).toBeVisible();
  180 |     await expect(page.getByRole("button", { name: "See Results" })).toBeVisible();
  181 |   });
  182 | 
  183 |   test("6 - View result page", async ({ page }) => {
  184 |     const pt = await getParticipantToken(hexId, "E2E Viewer");
  185 | 
  186 |     await authenticatePage(page, authToken);
  187 |     if (pt) {
  188 |       await page.evaluate((token) => {
  189 |         sessionStorage.setItem("participantToken", token);
  190 |       }, pt);
  191 |     }
  192 | 
  193 |     await page.goto(`/${hexId}/result`);
  194 | 
  195 |     await expect(page.getByText("It's decided!")).toBeVisible();
  196 |     await expect(page.getByRole("heading", { name: "The Test Cafe" })).toBeVisible();
  197 |     await expect(page.getByText("Open in Maps")).toBeVisible();
  198 |   });
  199 | 
  200 |   test("7 - Submit feedback", async ({ page }) => {
  201 |     const pt = await getParticipantToken(hexId, "E2E Feedback");
  202 | 
  203 |     await authenticatePage(page, authToken);
  204 |     if (pt) {
  205 |       await page.evaluate((token) => {
  206 |         sessionStorage.setItem("participantToken", token);
  207 |       }, pt);
  208 |     }
  209 | 
  210 |     await page.goto(`/${hexId}/result`);
  211 |     await expect(page.getByText("How was it?")).toBeVisible();
  212 | 
  213 |     const experienceCircles = page.locator("h3:has-text('Overall experience') + div button");
  214 |     await experienceCircles.first().click();
  215 | 
  216 |     await page.getByRole("button", { name: "Great vibe" }).click();
  217 |     await page.getByRole("button", { name: "Submit feedback" }).click();
  218 | 
  219 |     await expect(page.getByText("Thanks for the feedback!")).toBeVisible({ timeout: 10000 });
  220 |   });
  221 | 
  222 |   test("8 - Rally appears on dashboard", async ({ page }) => {
  223 |     await authenticatePage(page, authToken);
  224 |     await page.goto("/dashboard");
  225 | 
  226 |     await expect(page.getByText("E2E Test Hangout").first()).toBeVisible({ timeout: 10000 });
  227 |   });
```