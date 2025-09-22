const express = require('express');
const app = express();
app.get('/health', (req, res) => res.json({ status: 'Bookmark Service healthy' }));
const PORT = process.env.BOOKMARK_SERVICE_PORT || 4006;
app.listen(PORT, () => console.log(`Bookmark Service listening on port ${PORT}`));
