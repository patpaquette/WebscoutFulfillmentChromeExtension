/**
 * Created by Pierre-Yves on 3/14/2016.
 */

function HomedepotWebDriver() {

}
HomedepotWebDriver.prototype = new BaseWebDriver("homedepot");
HomedepotWebDriver.prototype.constructor = HomedepotWebDriver();

/** ----------- Recorder ----------- **/
// Homedepot inputs don't have IDs, so we're using name instead
HomedepotWebDriver.prototype.save_element_selector = function(element, page_type, field_name){
  console.log(element);
  var name = element.getAttribute('name');
  var selector = "input[name='" + name + "']";
  console.log(selector);

  if(name){
    return this.add_page_type_field_selector(page_type, field_name, selector, 'css');
  }
};