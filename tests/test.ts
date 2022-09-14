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

Best practice seems to be to use the most user-facing way possible of selecting
something. So instead of finding a div with a row-wrap class then selecting all the
divs with v-card class from that, select all div.v-card with :has-text('Open') since
the SavedQuery cards all have an Open button. This is more robust to changes in the
layout; try to make the tests so that they work as long as what the user sees is
correct / hasn't changed instead of testing from the developer side.

> Playwright scripts run in your Playwright environment. Your page scripts run in the browser page environment. Those environments don't intersect, they are running in different virtual machines in different processes and even potentially on different computers.
> The page.evaluate(pageFunction[, arg]) API can run a JavaScript function in the context of the web page and bring results back to the Playwright environment. Browser globals like window and document can be used in evaluate.
* So things like `document` and `IntersectionObserver` only work within `evaluate`.

Try to get rid of `waitForTimeout` if you can.

I think doing locator.filter({hasText: text}) checks that the element or a child of it
has `text` but won't work if `text` is split across multiple children (e.g. different
`<p>` elements). So if you expect that, you need to do the check differently (e.g. maybe
join allInnerTexts and do a substring check).
*/

import { test, expect, Locator, Page } from '@playwright/test'

const CSS_CARD = "div.v-card:has-text('Open')"
const CSS_EXP_PANEL = "div.v-expansion-panel:has-text('Open')"
const CSS_CARD_TITLE = "div.v-card__title"
const DEV_URL = "https://localhost:8080/#/"

async function exists(l: Locator) {
  expect(await l.count()).toBeGreaterThan(0)
}

async function existsOnce(l: Locator) {
  expect(await l.count()).toBe(1)
}

function getFromLabel(page: Page | Locator, label: string, neighbor: string) {
  return page.locator(`label:has-text('${label}') + ${neighbor}`)
}

function getInputFromLabel(page: Page | Locator, label: string) {
  return getFromLabel(page, label, "input")
}

function getInputValueFromLabel(page: Page | Locator, label: string) {
  return getInputFromLabel(page, label).inputValue()
}

function getTextAreaFromLabel(page: Page | Locator, label: string) {
  return getFromLabel(page, label, "textarea")
}

function getTextAreaValueFromLabel(page: Page | Locator, label: string) {
  return getTextAreaFromLabel(page, label).inputValue()
}

// https://stackoverflow.com/a/68848306/4880003
// based on Puppeteer's method
async function isIntersectingViewport(locator: Locator): Promise<boolean> {
  return locator.evaluate(async element => {
    const visibleRatio: number = await new Promise(resolve => {
      const observer = new IntersectionObserver(entries => {
        resolve(entries[0].intersectionRatio)
        observer.disconnect()
      })
      observer.observe(element)
      // Firefox doesn't call IntersectionObserver callback unless
      // there are rafs.
      requestAnimationFrame(() => {})
    })
    return visibleRatio > 0
  })
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
  await page.locator("label:has-text('Name')").fill("RL")
  await page.locator("label:has-text('Tags')").fill("rl ")
  await page.locator("button:has-text('Save')").click()
  savedQueries.push("RL")

  await cards.filter({hasText: "RL"}).click()
  expect(await titles.allInnerTexts()).toStrictEqual(savedQueries)
  expect(await cards.count()).toBe(savedQueries.length)
})

async function checkPaper(page: Page, paper: any) {
    // now check that the saved entry looks right
    const paperLocator = page.locator(CSS_EXP_PANEL, {hasText: paper.title})
    await paperLocator.click()
    // the lines are trimmed during processing the new entry
    const expContent = paper.content.split("\n").map((line: string) => line.trim()).join("\n")
    const content = (await paperLocator.locator("div.v-expansion-panel-content").allInnerTexts()).join("\n")
    expect(content).toBe(expContent)

    await existsOnce(paperLocator.filter({hasText: paper.convertedDate}))
    // if you change how tags are shown when there are very many, might need to update
    // this. Right now, all tags are present even though you can't necessarily see them all
    expect(await paperLocator.locator("span.v-chip").allInnerTexts()).toStrictEqual(paper.tags)
}

test("Keyboard shortcuts.", async ({page}) => {
  const nav = page.locator("nav.v-navigation-drawer")
  expect(await isIntersectingViewport(nav)).toBe(false)
  await page.keyboard.press("Control+b")
  await page.waitForTimeout(100)
  expect(await isIntersectingViewport(nav)).toBe(true)
  await page.keyboard.press("Control+b")
  await page.waitForTimeout(1000)
  expect(await isIntersectingViewport(nav)).toBe(false)
})

test("add papers from url", async ({page}) => {
  // arxiv and youtube
  const papers = [
    {
      title: "Verifiably Safe Exploration for End-to-End Reinforcement Learning",
      tags: ["paper"],
      priority: "0",
      date: "2020/07/02",
      convertedDate: "Jul 2020",
      content: "Deploying deep reinforcement learning in safety-critical settings requires developing algorithms that obey hard constraints during exploration. This paper contributes a first approach toward enforcing formal safety constraints on end-to-end policies with visual inputs. Our approach draws on recent advances in object detection and automated reasoning for hybrid dynamical systems. The approach is evaluated on a novel benchmark that emphasizes the challenge of safely exploring in the presence of hard constraints. Our benchmark draws from several proposed problem sets for safe learning and includes problems that emphasize challenges such as reward signals that are not aligned with safety constraints. On each of these benchmark problems, our algorithm completely avoids unsafe behavior while remaining competitive at optimizing for as much reward as is safe. We also prove that our method of enforcing the safety constraints preserves all safe policies from the original environment.",
      authors: "Nathan Hunt, Nathan Fulton, Sara Magliacane, Nghia Hoang, Subhro Das, Armando Solar-Lezama",
      url: "https://arxiv.org/abs/2007.01223",
    },
    {
      title: "The Legend of Zelda: Tears of the Kingdom – Coming May 12th, 2023 – Nintendo Switch",
      tags: ["The Legend of Zelda: Tears of the Kingdom", "nintendo", "game", "gameplay", "video game", "nintendo switch", "The Legend of Zelda: Tears of the Kingdom release date", "Announcement Trailer", "The Legend of Zelda: Tears of the Kingdom trailer", "The Legend of Zelda: Tears of the Kingdom nintendo switch", "botw 2", "breath of the wild 2", "breath of the wild sequel", "zelda breath of the wild", "botw", "botw 2 release date", "new zelda game", "zelda tears of the kingdom", "zelda botw 2", "zelda switch game", "link botw", "watch"],
      priority: "0",
      date: "2022-09-13",
      convertedDate: "Sep 2022",
      // there's some trailing whitespace that needs to be preserved in one line, so I'm
      // creating the string this way to prevent trailing whitespace trimming on save
      // messing it up (it doesn't take multiline strings into account):
      // https://github.com/Microsoft/vscode/issues/52711
      content: [
        "Duration 1M37S",
        "",
        "The title for the sequel to The Legend of Zelda: Breath of the Wild has been revealed! The Legend of Zelda: Tears of the Kingdom will launch on Nintendo Switch May 12th, 2023.",
        "",
        "Wishlist today: https://www.nintendo.com/store/products/the-legend-of-zelda-tears-of-the-kingdom-switch/",
        "",
        "#LegendofZelda #TearsoftheKingdom #NintendoSwitch ",
        "",
        "Subscribe for more Nintendo fun! https://goo.gl/HYYsot",
        "",
        "Visit Nintendo.com for all the latest! http://www.nintendo.com/",
        "",
        "Like Nintendo on Facebook: http://www.facebook.com/Nintendo",
        "Follow us on Twitter: http://twitter.com/NintendoAmerica",
        "Follow us on Instagram: http://instagram.com/Nintendo",
        "Follow us on Pinterest: http://pinterest.com/Nintendo",
      ].join("\n"),
      authors: "Nintendo",
      url: "https://www.youtube.com/watch?v=2SNF4M_v7wc",
    },
  ]

  await (
    page.locator(CSS_CARD, {hasText: "All Papers"})
    .locator("button:has-text('Open')")
    .click()
  )
  for (const paper of papers) {
    await page.locator("button:has-text('add_circle_outline')").click()
    await page.locator("text=URL").fill(paper.url)
    await page.locator("text=URL").focus()
    await page.keyboard.press("Enter")

    // there's a URL label + input that we used above and then a new one now on the card
    // to create a new Paper entry, so we'll start subsequent selectors from the dialog.
    // need this for the save button too
    const dialog = page.locator("div.v-dialog:has-text('New Paper')")
    expect(await getInputValueFromLabel(dialog, "Title")).toBe(paper.title)
    expect(await dialog.locator("label:has-text('Tags') + div.v-select__selections").allInnerTexts()).toStrictEqual([paper.tags.join("\n")])
    expect(await getInputValueFromLabel(dialog, "Priority")).toBe(paper.priority)
    expect(await getInputValueFromLabel(dialog, "Date (YYYY/MM/DD)")).toBe(paper.date)
    expect(await getTextAreaValueFromLabel(dialog, "Content")).toBe(paper.content)
    expect(await getInputValueFromLabel(dialog, "Authors")).toBe(paper.authors)
    expect(await getInputValueFromLabel(dialog, "URL")).toBe(paper.url)
    await dialog.locator("button:has-text('Save')").click()

    await checkPaper(page, paper)
    // test fails if you don't wait. I think the new entry hasn't been saved yet, so
    // reloading too fast gives a blank page. Maybe find a better way to do this
    await page.waitForTimeout(2000)
    await page.reload()
    await checkPaper(page, paper)
  }
})
