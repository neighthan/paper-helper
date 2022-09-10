/*
Even with playwright's locators, there can still be issues with checking for something
new before it appears. When you try to do an action like locator.click(), playwright
will keep retrying until it succeeds in locating + clicking the element or it times
out (no default time limit for actions, but I set it to 5 seconds). If instead you
just query, e.g., the number of elements matching a locator, you'll get an immediate
result (which may not include a new element that is created slightly later).
So if you add some data that will create something new, it's better to try something
like clicking on it before querying anything else about it.
* You could also try `page.waitForSelector`.
* `page.waitForFunction` is more general and might be useful in other cases than just
  waiting for an element to exist.

Things you can't see can mess up your selectors. E.g. I was testing adding SavedQuerys
so I checked that the number of `div.v-card`s was correct. Initially this worked. But
once I opened a dialog to add a new SavedQuery, it kept the dialog's v-card even when
it was closed, so now the number of cards was one more than the number of SavedQuerys.
*/

import { test, expect, Locator } from '@playwright/test'

const CSS_CARD = "div.v-card:has-text('Open')"
const CSS_CARD_TITLE = "div.v-card__title"
const DEV_URL = "https://localhost:8080/#/"

async function exists(l: Locator) {
  expect(await l.count()).toBeGreaterThan(0)
}

async function existsOnce(l: Locator) {
  expect(await l.count()).toBe(1)
}

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000)
  await page.goto(DEV_URL)
})

test.use({
  ignoreHTTPSErrors: true,
})

test('test initial saved queries + add new one', async ({ page }) => {
  const cards = page.locator(CSS_CARD)
  const titles = cards.locator(CSS_CARD_TITLE)
  const savedQueries = ["All Papers", "All ToDos"]
  for (const savedQuery of savedQueries) {
    await cards.filter({hasText: savedQuery}).click()
  }
  expect(await cards.count()).toBe(savedQueries.length) // no extras
  expect(await titles.allInnerTexts()).toStrictEqual(savedQueries)

  // make SavedQuery named RL with tag rl
  await page.locator("button[role='button']:has-text('add')").click()
  await page.locator("text=Name").fill("RL")
  await page.locator("text=Tags").fill("rl ")
  await page.locator("button:has-text('Save')").click()
  savedQueries.push("RL")

  await cards.filter({hasText: "RL"}).click()
  expect(await titles.allInnerTexts()).toStrictEqual(savedQueries)
  expect(await cards.count()).toBe(savedQueries.length)
})
