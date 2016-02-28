/**
 * Created by patricepaquette on 2016-02-22.
 */

function copyToClipboard(elem) {
  // create hidden text element, if it doesn't already exist
  var targetId = "_hiddenCopyText_";
  console.log(document.body);
  console.log("element: ");
  console.log(elem);
  var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
  var origSelectionStart, origSelectionEnd;
  if (isInput) {
    // can just use the original source element for the selection and copy
    target = elem;
    origSelectionStart = elem.selectionStart;
    origSelectionEnd = elem.selectionEnd;
  } else {
    // must use a temporary form element for the selection and copy
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
  // select the content
  var currentFocus = document.activeElement;
  target.focus();
  target.setSelectionRange(0, target.value.length);

  // copy the selection
  var succeed;
  try {
    succeed = document.execCommand("copy");
  } catch(e) {
    succeed = false;
  }

  // highlight text if copy is successful
  console.log("succeed: " + succeed);
  if (succeed) {
    elem.setAttribute("style", "background-color:yellow");
  }

  // restore original focus
  if (currentFocus && typeof currentFocus.focus === "function") {
    currentFocus.focus();
  }

  if (isInput) {
    // restore prior selection
    elem.setSelectionRange(origSelectionStart, origSelectionEnd);
  } else {
    // clear temporary content
    target.textContent = "";
  }
  return succeed;
}

chrome.runtime.sendMessage({get_order_data: true}, function(response){
  $.get(chrome.extension.getURL("source_website/fulfillment_overlay.html"), function(body){

    //build fulfillment overlay (shows shipping address, name, etc)
    if($("#fulfillment-overlay").length < 0) {
      var shipping_fields = _.pick(response.order_data, ["shipping_name", "shipping_phone", "shipping_address_line_1", "shipping_address_line_2", "shipping_address_line_3", "shipping_city", "shipping_country_code", "shipping_state", "shipping_postal_code"]);

      shipping_fields.quantity = response.order_data.quantity * response.order_data.aoi_quantity;
      var split_name = shipping_fields.shipping_name.split(" ");
      shipping_fields.first_name = split_name[0];
      shipping_fields.last_name = split_name.splice(1).join(' ');

      var overlay_template = Handlebars.compile(body);
      var overlay_html = overlay_template(shipping_fields);

      $('body').append($(overlay_html));

      ////add copy combo button
      //var copy_combo = $("<button type='button'>Start copy combo!</button>")
      //  .click(function(){
      //    var spans = $("#fulfillment-overlay span");
      //    copyToClipboard(spans.get(0));
      //  });
      //
      //$("#fulfillment-overlay h1").after(copy_combo);

      //add click to copy functionality
      var copy_elem = $("<a href='#' style='margin-left: 3px; color: rgb(0, 109, 192);' onclick='return false;'>copy</a>")
        .click(function () {
          var closest_span = $(this).prev('span');
          copyToClipboard(closest_span.get(0));
        });

      $("#fulfillment-overlay span").after(copy_elem);
    }

  });
});