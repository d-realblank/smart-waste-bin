const axios = require('./server/node_modules/axios').default;

const payload = {
    binId: "BIN_003",
    fillLevel: 90.0,
    batteryLevel: 85,
    status: "FULL",
    isFull: true,
    timestamp: Date.now(),
    relayedBy: "BIN_001",
    location: "Remote Location Debug"
};

const API_KEY = "test-api-key-for-bins"; // From config.h

async function testRelay() {
    try {
        console.log("Sending payload:", payload);
        const response = await axios.post('http://localhost:3000/api/bins/status', payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            }
        });
        console.log("Response status:", response.status);
        console.log("Response data:", response.data);
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Server response:", error.response.data);
        }
    }
}

testRelay();
