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
        
        # -> Open the 'Log in' page
        await page.goto("http://localhost:3000/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the 'Email address' field with doctor@test.com, fill the 'Password' field with Password123!, then click the 'Log in' button to submit the form.
        # you@example.com email field
        elem = page.get_by_label('Email address', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("doctor@test.com")
        
        # -> Fill the 'Email address' field with doctor@test.com, fill the 'Password' field with Password123!, then click the 'Log in' button to submit the form.
        # At least 8 characters password field
        elem = page.get_by_label('Password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Password123!")
        
        # -> Fill the 'Email address' field with doctor@test.com, fill the 'Password' field with Password123!, then click the 'Log in' button to submit the form.
        # Log in button
        elem = page.get_by_role('button', name='Log in', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the doctor dashboard is displayed
        # Assert: Expected URL to contain 'doctor' indicating the doctor dashboard.
        await expect(page).to_have_url(re.compile("doctor"), timeout=15000), "Expected URL to contain 'doctor' indicating the doctor dashboard."
        # Assert: Expected the 'Book appointment' link to be not visible on the doctor dashboard.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div[1]/a").nth(0)).not_to_be_visible(timeout=15000), "Expected the 'Book appointment' link to be not visible on the doctor dashboard."
        # Assert: Expected the 'All appointments' link to be not visible on the doctor dashboard.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div[2]/section[2]/div[1]/a").nth(0)).not_to_be_visible(timeout=15000), "Expected the 'All appointments' link to be not visible on the doctor dashboard."
        
        # --> Verify the user is shown a doctor-specific experience
        # Assert: Expected the URL to contain "/doctor" indicating the doctor dashboard.
        await expect(page).to_have_url(re.compile("/doctor"), timeout=15000), "Expected the URL to contain \"/doctor\" indicating the doctor dashboard."
        # Assert: Expected the primary sidebar link to point to "/doctor" to show doctor navigation.
        await expect(page.locator("xpath=/html/body/div[2]/aside/nav/a[1]").nth(0)).to_have_attribute("href", "/doctor", timeout=15000), "Expected the primary sidebar link to point to \"/doctor\" to show doctor navigation."
        # Assert: Expected the main action link to point to the doctor appointments route "/doctor/appointments/new".
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div[1]/a").nth(0)).to_have_attribute("href", "/doctor/appointments/new", timeout=15000), "Expected the main action link to point to the doctor appointments route \"/doctor/appointments/new\"."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    