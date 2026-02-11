/**
 * Admin Dashboard E2E Tests
 *
 * End-to-end tests for the admin dashboard page.
 * Uses auth bypass for E2E testing (VITE_E2E_AUTH_BYPASS=true).
 *
 * @see FAS-7.1 - DAO Admin Suite extraction
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display admin dashboard heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
  });

  test('should display admin section cards', async ({ page }) => {
    await expect(page.getByText('KYC Management')).toBeVisible();
    await expect(page.getByText('Member Management')).toBeVisible();
    await expect(page.getByText('Governance Oversight')).toBeVisible();
    await expect(page.getByText('Treasury Management')).toBeVisible();
    await expect(page.getByText('System Monitoring')).toBeVisible();
    await expect(page.getByText('Content Moderation')).toBeVisible();
  });

  test('should navigate to KYC Management', async ({ page }) => {
    await page.getByText('KYC Management').click();
    await expect(page).toHaveURL('/kyc');
    await expect(page.getByText('KYC Review Administration')).toBeVisible();
  });

  test('should navigate to Member Management', async ({ page }) => {
    await page.getByText('Member Management').click();
    await expect(page).toHaveURL('/members');
    await expect(page.getByText('Member Management')).toBeVisible();
  });
});

test.describe('KYC Review Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/kyc');
  });

  test('should display KYC review page', async ({ page }) => {
    await expect(page.getByText('KYC Review Administration')).toBeVisible();
  });

  test('should display review queue', async ({ page }) => {
    await expect(page.getByText('KYC Review Queue')).toBeVisible();
  });
});
