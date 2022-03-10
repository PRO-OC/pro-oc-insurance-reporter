// Duplikované v background/background.js
const chromeLocalStorageOptionsNamespace = "pro-oc-insurance-reporter";

const B2B_SERVER_URL = "B2BServerUrl";
const POINT_SERVER_URL = "PointServerUrl";
const ENCRYPTING_DISABLED = "EncryptingDisabled";
const ENCRYPTING_PASSWORD = "EncryptingPassword";

function setOptionsToLocalStorage(options) {
  chrome.storage.local.set({[chromeLocalStorageOptionsNamespace] : options});
}

function getOptionsFromLocalStorage(callback) {
  chrome.storage.local.get([chromeLocalStorageOptionsNamespace], function(data) {
    callback(data[chromeLocalStorageOptionsNamespace]);
  });
}

function setB2BServerUrl(B2BServerUrl) {
  var B2BServerUrlElement = document.getElementById(B2B_SERVER_URL);
  B2BServerUrlElement.value = B2BServerUrl;
}

function setPointServerUrl(PointServerUrl) {
  var PointServerUrlElement = document.getElementById(POINT_SERVER_URL);
  PointServerUrlElement.value = PointServerUrl;
}

function setEncryptingPassword(EncryptingPassword) {
  var EncryptingPasswordElement = document.getElementById(ENCRYPTING_PASSWORD);
  EncryptingPasswordElement.value = EncryptingPassword;
}

function setEncryptingDisabled(EncryptingDisabled) {
  var EncryptingDisabledElement = document.getElementById(ENCRYPTING_DISABLED);
  EncryptingDisabledElement.checked = EncryptingDisabled;
}

function saveOptions(B2BServerUrl, PointServerUrl, EncryptingDisabled, EncryptingPassword) {
  var options = new URLSearchParams();
  options.set(B2B_SERVER_URL, B2BServerUrl);
  options.set(POINT_SERVER_URL, PointServerUrl);
  options.set(ENCRYPTING_DISABLED, EncryptingDisabled);
  options.set(ENCRYPTING_PASSWORD, EncryptingPassword);

  setOptionsToLocalStorage(options.toString());
}

function getOptions(callback) {
  getOptionsFromLocalStorage(function(optionsURLSearchParams) {
    var options = new URLSearchParams(optionsURLSearchParams);
    callback(options);
  });
}

const optionsForm = document.getElementById("options");
if(optionsForm) {
  optionsForm.addEventListener("submit", function(event) {

    event.preventDefault();

    var optionsFormData = new FormData(optionsForm);

    var EncryptingDisabled = document.getElementById(ENCRYPTING_DISABLED);

    saveOptions(
      optionsFormData.get(B2B_SERVER_URL),
      optionsFormData.get(POINT_SERVER_URL),
      EncryptingDisabled ? EncryptingDisabled.checked : false,
      optionsFormData.get(ENCRYPTING_PASSWORD)
    )
  });
}

window.onload = function() {
  getOptions(function(options) {
    setB2BServerUrl(options.get(B2B_SERVER_URL));
    setPointServerUrl(options.get(POINT_SERVER_URL));
    setEncryptingDisabled(options.get(ENCRYPTING_DISABLED) == "true" ? true : false);
    setEncryptingPassword(options.get(ENCRYPTING_PASSWORD));
  });
};