import fetch from 'node-fetch';

async function testCallback() {
    const url = "http://localhost:3000/auth/callback?code=fake_code_123&type=recovery&redirect_to=http://localhost:3000/auth/callback";
    console.log(`[TEST] Simulating click on: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'manual'
        });

        console.log(`[RESULT] Status: ${response.status}`);
        console.log(`[RESULT] Redirect Location: ${response.headers.get('location')}`);
    } catch (error) {
        console.error("Test failed:", error);
    }
}

testCallback();
