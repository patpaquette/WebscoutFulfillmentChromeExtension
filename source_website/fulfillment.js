/**
 * Created by patricepaquette on 2016-02-22.
 */
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
  domain = domain.replace('.com', '');
  domain = domain.replace('.net', '');
  domain = domain.replace('.org', '');

  return domain;
}

function getWebDriver(source_domain){
  console.log(source_domain);
  //var webDriver = _.find(webDrivers, function(object) {
  //  return object.host == source_domain;
  //});
  //if(!webDriver) {
  //  return new BaseWebDriver();
  //}
  //else {
  //  return webDriver.getWebDriver();
  //}
  var capitalized_domain = source_domain.charAt(0).toUpperCase() + source_domain.slice(1);
  eval("var web_driver = new " + capitalized_domain + "WebDriver()");
  return web_driver;
}

function removeHighlight(elem) {
  $(elem).css("background-color", "");
}

function pasteStringInElem(elem){
  $(elem).select();
  if(document.execCommand('paste')){
    console.log("should have pasted!");
  }
  else{
    console.log("no paste");
  }
}

//get web driver for this domain
$(document).ready(function(){
  var web_driver = getWebDriver(extractDomain(window.location.href));

  web_driver.ready(function(){
    chrome.runtime.sendMessage({get_order_data: true}, function(response){
      $.get(chrome.extension.getURL("source_website/fulfillment_overlay.html"), function(body){
        console.log("driver");
        console.log(web_driver);
        web_driver.mainInit(body, response);


        /* Keyboard shortcuts */
        /*
        var altDown = false;

        $(document).keydown(altDown, function(event) {
          if(event.keyCode == 18) {
            event.altDown = true;
          }
          else if(event.altDown && event.keyCode == 81) {
            console.log("ALT+Q keybind!"); // doesn't work! :(
          }
          console.log(event.keyCode);
        });
        $(document).keyup(altDown, function(event) {
          if(event.keyCode == 18) {
            event.altDown = false;
          }
          console.log(event.keyCode);
        });*/
      });
    });
  });
});
