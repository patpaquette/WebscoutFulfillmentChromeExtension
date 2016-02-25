/**
 * Created by patricepaquette on 2016-02-23.
 */

//add the fulfillment buttons to the orders grid
function create_fulfill_buttons(grid_data){
  function fulfill(){
    //find order data
    var data_uid = $(this).closest('tr').attr('data-uid');

    console.log(data_uid);
    var data_row = _.find(grid_data, function(row){
      return data_uid === row["uid"];
    });

    console.log(data_row);

    //call background fulfillment function to set order data

    //create new tab to product page
  }

  console.log("create buttons");
  var button = jQuery("<button>Fulfill</button>");
  button.click(fulfill);

  jQuery("#ordersGrid tr td:last-child").append(button);
}

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.message_type && (event.data.message_type == "FROM_PAGE")) {
    console.log("Content script received: " + event.data.event_type);

    if(event.data.event_type === "kendo_grid_databound"){
      console.log(event.data.grid_data);
      create_fulfill_buttons(event.data.grid_data);
    }
    //port.postMessage(event.data.text);
  }
}, false);

chrome.runtime.sendMessage({inject_webscout_scripts: true}, function(response){
  if(response.done){
    console.log("Scripts loaded");
  }
  else{
    console.log("Errors loading scripts");
  }
});