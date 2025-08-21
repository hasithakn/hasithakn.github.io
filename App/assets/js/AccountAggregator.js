// import * as jose from 'jose'
// import axios from "axios";

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

async function doAccount() {
    console.log("doAccount");
    const apiUrl = 'http://localhost:9090/xs2a/v1/appToken?clientId=J8KGGr7P8sPF8FU801wbfpLd0EUa&redirect_uri=http://localhost:9090/xs2a/v1/callback&scopes=accounts openid';

    const token = await getAccAppToken(apiUrl);
    console.log("token", token);

    const consentId = await doAccInitiation(token);
    console.log(consentId);

    const authUrl = await getAccAuthURL(consentId);
    console.log("authUrl", authUrl);
    window.location.replace(authUrl);

}

// This runs on the callback page
(function() {
    console.log("Callback page loaded");
    console.log("window.location.hash", window.location.hash);
    console.log("window.location.pathname", window.location.pathname);
    if (window.location.hash) {
        // Remove the leading '#' and split into key-value pairs
        const fragment = window.location.hash.substring(1);
        const baseUrl = 'http://localhost:9090/xs2a/v1/callback';
        let query = window.location.search;
        console.log("baseUrl", baseUrl);
        console.log("query", query);
        // If there are already query params, append with '&'
        const newQuery = query
            ? query + '&' + fragment
            : '?' + fragment;
        // Redirect to the same path with fragment as query params
        
        console.log("newQuery", newQuery);
        window.location.replace(baseUrl + newQuery);
    } else {
        console.log("Callback else");
    }
})();

async function doPayment() {
    console.log("doPayment");
    const apiUrl = 'http://localhost:9090/xs2a/v1/appToken?clientId=J8KGGr7P8sPF8FU801wbfpLd0EUa&redirect_uri=http://localhost:9090/xs2a/v1/callback&scopes=payments openid';

    const token = await getAccAppToken(apiUrl);
    console.log("token", token);

    const consentId = await doPaymentInitiation(token);
    console.log(consentId);

    const authUrl = await getPaymentAuthURL(consentId);
    console.log("authUrl", authUrl);
    window.location.replace(authUrl);

}

async function getAccAppToken(apiUrl) {

    console.log("getAccAppToken");

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        return json.access_token;
    } catch (error) {
        console.error(error.message);
    }
}

async function doAccInitiation(token) {
    console.log("doAccInitiation");

    const body = {
            "Data": {
                "Permissions": [
                "ReadAccountsDetail",
                "ReadBalances"
                ],
                "ExpirationDateTime": "2026-06-03T00:00:00+00:00",
                "TransactionFromDateTime": "2021-05-03T00:00:00+00:00",
                "TransactionToDateTime": "2021-12-03T00:00:00+00:00"
            },
            "Risk": {}
            }
    console.log("doAccInitiation body ", body);

    try {
        const response = await fetch("http://localhost:9090/xs2a/v1/accountConsents", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                'token': token,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            // ...
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        console.log(json);
        console.log("consentId", json.Data.ConsentId);
        localStorage.setItem("accConsentId", json.Data.ConsentId);
        return json.Data.ConsentId;
    } catch (error) {
        console.error(error.message);
    }
}

async function doPaymentInitiation(token) {
    console.log("doPaymentInitiation");

    const body = { 
        "Data":{ 
            "ReadRefundAccount" : "Yes",
            "Initiation":{ 
                "InstructionIdentification":"ACME412",
                "EndToEndIdentification":"FRESCO.21302.GFX.20",
                "LocalInstrument": "UK.OBIE.BACS",
                "InstructedAmount":{ 
                    "Amount":"300.65",
                    "Currency":"GBP"
                },
                "DebtorAccount": {
                    "SchemeName": "UK.OBIE.SortCodeAccountNumber",
                    "Identification": "30080012343456",
                    "Name": "Andrea Smith",
                    "SecondaryIdentification": "003"
                },
                "CreditorAccount":{ 
                    "SchemeName":"UK.OBIE.SortCodeAccountNumber",
                    "Identification":"08080021325698",
                    "Name":"ACME Inc",
                    "SecondaryIdentification":"0002"
                },
                
                "RemittanceInformation":{ 
                    "Reference":"FRESCO-101",
                    "Unstructured":["Internal ops code 5120101"]
                }
            }
        },
        "Risk":{
            "PaymentContextCode":"BillingGoodsAndServicesInAdvance",
            "MerchantCategoryCode":"5967",
            "MerchantCustomerIdentification":"053598653254",
            "DeliveryAddress":{
                "AddressLine":[
                    "Flat 7",
                    "Acacia Lodge"
                ],
                "StreetName":"Acacia Avenue",
                "BuildingNumber":"27",
                "PostCode":"GU31 2ZZ",
                "TownName":"Sparsholt",
                "CountrySubDivision":"Wessex",
                "Country":"UK"
            }
        }
    }
    console.log("doPaymentInitiation body ", body);

    try {
        const response = await fetch("http://localhost:9090/xs2a/v1/paymentConsents", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                'token': token,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        console.log(json);
        console.log("paymentId", json.Data.ConsentId);
        return jjson.Data.ConsentId;
    } catch (error) {
        console.error(error.message);
    }
}


async function getAccAuthURL(consentId) {
    console.log("getAuthURL");
    console.log("consentId", consentId);

    try {
        const response = await fetch("http://localhost:9090/xs2a/v1/authorize", {
            headers: {
                'consentID': consentId,
                'clientID': 'J8KGGr7P8sPF8FU801wbfpLd0EUa',
                'redirectUrl': 'http://localhost:9090/xs2a/v1/callback',
                'scope': 'accounts openid',
            },
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.text();
        console.log(json);
        return json;
    } catch (error) {
        console.error(error.message);
    }
}

async function getPaymentAuthURL(consentId) {
    console.log("getAuthURL");

    try {
        const response = await fetch("http://localhost:9090/xs2a/v1/authorize", {
            headers: {
                'consentID': consentId,
                'clientID': 'J8KGGr7P8sPF8FU801wbfpLd0EUa',
                'redirectUrl': 'http://localhost:9090/xs2a/v1/callback',
                'scope': 'payments openid',
            },
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.text();
        console.log(json);
        return json;
    } catch (error) {
        console.error(error.message);
    }
}

async function getPaymentDetails(consentId, token) {
    console.log("getPaymentDetails");

    try {
        const response = await fetch("http://localhost:9090/xs2a/v1/accounts", {
            headers: {
                'consentId': consentId,
                'token': token
            },
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.text();
        console.log(json);
        return json;
    } catch (error) {
        console.error(error.message);
    }
}