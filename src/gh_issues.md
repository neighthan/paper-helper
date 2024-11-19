Make these into github issues

For markdown.ts::addSideBySide
Sequential works but nesting is broken. I think the startEndIdxs are okay, but when we start making newMd, it's still done as if it were sequential. What we need is to replace things in the original md, so that once you replace a nested SS with the divs, then you can replace the outer SS, and it will have the right content nested inside.
This is tricky, though, because once you change the md, the start / end indices all get messed up. Maybe you could replace <@SS> and </SS> with <@SSi> and </SSi> for i from 0 to however many. Then you could just store i for each start/end pair and use indexOf to find the current indices of those tokens (since they'll change as you modify md).
You will need to take into account that you could have i's that are multiple digits, so the length of the tokens won't be constant anymore.

give the Markdown element in expansion panels a smaller max height

Make a readme where you show all the features
