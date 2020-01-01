let vue = new Vue({
  el: '#app',
  vuetify: new Vuetify(),
  data: {
    title: "",
    url: "",
    tags: "",
    priority: "0",
    paper_data: {},
    all_tags: [],
    paper_data_loaded: false,
    tags_loaded: false,
  },
  methods: {
    add_paper: function(save) {
      if(save) {
        let time = (new Date()).getTime()
        let new_paper_data = {
          title: this.title,
          url: this.url,
          priority: parseFloat(this.priority),
          tags: this.tags,
          time,
        }
        this.paper_data[time] = new_paper_data
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
  chrome.tabs.sendMessage(tabs[0].id, {method: "extract_metadata"}, function(response) {
    console.log(response)
    vue.title = response.title
  });
});

let pd_promise = new Promise(function(resolve) {
  chrome.storage.local.get(["paper_data"], function(result) {
    resolve(result)
  })
})
pd_promise.then(function(result) {
  console.log(result)
  vue.paper_data = result["paper_data"]
  vue.paper_data_loaded = true
})

let tags_promise = new Promise(function(resolve) {
  chrome.storage.local.get(["tags"], function(result) {
    resolve(result)
  })
})
tags_promise.then(function(result) {
  console.log(result)
  vue.all_tags = result["tags"]
  vue.tags_loaded = true
})
