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
  return new BaseWebDriver();
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

/* Input .click handlers */
// Add .click handler with payload to inputs if they don't have any yet
function setInputHandlers(inputs, data) {
  jQuery.each($(inputs), function(index, value) {
    if(!jQuery._data(value, "events")) {
      console.log("event added");
      $(value)
        .click(data, function (event) {
          console.log("clicked " + event.data.index);
          // Only change input values if copy combo or a span has been clicked
          if(event.data.index >= 0 && event.data.index < event.data.spans.length) {
            copyToClipboard($(event.data.spans).get(event.data.index));
            pasteStringInElem(this);
            // Remove previous span highlight and get the next one ready
            removeHighlight($(event.data.spans).get(event.data.index));
            event.data.index += 1;
            highlight($(event.data.spans).get(event.data.index));
          }
      });
    }
  });
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
    //get web driver for this domain
    var web_driver = getWebDriver(extractDomain(window.location.href));

    /* Fulfillment overlay */
    // Build fulfillment overlay (shows shipping address, name, etc) if it hasn't been done already
    if($("#fulfillment-overlay").length == 0) {
      web_driver.insert_overlay(body, response.order_data);
    }

    // Prep payload for future .click events
    var copy_index = -1;
    var spans = web_driver.dataFields;
    var data = {index:copy_index, spans:spans};

    /* Copy combo handler */
    web_driver.initCopyComboHandler(web_driver.payload);
    web_driver.initClickToCopyHandlers(web_driver.payload);
    console.log($(web_driver.dataLabels.get(1)).prop("tagName"));
    console.log(typeof web_driver.getIndex() == "object");

    /* Click to copy functionality */
    // Add .click callback for spans
    //if(!jQuery._data($("#fulfillment-overlay span.buyer-info"), "events")) {
    //  $("#fulfillment-overlay span.buyer-info")
    //    .click(data, function (event) {
    //      setInputHandlers($("input"), data);
    //      event.data.index = event.data.spans.index(this);
    //      removeHighlight(event.data.spans);
    //      highlight(this);
    //      copyToClipboard(this);
    //    });
    //}

    // Add .click callback for labels
    //if(!jQuery._data($("#fulfillment-overlay b.buyer-info"), "events")) {
    //  $("#fulfillment-overlay b.buyer-info")
    //    .click(data, function (event) {
    //      setInputHandlers($("input"), data);
    //      event.data.index = event.data.spans.index($(this).nextAll("span.buyer-info"));
    //      removeHighlight(event.data.spans);
    //      highlight(event.data.spans.get(event.data.index));
    //      copyToClipboard(event.data.spans.get(event.data.index));
    //    });
    //}

    /* Dropdown menus */
    // Selects the right option for dropdown menus
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
