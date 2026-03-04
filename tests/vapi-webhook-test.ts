import fetch from 'node-fetch';

async function testVapiWebhook() {
  const url = 'http://localhost:3000/webhook/vapi';

  const payload = {
    message: {
      type: 'function-call',
      callId: 'test-call-id',
      functionCall: {
        name: 'bilgi_ver',
        parameters: {
          konu: 'yazılım geliştirme',
        },
      },
    },
  };

  console.log('Sending test request to Vapi webhook...');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (response.status === 200 && data.result) {
      console.log('✅ Webhook test passed!');
    } else {
      console.log('❌ Webhook test failed!');
    }
  } catch (error) {
    console.error('❌ Error during webhook test:', error.message);
  }
}

testVapiWebhook();
