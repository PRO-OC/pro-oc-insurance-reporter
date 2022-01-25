// Duplikované v background/background.js
const chromeLocalStorageOptionsNamespace = "pro-oc-vzp-b2b-options";

function setOptionsToLocalStorage(options) {
  chrome.storage.local.set({[chromeLocalStorageOptionsNamespace] : options});
}

function getOptionsFromLocalStorage(callback) {
  chrome.storage.local.get([chromeLocalStorageOptionsNamespace], function(data) {
    callback(data[chromeLocalStorageOptionsNamespace]);
  });
}

function setB2BServerUrl(B2BServerUrl) {
  var B2BServerUrlElement = document.getElementById("B2BServerUrl");
  B2BServerUrlElement.value = B2BServerUrl;
}

function saveOptions(B2BServerUrl) {
  var options = new URLSearchParams();
  options.set("B2BServerUrl", B2BServerUrl);

  setOptionsToLocalStorage(options.toString());
}

function getOptions(callback) {
  getOptionsFromLocalStorage(function(optionsURLSearchParams) {

    var options = new URLSearchParams(optionsURLSearchParams);
    var B2BServerUrl = options.get("B2BServerUrl");

    callback({
      "B2BServerUrl": B2BServerUrl
    });
  });
}

const optionsForm = document.getElementById("options");
if(optionsForm) {
  optionsForm.addEventListener("submit", function(event) {

    event.preventDefault();

    var optionsFormData = new FormData(optionsForm);

    saveOptions(
      optionsFormData.get("B2BServerUrl")
    )
  });
}

window.onload = function() {
  getOptions(function(options) {
    setB2BServerUrl(options.B2BServerUrl);
  });
};