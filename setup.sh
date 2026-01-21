#!/bin/bash
# Mercana Shopify App Setup Script
# Run this after `shopify app init` to configure the app with Mercana settings

set -e

# Get the client_id from the generated config
CLIENT_ID=$(grep 'client_id' shopify.app.toml | head -1 | cut -d'"' -f2)

if [ -z "$CLIENT_ID" ]; then
    echo "Error: Could not find client_id in shopify.app.toml"
    exit 1
fi

echo "Found Client ID: $CLIENT_ID"

# Get the app name from the generated config
APP_NAME=$(grep '^name' shopify.app.toml | head -1 | cut -d'"' -f2)
echo "App Name: $APP_NAME"

# Overwrite with Mercana config
cat > shopify.app.toml << EOF
client_id = "$CLIENT_ID"
name = "$APP_NAME"
application_url = "https://mercana.so"
embedded = false

[access_scopes]
scopes = "read_customers,read_orders,read_products"

[auth]
redirect_urls = [
  "https://api.mercana.so/auth/shopify/callback"
]

[webhooks]
api_version = "2024-01"
EOF

echo ""
echo "Updated shopify.app.toml with Mercana config"
echo ""

# Deploy config without releasing and capture output
echo "Deploying config to Shopify (without release)..."
DEPLOY_OUTPUT=$(shopify app deploy --no-release --force 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract app ID from the deploy output URL
# URL format: https://dev.shopify.com/dashboard/199632589/apps/314274119681/versions/...
APP_ID=$(echo "$DEPLOY_OUTPUT" | grep -o 'apps/[0-9]*' | head -1 | cut -d'/' -f2)

echo ""
echo "========================================="
echo "SETUP COMPLETE"
echo "========================================="
echo "Client ID: $CLIENT_ID"
echo "App ID: $APP_ID"
echo ""

if [ -n "$APP_ID" ]; then
    SETTINGS_URL="https://dev.shopify.com/dashboard/199632589/apps/$APP_ID/settings"
    echo "Opening Partner Dashboard to get Client Secret..."
    echo "$SETTINGS_URL"

    # Open the browser (works on macOS)
    if command -v open &> /dev/null; then
        open "$SETTINGS_URL"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$SETTINGS_URL"
    fi
else
    echo "Could not extract App ID. Please go to:"
    echo "https://dev.shopify.com/dashboard/199632589/apps"
fi

echo "========================================="
