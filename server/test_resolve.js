const API_URL = 'http://localhost:3000/api';

async function testResolve() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'adminpassword123'
            })
        });
        const loginData = await loginRes.json();
        
        if (!loginData.success) {
            throw new Error('Login failed: ' + JSON.stringify(loginData));
        }

        const token = loginData.data.token;
        console.log('Logged in. Token:', token.substring(0, 20) + '...');

        // 2. Get Alerts
        console.log('Fetching alerts...');
        const alertsRes = await fetch(`${API_URL}/alerts?status=ACTIVE`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const alertsData = await alertsRes.json();
        
        const alerts = alertsData.data;
        console.log(`Found ${alerts.length} active alerts.`);

        if (alerts.length === 0) {
            console.log('No active alerts to resolve.');
            return;
        }

        const alertId = alerts[0]._id;
        console.log('Attempting to resolve alert:', alertId);

        // 3. Resolve Alert
        const resolveRes = await fetch(`${API_URL}/alerts/${alertId}/resolve`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
                notes: 'Resolved via test script'
            })
        });
        
        const resolveData = await resolveRes.json();
        console.log('Resolve response:', resolveData);

    } catch (error) {
        console.error('Error:', error);
    }
}

testResolve();
