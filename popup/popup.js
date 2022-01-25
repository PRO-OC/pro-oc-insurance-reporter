// Duplikované v options/options.js
const chromeLocalStorageOptionsNamespace = "pro-oc-vzp-b2b-options";

const DEFAULT_B2B_PROD_SERVER_URL = 'https://prod.b2b.vzp.cz';

var ViaReportButton = document.getElementById("ViaReport");
if (ViaReportButton) {
    ViaReportButton.onclick = function() {

        isEregKsrzisSignedIn(function(isSignedIn) {

            if(isSignedIn) {

                getRegistrLoginCookies(function (cookieParams) {

                    var kodOsoby = cookieParams.get("kodOsoby");
                    var heslo = cookieParams.get("heslo");
                
                    if(!kodOsoby || !heslo) {
                        alert("Je potřeba být přihlášený do registru Žadanky Covid-19.")
                    } else {
                        var url = chrome.runtime.getURL("assets/Zadanky.xlsx");
                        fetch(url)
                            .then(response => {
                                response.arrayBuffer().then(xlsxBytes => {

                                    var workbook = XLSX.readFile(xlsxBytes);

                                    var firstSheetName = workbook.SheetNames[0];
                                    var worksheet = workbook.Sheets[firstSheetName];

                                readAndReportAllNotCorrectInsudances(worksheet);
                            });
                        });
                    }
                });
            } else {
                alert("Je potřeba být přihlášený do ereg registru.")
            }
        });
    }
}

const OPTIONS_PAGE = "OptionsPage";
const OptionsPageButton = document.getElementById(OPTIONS_PAGE);

if (OptionsPageButton) {
    OptionsPageButton.onclick = function() {
        chrome.runtime.openOptionsPage();
    }
}

function isEregKsrzisSignedIn(callback) {
    var url = getEregRegistrUrl();
  
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if(xhr.readyState === XMLHttpRequest.DONE) {
  
            if(xhr.status == 200) {
  
                var parser = new DOMParser();
                var responseDocument = parser.parseFromString(xhr.responseText,"text/html");
  
                if(responseDocument.title.includes("Přihlášení")) {
                    callback(false);
                } else {
                    callback(true);
                }
            } else {
                callback(false);
            }
        }
    };
    xhr.send();
}

async function readAndReportAllNotCorrectInsudances(worksheet) {
    var index = 2;
    var CisloZadanky = worksheet["B" + index].h;
    //CisloZadanky = 7606834061; // only testing purpose
    while(CisloZadanky) {

        await reportAllNotCorrectInsurances(index, CisloZadanky);

        index++;
        try {
            CisloZadanky = worksheet["B" + index].h;
            //CisloZadanky = null;  // only testing purpose
        } catch(e) {
            break;
        }
    }
}

function tryToFindForeignProfilesByZadankaData(ZadankaData, callback) {

    var searchVariantJmenoPrijmeniDatumNarozeni = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni: ZadankaData.TestovanyDatumNarozeniText,
        StatniPrislusnost: ZadankaData.TestovanyNarodnostKod,
        TypVyhledani: "JmenoPrijmeniRC"
    };

    var searchVariantJmenoPrijmeniDatumNarozeniMistoNarozeni = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni: ZadankaData.TestovanyDatumNarozeniText,
        StatniPrislusnost: ZadankaData.TestovanyNarodnostKod,
        CisloPojistence: ZadankaData.TestovanyCisloPojistence,
        TypVyhledani: "JmenoPrijmeniDatumNarozeniMistoNarozeni"
    };

    var searchVariantCizinecJmenoPrijmeniDatumNarozniObcanstvi = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni: ZadankaData.TestovanyDatumNarozeniText,
        StatniPrislusnost: ZadankaData.TestovanyNarodnostKod,
        TypVyhledani: "CizinecJmenoPrijmeniDatumNarozniObcanstvi"
    };

    var Profiles = [];
    loadOckoUzisPatientInfo(searchVariantJmenoPrijmeniDatumNarozeni, function(Profile1) {
        if(Profile1.Cislo) {
            Profiles.push(Profile1);
        }
        loadOckoUzisPatientInfo(searchVariantJmenoPrijmeniDatumNarozeniMistoNarozeni, function(Profile2) {
            if(Profile2.Cislo) {
                Profiles.push(Profile2);
            }
            loadOckoUzisPatientInfo(searchVariantCizinecJmenoPrijmeniDatumNarozniObcanstvi, function(Profile3) {
                if(Profile3.Cislo) {
                    Profiles.push(Profile3);
                }
                callback(Profiles);
            });
        });
    });
}

function padStart(num, padLen, padChar) {
    var pad = new Array(1 + padLen).join(padChar);
    return (pad + num).slice(-pad.length);
}

function PrubehPojisteniDruhB2B(CisloPojistence, KontrolaKeDni, onSuccess, onError) {

    return new Promise(function (resolve, reject) {

        getOptionsFromLocalStorage(function(optionsURLSearchParams) {
  
            var options = new URLSearchParams(optionsURLSearchParams);
      
            var B2BServerUrlFromOptions = options.get("B2BServerUrl");

            var xmlhttp = new XMLHttpRequest();

            var KontrolaKeDniString = KontrolaKeDni.getFullYear() + "-" + padStart((KontrolaKeDni.getMonth() + 1 ), 2, "0") + "-" + padStart(KontrolaKeDni.getDate(), 2, "0");
  
            var sr = "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\r\n\t<soap:Body xmlns:ns1=\"http://xmlns.gemsystem.cz/PrubehPojisteniDruhB2B\">\r\n\t\t<ns1:prubehPojisteniDruhB2BPozadavek>\r\n\t\t<ns1:cisloPojistence>" + CisloPojistence + "</ns1:cisloPojistence>\r\n\t\t<ns1:kDatu>" + KontrolaKeDniString + "</ns1:kDatu>\r\n\t\t</ns1:prubehPojisteniDruhB2BPozadavek>\r\n\t</soap:Body>\r\n</soap:Envelope>";

            xmlhttp.open('POST', (B2BServerUrlFromOptions ? B2BServerUrlFromOptions : DEFAULT_B2B_PROD_SERVER_URL) + "/B2BProxy/HttpProxy/PrubehPojisteniDruhB2B", true);
            //xmlhttp.withCredentials = true;
            xmlhttp.setRequestHeader('Content-Type', 'text/xml');
            xmlhttp.onreadystatechange = function () {
                if(xmlhttp.readyState === XMLHttpRequest.DONE) {
  
                    if(xmlhttp.status == 200) {
                        var results = {
                            "stav": getSoapTagValue(xmlhttp.response, "stav"),
                            "kodPojistovny": getSoapTagValue(xmlhttp.response, "kodPojistovny"),
                            "nazevPojistovny": getSoapTagValue(xmlhttp.response, "nazevPojistovny"),
                            "druhPojisteni": getSoapTagValue(xmlhttp.response, "druhPojisteni")
                        };
                        onSuccess(results);
                    } else {
                        onError();
                    }
                    resolve();
                }
            }
            xmlhttp.send(sr);
        });
    });
}

function getSoapTagValue(soapBody, tagName) {

    var tagStartPosition = soapBody.indexOf(tagName);
    if(tagStartPosition < 0) {
      return undefined;
    }
  
    var tagValueStartPosition = soapBody.substring(tagStartPosition + tagName.length + 1);
  
    var tagClosePosition = tagValueStartPosition.indexOf(tagName);
    if(tagClosePosition < 0) {
      return undefined;
    }
  
    var tagValue = tagValueStartPosition.substring(0, tagClosePosition - ("</ns0:").length);
  
    return tagValue;
}

function getEregRegistrDomain() {
    return "ereg.ksrzis.cz";
}

function getEregRegistrUrl() {
    return "https://" + getEregRegistrDomain();
}

function getRegistrCUDVyhledaniPacientaUrl() {
    return getEregRegistrUrl() + "/Registr/CUDZadanky/VyhledaniPacienta";
}

function getRegistrLoginCookieName() {
    return "MyUniqueKey";
}

function getRegistrLoginCookies(callback) {
    var registrUrl = getRegistrUrl();

    chrome.cookies.get({
        url: registrUrl, 
        name: getRegistrLoginCookieName()
    }, function(cookie) {
        if(!cookie) {
            callback(new URLSearchParams());
        } else {
            var cookieParams = new URLSearchParams(cookie.value);
            callback(cookieParams);
        }
    });
}

function getRegistrCUDVyhledaniPacientaUrlParams(zadanka) {
    var urlParams = new URLSearchParams();
    urlParams.set("DuvodVyhledani", "VyhledatPacienta");
    urlParams.set("TypVyhledani", zadanka.StatniPrislusnost == "CZ" ? "JmenoPrijmeniRC" : "CizinecJmenoPrijmeniDatumNarozniObcanstvi");
    urlParams.set("Jmeno", zadanka.Jmeno);
    urlParams.set("Prijmeni", zadanka.Prijmeni);
    if(zadanka.StatniPrislusnost == "CZ") {
      urlParams.set("RodneCislo", zadanka.CisloPojistence);
    } else {
      urlParams.set("DatumNarozeni", zadanka.DatumNarozeni);
      if(zadanka.StatniPrislusnost) {
        urlParams.set("ZemeKod", zadanka.StatniPrislusnost);
      }
      if(zadanka.ZemeKod_Title) {
        urlParams.set("ZemeKod_Title", zadanka.ZemeKod_Title);
      }
    }
    urlParams.set("_submit", "None");
    return urlParams;
}

function DateStringFormatDDMMYYYYToDate(Datum) {
    var day = Datum.split(".")[0].trim();
    var month = Datum.split(".")[1].trim();
    var year = Datum.split(".")[2].trim();
    return new Date(year, month - 1, day);
}

function loadOckoUzisPatientInfo(zadanka, callback) {

    var url = getRegistrCUDVyhledaniPacientaUrl();
    var urlParams = getRegistrCUDVyhledaniPacientaUrlParams(zadanka);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status == 200) {
  
            var parser = new DOMParser();
            var responseDocument = parser.parseFromString(xhr.responseText,"text/html");

            var results = {};

            var results = {
                Telefon: undefined,
                Email: undefined,
                Cislo: undefined,
                PacientDatumNarozeniText: undefined,
                PacientCisloPojistence: undefined
            };
            
            var labels = responseDocument.getElementsByTagName('label');
            for (var i = 0; i < labels.length; i++) {
            switch(labels[i].htmlFor) {
                case 'Pacient_Telefon':
                    results.Telefon = labels[i].nextElementSibling.innerText.trim();
                    break;
                case 'Pacient_Email':
                    results.Email = labels[i].nextElementSibling.innerText.trim();
                    break;
                case 'Pacient_CisloPacienta':
                    results.Cislo = labels[i].nextElementSibling.innerText.trim();
                    break;
                case 'PacientDatumNarozeniText':
                    results.PacientDatumNarozeniText = labels[i].nextElementSibling.innerText.trim();
                    break;
                case 'Pacient_CisloPojistence':
                    results.PacientCisloPojistence = labels[i].nextElementSibling.innerText.trim();
                    break;
                }
            }

            results.Link = xhr.responseURL;
            results.EditLink = xhr.responseURL.replace("Index", "Edit");
  
            callback(results);
        }
    }
    xhr.send(urlParams.toString());
}

async function reportCorrectInsuranceFromProfiles(index, ZadankaData, KontrolaKeDni, PacientProfiles, onSuccess) {

    if(PacientProfiles.length == 0) {
        console.log("Vyžádaná úprava k Excel řádku č. " + index + ". Žádanka č. " + ZadankaData.Cislo + ". Uvedené pojištění: `" + ZadankaData.TestovanyCisloPojistence + "` na žádance nebylo v den vystavení žádanky: `"+ KontrolaKeDni + "` platné. Pro danou osobu se nepodařil najít v ISIN žádný profil, který by odpovídalo jménu, přijmení, datumu narození a státní příslušnosti ze žádanky.");
        onSuccess();
        return;
    }

    var CisloPojistence = null;

    for (var pacientCounter = 0; pacientCounter < PacientProfiles.length; pacientCounter++) {

        var PacientInfo = PacientProfiles[pacientCounter];

        if(PacientInfo.PacientCisloPojistence) {

            await PrubehPojisteniDruhB2B(PacientInfo.PacientCisloPojistence, KontrolaKeDni, function(Results2) {
                if (Results2 && Results2.stav == "pojisten") {
                    CisloPojistence = PacientInfo.PacientCisloPojistence;
                }
            });
        }

        if(pacientCounter + 1 >= PacientProfiles.length) {

            if(CisloPojistence) {

                // zda je pojištění platné i dnešní datum
                PrubehPojisteniDruhB2B(CisloPojistence, new Date(), function(Result) {
                    if (Result && Result.stav == "pojisten") {
                        var dateNow = new Date();
                        console.log("Vyžádaná úprava k Excel řádku č. " + index + ". Žádanka č. " + ZadankaData.Cislo + ". Uvedené pojištění: `" + ZadankaData.TestovanyCisloPojistence + "` na žádance nebylo v den vystavení žádanky: `"+ KontrolaKeDni+ "` platné. Pro danou osobu se ale podařilo na profilu v ISIN číslo: `" + PacientInfo.Cislo + "` přečíst číslo pojištěnce: `" + CisloPojistence + "`, které v danou chvíli platné bylo. K datu této kontroly platné je: `" + dateNow.toString() + "`.");
                    } else {
                        console.log("Vyžádaná úprava k Excel řádku č. " + index + ". Žádanka č. " + ZadankaData.Cislo + ". Uvedené pojištění: `" + ZadankaData.TestovanyCisloPojistence + "` na žádance nebylo v den vystavení žádanky: `"+ KontrolaKeDni+ "` platné. Pro danou osobu se ale podařilo na profilu v ISIN číslo: `" + PacientInfo.Cislo + "` přečíst číslo pojištěnce: `" + CisloPojistence + "`, které v danou chvíli platné bylo. K datu této kontroly platné ale není: `" + dateNow.toString() + "`.");
                    }
                });
            } else {
                console.log("Vyžádaná úprava k Excel řádku č. " + index + ". Žádanka č. " + ZadankaData.Cislo + ". Uvedené pojištění: `" + ZadankaData.TestovanyCisloPojistence + "` na žádance nebylo v den vystavení žádanky: `"+ KontrolaKeDni + "` platné. Pro danou osobu se nepodařilo na nalezeném profilu v ISIN přečíst číslo pojištěnce, které by v danou chvíli platné bylo.");
            }
            onSuccess();
        }
    }
}

function reportNotCorrectInsurance(index, ZadankaData, onSuccess) {

    // kontrola ke dni:
    //     1. potvrzení OC
    //     2. potvrzení lab
    //     3. dnešní datum
    var KontrolaKeDni = ZadankaData.PotvrzeniOdberu && ZadankaData.PotvrzeniOdberu.length ? new Date(ZadankaData.PotvrzeniOdberu[0].DatumPotvrzeni) : (ZadankaData.PotvrzeniLaborator && ZadankaData.PotvrzeniLaborator.length ? new Date(ZadankaData.PotvrzeniLaborator[0].DatumPotvrzeni) : DateStringFormatDDMMYYYYToDate(ZadankaData.Datum));

    PrubehPojisteniDruhB2B(ZadankaData.TestovanyCisloPojistence, KontrolaKeDni,
        function(Results) {

            if(Results.stav == "nepojisten") {

                tryToFindForeignProfilesByZadankaData(ZadankaData, function(PacientProfiles) {

                    reportCorrectInsuranceFromProfiles(index, ZadankaData, KontrolaKeDni, PacientProfiles, function() {
                        onSuccess();
                    });
                });
            } else {
                //console.log("OK"); // testing purpose only
                onSuccess();
            }
        }, function() {
            console.log("Při zjišťování, zda je úprava vyžadovaná k Excel řádku č. " + index + ". Žádanka č. " + ZadankaData.Cislo + " došlo k chybě.");
            onSuccess();
        }
    );
}

function reportAllNotCorrectInsurances(index, CisloZadanky) {

    return new Promise(function (resolve, reject) {

        getZadankaData(CisloZadanky).then(function(ZadankaData) {
            if(
                ZadankaData.TestovanyZdravotniPojistovnaKod == "111" ||
                ZadankaData.TestovanyZdravotniPojistovnaKod == "201" ||
                ZadankaData.TestovanyZdravotniPojistovnaKod == "205" ||
                ZadankaData.TestovanyZdravotniPojistovnaKod == "207" ||
                ZadankaData.TestovanyZdravotniPojistovnaKod == "209" ||
                ZadankaData.TestovanyZdravotniPojistovnaKod == "211" ||
                ZadankaData.TestovanyZdravotniPojistovnaKod == "213" &&
                ZadankaData.TypTestuKod == "PCR"
            ) {
                //console.log(index, ZadankaData.Cislo); // testing purpose only
                reportNotCorrectInsurance(index, ZadankaData, function() {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
}

function getRegistrDomain() {
    return "eregpublicsecure.ksrzis.cz";
}

function getRegistrUrl() {
    return "https://" + getRegistrDomain();
}

function getRegistrCUDOvereniCisloZadankyUrl(kodOsoby, heslo, cisloZadanky) {
    var urlParams = new URLSearchParams();
      
    urlParams.set("PracovnikKodOsoby", kodOsoby);
    urlParams.set("heslo", heslo);
    urlParams.set("Cislo", cisloZadanky);
      
    return getRegistrUrl() + "/Registr/CUD/Overeni/Json" + "?" + urlParams.toString();
}

async function getZadankaData(cisloZadanky) {

    return new Promise(function (resolve, reject) {

        getRegistrLoginCookies(function (cookieParams) {

            var kodOsoby = cookieParams.get("kodOsoby");
            var heslo = cookieParams.get("heslo");
        
            if(!kodOsoby || !heslo) {
                resolve();
            }

            var url = getRegistrCUDOvereniCisloZadankyUrl(kodOsoby, heslo, cisloZadanky);
  
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.setRequestHeader("Content-Type","application/json; charset=UTF-8");
            xhr.onreadystatechange = function() {
                if(xhr.readyState == XMLHttpRequest.DONE) {
                    if(xhr.status == 200) {
                        var data = JSON.parse(xhr.responseText);
                        resolve(data);
                    } else {
                        resolve();
                    }
                }
            };
            xhr.send();
        });
    });
}

function getOptionsFromLocalStorage(callback) {
    chrome.storage.local.get([chromeLocalStorageOptionsNamespace], function(data) {
      callback(data[chromeLocalStorageOptionsNamespace]);
    });
  }
  