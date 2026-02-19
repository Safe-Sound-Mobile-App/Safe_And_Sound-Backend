require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📍 Dashboard:  http://localhost:${PORT}/display/dashboard`);
    console.log(`📍 Elders API: http://localhost:${PORT}/api/elders`);
    console.log(`📍 Trigger:    POST http://localhost:${PORT}/api/trigger/:elderId\n`);
});
