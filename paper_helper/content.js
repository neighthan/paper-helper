chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.method == "extract_metadata")
      sendResponse({title: "TEST"});
  }
)
