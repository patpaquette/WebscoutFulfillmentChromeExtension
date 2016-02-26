/**
* Created by patricepaquette on 2016-02-23.
*/

console.log("YEAH!");

//add the fulfillment buttons to the orders grid
function create_fulfill_links(grid_data){
  function fulfill(){
    //find order data
    var data_uid = $(this).closest('tr').attr('data-uid');
    var source_link = $(this).attr('href');

    console.log(data_uid);
    var data_row = _.find(grid_data, function(row){
      console.log(row['uid']);
      return data_uid === row["uid"];
    });

    //clone because we want to modify without changing the initial data
    data_row = _.cloneDeep(data_row);

    //get the source that we want (from the link href)
    var source = _.find(data_row.domainItems, function(domainItem){
      return source_link.indexOf(domainItem.item_source_link) >= 0;
    });

    _.assign(data_row, source);

    console.log(data_row);

    //call background fulfillment function to set order data
    chrome.runtime.sendMessage({set_order_data: true, order_data: data_row});
  }

  //get all source links for orders
  var source_links = jQuery("#ordersGrid tr td a[ng-if*='domainItem.item_source_link'], #ordersGrid tr td a[ng-if*='domainItem.item_source_link']");

  //add the fulfill onClick listener to each element
  source_links.click(fulfill);

  //modify the href
  source_links.each(function(){
    var link = $(this).attr('href');

    if(link.indexOf("?") >= 0){
      link += "&webscout_fulfillment=1&page=product";
    }
    else{
      link += "?webscout_fulfillment=1&page=product";
    }

    $(this).attr('href', link);
  });
}

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.message_type && (event.data.message_type == "FROM_PAGE")) {
    console.log("Content script received: " + event.data.event_type);

    if(event.data.event_type === "kendo_grid_databound"){
      console.log(event.data.grid_data);
      create_fulfill_links(event.data.grid_data);
    }
  }
}, false);
