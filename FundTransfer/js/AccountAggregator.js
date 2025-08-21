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
    const apiUrl = 'http://localhost:9090/xs2a/v1/appToken?clientId=PSDGB-OB-Unknown0015800001HQQrZAAX&redirect_uri=http://localhost:9090/xs2a/v1/callback&scopes=accounts openid';

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
    const apiUrl = 'http://localhost:9090/xs2a/v1/appToken?clientId=PSDGB-OB-Unknown0015800001HQQrZAAX&redirect_uri=http://localhost:9090/xs2a/v1/callback&scopes=payments openid';

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
        instructedAmount: {
            currency: currency,
            amount: amount.toString()
        },
        debtorAccount: {
            iban: "DE12345678901234567890",
            currency: "USD"
        },
        creditorName: accountName,
        creditorAccount: {
            iban: accountNumber.toString()
        },
        remittanceInformationUnstructured: "Ref Number Merchant"
    }
    console.log("doPaymentInitiation body ", body);

    try {
        const response = await fetch("http://localhost:9090/xs2a/v1/payments", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                'token': token,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'paymentType': 'payments',
                'paymentProduct': 'sepa-credit-transfers'
            }
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        console.log(json);
        console.log("paymentId", json.paymentId);
        return json.paymentId;
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
                'clientID': 'PSDGB-OB-Unknown0015800001HQQrZAAX',
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
                'clientID': 'PSDGB-OB-Unknown0015800001HQQrZAAX',
                'redirectUrl': 'http://localhost:9090/xs2a/v1/callback',
                'scope': 'pis:' + consentId,
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