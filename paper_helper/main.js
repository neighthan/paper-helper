let vue = new Vue({
  el: '#app',
  vuetify: new Vuetify(),
  data: {
    paper_data: {},
    paper_data_loaded: false,
  },
})

let pd_promise = new Promise(function(resolve) {
  chrome.storage.local.get(["paper_data"], function(result) {
    resolve(result)
  })
})
pd_promise.then(function(result) {
  console.log(result)
  vue.paper_data = result
  vue.paper_data_loaded = true
})
