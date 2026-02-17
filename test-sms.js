const myHeaders = new Headers();
myHeaders.append("Authorization", "App 990ec60831eb9c11e412c6f24252822a-41e1e65f-7e97-4659-9db5-ea1770d7a142");
myHeaders.append("Content-Type", "application/json");
myHeaders.append("Accept", "application/json");

const raw = JSON.stringify({
    "messages": [
        {
            "destinations": [{"to":"14372156321"}],
            "from": "ServiceSMS",
            "text": "Congratulations on sending your first message. Go ahead and check the delivery report in the next step."
        }
    ]
});

const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
};

fetch("https://api.infobip.com/sms/2/text/advanced", requestOptions)
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.error(error));