//check whether webscout fulfillment is enabled
var url = window.location.href;

if(url.indexOf("webscout_fulfillment=1") >= 0){
  chrome.runtime.sendMessage({inject_fulfillment_scripts: true}, function(response){
    console.log(response);
    if(response.done){
      console.log("Scripts loaded");
    }
    else{
      console.log("Errors loading scripts");
    }
  });
}

