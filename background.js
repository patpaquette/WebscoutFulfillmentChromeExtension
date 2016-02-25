/**
 * Created by patricepaquette on 2016-02-23.
 */

var current_order = null;

function set_order_data(order_data){
  current_order = order_data;
}

function executeScripts(js_includes, sender, callback){
  js_includes.forEach(function(url){
    chrome.tabs.executeScript(sender.tab.id, {file: url}, callback);
  });
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log(message);

  if(message.inject_fulfillment_scripts){ //inject scripts required to fulfill orders on source websites
    var js_includes = [
      "bower_components/lodash/lodash.js",
      "bower_components/jquery/dist/jquery.js",
      "source_website/product_page_controller.js"
    ];

    executeScripts(js_includes, sender, function() {
      sendResponse({ done: true });
    });

    return true; // Required for async sendResponse()
  }
  else if(message.inject_webscout_scripts){ //inject scripts required on the webscout orders page
    var js_includes = [
      "bower_components/lodash/lodash.js",
      "bower_components/jquery/dist/jquery.js",
      "webscout_orders_page/webscout_orders_page_controller.js"
    ];

    console.log("HMMM");
    executeScripts(js_includes, sender, function() {
      sendResponse({ done: true });
    });

    return true; // Required for async sendResponse()
  }
  else if(message.set_order_data){ //set order data for use in the rest of the process
    set_order_data(message.order_data);
  }
  else if(message.get_order_data){ //get order data
    console.log("get_order_data");
    console.log(sender);

    if(sender.url.indexOf(current_order.item_source_link) >= 0){
      sendResponse({success: true, order_data: current_order});
    }
    else {
      sendResponse({success: false, error_code: "urls_dont_match"});
    }
  }
});