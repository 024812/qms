/**
 * Registry, navigation and i18n consistency.
 *
 * Blueprint §9 makes `src/modules/registry.ts` the single source for module IDs,
 * metadata and capabilities, and requires that adding a module updates the
 * sidebar, both message catalogues and the agent scope map. §13 lists
 * "registry, navigation, i18n" as a required test surface.
 *
 * Nothing here was covered before: the en/zh catalogue parity was only ever an
 * ad-hoc scan, and the two sidebar couplings below fail *silently* —
 *
 *   - `moduleIcons[module.icon] || Package` falls back to a generic box, so a
 *     new module ships with the wrong icon and no error;
 *   - `getCurrentModuleId()` matches a hand-written pathname list, so a new
 *     module simply never highlights as active;
 *   - `t('users.modules.<id>')` is called for every module on every render, so a
 *     missing key throws inside the sidebar rather than degrading.
 */

import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { MODULE_IDS, MODULE_REGISTRY, getAllModules, getModule, hasModule } from '@/modules/registry';
import en from '../../messages/en.json';
import zh from '../../messages/zh.json';

/**
 * Importing the registry pulls in every module config, and with it each module's
 * UI. Those components import `@/i18n/routing`, which is a thin wrapper over
 * `next-intl/navigation` → `next/navigation`, and that chain does not resolve
 * under Vitest. Nothing here renders a component, so the navigation surface is
 * stubbed exactly as `src/modules/cards/ui/__tests__/CardCard.test.tsx` does.
 */
vi.mock('@/i18n/routing', () => ({
  Link: () => null,
  redirect: vi.fn(),
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  getPathname: () => '/',
}));

const SIDEBAR_PATH = path.resolve(process.cwd(), 'src/components/layout/AppSidebar.tsx');
const sidebarSource = fs.readFileSync(SIDEBAR_PATH, 'utf8');

/** Every leaf key in a message catalogue, dot-joined. */
function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key)
  );
}

function lookup(catalogue: unknown, dottedKey: string): unknown {
  return dottedKey
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        typeof node === 'object' && node !== null
          ? (node as Record<string, unknown>)[part]
          : undefined,
      catalogue
    );
}

/** Members of the `const moduleIcons: Record<string, LucideIcon> = { ... }` map. */
function sidebarIconNames(): string[] {
  const block = sidebarSource.match(/const moduleIcons[^=]*=\s*\{([^}]*)\}/);
  if (!block) throw new Error('could not locate the moduleIcons map in AppSidebar.tsx');
  return block[1]
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);
}

describe('module registry', () => {
  it('registers exactly the modules in the ID vocabulary', () => {
    expect(Object.keys(MODULE_REGISTRY).sort()).toEqual([...MODULE_IDS].sort());
  });

  it('keeps every registry key equal to the module id it points at', () => {
    // Catches a copy-paste such as `maps: mapModule` where the config still
    // declares `id: 'map'` — the sidebar links to `/${module.id}`, so the two
    // disagreeing would produce a dead route.
    for (const [key, entry] of Object.entries(MODULE_REGISTRY)) {
      expect(entry.id, `registry key "${key}"`).toBe(key);
    }
  });

  it('resolves every registered module and rejects unknown ids', () => {
    for (const id of MODULE_IDS) {
      expect(getModule(id), id).toBe(MODULE_REGISTRY[id]);
      expect(hasModule(id), id).toBe(true);
    }

    expect(getModule('nonexistent')).toBeUndefined();
    expect(hasModule('nonexistent')).toBe(false);
    expect(hasModule('__proto__')).toBe(false);
  });

  it('returns every module from getAllModules', () => {
    expect(getAllModules()).toHaveLength(MODULE_IDS.length);
    expect(getAllModules().map(entry => entry.id).sort()).toEqual([...MODULE_IDS].sort());
  });

  it('gives every module the metadata the shell depends on', () => {
    for (const entry of getAllModules()) {
      expect(entry.name, `${entry.id}.name`).toBeTruthy();
      expect(entry.description, `${entry.id}.description`).toBeTruthy();
      expect(entry.icon, `${entry.id}.icon`).toBeTruthy();
      expect(entry.color, `${entry.id}.color`).toBeTruthy();
      expect(entry.formFields.length, `${entry.id}.formFields`).toBeGreaterThan(0);
    }
  });
});

describe('sidebar coupling', () => {
  it('has an icon for every module, so none silently falls back to the default', () => {
    const icons = sidebarIconNames();

    for (const entry of getAllModules()) {
      expect(icons, `module "${entry.id}" uses icon "${entry.icon}"`).toContain(entry.icon);
    }
  });

  it('recognises every module path when deciding which module is active', () => {
    for (const id of MODULE_IDS) {
      expect(sidebarSource, `no active-state check for "/${id}"`).toContain(`startsWith('/${id}')`);
    }
  });

  it('detects a missing icon, so the check above cannot pass vacuously', () => {
    const icons = sidebarIconNames();

    expect(icons.length).toBeGreaterThan(0);
    expect(icons).not.toContain('IconThatDoesNotExist');
  });
});

describe('module i18n coverage', () => {
  const catalogues = [
    { locale: 'en', messages: en },
    { locale: 'zh', messages: zh },
  ] as const;

  it('translates every module name, because the sidebar reads it on every render', () => {
    for (const { locale, messages } of catalogues) {
      for (const id of MODULE_IDS) {
        expect(lookup(messages, `users.modules.${id}`), `${locale}: users.modules.${id}`).toBeTruthy();
      }
    }
  });

  it('has a navigation label for every module', () => {
    for (const { locale, messages } of catalogues) {
      for (const id of MODULE_IDS) {
        expect(lookup(messages, `navigation.${id}`), `${locale}: navigation.${id}`).toBeTruthy();
      }
    }
  });

  it('keeps the English and Chinese catalogues key-for-key identical', () => {
    const enKeys = flattenKeys(en).sort();
    const zhKeys = flattenKeys(zh).sort();

    // Report the diff rather than the two full lists, which would be unreadable.
    expect(enKeys.filter(key => !zhKeys.includes(key))).toEqual([]);
    expect(zhKeys.filter(key => !enKeys.includes(key))).toEqual([]);
  });
});
