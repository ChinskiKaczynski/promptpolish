# Stripe Billing Integration Checklist

This guide provides a manual verification checklist to safely test the Stripe integration in development/test-mode and verify the configuration before production deployment.

---

## 1. Required Local Environment Variables (`.env.local`)
To verify Stripe in development, configure these keys in your local environment file:

```bash
# Enable Stripe integration locally
STRIPE_ENABLED=true

# Stripe API Keys (Test Mode from Stripe Dashboard: https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID_PRO=price_...

# Webhook Secret (Obtained when running 'stripe listen')
STRIPE_WEBHOOK_SECRET=whsec_...

# Local Dev URL
APP_URL=http://localhost:3000
```

---

## 2. Stripe Dashboard Test Setup
1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com/).
2. Toggle the **"Test mode"** switch in the top-right corner.
3. Navigate to **Product catalog** and click **Add product**.
4. Create a product named **PromptPolish Pro**:
   - **Pricing model**: Recurring (Monthly)
   - **Price**: $9.00 USD / month
   - **Billing period**: Monthly
5. Copy the generated **Price ID** (starts with `price_...`) and save it as `STRIPE_PRICE_ID_PRO` in `.env.local`.

---

## 3. Local Webhook Forwarding
To route webhooks from Stripe to your local server:
1. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli).
2. Authenticate the CLI:
   ```bash
   stripe login
   ```
3. Start the local forwarding command:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks
   ```
4. Copy the webhook signing secret printed by the command (starts with `whsec_...`) and save it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

---

## 4. Test Scenarios

### Scenario A: Checkout Success & Active Pro
1. Start the Next.js server locally (`pnpm dev`).
2. Register/Log in to a new test account at `/login`.
3. Navigate to the `/pricing` page and click **Activate Pro with Stripe**.
4. Verify you are redirected to the Stripe Checkout page.
5. Use test credentials (e.g. Card number: `4242 4242 4242 4242`, Expiration: `12/30`, CVC: `123`) to complete the purchase.
6. Once redirected back, verify:
   - Your account plan badge changes to **Pro**.
   - Your daily and monthly usage limits reflect Pro plan metrics.
   - Database verification: Check that `stripe_customers` has your mapped row and `subscriptions` has an `active` status.

### Scenario B: Customer Portal Management
1. Navigate to `/account`.
2. Click **Manage subscription & billing** (opens the Stripe Customer Portal).
3. Verify you can view your invoice history, update payment details, or cancel the subscription.
4. Close the portal and confirm you are redirected safely back to the local account page.

### Scenario C: Entitlement Check - PDF Export
1. Run a prompt audit to generate a result.
2. Navigate to the result view page.
3. Click the **Export to PDF** button.
4. Verify the PDF downloads successfully (only permitted for Pro users).

### Scenario D: Past Due Grace Period
1. In the Stripe Dashboard under **Customers**, locate your test customer.
2. Under **Subscriptions**, select the subscription and trigger a payment failure, or change its status to **past_due** manually.
3. Verify the local account page displays the **Zaległość w płatności (Grace Period)** warning banner.
4. Verify that you **still retain Pro entitlements** (e.g., PDF export is still accessible).

### Scenario E: Unpaid Downgrade
1. Change the subscription status to **unpaid** in the Stripe Dashboard.
2. Refresh the local account page.
3. Verify that your plan badge degrades to **Free**.
4. Verify that the **Dostęp zawieszony (Access Suspended)** message is displayed.
5. Attempt a PDF export; verify that it is blocked with a `403 Forbidden` response.

### Scenario F: Cancellation / Deletion Downgrade
1. Cancel the subscription in the Customer Portal or Stripe Dashboard.
2. If canceled at the end of the period, verify you retain Pro access until the period end.
3. Once the period ends (`customer.subscription.deleted` is received), verify:
   - Your plan badge reverts to **Free**.
   - The user profile `plan_slug` updates to `free` in the database.
   - PDF exports are blocked.

---

## 5. Metrics & Events Validation
Verify that the admin metrics page (`/admin`) reflects the proper event counts:
*   `checkout_started`
*   `checkout_completed`
*   `subscription_activated`
*   `subscription_canceled`
*   `checkout_failed`
