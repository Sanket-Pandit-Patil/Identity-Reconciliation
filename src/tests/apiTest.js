const axios = require('axios');
const baseUrl = 'http://localhost:3000';

async function testIdentify(payload, description) {
    console.log(`\n--- Testing: ${description} ---`);
    try {
        const response = await axios.post(`${baseUrl}/identify`, payload);
        console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
        return response.data;
    } catch (error) {
        console.error(`Error: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
}

async function runTests() {
    // Scenario 1: New customer
    await testIdentify({
        email: 'lorraine@hillvalley.edu',
        phoneNumber: '123456'
    }, 'First order');

    // Scenario 2: New info (creates secondary)
    await testIdentify({
        email: 'mcfly@hillvalley.edu',
        phoneNumber: '123456'
    }, 'Second order (new info)');

    // Scenario 3: Merging primaries
    await testIdentify({ email: 'george@hillvalley.edu', phoneNumber: '919191' }, 'George 1');
    await testIdentify({ email: 'biffsucks@hillvalley.edu', phoneNumber: '717171' }, 'Biff 1');
    await testIdentify({ email: 'george@hillvalley.edu', phoneNumber: '717171' }, 'Link George & Biff');
}

runTests();
