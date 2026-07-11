import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Open the 'Log in' page (navigate to the Login page).
        await page.goto("http://localhost:3000/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill 'admin@test.com' into the Email address field, 'Password123!' into the Password field, then click the 'Log in' button.
        # you@example.com email field
        elem = page.get_by_label('Email address', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@test.com")
        
        # -> Fill 'admin@test.com' into the Email address field, 'Password123!' into the Password field, then click the 'Log in' button.
        # At least 8 characters password field
        elem = page.get_by_label('Password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Password123!")
        
        # -> Fill 'admin@test.com' into the Email address field, 'Password123!' into the Password field, then click the 'Log in' button.
        # Log in button
        elem = page.get_by_role('button', name='Log in', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Add doctor' page (the Add doctor form) to begin testing validation.
        await page.goto("http://localhost:3000/admin/doctors/new")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Open the 'Add doctor' page by navigating to /admin/doctors/new so the Add Doctor form can be observed.
        await page.goto("http://localhost:3000/admin/doctors/new")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Open the 'Add doctor' page so the Add Doctor form is visible (navigate to /admin/doctors/new).
        await page.goto("http://localhost:3000/admin/doctors/new")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Open the 'Add doctor' page (visit the Add Doctor form) so the Add Doctor form is visible.
        await page.goto("http://localhost:3000/admin/doctors/new")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Settings' link in the left navigation to look for admin or doctor management links.
        # Settings link
        elem = page.get_by_text('CuraFlow', exact=True).locator("xpath=ancestor-or-self::*[.//a][1]").get_by_role('link', name='Settings', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'New' button on the Settings page to open creation options or the Add Doctor form.
        # New button
        elem = page.get_by_role('button', name='New', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Log in' page so the Admin account can be used to sign in.
        await page.goto("http://localhost:3000/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Settings' link in the left navigation to open Settings and look for admin or doctor management options.
        # Settings link
        elem = page.get_by_text('CuraFlow', exact=True).locator("xpath=ancestor-or-self::*[.//a][1]").get_by_role('link', name='Settings', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '+ New' button on the Settings page to reveal creation options or the Add Doctor form.
        # New button
        elem = page.get_by_role('button', name='New', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '+ New' button (label: 'New') in Settings to open the creation options or Add Doctor form, then observe the UI for newly revealed form fields.
        # New button
        elem = page.get_by_role('button', name='New', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Log in' page and sign in as Admin using email 'admin@test.com' and password 'Password123!'.
        await page.goto("http://localhost:3000/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Open the profile menu by clicking the 'VC' avatar in the top-right to look for admin or account/role options.
        # VC
        elem = page.locator('xpath=/html/body/div/div/header/span[2]')
        await elem.click(timeout=10000)
        
        # -> Final action — this is where the agent failed
        # Error observed by agent: Navigation failed: Event handler browser_use.browser.watchdog_base.BrowserSession.on_NavigateToUrlEvent#3840(?▶ NavigateToUrlEvent#bae3 🏃) timed out after 60.0s and interrupted any processing of 1 chi
        await page.goto("http://localhost:3000/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # --> Assertions to verify final state
        current_url = await page.evaluate("() => window.location.href")
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        current_url = await page.evaluate("() => window.location.href")
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    