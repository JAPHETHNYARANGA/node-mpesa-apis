import https from 'https'; // Using import instead of require


// Authorization function to get the access token
const authorize = () => {
  return new Promise((resolve, reject) => {
    const url = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    const username = process.env.CONSUMER_KEY; 
    const password = process.env.CONSUMER_SECRET;
    // Create the Basic Auth Header (Base64 encoded credentials)
    const authHeader = `Basic ${Buffer.from(username + ':' + password).toString('base64')}`;

    // Request options
    const options = {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      }
    };

    https.request(url, options, (response) => {
      let data = '';

      // Collect response data
      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          // Check if access_token exists in the response
          if (parsedData.access_token) {
            resolve(parsedData.access_token);
          } else {
            reject('Failed to retrieve access token from Safaricom API.');
          }
        } catch (error) {
          reject('Error parsing response from Safaricom API.');
        }
      });
    })
    .on('error', (error) => {
      reject('Request failed to Safaricom API');
    })
    .end();
  });
};

// Function to initiate STK Push (payment request)
const getStkPush = async (req, res) => {
  try {
    const { Amount, PhoneNumber } = req.body;

    if (!Amount || !PhoneNumber) {
      return res.status(400).json({ error: 'Amount and PhoneNumber are required.' });
    }

    const date = new Date();
    const timestamp =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);
    const shortCode = process.env.SHORTCODE; 
    const passkey = process.env.PASSKEY;

    // Call the authorize function to get the access token dynamically
    const accessToken = await authorize();


    const stk_password = Buffer.from(shortCode + passkey + timestamp).toString('base64');


    // STK Push data (customize it as per your needs)
    const stkPushData = {
      BusinessShortCode: shortCode,  // Replace with your business shortcode
      Password: stk_password,
      Timestamp: timestamp,  // Timestamp in format YYYYMMDDHHMMSS
      TransactionType: 'CustomerPayBillOnline',
      Amount: "2",  // Amount to be paid
      PartyA: '254729736134',  // The phone number making the payment
      PartyB: shortCode,  // Your business shortcode
      PhoneNumber: '254729736134',  // The phone number making the payment
      CallBackURL: 'https://7270-102-68-76-239.ngrok-free.app/api/callBackUrl',  // Replace with your callback URL
      AccountReference: 'CompanyXLTD',  // Account reference
      TransactionDesc: 'Payment of X'  // Description of the transaction
    };

    // Construct the request body for STK Push
    const stkPushOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const stkPushReq = https.request('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', stkPushOptions, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.ResponseCode === '0') {
            res.status(200).json({ message: 'STK Push sent successfully', data: parsedData });
          } else {
            res.status(400).json({ error: 'STK Push failed', data: parsedData });
          }
        } catch (error) {
          console.error('Error parsing STK Push response:', error);
          res.status(500).json({ error: 'Failed to process STK Push response' });
        }
      });
    });

    stkPushReq.on('error', (error) => {
      console.error('Error sending STK Push request:', error);
      res.status(500).json({ error: 'Failed to send STK Push request' });
    });

    // Write the body for the STK Push
    stkPushReq.write(JSON.stringify(stkPushData));
    stkPushReq.end();
  } catch (error) {
    console.error('Error sending STK push:', error);
    res.status(500).json({ error: 'Failed to send STK push. Please try again later' });
  }
};

const getCallbackUrl = async (req, res) => {
    try {
      // Process callback response from M-Pesa
      const callbackData = req.body; // Assuming M-Pesa sends data in request body
  
      // You can store it or log the response
      console.log(callbackData);
      
      res.status(200).json({ message: 'Callback received successfully', data: callbackData });
    } catch (error) {
      console.error('Error receiving callback:', error);
      res.status(500).json({ error: 'Failed to handle callback' });
    }
  };

export default { getStkPush, getCallbackUrl };
