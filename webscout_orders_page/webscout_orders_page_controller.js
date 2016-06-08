/**
* Created by patricepaquette on 2016-02-23.
*/
(function(){
  var current_order = null;

  //pick the right account data to add to fulfill link message
  function get_login_data(account_data) {
    if(!account_data.error) {
      return {username: account_data.username, password: account_data.password};
    }
    else {
      return {error: account_data.error};
    }
  }
  //may not be used
  function send_login_data(account_data) {
    chrome.runtime.sendMessage({set_login_data: true, login_data: get_login_data(account_data)});
  }

  //add the fulfillment buttons to the orders grid
  function create_fulfill_links(grid_data, login_data){
    function fulfill(){
      //find order data
      var order_row_element = $(this).closest('tr');
      var data_uid = order_row_element.attr('data-uid');
      var source_link = $(this).attr('href');

      console.log("DATA_UID: " );
      console.log(data_uid);
      var data_row = _.find(grid_data, function(row){
        console.log("UID: ");
        console.log(row['uid']);
        return data_uid === row["uid"];
      });

      //clone because we want to modify without changing the initial data
      current_order = data_row;
      data_row = _.cloneDeep(data_row);

      //get the source that we want (from the link href)
      var source = _.find(data_row.domainItems, function(domainItem){
        if(source_link == "https://shop.upromise.com/e/members/benefits.php?xkeyword=walmart"){
          return domainItem.domain_host == 'walmart';
        }
        else{
          return source_link.indexOf(domainItem.item_source_link) >= 0;
        }
      });

      _.assign(data_row, source);

      //call background fulfillment function to set order data
      chrome.runtime.sendMessage({set_order_data: true, order_data: data_row, login_data: login_data});
    }

    //get all source links for orders
    var source_links = jQuery(".source-link");

    //add the fulfill onClick listener to each element
    source_links.click(fulfill);
    source_links.css('background-color', 'lightblue');

    //modify the href
    source_links.each(function(){
      var link = $(this).attr('href');

      if(link.indexOf("?") >= 0){
        link += "&webscout_fulfillment=1&page=product";
      }
      else{
        link += "?webscout_fulfillment=1&page=product";
      }
      //
        if(link.indexOf("walmart") >= 0){
          link = "https://shop.upromise.com/e/members/benefits.php?xkeyword=walmart"
        }

      $(this).attr('href', link);
    });
  }

  //event listener from fulfillment.js (source website content script)
  chrome.extension.onMessage.addListener(function(message, sender, sendResponse){
    console.log(message);

    if(message.source_fulfillment_done){
      //send message to webscout orders page to update order data
      var attributes = {
        uid: current_order.uid,
        aoi_real_cost: message.cost,
        aoi_real_tax: message.taxes,
        source_confirmation: message.source_confirmation,
        source_account_username: message.source_account_username
      };

      attributes = _.pickBy(attributes, function(val, key){
        console.log(val);
        return val && val != '';
      });


      window.postMessage({message_type: "FROM_PAGE", event_type: "source_fulfillment_done", order_attributes: attributes, source_data: message.source_data}, "*")
    }
  });

  window.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != window)
      return;

    if (event.data.message_type && (event.data.message_type == "FROM_PAGE")) {
      console.log("Content script received: " + event.data.event_type);

      if(event.data.event_type === "kendo_grid_databound") {
        create_fulfill_links(event.data.grid_data, get_login_data(event.data.account_data));
      }
      //else if(event.data.event_type === "source_account_provision") {
      //  console.log(event.data.account_data);
      //}
    }
  }, false);
})();