/**
 * Created by patricepaquette on 2016-03-02.
 */
var backend_api_endpoint = "https://45.55.18.141";

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

function pasteStringInElem(elem){
  console.log("elem to paste in ");
  console.log(elem);
  $(elem).select();
  if(document.execCommand('paste')){
    console.log("should have pasted!");
  }
  else{
    console.log("no paste");
  }
}

function BaseWebDriver(domain_host){
  var that = this;
  this.domain_host = domain_host;
  this.page_type = null;
  this.page_type_data = null;
  this.page_type_data_p = null;
  this.source_data = null;

  this._fetch_source_data(domain_host)
    .then(function(source_data){
      that._resolve_page_type(source_data);
    });
}

BaseWebDriver.prototype._fetch_source_data = function(domain_host){
  var that = this;

  this.page_type_data_p = Q.Promise(function(resolve, reject, notify){
    $.get(backend_api_endpoint + "/model/domains/" + domain_host + "/get_fulfillment_selectors", function(body){
      var data = body.data;
      console.log(data);
      that.source_data = data;
      resolve(data);
    });
  });

  return this.page_type_data_p;
}

BaseWebDriver.prototype._resolve_page_type = function(source_data){
  var url = document.location.href;
  var that = this;

  _.some(source_data, function(page_type_data){
    return _.some(page_type_data["domainPageTypeMatches"], function(match_regex_data){
      var match_regex = match_regex_data["match_regex"]

      if(url.match(match_regex)){
        that.page_type = page_type_data["page_type"];
        that.page_type_data = page_type_data;
        return true;
      }

      return false;
    });
  });

  console.log("Page type : " + that.page_type);
}

BaseWebDriver.prototype.ready = function(callback){
  console.log("called base ready");
  this.page_type_data_p.then(function(){
    callback();
  });
}

//insert extension overlay into source page
BaseWebDriver.prototype.insert_overlay = function(overlay_html){
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

//provision source page with extra code (ex. event listeners)
BaseWebDriver.prototype.provision = function(){

}

//set field value
BaseWebDriver.prototype.set_field_value = function(field, value){
  var that = this;
  var selectors_data = [];

  //check if we have selector data available
  if(!that.page_type_data && !that.source_data){
    return false;
  }
  else if(!that.page_type_data){ //page type isn't known, so try with all page types
    selectors_data = _.reduce(that.source_data, function(result, page_type_data){
      result.extend(_.filter(page_type_data["domainPageTypeSelectors"], {field: field}));
      return result;
    }, []);
  }
  else{
    selectors_data = _.filter(this.page_type_data["domainPageTypeSelectors"], {field: field});
  }

  var css_selectors = _(selectors_data).filter({selector_type: 'css'}).map('selector').value();
  return this._fill_data_from_css_selectors(css_selectors, field, value);
}

BaseWebDriver.prototype._fill_data_from_css_selectors = function(selectors, field, value){
  var success = false;

  copyToClipboard($("<span>" + value + "</span>").get(0));

  _.each(selectors, function(selector){
    console.log(selector);
    var matches = $(selector);

    console.log(matches);
    if(matches.length > 0){
      success = true;
      pasteStringInElem(matches.get(0));
    }
  });

  return success;

}

//set page type match regex
BaseWebDriver.prototype.add_page_type_match_regex = function(page_type, match_regex){
  var that = this;

  return Q.promise(function(resolve, reject){
    $.post(backend_api_endpoint + "/model/domains/" + domain_host + "/add_page_type_match", {page_type: page_type, match_regex: match_regex}, function(body){
      resolve();
    });
  });
}

//set field selector
BaseWebDriver.prototype.add_page_type_field_selector = function(page_type, field, selector, selector_type){
  var that = this;

  return Q.promise(function(resolve, reject){
    $.post(backend_api_endpoint + "/model/domains/" + that.domain_host + "/add_page_type_selector", {page_type: page_type, field: field, selector: selector, selector_type: selector_type}, function(body){
      console.log("yay!");
      resolve();
    });
  });
}