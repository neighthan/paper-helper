let vue = new Vue({
  el: '#app',
  vuetify: new Vuetify(),
  data: {
    title: "",
    url: "",
    tags: "",
    priority: "0",
    paper_data: [],
    all_tags: [],
    metadata: {},
    paper_data_loaded: false,
    tags_loaded: false,
    metadata_loaded: false,
  },
  methods: {
    add_paper: function(save) {
      if(save) {
        let new_paper_data = {
          ...this.metadata,
          title: this.title,
          url: this.url,
          priority: parseFloat(this.priority),
          tags: this.tags,
        }
        this.paper_data.push(new_paper_data)
        this.all_tags = [...new Set(this.all_tags.concat(this.tags))]
        chrome.storage.local.set({paper_data: this.paper_data})
        chrome.storage.local.set({tags: this.all_tags})
      }
      this.title = ""
      this.url = ""
      this.tags = ""
      this.priority = "0"
    },
    open_main_page: function() {
      chrome.tabs.create({url: "main.html"})
    },
  },
})

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  let current_tab = tabs[0]
  if (current_tab.url.startsWith("chrome://") || current_tab.url.startsWith("chrome-extension://")) {
    vue.url = current_tab.url
    vue.metadata_loaded = true
    return
  }
  chrome.tabs.sendMessage(current_tab.id, {method: "extract_metadata"}, function(response) {
    vue.title = response.title
    vue.url = response.url
    vue.metadata = response
    vue.metadata_loaded = true
  });
});

let pd_promise = new Promise(function(resolve) {
  chrome.storage.local.get(["paper_data"], function(result) {
    resolve(result)
  })
})
pd_promise.then(function(result) {
  let paper_data = result["paper_data"]
  if (paper_data != null) {
    vue.paper_data = paper_data
  } else {
    vue.paper_data = []
  }
  vue.paper_data_loaded = true
})

let tags_promise = new Promise(function(resolve) {
  chrome.storage.local.get(["tags"], function(result) {
    resolve(result)
  })
})
tags_promise.then(function(result) {
  let all_tags = result["tags"]
  if (all_tags != null) {
    vue.all_tags = all_tags
  } else {
    vue.all_tags = []
  }
  vue.tags_loaded = true
})
