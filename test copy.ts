import { test, expect, Locator } from '@playwright/test'

async function exists(l: Locator) {
  const count = await l.count()
  expect(count).toBeGreaterThan(0)
}

test.use({
  ignoreHTTPSErrors: true
})

const CSS_CARD = "div.v-card"
const DEV_URL = "https://localhost:8080/#/"

test('test', async ({ page }) => {
  await page.goto(DEV_URL)
  const cards = page.locator(CSS_CARD)
  // Click button[role="button"]:has-text("add")

  // Go to https://localhost:8080/#/
  await page.goto('https://localhost:8080/#/')

  // Click text=Vision
  await page.locator('text=Vision').click()

  // Click button:has-text("Open") >> nth=0
  await page.locator('button:has-text("Open")').first().click()
  await expect(page).toHaveURL('https://localhost:8080/#/search/183224bfceabfc6252c55014')

  // Click button:has-text("add") >> nth=0
  await page.locator('button:has-text("add")').first().click()

  // Fill #input-87
  await page.locator('#input-87').fill('Demo paper')

  // Press Tab
  await page.locator('#input-87').press('Tab')

  // Fill text=Tagsarrow_drop_down >> input[type="text"]
  await page.locator('text=Tagsarrow_drop_down >> input[type="text"]').fill('cv ')

  // Click textarea
  await page.locator('textarea').click()

  // Fill textarea
  await page.locator('textarea').fill('New vision research.')

  // Press s with modifiers
  await page.locator('textarea').press('Control+s')

  // Click button:has-text("Demo paperOpenswap_vertdeleteeditopen_in_newcv Sep 2022")
  await page.locator('button:has-text("Demo paperOpenswap_vertdeleteeditopen_in_newcv Sep 2022")').click()

  // Click text=New vision research.
  await page.locator('text=New vision research.').click()

  // Click button:has-text("open_in_new") >> nth=1
  await page.locator('button:has-text("open_in_new")').nth(1).click()
  await expect(page).toHaveURL('https://localhost:8080/#/notes/Paper/18322605621434455db5e7a2')

  // Click text=New vision research.
  await page.locator('text=New vision research.').click()

  // Click textarea
  await page.locator('textarea').click()

  // Press h with modifiers
  await page.locator('textarea').press('Control+h')
  await expect(page).toHaveURL('https://localhost:8080/#/')

  // Click button:has-text("Open") >> nth=2
  await page.locator('button:has-text("Open")').nth(2).click()
  await expect(page).toHaveURL('https://localhost:8080/#/search/183225fe9f908e50b80f9b78')

  // Press h with modifiers
  await page.locator('#input-189').press('Control+h')
  await expect(page).toHaveURL('https://localhost:8080/#/')

  // Click button:has-text("edit") >> nth=2
  await page.locator('button:has-text("edit")').nth(2).click()

  // Click button:has-text("Cancel")
  await page.locator('button:has-text("Cancel")').click()

  // Click button:has-text("Open") >> nth=0
  await page.locator('button:has-text("Open")').first().click()
  await expect(page).toHaveURL('https://localhost:8080/#/search/183224bfceabfc6252c55014')

  // Press h with modifiers
  await page.locator('#input-282').press('Control+h')
  await expect(page).toHaveURL('https://localhost:8080/#/')

  // Click button:has-text("edit") >> nth=2
  await page.locator('button:has-text("edit")').nth(2).click()

  // Click text=Entry Typearrow_drop_down >> input[type="text"]
  await page.locator('text=Entry Typearrow_drop_down >> input[type="text"]').click()

  // Click div[role="listbox"] div:has-text("Paper") >> nth=1
  await page.locator('div[role="listbox"] div:has-text("Paper")').nth(1).click()

  // Click button:has-text("Save")
  await page.locator('button:has-text("Save")').click()

  // Click button:has-text("Open") >> nth=2
  await page.locator('button:has-text("Open")').nth(2).click()
  await expect(page).toHaveURL('https://localhost:8080/#/search/183225fe9f908e50b80f9b78')

  // Click button:has-text("Demo paperOpenswap_vertdeleteeditopen_in_newcv Sep 2022")
  await page.locator('button:has-text("Demo paperOpenswap_vertdeleteeditopen_in_newcv Sep 2022")').click()

  // Click text=New vision research.
  await page.locator('text=New vision research.').click()

  // Click button:has-text("open_in_new") >> nth=1
  await page.locator('button:has-text("open_in_new")').nth(1).click()
  await expect(page).toHaveURL('https://localhost:8080/#/notes/Paper/18322605621434455db5e7a2')

  // Press r with modifiers
  await page.locator('textarea').press('Control+r')

  // Go to https://localhost:8080/#/notes/Paper/18322605621434455db5e7a2
  await page.goto('https://localhost:8080/#/notes/Paper/18322605621434455db5e7a2')

  // Click text=New vision research.
  await page.locator('text=New vision research.').click()

  // Click textarea
  await page.locator('textarea').click()

  // Press Enter
  await page.locator('textarea').press('Enter')

  // Press Enter
  await page.locator('textarea').press('Enter')

  // Fill textarea
  await page.locator('textarea').fill('New vision research.\n\nSomething is all you need.')

  // Press s with modifiers
  await page.locator('textarea').press('Control+s')

  // Press h with modifiers
  await page.locator('textarea').press('Control+h')
  await expect(page).toHaveURL('https://localhost:8080/#/')

  // Click button:has-text("Open") >> nth=0
  await page.locator('button:has-text("Open")').first().click()
  await expect(page).toHaveURL('https://localhost:8080/#/search/183224bfceabfc6252c55014')

  // Click button:has-text("Demo paperOpenswap_vertdeleteeditopen_in_newcv Sep 2022")
  await page.locator('button:has-text("Demo paperOpenswap_vertdeleteeditopen_in_newcv Sep 2022")').click()

  // Click text=New vision research. Something is all you need.
  await page.locator('text=New vision research. Something is all you need.').click()

  // Click button:has-text("add") >> nth=0
  await page.locator('button:has-text("add")').first().click()

  // Fill #input-123
  await page.locator('#input-123').fill('Bad paper')

  // Click div[role="document"] button:has-text("Save")
  await page.locator('div[role="document"] button:has-text("Save")').click()

  // Click button:has-text("delete") >> nth=3
  await page.locator('button:has-text("delete")').nth(3).click()

  // Go to https://localhost:8080/#/search/183224bfceabfc6252c55014
  await page.goto('https://localhost:8080/#/search/183224bfceabfc6252c55014')

  // Click button:has-text("add") >> nth=0
  await page.locator('button:has-text("add")').first().click()

  // Fill #input-68
  await page.locator('#input-68').fill('Better paper')

  // Press s with modifiers
  await page.locator('#input-68').press('Control+s')

  // Click button:has-text("delete") >> nth=3
  await page.locator('button:has-text("delete")').nth(3).click()

  // Click button:has-text("Undo")
  await page.locator('button:has-text("Undo")').click()

  // Click button:has-text("Better paperOpenswap_vertdeleteeditopen_in_new Sep 2022")
  await page.locator('button:has-text("Better paperOpenswap_vertdeleteeditopen_in_new Sep 2022")').click()

  // Go to https://localhost:8080/#/search/183224bfceabfc6252c55014
  await page.goto('https://localhost:8080/#/search/183224bfceabfc6252c55014')

  // Click button:has-text("Demo paperOpenswap_vertdeleteeditopen_in_newcv Sep 2022")
  await page.locator('button:has-text("Demo paperOpenswap_vertdeleteeditopen_in_newcv Sep 2022")').click()

  // Click button:has-text("Demo paperOpenswap_vertdeleteeditopen_in_newcv Sep 2022")
  await page.locator('button:has-text("Demo paperOpenswap_vertdeleteeditopen_in_newcv Sep 2022")').click()

  // Click button:has-text("Better paperOpenswap_vertdeleteeditopen_in_new Sep 2022")
  await page.locator('button:has-text("Better paperOpenswap_vertdeleteeditopen_in_new Sep 2022")').click()

})
