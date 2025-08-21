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

async function doPayment(bank, accountNumber, accountName, amount, currency) {
    console.log("doPayment");
    const apiUrl = 'http://localhost:9090/xs2a/v1/appToken?clientId=J8KGGr7P8sPF8FU801wbfpLd0EUa&redirect_uri=http://localhost:9090/xs2a/v1/callback&scopes=payments openid';

    const token = await getAccAppToken(apiUrl);
    console.log("token", token);

    const consentId = await doPaymentInitiation(token, accountNumber, accountName, amount, currency);
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
        console.log("json");
        // console.log("token", json.access_token);
        return json.access_token;
    } catch (error) {
        console.error(error.message);
    }
}

async function doAccInitiation(token) {
    console.log("doAccInitiation");

    const body = {
        access: {
            accounts: [

            ],
            balances: [

            ],
            transactions: [

            ]
        },
        recurringIndicator: true,
        validUntil: "2024-12-03",
        frequencyPerDay: 4,
        combinedServiceIndicator: false
    }
    console.log("doAccInitiation body ", body);

    try {
        const response = await fetch("http://localhost:9090/xs2a/v1/consents", {
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
        console.log("consentId", json.consentId);
        localStorage.setItem("accConsentId", json.consentId);
        return json.consentId;
    } catch (error) {
        console.error(error.message);
    }
}

async function doPaymentInitiation(token, accountNumber, accountName, amount, currency) {
    console.log("doPaymentInitiation");
    console.log(accountNumber);
    console.log(accountName);
    console.log(amount);
    console.log(currency);

    const body = { 
        "Data":{ 
            "ReadRefundAccount" : "Yes",
            "Initiation":{ 
                "InstructionIdentification":"ACME412",
                "EndToEndIdentification":"FRESCO.21302.GFX.20",
                "LocalInstrument": "UK.OBIE.BACS",
                "InstructedAmount":{ 
                    "Amount":amount,
                    "Currency":currency
                },
                "DebtorAccount": {
                    "SchemeName": "UK.OBIE.SortCodeAccountNumber",
                    "Identification": "30080012343456",
                    "Name": "John Doe",
                    "SecondaryIdentification": "003"
                },
                "CreditorAccount":{ 
                    "SchemeName":"UK.OBIE.SortCodeAccountNumber",
                    "Identification":accountNumber,
                    "Name":accountName,
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
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        console.log(json);
        console.log("paymentId", json.Data.ConsentId);
        return json.Data.ConsentId;
    } catch (error) {
        console.error(error.message);
    }
}


async function getAccAuthURL(consentId) {
    console.log("getAuthURL");

    try {
        const response = await fetch("http://localhost:9090/xs2a/v1/authorize", {
            headers: {
                'consentID': consentId,
                'clientID': 'J8KGGr7P8sPF8FU801wbfpLd0EUa',
                'redirectUrl': 'http://localhost:9090/xs2a/v1/callback',
                'scope': 'ais:' + consentId,
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