/**
 * Created by patricepaquette on 2016-02-23.
 */

console.log("OH YEAH");

function executeScripts(js_includes, callback){
  js_includes.forEach(function(url){
    chrome.tabs.executeScript(sender.tab.id, {file: url}, callback);
  });
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log(message);
  if(message.inject_fulfillment_scripts){
    var js_includes = [
      "bower_components/lodash/lodash.js",
      "bower_components/jquery/dist/jquery.js",
      "product_page/product_page_controller.js"
    ];

    executeScripts(js_includes, function() {
      console.log(url + " loaded");
      sendResponse({ done: true });
    });

    return true; // Required for async sendResponse()
  }
  else if(message.inject_webscout_scripts){
    var js_includes = [
      "bower_components/lodash/lodash.js",
      "bower_components/jquery/dist/jquery.js",
      "webscout_orders_page/webscout_orders_page_controller.js"
    ];

    executeScripts(js_includes, function() {
      console.log(url + " loaded");
      sendResponse({ done: true });
    });

    return true; // Required for async sendResponse()
  }
});