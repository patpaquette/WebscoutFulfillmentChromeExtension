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

  return domain;
}

function getWebDriver(source_domain){
  console.log(source_domain);
  var webDriver = _.find(webDrivers, function(object) {
    return object.host == source_domain;
  }).getWebDriver();
  if(!webDriver) {
    return new BaseWebDriver();
  }
  else {
    return webDriver;
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

  // Restore original focus
  if (currentFocus && typeof currentFocus.focus === "function") {
    currentFocus.focus();
  }

  if (isInput) {
    // Restore prior selection
    elem.setSelectionRange(origSelectionStart, origSelectionEnd);
  } else {
    // Clear temporary content
    target.textContent = "";
  }
  return succeed;
}

function highlight(elem) {
  $(elem).css("background-color", "yellow");
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

//function setIndex(index) {
//  console.log("new index: " + index);
//  highlight
//}

chrome.runtime.sendMessage({get_order_data: true}, function(response){
  $.get(chrome.extension.getURL("source_website/fulfillment_overlay.html"), function(body){
    console.log("MESSAGE RECEIVED");

    // Get web driver for this domain
    // var web_driver = getWebDriver(extractDomain(window.location.href));
    var web_driver = getWebDriver(response.order_data.domain_host);
    //var payload = { webDriver: web_driver };

    web_driver.mainInit(body, response);
    /* Fulfillment overlay */
    // Build fulfillment overlay (shows shipping address, name, etc) if it hasn't been done already
    //if($("#fulfillment-overlay").length == 0) {
    //  web_driver.insert_overlay(body, response.order_data);
    //}

    /* Copy combo handler */
    //web_driver.initCopyComboHandler(payload);
    //web_driver.initClickToCopyHandlers(payload);
    console.log(web_driver.constructor);
    console.log(web_driver);

    setDropdownSelections(response.order_data);

    // Change the text of the button to indicate that everything is ready to go
    setTimeout(function() {
      web_driver.copyCombo.text("Start copy combo!");
    }, 2500);

    /* Keyboard shortcuts */
    var altDown = false;

    $(document).keydown(altDown, function(event) {
      if(event.keyCode == 18) {
        event.altDown = true;
      }
      else if(event.altDown && event.keyCode == 81) {
        console.log("ALT+Q keybind!"); // doesn't work! :(
      }
      //console.log(event.keyCode);
    });
    $(document).keyup(altDown, function(event) {
      if(event.keyCode == 18) {
        event.altDown = false;
      }
      //console.log(event.keyCode);
    });

  });
});
