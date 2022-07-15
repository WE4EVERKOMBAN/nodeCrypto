
const express = require('express');

const app = express()

const PORT = '8080'

const wallet = require('./libs/coinpayment');

app.get('/', function(request, response) {

 response.send('Hello, World!');

});

app.post('/api/deposit', function (req, res) {

wallet.addfunds(req.body);

 return res.status(200);

});

app.listen(PORT, async () => {
  console.log(`🚀 server is running`)
  require('./core/bot');
  import './commands/index'
})