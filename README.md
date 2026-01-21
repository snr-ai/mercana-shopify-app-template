# Mercana Shopify App Template

Minimal Shopify app template for creating per-customer Mercana OAuth apps.

## Usage

### Step 1: Create the app

```bash
cd /tmp
shopify app init --name "Mercana <StoreName>" --template https://github.com/snr-ai/mercana-shopify-app-template
```

This will prompt you to confirm creating the app. Say yes.

### Step 2: Configure with Mercana settings

```bash
cd mercana-<storename>
./setup.sh
```

This script will:
1. Extract the Client ID from the generated config
2. Overwrite the config with Mercana settings (redirect URL, app URL, scopes)
3. Deploy the config to Shopify (without releasing)

### Step 3: Get the Client Secret

Go to the Partner Dashboard and copy the Client Secret:
https://dev.shopify.com/dashboard/199632589/apps

## Pre-configured Settings

- **App URL**: `https://mercana.so`
- **Embedded**: `false` (not embedded in Shopify admin)
- **Scopes**: `read_customers`, `read_orders`, `read_products`
- **Redirect URL**: `https://api.mercana.so/auth/shopify/callback`

## After Setup

1. Copy the **Client ID** (shown by the setup script)
2. Get the **Client Secret** from the Partner Dashboard
3. Store them in Mercana for the organization
4. Complete the OAuth install flow
