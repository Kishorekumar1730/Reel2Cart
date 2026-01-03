# Reel2Cart Legal & Help Documents

This directory contains the static HTML files for:
- Terms & Conditions
- Privacy Policy
- Help Guide

## Localization
Each file contains embedded JavaScript to handle localization for:
- English
- Arabic
- Hindi
- Tamil
- Telugu
- Malayalam
- Kannada

The language can be set via a query parameter `?lang=en` or selected via the dropdown on the page.

## Deployment to Vercel
To deploy these documents to Vercel:
1. Move into the `legal` directory: `cd legal`
2. Run `vercel` (for preview) or `vercel --prod` (for production)
3. Ensure the project name is set to `reel2cart` so the URLs become `reel2cart.vercel.app/terms`, etc.

## Rewrite Rules
The `vercel.json` file handles the mapping from clean URLs to HTML files:
- `/terms` -> `terms.html`
- `/privacy` -> `privacy.html`
- `/help` -> `help.html`
