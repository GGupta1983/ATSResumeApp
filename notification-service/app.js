const express = require('express');
const app = express();
app.get('/health', (req, res) => res.json({ status: 'Notification Service healthy' }));
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 4005;
app.listen(PORT, () => console.log(`Notification Service listening on port ${PORT}`));
