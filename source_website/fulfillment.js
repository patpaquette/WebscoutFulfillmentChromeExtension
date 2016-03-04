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
    console.log(response.order_data);

    /* Fulfillment overlay */
    // Build fulfillment overlay (shows shipping address, name, etc) if it hasn't been done already
    if($("#fulfillment-overlay").length == 0) {
      var shipping_fields = _.pick(response.order_data, ["shipping_name", "shipping_phone", "shipping_address_line_1", "shipping_address_line_2", "shipping_address_line_3", "shipping_city", "shipping_country_code", "shipping_state", "shipping_postal_code"]);

      shipping_fields.quantity = response.order_data.quantity * response.order_data.aoi_quantity;
      var split_name = shipping_fields.shipping_name.split(" ");
      shipping_fields.first_name = split_name[0];
      shipping_fields.last_name = split_name.splice(1).join(' ');

      var overlay_template = Handlebars.compile(body);
      var overlay_html = overlay_template(shipping_fields);
      web_driver.insert_overlay(overlay_html);
    }

    // Prep payload for future .click events
    var copy_index = -1;
    var spans = $("#fulfillment-overlay span.buyer-info");
    var data = {index:copy_index, spans:spans};

    /* Input .click handlers */
    setInputHandlers($("input"), data);

    /* Copy combo handler */
    if(!jQuery._data($("#fulfillment-overlay button"), "events")) {
      $("#fulfillment-overlay button")
        .click(data, function (event) {
          // Set input handlers if there are new ones without a handler
          setInputHandlers($("input"), data);
          setDropdownSelections(response.order_data);
          // Reset highlights and index every time the copy combo button is clicked
          event.data.index = 0;
          removeHighlight(event.data.spans);
          highlight(event.data.spans.get(0));
          copyToClipboard(event.data.spans.get(0));

          $("#fulfillment-overlay button").text("Restart copy combo!");
        });
    }

    /* Click to copy functionality */
    // Add .click callback for spans
    if(!jQuery._data($("#fulfillment-overlay span.buyer-info"), "events")) {
      $("#fulfillment-overlay span.buyer-info")
        .click(data, function (event) {
          setInputHandlers($("input"), data);
          event.data.index = event.data.spans.index(this);
          removeHighlight(event.data.spans);
          highlight(this);
          copyToClipboard(this);
        });
    }

    // Add .click callback for labels
    if(!jQuery._data($("#fulfillment-overlay b.buyer-info"), "events")) {
      $("#fulfillment-overlay b.buyer-info")
        .click(data, function (event) {
          setInputHandlers($("input"), data);
          event.data.index = event.data.spans.index($(this).nextAll("span.buyer-info"));
          removeHighlight(event.data.spans);
          highlight(event.data.spans.get(event.data.index));
          copyToClipboard(event.data.spans.get(event.data.index));
        });
    }

    /* Dropdown menus */
    // Selects the right option for dropdown menus
    setDropdownSelections(response.order_data);


    // Change the text of the button to indicate that everything is ready to go
    setTimeout(function() {
      $("#fulfillment-overlay button").text("Start copy combo!");
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
