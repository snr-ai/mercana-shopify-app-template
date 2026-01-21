# Mercana Shopify App Template

Minimal Shopify app template for creating per-customer Mercana OAuth apps.

## Usage

```bash
shopify app init --name "Mercana <StoreName>" --template https://github.com/snr-ai/mercana-shopify-app-template
```

This will:
1. Create a new Shopify Partner app with pre-configured settings
2. Set up OAuth redirect to `https://api.mercana.so/auth/shopify/callback`
3. Configure required scopes: `read_customers`, `read_orders`, `read_products`

## Pre-configured Settings

- **App URL**: `https://mercana.so`
- **Embedded**: `false` (not embedded in Shopify admin)
- **Scopes**: `read_customers`, `read_orders`, `read_products`
- **Redirect URL**: `https://api.mercana.so/auth/shopify/callback`

## After Creation

1. Get the **Client ID** and **Client Secret** from the Partner Dashboard
2. Store them in Mercana for the organization
3. Complete the OAuth install flow
