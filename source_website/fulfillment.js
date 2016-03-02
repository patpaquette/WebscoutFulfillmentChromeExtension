/**
 * Created by patricepaquette on 2016-02-22.
 */

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

      var overlay_template = Handlebars.compile(body);
      var overlay_html = overlay_template(shipping_fields);

      //$('body').children().wrapAll('<div id="webscout_fulfillment_source_content" />');
      //$('body').prepend($(overlay_html));

      var overlay = $(overlay_html);
      var html = $('html');
      var currentLeft = html.css('left');
      if(currentLeft == 'auto'){
        currentLeft = 0;
      }
      else{
        currentLeft = parseFloat(currentLeft);
      }
      
      var currentWidth = html.css('width');
      console.log(currentWidth);
      if(currentWidth == 'auto'){
        currentWidth = 0;
      }
      else{
        currentWidth = parseFloat(currentWidth);
      }

      var overlayWidth = 250;
      var newLeft = (overlayWidth + currentLeft) + 'px';
      var newWidth = currentWidth - overlayWidth;

      console.log(overlayWidth);
      console.log("newwidth : " + newWidth);
      
      html.css('position', 'relative');
      html.css('left', newLeft);
      html.css('width', newWidth);
      html.prepend(overlay);
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
          $(this).attr("value", $($(event.data.spans).get(event.data.index)).text());
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
      .click(data, function (event) {
        // Reset highlights and index every time the copy combo button is clicked
        event.data.index = 0;
        removeHighlight(event.data.spans);
        highlight(event.data.spans.get(0));
        copyToClipboard(event.data.spans.get(0));

        $("#fulfillment-overlay button").text("Restart copy combo!");
      });

    /* Click to copy functionality */
    // Add .click callback for spans
    $("#fulfillment-overlay span.buyer-info")
      .click(data, function(event) {
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
    $("#fulfillment-overlay button").text("Start copy combo!");

    /* Keyboard shortcuts */
    $(document).keydown(function(event) {
      if(event.keyCode == 68) //placeholder
      console.log(event);
    });

  });
});
