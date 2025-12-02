const express = require('express');
const app = express();
const port = 3000;

app.get('/ap', (req, res) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// GET;PUT;DELETE;PATCH;POST;OPTIONS;HEAD