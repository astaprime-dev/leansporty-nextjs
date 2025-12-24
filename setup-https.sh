#!/bin/bash

echo "🔒 Setting up local HTTPS for Apple Sign In development"
echo ""

# Create .certs directory
mkdir -p .certs

# Generate self-signed certificate
echo "📝 Generating self-signed SSL certificate..."
openssl req -x509 -newkey rsa:4096 \
  -keyout .certs/localhost-key.pem \
  -out .certs/localhost-cert.pem \
  -days 365 -nodes \
  -subj "/CN=localhost"

echo ""
echo "✅ Certificate generated!"
echo ""
echo "📋 Next steps:"
echo "1. Trust the certificate:"
echo "   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain .certs/localhost-cert.pem"
echo ""
echo "2. Add to Apple Developer Console:"
echo "   Domain: localhost"
echo "   Return URL: https://localhost:3000/auth/callback"
echo ""
echo "3. Run the dev server with HTTPS:"
echo "   npm run dev:https"
echo ""
echo "4. Open https://localhost:3000 in your browser"
echo ""
