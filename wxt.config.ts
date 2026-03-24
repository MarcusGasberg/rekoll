import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  manifest: {
    name: "Rekoll",
    description:
      "Captures browsing interactions into a local database for natural language querying",
    permissions: [
      "storage",
      "unlimitedStorage",
      "activeTab",
      "alarms",
      "sidePanel",
      "webNavigation",
      "offscreen",
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
    web_accessible_resources: [
      {
        resources: ["wasm/*"],
        matches: ["<all_urls>"],
      },
    ],
    browser_specific_settings: {
      gecko: {
        id: "{2e11b7da-b5c5-4b21-969e-809b1b15776e}",
        // @ts-expect-error -- valid Firefox manifest key, not yet in WXT types
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
  },
  hooks: {
    "build:manifestGenerated": (_wxt, manifest) => {
      // Remove Chrome-only permissions for Firefox (MV2)
      if (manifest.manifest_version === 2 && manifest.permissions) {
        const chromeOnly = ["sidePanel", "offscreen"];
        manifest.permissions = manifest.permissions.filter(
          (p: string) => !chromeOnly.includes(p),
        );
      }
    },
  },
});
