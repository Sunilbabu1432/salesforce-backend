require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Salesforce credentials (BACKEND ONLY)
const CLIENT_ID = process.env.SF_CLIENT_ID;
const CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
const USERNAME = process.env.SF_USERNAME;
const PASSWORD = process.env.SF_PASSWORD;
const LOGIN_URL = process.env.SF_LOGIN_URL;


// 🔹 Health check
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// 🔹 Salesforce login helper
async function salesforceLogin() {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    username: USERNAME,
    password: PASSWORD,
  }).toString();

  const auth = await axios.post(LOGIN_URL, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return auth.data;
}

// 🔹 TEST LOGIN
app.get('/test-login', async (req, res) => {
  try {
    const data = await salesforceLogin();
    res.json(data);
  } catch (error) {
    res.status(400).json(error.response?.data || error.message);
  }
});

// 🔹 ACCOUNTS LIST API
app.get('/accounts', async (req, res) => {
  try {
    const auth = await salesforceLogin();

    const result = await axios.get(
      `${auth.instance_url}/services/data/v59.0/query`,
      {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
        params: {
          q: 'SELECT Id, Name, Phone, Industry FROM Account LIMIT 20',
        },
      }
    );

    res.json(result.data.records);
  } catch (error) {
    console.log('LIST ERROR 👉', error.response?.data || error.message);
    res.status(500).json(error.response?.data || error.message);
  }
});

// 🔹 ACCOUNT DETAILS API
app.get('/accounts/:id', async (req, res) => {
  try {
    const accountId = req.params.id;
    const auth = await salesforceLogin();

    const result = await axios.get(
      `${auth.instance_url}/services/data/v59.0/sobjects/Account/${accountId}`,
      {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      }
    );

    res.json(result.data);
  } catch (error) {
    console.log('DETAILS ERROR 👉', error.response?.data || error.message);
    res.status(500).json(error.response?.data || error.message);
  }
});


// 🔹 CREATE ACCOUNT API
app.post('/accounts', async (req, res) => {
  try {
    const { Name, Phone, Industry } = req.body;

    const auth = await salesforceLogin();

    const result = await axios.post(
      `${auth.instance_url}/services/data/v59.0/sobjects/Account`,
      {
        Name,
        Phone,
        Industry,
      },
      {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ success: true, id: result.data.id });
  } catch (error) {
    console.log('CREATE ERROR 👉', error.response?.data || error.message);
    res.status(500).json(error.response?.data || error.message);
  }
});



app.post('/accounts', async (req, res) => {
  try {
    const { Name, Phone, Industry } = req.body;

    const auth = await loginToSalesforce(); // already unna login function

    const result = await axios.post(
      `${auth.instance_url}/services/data/v59.0/sobjects/Account`,
      { Name, Phone, Industry },
      {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(result.data);
  } catch (e) {
    res.status(500).json({ error: 'Account create failed' });
  }
});



// ▶️ Start server
app.listen(3000, () => {
  console.log('✅ Backend running on http://localhost:3000');
});
