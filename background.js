/**
 * Created by patricepaquette on 2016-02-23.
 */

var current_order = null;
var current_account = null;

var supported_cashback_websites = ["upromise"];

function extractDomain(url) {
  var domain;
  //find & remove protocol (http, ftp, etc.) and get domain
  if (url.indexOf("://") > -1) {
    domain = url.split('/')[2];
  }
  else {
    domain = url.split('/')[0];
  }

  //find & remove port number
  domain = domain.split(':')[0];

  domain = domain.replace('www.', '');
  domain = domain.replace('secure2.', ''); // For Home Depot specifically
  domain = domain.replace('.com', '');
  domain = domain.replace('.net', '');
  domain = domain.replace('.org', '');

  return domain;
}

function set_order_data(order_data) {
  console.log("set order data");
  current_order = order_data;
}
function set_account_data(account_data) {
  console.log("set account data");
  console.log(account_data);
  current_account = account_data;
}

function executeScripts(js_includes, tabId, callback) {
  js_includes.forEach(function (url) {
    chrome.tabs.executeScript(tabId, {file: url}, callback);
  });
}

function injectExtensionScripts(module, tabId, callback) {
  switch (module) {
    case "fulfillment":
      var js_includes = [
        "bower_components/lodash/lodash.js",
        "bower_components/jquery/dist/jquery.js",
        "bower_components/q/q.js",
        "bower_components/handlebars/handlebars.js",
        "bower_components/async/dist/async.js",
        "source_website/fulfillment.js",
        "source_website/web_drivers/base_web_driver.js",
        "source_website/web_drivers/homedepot_web_driver.js",
        "source_website/web_drivers/toysrus_web_driver.js",
        "source_website/web_drivers/walmart_web_driver.js"
      ];

      executeScripts(js_includes, tabId, callback);
      break;
    case "cashback":
      var js_includes = [
        "bower_components/lodash/lodash.js",
        "bower_components/jquery/dist/jquery.js",
        "bower_components/q/q.js",
        "bower_components/async/dist/async.js",
        "cashback_website/redirection.js",
        "cashback_website/web_drivers/base_web_driver.js",
        "cashback_website/web_drivers/upromise_driver.js"
      ];

      executeScripts(js_includes, tabId, callback);
      break;
  }
}

// handle messages from content scripts
(function () {
  var webscout_orders_tab = null;
  var source_tab = null;

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log(message);

    if (message.set_order_data) { // set order data for use in the rest of the process
      current_order = null;
      set_order_data(message.order_data);
      webscout_orders_tab = sender.tab;
    }
    else if (message.set_account_data) {
      console.log(message);
      set_account_data(message.account_data);
    }
    else if (message.get_order_and_account_data) { //get order and login data
      console.log("get_order_data");
      console.log(sender);
      var response = {success: false, order_data: null, account_data: null};
      source_tab = sender.tab;

      // order
      if (current_order) {
        response.success = true;
        response.order_data = current_order;
      }
      else { response.error_code = "no_order"; }

      // login
      response.account_data = current_account;

      console.log(response);
      sendResponse(response);
    }
    else if (message.source_fulfillment_done) {
      console.log("FULFILLMENT FINISHED");
      if(webscout_orders_tab){
        var attributes_fulfillment_done = {source_fulfillment_done: true, source_data: message.source_data, source_account_data: message.source_account_data};
        var attributes_tab_closed = {source_tab_closed: true, source_data: current_order, source_account_data: current_account};

        _.each(_.pick(message ,["cost", "taxes", "source_confirmation", "source_account_username"]), function(value, key){
          console.log(key + ":" + value);
          attributes_fulfillment_done[key] = value;
          attributes_tab_closed[key] = value;
        });


        chrome.tabs.sendMessage(webscout_orders_tab.id, attributes_tab_closed)
        current_order = null;
        current_account = null;
        chrome.tabs.sendMessage(webscout_orders_tab.id, attributes_fulfillment_done);
        chrome.tabs.remove(sender.tab.id);
      }
    }
    else if(message.fulfillment_timeout){
      if(current_order.id == message.order_data.id){
        current_order = null;
      }

      chrome.tabs.remove(sender.tab.id);
    }
  });

  chrome.tabs.onRemoved.addListener(function(tabId, changeInfo, tab){
    console.log(source_tab);
    if(tabId === source_tab.id && current_order){
      console.log("tab closed");
      chrome.tabs.sendMessage(webscout_orders_tab.id, {source_tab_closed: true, source_data: current_order, source_account_data: current_account})
    }
  });
})();

//check if tab url has same domain as the order source (this is required for websites that wipe out the url parameters, which can be used to determine whether the extension should be enabled)
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  //only check if there is an order to fulfill
  console.log(current_order);
  if (current_order && changeInfo.status === 'complete') {
    console.log(tab.url);
    console.log(current_order.item_source_link);

    //var order_source_domain = extractDomain(current_order.item_source_link);
    var order_source_domain = current_order.domain_host;
    var current_domain = extractDomain(tab.url);

    console.log("domains");
    console.log(order_source_domain);
    console.log(current_domain);

    if (current_domain.indexOf(order_source_domain) >= 0) { //check if we're on a retailer website
      //inject fulfillment scripts
      injectExtensionScripts("fulfillment", tabId);
    }
    else if(supported_cashback_websites.indexOf(current_domain)){ //check if we're on a callback website
      injectExtensionScripts("cashback", tabId);
    }
    //injectExtensionScripts("fulfillment", tabId);
  }
});