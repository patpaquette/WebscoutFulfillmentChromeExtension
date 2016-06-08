/**
 * Created by patricepaquette on 2016-03-02.
 */
//var backend_api_endpoint = "https://45.55.18.141";
var backend_api_endpoint = "http://localhost:8888";

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

BaseWebDriver.prototype.logout = function(){
  //leave implementation details to child classes
  return Q.when();
};

BaseWebDriver.prototype._fetch_source_data = function(domain_host){
  var that = this;

  this.page_type_data_p = Q.Promise(function(resolve, reject, notify){
    $.get(backend_api_endpoint + "/model/domains/" + domain_host + "/get_fulfillment_selectors", function(body){
      var data = body.data;
      //console.log(data);
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
      var match_regex = match_regex_data["match_regex"];
      console.log(match_regex);

      if(url.match(match_regex)){
        that.page_type = page_type_data["page_type"];
        that.page_type_data = page_type_data;
        return true;
      }

      return false;
    });
  });

  console.log("Page type : " + that.page_type);
};

BaseWebDriver.prototype.ready = function(callback){
  console.log("called base ready");
  this.page_type_data_p.then(function(){
    callback();
  });
};

BaseWebDriver.prototype.is_landing_page = function(){
  return false;
};

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
  //console.log(currentWidth);
  if(currentWidth == 'auto'){
    currentWidth = 0;
  }
  else{
    currentWidth = parseFloat(currentWidth);
  }

  var overlayWidth = 250;
  var newLeft = (overlayWidth + currentLeft) + 'px';
  var newWidth = currentWidth - overlayWidth;

  //console.log(overlayWidth);
  //console.log("newwidth : " + newWidth);

  html.css('position', 'relative');
  html.css('left', newLeft);
  html.css('width', newWidth);
  html.prepend(overlay);
};

//provision source page with extra code (ex. event listeners)
BaseWebDriver.prototype.provision = function(){

};

//set field value
BaseWebDriver.prototype.set_field_value = function(field, value){
  var that = this;
  var selectors_data = [];
  value = value.toString();

  //check if we have selector data available
  if(!that.page_type_data && !that.source_data){
    console.log("no selector");
    return false;
  }
  else if(!that.page_type_data){ //page type isn't known, so try with all page types
    console.log("no page type");
    selectors_data = _.reduce(that.source_data, function(result, page_type_data){
      console.log(page_type_data);
      result = result.concat(_.filter(page_type_data["domainPageTypeSelectors"], {field: field}));
      return result;
    }, []);

    console.log(selectors_data);
  }
  else{
    console.log("selectors and page type available");
    selectors_data = _.filter(this.page_type_data["domainPageTypeSelectors"], {field: field});
  }
  console.log(selectors_data);

  var css_selectors = _(selectors_data).filter({selector_type: 'css'}).map('selector').value();
  console.log(css_selectors);
  return this._fill_data_from_css_selectors(css_selectors, value);
};

//get field value
BaseWebDriver.prototype.get_field_value = function(field){
  var that = this;
  var selectors_data = [];

  //check if we have selector data available
  if(!that.page_type_data && !that.source_data){
    console.log("selector data not available");
    return false;
  }
  else if(!that.page_type_data){ //page type isn't known, so try with all page types
    console.log("trying with unkown page type");
    selectors_data = _.reduce(that.source_data, function(result, page_type_data){
      console.log(page_type_data);
      result = result.concat(_.filter(page_type_data["domainPageTypeSelectors"], {field: field}));
      return result;
    }, []);

    console.log(selectors_data);
  }
  else{
    selectors_data = _.filter(this.page_type_data["domainPageTypeSelectors"], {field: field});
  }

  var css_selectors = _(selectors_data).filter({selector_type: 'css'}).map('selector').value();
  return _.reduce(css_selectors, function(ret, selector){
    if(ret){ return ret; }

    var text = $(selector).text().trim();

    if(text === ""){ return null; }
    return text;
  }, null);
};

BaseWebDriver.prototype._fill_data_from_css_selectors = function(selectors, value){
  var success = false;
  var that = this;

  _.each(selectors, function(selector){
    var matches = $(selector);
    console.log(selector);
    console.log(matches);

    if(matches.length > 0){
      _.each(matches, function(element, index){
        success = true;
        that._resolve_element_value(element, value);
      });
    }
  });

  return success;
};

BaseWebDriver.prototype._resolve_element_value = function(element, value){
  if(this._is_text_input(element)){
    this._text_input_resolver(element, value);
  }
  else if(this._is_dropdown(element)){
    this._dropdown_resolver(element, value);
  }
};

BaseWebDriver.prototype._is_text_input = function(element){
  var text_input_types = ["text", "tel"];

  return element.nodeName.toLowerCase() === 'input' && text_input_types.indexOf($(element).attr('type')) >= 0;
};

BaseWebDriver.prototype._is_dropdown = function(element){
  return element.nodeName.toLowerCase() === 'select';
};

BaseWebDriver.prototype._text_input_resolver = function(element, value){
  console.log("resolving text input");
  $(element).val('');
  copyToClipboard($("<span>" + value + "</span>").get(0));
  pasteStringInElem(element);
};

BaseWebDriver.prototype._dropdown_resolver = function(element, value){
  throw new Error('Not implemented');
};

//set page type match regex
BaseWebDriver.prototype.add_page_type_match_regex = function(page_type, match_regex){
  var that = this;

  return Q.promise(function(resolve, reject){
    $.post(backend_api_endpoint + "/model/domains/" + domain_host + "/add_page_type_match", {page_type: page_type, match_regex: match_regex}, function(body){
      resolve();
    });
  });
};

/** ----------- Recorder ----------- **/
BaseWebDriver.prototype.save_element_selector = function(element, page_type, field_name){
  console.log(element);
  var id = element.getAttribute('id');
  var selector = "#" + id;
  console.log(selector);

  if(id){
    return this.add_page_type_field_selector(page_type, field_name, selector, 'css');
  }
};

//set field selector
BaseWebDriver.prototype.add_page_type_field_selector = function(page_type, field_name, selector, selector_type){
  var that = this;
  console.log(" not yay " );

  return Q.promise(function(resolve, reject){
    $.post(backend_api_endpoint + "/model/domains/" + that.domain_host + "/add_page_type_selector", {page_type: page_type, field: field_name, selector: selector, selector_type: selector_type}, function(body){
      console.log("yay!");
      resolve();
    });
  });
};