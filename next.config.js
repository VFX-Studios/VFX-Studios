import base44 from "@base44/next-plugin"
import react from '@next.js/plugin-react'
import { defineConfig } from 'next'
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      visualEditAgent: true
    }),
    react(),
  ],
  server: {
    // Allow Netlify dev server host header
    allowedHosts: ['devserver-master--vfx-studios.netlify.app']
  }
});
