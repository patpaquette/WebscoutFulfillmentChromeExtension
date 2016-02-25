/**
 * Created by patricepaquette on 2016-02-22.
 */

console.log("LOADED!");

chrome.runtime.sendMessage({get_order_data: true}, function(response){
  console.log(response);
});