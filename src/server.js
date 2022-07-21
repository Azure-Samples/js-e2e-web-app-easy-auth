// general dependencies
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import appInsights from 'applicationinsights';
import jwt_decode from "jwt-decode";

const getUserProfile = async (accessToken, bearerIncluded = false, downstreamUrl) => {

  const args = {accessToken, bearerIncluded, downstreamUrl};

  appInsights.defaultClient.trackTrace({ message: args });
  console.log(args);

  const bearerToken = (bearerIncluded) ? accessToken : 'Bearer ' + accessToken;
  console.log(`Constructed token: ${bearerToken}`);

  if(!bearerToken || (bearerToken.indexOf("Bearer ")==-1)) throw Error("missing bearerToken");
  if(!downstreamUrl) throw Error("missing downstreamUrl");

  try {

    const options = {
      method: 'GET',
      headers: {
        Authorization: bearerToken,
        'Content-type': 'application/json',
      },
    };

    const graphResponse = await axios.get(downstreamUrl, options);
    const { data } = await graphResponse;
    
    console.log(data);
    appInsights.defaultClient.trackTrace({ message: data });

    return data;

  } catch (err) {
    throw err;
  }
}

export const create = async () => {
  const app = express();

  app.use(bodyParser.urlencoded({ extended: true }));

  app.get('/', async (req, res) => {
    return res.send('home');
  });

  // upstream server
  app.get('/access-token', async (req, res) => {
    return res.json(req.headers['x-ms-token-aad-access-token']);
  });

  // upstream server
  app.get('/jwt-decode', async (req, res) => {

    var decoded = jwt_decode(req.headers['x-ms-token-aad-access-token']);

    return res.json(decoded);
  });  

  // upstream server
  app.get('/profile', async (req, res) => {

    try {

      // should have `x-ms-token-aad-access-token`
      // insert from App Service if
      // MS AD identity provider is configured
      const accessToken = req.headers['x-ms-token-aad-access-token'];
      const accessTokenIncludesBearer = false;
      const downstreamUrl = "https://graph.microsoft.com/v1.0/me";

      const profile = await getUserProfile(accessToken, accessTokenIncludesBearer, downstreamUrl);

      appInsights.defaultClient.trackTrace({ message: profile })
      res.json(profile);

    } catch (err) {
      console.log(err);
      appInsights.defaultClient.trackTrace({ message: err })
      return res.status(500).send(JSON.stringify(err));
    }
  });

  // upstream server
  app.get('/downstream-profile', async (req, res) => {
    try {


      // should have `x-ms-token-aad-access-token`
      // insert from App Service if
      // MS AD identity provider is configured
      const accessToken = req.headers['x-ms-token-aad-access-token'];
      const accessTokenIncludesBearer = false;
      const downstreamUrl = req.query["downstreamurl"];

      //if(!downstreamUrl) return res.status(403).json({error: "missing querystring param: downstreamurl: example - https%3A%2F%2FYOUR-DOWNSTREAM-APP-NAME.azurewebsites.net/downstream"});

      const profile = await getUserProfile(accessToken, accessTokenIncludesBearer, downstreamUrl);
      res.json(profile);

    } catch (err) {
      console.log(err);
      appInsights.defaultClient.trackTrace({ message: err })
      return res.status(500).send(JSON.stringify(err));
    }
  });
  // downstream server
  app.get('/downstream', async (req, res) => {
    try {

      // should have `authorization` header
      const accessToken = req.headers['authorization'];
      const accessTokenIncludesBearer = true;
      const downstreamUrl = "https://graph.microsoft.com/v1.0/me";

      const profile = await getUserProfile(accessToken, accessTokenIncludesBearer, downstreamUrl);
      res.json(profile);

    } catch (err) {
      console.log(err);
      appInsights.defaultClient.trackTrace({ message: err })
      return res.status(500).send(JSON.stringify(err));
    }
  });

  // instead of 404 - just return home page
  app.get('*', (req, res) => {
    res.redirect('/');
  });

  return app;
};
