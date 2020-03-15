/*

  @ Dexcom Developer documentation
  https://developer.dexcom.com/overview

*/

require('dotenv').config();
const PORT = process.env.PORT || 5000;
const express = require('express');
const app = express();
const qs = require("querystring");
const http = require("https");
let startDate = ''
let nowDate = ''

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});



app.get('/', (req, res, err) => {
  console.log(req.query.code)
  if(req.query.code) {
    res.redirect(`/get-auth?code=${req.query.code}`);
  } else {
    res.json({error: 'nothing to return'})
  }
});

app.get('/get-auth', (req, res, err) => {
  let options = {
    "method": "POST",
    "hostname": "api.dexcom.com",
    "port": null,
    "path": "/v2/oauth2/token",
    "headers": {
      "content-type": "application/x-www-form-urlencoded",
      "cache-control": "no-cache"
    }
  };
  
  let request = http.request(options, function (response) {
    let chunks = [];
  
    response.on("data", function (chunk) {
      chunks.push(chunk);
    });
  
    response.on("end", function () {
      let body = Buffer.concat(chunks);
      res.json(JSON.parse(body.toString()))
    });

  });
  
  request.write(qs.stringify({ client_secret: `${process.env.CLIENT_SECRET}`,
    client_id: 'Gm704rNUXZdRLy2SkbMvSA6ansXnIk1H',
    code: `${req.query.code}`,
    grant_type: 'authorization_code',
    redirect_uri: 'http://localhost:3000/' }));
    request.end();
})


app.get('/get-data', (req, res, err) => {
  const access_token = req.query.access_token 
  const refresh_token = req.query.refresh_token
  startDate = req.query.dateFrom
  nowDate = req.query.dateNow
  
  let setting = {
    access_token : req.query.access_token ,
    refresh_token : req.query.refresh_token
  }


  let options = {
    "method": "GET",
    "hostname": "api.dexcom.com",
    "port": null,
    "path": `/v2/users/self/egvs?startDate=${startDate}&endDate=${nowDate}`,
    "headers": {
      "authorization": `Bearer ${access_token}`,
      }
  };

  let request = http.request(options, function (request) {
    let chunks = [];

    request.on("data", function (chunk) {
      chunks.push(chunk);
    });

    request.on("end", function () {
      console.log(request.statusMessage)
      if(request.statusCode === 200) {
        let body = Buffer.concat(chunks);
        const data = {
          settings: setting ,
          dexcom : JSON.parse(body.toString())
        }
        res.json(data);
      } else {
        console.log('why did this come here?')
        console.log('hi')
        res.redirect(`/refresh/?access_token=${access_token}&refresh_token=${refresh_token}&dateFrom=${startDate}&dateNow=${nowDate}`)
      }
    });
  });

  request.end();
})


app.get("/refresh", (req, res, next) => {
  access_token = req.query.access_token 
  refresh_token = req.query.refresh_token
  startDate = req.query.dateFrom
  nowDate = req.query.dateNow
  
  let options = {
    method: "POST",
    hostname: "api.dexcom.com",
    port: null,
    path: "/v2/oauth2/token",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "cache-control": "no-cache"
    }
  };

  let requ = http.request(options, ress => {
    let chunks = [];

    ress.on("data", chunk => {
      chunks.push(chunk);
    });

    ress.on("end", () => {
      let body = Buffer.concat(chunks);
      access_token = JSON.parse(body.toString()).access_token;
      refresh_token = JSON.parse(body.toString()).refresh_token;
      console.log(refresh_token, 'here')
      console.log('hi')
      res.redirect(`/get-data/?access_token=${access_token}&refresh_token=${refresh_token}&dateFrom=${startDate}&dateNow=${nowDate}`);
    });
  });

  requ.write(
    qs.stringify({
      client_secret: process.env.CLIENT_SECRET,
      client_id: "Gm704rNUXZdRLy2SkbMvSA6ansXnIk1H",
      refresh_token: refresh_token,
      grant_type: "refresh_token",
      redirect_uri: "http://localhost:3000/"
    })
  );

  requ.end();
});


app.listen(PORT, () => console.log(`logging on port ${PORT}`));