import express from "express";
import { mnemonicToAccount } from "viem/accounts";
import cors from "cors";
import { chromium } from "playwright";
import { v4 as uuidv4 } from "uuid";

const app = express();
const port = process.env.APP_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory session store to keep browser instances alive
const sessions = new Map();

// Cleanup old sessions after 10 minutes
const SESSION_TIMEOUT = 10 * 60 * 1000; // 5 minutes

setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TIMEOUT) {
      console.log(`Cleaning up expired session: ${sessionId}`);
      if (session.browser) {
        session.browser.close().catch(console.error);
      }
      sessions.delete(sessionId);
    }
  }
}, 60000); // Check every 10 seconds

// Get the TEE mnemonic from environment
const mnemonic = process.env.MNEMONIC;

if (!mnemonic) {
  throw new Error("MNEMONIC not found in environment");
}

// Derive account from mnemonic
const account = mnemonicToAccount(mnemonic);

// Route 1: Return TEE public address
app.get("/tee-address", (req, res) => {
  res.json({
    address: account.address,
    message: "This is the TEE public address derived from the mnemonic",
  });
});

// Route 2: Return signed "gm" message
app.get("/gm", async (req, res) => {
  const timestamp = Date.now();
  const message = `gm${timestamp}`;

  try {
    const signature = await account.signMessage({
      message: message,
    });

    res.json({
      message: message,
      timestamp: timestamp,
      signature: signature,
      address: account.address,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to sign message" });
  }
});

// Step 1: Login to Amazon Pay with email and password
app.post("/api/login/step1", async (req, res) => {
  const { username, password } = req.body;

  // Validate required fields
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required",
    });
  }

  let browser;
  let sessionId;

  try {
    sessionId = uuidv4();
    console.log(`[${sessionId}] Starting Step 1: Login to Amazon Pay`);

    // Launch browser
    console.log(`[${sessionId}] Launching browser...`);
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to Amazon Pay history page (will redirect to login)
    console.log(`[${sessionId}] Navigating to Amazon Pay...`);
    await page.goto("https://amazon.in/pay/history", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Fill email and click continue
    console.log(`[${sessionId}] Waiting for email field...`);
    await page.waitForSelector("#ap_email", { timeout: 10000 });
    await page.fill("#ap_email", username);
    console.log(`[${sessionId}] Email filled, pressing Enter...`);
    await page.press("#ap_email", "Enter");

    // Wait for password field
    console.log(`[${sessionId}] Waiting for password field...`);
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("#ap_password", { timeout: 10000 });

    // Fill password and submit
    console.log(`[${sessionId}] Filling password...`);
    await page.fill("#ap_password", password);
    await page.press("#ap_password", "Enter");

    // Check if confirmation code needs to be sent
    try {
      await page.waitForSelector("#auth-send-code", { timeout: 5000 });
      console.log(`[${sessionId}] Send code button found, clicking...`);
      await page.click("#auth-send-code");
    } catch (e) {
      console.log(
        `[${sessionId}] No confirmation code button detected, continuing...`
      );
    }

    // Wait for 2FA OTP field
    console.log(`[${sessionId}] Waiting for 2FA OTP field...`);
    await page.waitForSelector("#auth-mfa-otpcode", { timeout: 10000 });

    // Log current page URL and title
    const currentUrl = page.url();
    const currentTitle = await page.title();
    console.log(`[${sessionId}] Current page URL:`, currentUrl);
    console.log(`[${sessionId}] Current page title:`, currentTitle);

    // Store session data
    sessions.set(sessionId, {
      browser,
      context,
      page,
      email: username,
      createdAt: Date.now(),
    });

    console.log(`[${sessionId}] Step 1 completed! Waiting for OTP...`);

    return res.json({
      success: true,
      sessionId: sessionId,
      message: "Login successful. Please enter the OTP sent to your device.",
    });
  } catch (error) {
    console.error(`[${sessionId || "unknown"}] Error during Step 1:`, error);
    if (browser) {
      await browser.close().catch(console.error);
    }
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "An error occurred during login",
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

// Step 2: Submit OTP and retrieve transaction data
app.post("/api/login/step2", async (req, res) => {
  const { sessionId, otp } = req.body;

  // Validate required fields
  if (!sessionId || !otp) {
    return res.status(400).json({
      success: false,
      error: "Session ID and OTP are required",
    });
  }

  // Retrieve session
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: "Invalid or expired session. Please start over.",
    });
  }

  const { browser, page } = session;

  try {
    console.log(`[${sessionId}] Starting Step 2: Submitting OTP`);

    // Fill in 2FA OTP
    console.log(`[${sessionId}] Entering OTP...`);
    await page.fill("#auth-mfa-otpcode", otp);
    await page.press("#auth-mfa-otpcode", "Enter");
    console.log(`[${sessionId}] 2FA OTP submitted`);

    // Wait for /pay/history page to load after authentication
    console.log(`[${sessionId}] Waiting for pay/history page...`);
    await page.waitForURL("**/pay/history", { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    const currentUrl = page.url();
    const currentTitle = await page.title();
    console.log(`[${sessionId}] Current page URL:`, currentUrl);
    console.log(`[${sessionId}] Current page title:`, currentTitle);

    // Navigate to first transaction
    console.log(`[${sessionId}] Navigating to first transaction...`);
    try {
      // Click first <a> inside #transaction-desktop
      const firstLink = page.locator("#transaction-desktop > a").first();
      await firstLink.click();

      console.log(`[${sessionId}] Clicked first transaction link`);
    } catch (e) {
      console.error(`[${sessionId}] Error navigating to transaction:`, e);
      throw new Error("Could not find or click transaction link");
    }

    // Wait for transaction receipt to load and extract data
    console.log(`[${sessionId}] Waiting for transaction receipt...`);
    try {
      await page.waitForSelector("#payui-transaction-receipt-id", {
        timeout: 10000,
      });

      const dataValue = await page
        .locator("#payui-transaction-receipt-id")
        .getAttribute("data");

      console.log(`[${sessionId}] Data attribute retrieved`);

      if (!dataValue) {
        throw new Error("Transaction receipt data not found");
      }

      const data = JSON.parse(dataValue);

      console.log(data);

      // Extract transaction details
      const paymentTotalAmount = data.paymentStatusDetails.paymentAmount;
      const paymentStatusTitle = data.paymentStatusDetails.status;

      const receiverUpiId =
        data.paymentEntityOfTypePaymentMethodEntity.paymentMethodInstruments[0]
          .unmaskedVpaId;

      const upiTransactionId =
        data.identifierEntities[0].identifierValues[0].ctaTitle;

      const paymentData = {
        paymentStatusTitle: paymentStatusTitle,
        paymentTotalAmount: paymentTotalAmount,
        receiverUpiId: receiverUpiId,
        upiTransactionId: upiTransactionId,
      };

      const signature = await account.signTypedData({
        domain: {
          name: "PaymentVerificationService",
          version: "1",
          chainId: 42161,
          verifyingContract: "0x5b866b6655234b3b6f9b3bd86f068a99622f5919",
        },
        types: {
          PaymentData: [
            { name: "paymentStatusTitle", type: "string" },
            { name: "paymentTotalAmount", type: "uint256" },
            { name: "receiverUpiId", type: "string" },
            { name: "upiTransactionId", type: "string" },
          ],
        },
        primaryType: "PaymentData",
        message: paymentData,
      });

      // Cleanup
      await browser.close();
      sessions.delete(sessionId);

      return res.json({
        success: true,
        transaction: paymentData,
        signature: signature,
        message: "Transaction data retrieved successfully!",
      });
    } catch (e) {
      console.error(`[${sessionId}] Error scraping receipt:`, e);
      throw new Error("Failed to extract transaction data: " + (e as Error).message);
    }
  } catch (error) {
    console.error(`[${sessionId}] Error during Step 2:`, error);
    if (browser) {
      await browser.close().catch(console.error);
    }
    sessions.delete(sessionId);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "An error occurred during OTP submission",
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});


// Health check endpoint for Caddy
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(port, () => {
  console.log(`TEE Express app listening on port ${port}`);
});

