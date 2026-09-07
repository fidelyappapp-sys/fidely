// Client-safe: no server-only imports. Split out from translateMenu.ts
// (which pulls in the service-role Supabase client) so client components
// like HubTabs can reference the locale list/type without bundling
// server-only code.
export const HUB_MENU_LOCALES = ["en", "es", "de", "it"] as const;
export type HubMenuLocale = (typeof HUB_MENU_LOCALES)[number];
