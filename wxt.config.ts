import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'Browsing Context Capture',
    description:
      'Captures browsing interactions into a local database for natural language querying',
    permissions: [
      'storage',
      'unlimitedStorage',
      'activeTab',
      'sidePanel',
      'webNavigation',
      'offscreen',
    ],
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
    web_accessible_resources: [
      {
        resources: ['wasm/*'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
