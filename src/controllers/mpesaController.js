import https from 'https'; // Using import instead of require

const username = process.env.CONSUMER_KEY; 
const password = process.env.CONSUMER_SECRET;


// Authorization function to get the access token
const authorize = () => {
  return new Promise((resolve, reject) => {
    const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

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

    // Call the authorize function to get the access token dynamically
    const accessToken = await authorize();

    // STK Push data (customize it as per your needs)
    const stkPushData = {
      BusinessShortCode: 174379,  // Replace with your business shortcode
      Password: 'MTc0Mzc5YmZiMjc5ZjlhYTliZGJjZjE1OGU5N2RkNzFhNDY3Y2QyZTBjODkzMDU5YjEwZjc4ZTZiNzJhZGExZWQyYzkxOTIwMjUwMTI3MTEwMDEy',
      Timestamp: '20250127110012',  // Timestamp in format YYYYMMDDHHMMSS
      TransactionType: 'CustomerPayBillOnline',
      Amount: Amount,  // Amount to be paid
      PartyA: PhoneNumber,  // The phone number making the payment
      PartyB: 174379,  // Your business shortcode
      PhoneNumber: PhoneNumber,  // The phone number making the payment
      CallBackURL: 'https://mydomain.com/path',  // Replace with your callback URL
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

    const stkPushReq = https.request('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', stkPushOptions, (response) => {
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

export default { getStkPush };
