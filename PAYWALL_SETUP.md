# Paywall & In-App Purchase Setup

Epistle uses **RevenueCat** for cross-platform in-app subscriptions (iOS App Store + Google Play).

## 1. Create a RevenueCat account

1. Sign up at [app.revenuecat.com](https://app.revenuecat.com)
2. Create a new project (e.g. "Epistle")
3. Add your iOS app (bundle ID) and Android app (package name)
4. Copy the **public API keys** from Project → API Keys

## 2. Add API keys

Edit `src/shared/utils/constants.ts`:

```ts
export const REVENUECAT_API_KEY_APPLE = 'appl_YOUR_ACTUAL_IOS_KEY';
export const REVENUECAT_API_KEY_GOOGLE = 'goog_YOUR_ACTUAL_ANDROID_KEY';
```

## 3. Configure products in RevenueCat

1. In RevenueCat dashboard: **Products** → add your App Store / Play Store product IDs
2. Create an **Entitlement** (e.g. `premium`) and attach products to it
3. Create an **Offering** with packages (monthly, annual, etc.)
4. Set the entitlement ID in `constants.ts` if different from `premium`:

```ts
export const REVENUECAT_ENTITLEMENT_ID = 'premium';
```

## 4. iOS: Enable In-App Purchase

1. Open `ios/Epistle.xcworkspace` in Xcode
2. Select the Epistle target → **Signing & Capabilities**
3. Click **+ Capability** → add **In-App Purchase**

## 5. App Store Connect / Google Play Console

- **iOS**: Create subscription products in App Store Connect (e.g. monthly, annual with 3-day trial)
- **Android**: Create subscription products in Google Play Console

Link these product IDs in the RevenueCat dashboard.

## Testing

- **RevenueCat Test Store**: New projects include a Test Store—no App Store/Play setup needed for initial testing
- **Sandbox**: Use sandbox test accounts for real store testing
- See [RevenueCat Sandbox Testing](https://www.revenuecat.com/docs/test-and-launch/sandbox) for details
