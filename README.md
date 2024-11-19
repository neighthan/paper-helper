# paper-helper

## Use cases

This app is just a way to record information with Markdown rendering support and tag that information for easy access later. That's broad enough you can do a lot with it but perhaps too broad to give you good ideas of what you'd like to do. Here are some things that I use it for.

(currently the Markdown rendering is done the same way for all types of entries. I plan, however, to allow making templates for different kinds of entries so that you can make nice, specialized entry types for categories that are used often and might benefit from some more specific format)

### People

Especially for friends I don't see often, I can end up forgetting what was new in their life last time we talked. I like to create an entry for a person then record a few notes after talking with them so that I can easily refresh my memory next time about where they were at and what I might want to follow up about in their lives.

[put a screenshot here showing an example]

### Books / media consumption



### Research / work notes

### To Dos

## Syncing

Tried to use github with a [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) but blocked by CORS.

Need to create a repo on github and a personal access token.


### Merge conflicts

Once you're done editing the conflicting files, click the Sync to Github button again to make the merge commit and push it to Github.

## Importing

An imported markdown file inherits any tags present in the current search view (in addition to any tags defined in the file itself). You can use this to pre-tag groups of files that you import by creating / opening a `SavedQuery` with the appropriate tags.

## History with git

https://github.com/petersalomonsen/wasm-git
https://libgit2.org/


## Contributing

Feel free to create issues to request features or report bugs. If reporting a bug, try to find a minimal way to reproduce it since we won't have all of your notes, and make sure to check the console (ctrl+shift+i in Chrome) and report any errors.

If you want to contribute to the code directly, you can set up the project using
```
git clone https://github.com/neighthan/paper-helper
cd paper-helper
npm install
```

Compile the project and run the development server with
```
npm run serve
```
