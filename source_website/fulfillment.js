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

function highlight(elem) {
  $(elem).attr("style", "background-color:yellow");
}

function removeHighlight(elem) {
  //$(elem).attr("style", $(elem).attr("style").replace(" ?background-color:[^;]+;?", ""));
  $(elem).removeAttr("style");
}

var copy_index = -1;

chrome.runtime.sendMessage({get_order_data: true}, function(response){
  $.get(chrome.extension.getURL("source_website/fulfillment_overlay.html"), function(body){

    //build fulfillment overlay (shows shipping address, name, etc) if it hasn't been done already
    if($("#fulfillment-overlay").length < 0) {
      var shipping_fields = _.pick(response.order_data, ["shipping_name", "shipping_phone", "shipping_address_line_1", "shipping_address_line_2", "shipping_address_line_3", "shipping_city", "shipping_country_code", "shipping_state", "shipping_postal_code"]);

      shipping_fields.quantity = response.order_data.quantity * response.order_data.aoi_quantity;
      var split_name = shipping_fields.shipping_name.split(" ");
      shipping_fields.first_name = split_name[0];
      shipping_fields.last_name = split_name.splice(1).join(' ');

      var overlay_template = Handlebars.compile(body);
      var overlay_html = overlay_template(shipping_fields);

      $('body').append($(overlay_html));
    }

    //add click to copy functionality if it hasn't been done already
    if($("#fulfillment-overlay a").length < 0) {
      var copy_elem = $("<a href='#' style='margin-left: 3px; color: rgb(0, 109, 192);' onclick='return false;'>copy</a>")
        .click(function () {
          var closest_span = $(this).prev('span');
          copyToClipboard(closest_span.get(0));
        });
      $("#fulfillment-overlay span").after(copy_elem);
    }

    //add combo copy functionality to click event
    console.log(copy_index);
    $("#fulfillment-overlay button")
      .click(function () {
        var spans = $("#fulfillment-overlay span");

        if(copy_index < 0) {
          //add .click callback with payload if this is the first time clicking copy combo
          var data = {index:copy_index, spans:spans};
          $("input").click(data, function (event) {
            $(this).attr("value", $($(event.data.spans).get(event.data.index)).text());
            console.log("CLICK! " + event.data.index);
            //remove previous span highlight and get the next one ready
            removeHighlight($(event.data.spans).get(event.data.index));
            event.data.index += 1;
            highlight($(event.data.spans).get(event.data.index));
          });
        }
        //reset highlights and index
        copy_index = 0;
        removeHighlight(spans);
        highlight(spans.get(0));
        copyToClipboard(spans.get(0));
      });
    $("#fulfillment-overlay button").text("Start copy combo!");
  });
});
