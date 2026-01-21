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

# Deploy config without releasing
echo "Deploying config to Shopify (without release)..."
shopify app deploy --no-release --force

echo ""
echo "========================================="
echo "SETUP COMPLETE"
echo "========================================="
echo "Client ID: $CLIENT_ID"
echo ""
echo "Now get the Client Secret from the Partner Dashboard:"
echo "https://dev.shopify.com/dashboard/199632589/apps"
echo "========================================="
