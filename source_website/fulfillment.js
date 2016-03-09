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
<<<<<<< HEAD
  console.log(source_domain);
  var webDriver = _.find(webDrivers, function(object) {
    return object.host == source_domain;
  });
  if(!webDriver) {
    return new BaseWebDriver();
  }
  else {
    return webDriver.getWebDriver();
  }
}

function copyToClipboard(elem) {
  // Create hidden text element, if it doesn't already exist
  var targetId = "_hiddenCopyText_";
  //console.log(document.body);
  //console.log("element: ");
  //console.log(elem);
  var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
  var origSelectionStart, origSelectionEnd;
  if (isInput) {
    // Can just use the original source element for the selection and copy
    target = elem;
    origSelectionStart = elem.selectionStart;
    origSelectionEnd = elem.selectionEnd;
  } else {
    // Must use a temporary form element for the selection and copy
    target = document.getElementById(targetId);
    //console.log(target);
    //console.log(!target);
    if (!target) {
      var target = document.createElement("textarea");
      target.style.position = "absolute";
      target.style.left = "-9999px";
      target.style.top = "0";
      target.id = targetId;
      document.body.appendChild(target);
    }
    target.textContent = elem.textContent;
  }
  // Select the content
  var currentFocus = document.activeElement;
  target.focus();
  target.setSelectionRange(0, target.value.length);

  // Copy the selection
  var succeed;
  try {
    succeed = document.execCommand("copy");
  } catch(e) {
    succeed = false;
  }
=======
>>>>>>> py

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


<<<<<<< HEAD
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

//function setIndex(index) {
//  console.log("new index: " + index);
//  highlight
//}
var web_driver;

chrome.runtime.sendMessage({get_order_data: true}, function(response){
  $.get(chrome.extension.getURL("source_website/fulfillment_overlay.html"), function(body){
    console.log("MESSAGE RECEIVED");

    // Get web driver for this domain
    console.log(web_driver);
    //console.log(!web_driver);
    if(!web_driver) {
      web_driver = getWebDriver(response.order_data.domain_host);
      web_driver.mainInit(body, response);
    }


    // Change the text of the button to indicate that everything is ready to go
    setTimeout(function() {
      web_driver.copyCombo.text("Start copy combo!");
    }, 2500);

    /* Keyboard shortcuts */
    //var altDown = false;
    //
    //$(document).keydown(altDown, function(event) {
    //  if(event.keyCode == 18) {
    //    event.altDown = true;
    //  }
    //  else if(event.altDown && event.keyCode == 81) {
    //    console.log("ALT+Q keybind!"); // doesn't work! :(
    //  }
    //  //console.log(event.keyCode);
    //});
    //$(document).keyup(altDown, function(event) {
    //  if(event.keyCode == 18) {
    //    event.altDown = false;
    //  }
    //  //console.log(event.keyCode);
    //});

=======
//get web driver for this domain
$(document).ready(function(){
  var web_driver = getWebDriver(extractDomain(window.location.href));

  web_driver.ready(function(){
    chrome.runtime.sendMessage({get_order_data: true}, function(response){
      $.get(chrome.extension.getURL("source_website/fulfillment_overlay.html"), function(body){
        /* Fulfillment overlay */
        // Build fulfillment overlay (shows shipping address, name, etc) if it hasn't been done already
        //if($("#fulfillment-overlay").length == 0) {
        //  var shipping_fields = _.pick(response.order_data, ["shipping_name", "shipping_phone", "shipping_address_line_1", "shipping_address_line_2", "shipping_address_line_3", "shipping_city", "shipping_country_code", "shipping_state", "shipping_postal_code"]);
        //
        //  shipping_fields.quantity = response.order_data.quantity * response.order_data.aoi_quantity;
        //  var split_name = shipping_fields.shipping_name.split(" ");
        //  shipping_fields.first_name = split_name[0];
        //  shipping_fields.last_name = split_name.splice(1).join(' ');
        //  var shipping_fields_map = {"first_name": "firstname", "last_name": "lastname", "shipping_address_line_1": "address", "shipping_city": "city", "shipping_state": "state", "shipping_postal_code": "postal_code", "shipping_phone": "phone"};
        //
        //  _.each(shipping_fields_map, function(field_name, key){
        //    var value = shipping_fields[key];
        //
        //    if(value){
        //      web_driver.set_field_value(field_name, shipping_fields[key]);
        //    }
        //  });
        //
        //  var overlay_template = Handlebars.compile(body);
        //  var overlay_html = overlay_template(shipping_fields);
        //  web_driver.insert_overlay(overlay_html);
        //}
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
>>>>>>> py
  });
});
