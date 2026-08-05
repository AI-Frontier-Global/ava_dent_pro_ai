import type { Page } from '@/components/Sidebar';

export const PAGE_TO_PATH: Record<Page, string> = {
  dashboard: '/app/dashboard',
  scheduling: '/app/scheduling',
  'patient-engagement': '/app/patient-engagement',
  'patient-intake': '/app/patients',
  imaging: '/app/imaging',
  treatment: '/app/treatment',
  insurance: '/app/insurance',
  membership: '/app/membership',
  billing: '/app/billing',
  payments: '/app/payments',
  reports: '/app/reports',
  'ai-assistant': '/app/ai-assistant',
  'ai-hub': '/app/ai-hub',
  'ai-center': '/app/ai-center',
  technology: '/app/technology',
  settings: '/app/settings',
  'ai-platform': '/app/ai-platform',
};

export const PATH_TO_PAGE: Record<string, Page> = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([page, path]) => [path, page as Page]),
);

export function pageFromPath(pathname: string): Page | null {
  return PATH_TO_PAGE[pathname] ?? null;
}

export function pathFromPage(page: Page): string {
  return PAGE_TO_PATH[page] ?? '/app/dashboard';
}
