// SMS Configuration Diagnostic Script
// Run this to check if SMS is properly configured

console.log('========================================');
console.log('SMS CONFIGURATION DIAGNOSTIC');
console.log('========================================\n');

// Check 1: Environment Variables
console.log('1. ENVIRONMENT VARIABLES:');
console.log('   VITE_INFOBIP_API_KEY:', process.env.VITE_INFOBIP_API_KEY ? '✓ Set' : '✗ NOT SET');
console.log('   Value:', process.env.VITE_INFOBIP_API_KEY || 'MISSING');
console.log('   VITE_INFOBIP_BASE_URL:', process.env.VITE_INFOBIP_BASE_URL ? '✓ Set' : '✗ NOT SET');
console.log('   Value:', process.env.VITE_INFOBIP_BASE_URL || 'MISSING');
console.log('   VITE_INFOBIP_SENDER:', process.env.VITE_INFOBIP_SENDER ? '✓ Set' : '✗ NOT SET');
console.log('   Value:', process.env.VITE_INFOBIP_SENDER || 'MISSING');
console.log('   VITE_APP_MODE:', process.env.VITE_APP_MODE || 'NOT SET (defaults to demo)');
console.log('');

// Check 2: Expected Values
console.log('2. EXPECTED VALUES (from test-sms.js):');
console.log('   API Key: 990ec60831eb9c11e412c6f24252822a-41e1e65f-7e97-4659-9db5-ea1770d7a142');
console.log('   Base URL: https://api.infobip.com');
console.log('   Sender: ServiceSMS');
console.log('');

// Check 3: Test SMS
console.log('3. TESTING SMS SEND...');
const testPhone = '14372156321';
const testMessage = 'Test from diagnostic script - Amanis Cleaners';

const myHeaders = new Headers();
myHeaders.append("Authorization", `App ${process.env.VITE_INFOBIP_API_KEY || '990ec60831eb9c11e412c6f24252822a-41e1e65f-7e97-4659-9db5-ea1770d7a142'}`);
myHeaders.append("Content-Type", "application/json");
myHeaders.append("Accept", "application/json");

const raw = JSON.stringify({
  "messages": [
    {
      "destinations": [{"to": testPhone}],
      "from": process.env.VITE_INFOBIP_SENDER || "ServiceSMS",
      "text": testMessage
    }
  ]
});

const requestOptions = {
  method: "POST",
  headers: myHeaders,
  body: raw,
  redirect: "follow"
};

const baseUrl = process.env.VITE_INFOBIP_BASE_URL || 'https://api.infobip.com';

console.log('   Sending to:', testPhone);
console.log('   URL:', `${baseUrl}/sms/2/text/advanced`);
console.log('   Sender:', process.env.VITE_INFOBIP_SENDER || "ServiceSMS");
console.log('');

fetch(`${baseUrl}/sms/2/text/advanced`, requestOptions)
  .then((response) => {
    console.log('4. RESPONSE STATUS:', response.status, response.statusText);
    return response.text();
  })
  .then((result) => {
    console.log('5. RESPONSE BODY:');
    console.log(result);
    console.log('');

    try {
      const parsed = JSON.parse(result);
      if (parsed.messages && parsed.messages[0]) {
        const msg = parsed.messages[0];
        console.log('6. MESSAGE STATUS:');
        console.log('   Status:', msg.status?.groupName || 'Unknown');
        console.log('   Description:', msg.status?.description || 'N/A');
        console.log('   Message ID:', msg.messageId || 'N/A');

        if (msg.status?.groupName === 'PENDING') {
          console.log('\n✓ SUCCESS! SMS is configured correctly and message was sent.');
        } else {
          console.log('\n✗ ISSUE: Message status is not PENDING. Check response above.');
        }
      }
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
  })
  .catch((error) => {
    console.error('✗ ERROR:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Check if .env file exists in project root');
    console.log('2. Verify API key is correct');
    console.log('3. Make sure base URL is https://api.infobip.com');
    console.log('4. Check Infobip account has credits');
  });
