# Stripe Test Subscription Manual Repair Note

The following test subscription was created prior to metadata association:

- **Customer ID**: `cus_UpEcLLwxDNXB2D`
- **Subscription ID**: `sub_1TpaATKbdD0nmGG4wkFRF2qU`

## Rationale
Since this Checkout Session was initiated without an authenticated user context (null `client_reference_id` and empty metadata), the incoming Stripe webhook could not map it to any Supabase user. Consequently, the user's local account entitlement stayed `Free` while their Stripe session was marked `paid`.

## Action Plan
1. Log in to the Stripe Dashboard (Test Mode).
2. Look up customer `cus_UpEcLLwxDNXB2D`.
3. Locate subscription `sub_1TpaATKbdD0nmGG4wkFRF2qU` and cancel/delete it to release the billing state.
4. Perform the checkout flow again on the PromptPolish platform with the new updates. The session will now be properly associated with your authenticated Supabase user and immediately upgrade your account to Pro on success.
