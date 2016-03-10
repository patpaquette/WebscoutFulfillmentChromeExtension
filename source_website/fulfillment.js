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
  try{
    var capitalized_domain = source_domain.charAt(0).toUpperCase() + source_domain.slice(1);
    eval("var web_driver = new " + capitalized_domain + "WebDriver()");

    return web_driver;
  }
  catch(e){
    return new BaseWebDriver(source_domain);
  }
}

function copyToClipboard(elem) {
  // Create hidden text element, if it doesn't already exist
  var targetId = "_hiddenCopyText_";
  console.log(document.body);
  console.log("element: ");
  console.log(elem);
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
    console.log(target);
    console.log(!target);
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

function fill_input_success(field_name){
  $("span[field-name=" + field_name + "]").addClass('success');
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


//get web driver for this domain
$(document).ready(function(){
  var web_driver = getWebDriver(extractDomain(window.location.href));

  web_driver.ready(function(){
    console.log("is ready");
    chrome.runtime.sendMessage({get_order_data: true}, function(response){
      $.get(chrome.extension.getURL("source_website/fulfillment_overlay.html"), function(body){
        /* Fulfillment overlay */
        // Build fulfillment overlay (shows shipping address, name, etc) if it hasn't been done already
        if($("#fulfillment-overlay").length == 0) {
          var shipping_fields = _.pick(response.order_data, ["shipping_name", "shipping_phone", "shipping_address_line_1", "shipping_address_line_2", "shipping_address_line_3", "shipping_city", "shipping_country_code", "shipping_state", "shipping_postal_code"]);

          shipping_fields.quantity = response.order_data.quantity * response.order_data.aoi_quantity;
          var split_name = shipping_fields.shipping_name.split(" ");
          shipping_fields.first_name = split_name[0];
          shipping_fields.last_name = split_name.splice(1).join(' ');
          var shipping_fields_map = {"first_name": "firstname", "last_name": "lastname", "shipping_address_line_1": "address", "shipping_city": "city", "shipping_state": "state", "shipping_postal_code": "postal_code", "shipping_phone": "phone"};

          var overlay_template = Handlebars.compile(body);
          var overlay_html = overlay_template(shipping_fields);
          web_driver.insert_overlay(overlay_html);

          _.each(shipping_fields_map, function(field_name, key){
            var value = shipping_fields[key];

            if(value){
              var success = web_driver.set_field_value(field_name, shipping_fields[key]);

              if(success){
                fill_input_success(field_name);
              }
            }
          });
        }

        // Prep payload for future .click events
        var copy_index = -1;
        var spans = $("#fulfillment-overlay span.buyer-info");
        var data = {index:copy_index, spans:spans};

        /* Input .click handlers */
        // Add .click handler with payload to all inputs
        $("input")
          .click(data, function (event) {
            // Only change input values if copy combo or a span has been clicked
            if(event.data.index >= 0 && event.data.index < event.data.spans.length) {
              var field_name = event.data.spans[event.data.index].getAttribute('field-name');
              fill_input_success(field_name);

              copyToClipboard($(event.data.spans).get(event.data.index));
              pasteStringInElem(this);
              console.log(event.data.index);
              // Remove previous span highlight and get the next one ready
              removeHighlight($(event.data.spans).get(event.data.index));
              event.data.index += 1;
              highlight($(event.data.spans).get(event.data.index));
            }
          });

        /* Copy combo handler */
        $("#fulfillment-overlay button")
          .click(data, function(event) {
            // Reset highlights and index every time the copy combo button is clicked
            event.data.index = 0;
            event.data.spans = $("#fulfillment-overlay span.buyer-info:not(.success)");
            removeHighlight(event.data.spans);
            highlight(event.data.spans.get(0));
            copyToClipboard(event.data.spans.get(0));

            $("#fulfillment-overlay button").text("Restart copy combo!");
          });

        /* Click to copy functionality */
        // Add .click callback for spans
        $("#fulfillment-overlay span.buyer-info")
          .click(data, function(event) {
            event.data.spans = $("#fulfillment-overlay span.buyer-info:not(.success)");
            event.data.index = event.data.spans.index(this);
            removeHighlight(event.data.spans);
            highlight(this);
            copyToClipboard(this);
          });

        // Add .click callback for labels
        $("#fulfillment-overlay b.buyer-info")
          .click(data, function(event) {
            event.data.index = event.data.spans.index($(this).nextAll("span.buyer-info"));
            removeHighlight(event.data.spans);
            highlight(event.data.spans.get(event.data.index));
            copyToClipboard(event.data.spans.get(event.data.index));
          });
        // Change the text of the button to indicate that everything is ready to go

        /* Keyboard shortcuts */
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
        });

        $("#fulfillment-overlay button").text("Start copy combo!");
      });
    });
  });
});
