const path = require("node:path");
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:8000";
const screenshotDir = path.resolve(__dirname, "..", "docs", "assets");

async function launchBrowser() {
  const executableCandidates = [
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].filter(Boolean);

  try {
    return await chromium.launch();
  } catch (error) {
    for (const executablePath of executableCandidates) {
      try {
        return await chromium.launch({ executablePath });
      } catch (_) {
        // Try the next locally installed browser.
      }
    }
    throw error;
  }
}

async function login(page, role, username, password) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator('[data-action="reset-demo"]').click();
  await page.locator('[data-testid="role-select"]').selectOption(role);
  await page.locator('[data-testid="username-input"]').fill(username);
  await page.locator('[data-testid="password-input"]').fill(password);
  await page.locator('[data-testid="login-submit"]').click();
  await page.locator('[data-testid="content-area"]').waitFor();
}

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  await login(page, "manager", "quanly", "quanly123");
  await page.locator('[data-testid="nav-dashboard"]').waitFor();
  await page.screenshot({ path: path.join(screenshotDir, "dashboard-desktop.png"), fullPage: true });

  await page.locator('[data-testid="nav-requests"]').click();
  await page.locator('[data-testid="request-status-REQ-1002"]').selectOption({ index: 1 });
  const selectedStatus = await page.locator('[data-testid="request-status-REQ-1002"]').inputValue();
  if (!selectedStatus) {
    throw new Error(`Request status was not persisted. Current value: ${selectedStatus}`);
  }

  await page.locator('[data-testid="nav-students"]').click();
  const studentForm = page.locator('[data-testid="student-form"]');
  await studentForm.locator('[name="name"]').fill("Tran Demo");
  await studentForm.locator('[name="code"]').fill("SV999");
  await studentForm.locator('[name="className"]').fill("CNTT Demo");
  await studentForm.locator('[name="birthDate"]').fill("2005-01-15");
  await studentForm.locator('[name="phone"]').fill("0900000999");
  await studentForm.locator('[name="email"]').fill("sv999@example.com");
  await studentForm.locator('[name="hometown"]').fill("Ha Noi");
  await studentForm.locator('[name="roomId"]').selectOption("P-A101");
  await studentForm.locator('[name="checkInDate"]').fill("2026-05-16");
  await studentForm.locator('[name="monthlyRent"]').fill("550000");
  await studentForm.locator('[name="utilityDebt"]').fill("0");
  await studentForm.locator('[name="loginPassword"]').fill("sv999pass");
  await page.locator('[data-testid="save-student"]').click();
  await page.getByRole("cell", { name: "SV999" }).waitFor();

  await page.locator('[data-testid="edit-student-SV999"]').click();
  await studentForm.locator('[name="phone"]').fill("0911111999");
  await page.locator('[data-testid="save-student"]').click();
  await page.getByText("0911111999").waitFor();

  await page.locator('[data-testid="nav-rooms"]').click();
  const roomForm = page.locator('[data-testid="room-form"]');
  await roomForm.locator('[name="name"]').fill("Z999");
  await roomForm.locator('[name="building"]').fill("Z");
  await roomForm.locator('[name="floor"]').fill("9");
  await roomForm.locator('[name="capacity"]').fill("4");
  await roomForm.locator('[name="monthlyPrice"]').fill("600000");
  await roomForm.locator('[name="electricityKwh"]').fill("0");
  await roomForm.locator('[name="waterM3"]').fill("0");
  await page.locator('[data-testid="save-room"]').click();
  await page.getByText("Z999", { exact: true }).first().waitFor();

  const facilityForm = page.locator('[data-testid="facility-form"]');
  await facilityForm.locator('[name="name"]').fill("May loc nuoc");
  await facilityForm.locator('[name="quantity"]').fill("1");
  await facilityForm.locator('[name="roomId"]').selectOption({ label: "Phòng Z999" });
  await page.locator('[data-testid="save-facility"]').click();
  await page.getByText("May loc nuoc").first().waitFor();

  await page.locator('[data-action="logout"]').click();
  await page.locator('[data-testid="role-select"]').selectOption("student");
  await page.locator('[data-testid="username-input"]').fill("SV999");
  await page.locator('[data-testid="password-input"]').fill("sv999pass");
  await page.locator('[data-testid="login-submit"]').click();
  await page.getByRole("heading", { name: "Tran Demo" }).waitFor();

  await page.locator('[data-action="logout"]').click();
  await page.locator('[data-testid="role-select"]').selectOption("student");
  await page.locator('[data-testid="username-input"]').fill("sv001");
  await page.locator('[data-testid="password-input"]').fill("123456");
  await page.locator('[data-testid="login-submit"]').click();
  await page.locator('[data-testid="nav-support"]').click();
  await page.locator('[data-testid="support-content"]').fill("Kiểm tra đèn bàn học trong phòng A101.");
  await page.locator('[data-testid="support-submit"]').click();
  await page.getByText("Kiểm tra đèn bàn học trong phòng A101.").waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(screenshotDir, "student-mobile.png"), fullPage: true });

  await browser.close();
  console.log("Smoke test passed:", baseUrl);
})();
