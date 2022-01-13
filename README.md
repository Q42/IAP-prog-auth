# IAP-prog-auth
Google Identity Aware Proxy Programmatic Authentication.
Accompanying code for the article on https://engineering.q42.nl/google-identity-aware-proxy/

# How to
#### Programmatic authentication for Google Identity Aware Proxy
So you have that fancy google IAP (Identity Aware Proxy) set up to protect your Google Cloud thingy. Login screen and access management, so easy, no effort! Oh wait, now you can't call those endpoints from your script or remote testing suite. To the docs! No nodejs docs you say? Fear not, with this handy-dandy guide you could be authenticating programmatically in a jiffy!

## Setup
Service account (for your script to use)
  1. Create a service account in the project you're using google IAP with, [here](https://console.cloud.google.com/iam-admin/serviceaccounts)
  2. Enter a sensible name and click ok
  3. Give the user the "IAP-secured Web App User" role and click OK
  4. At the final step, click "Create Key" and save the JSON file as `serviceAccount.json`

All done there. Now get the client ID of the IAP secured resource
  1. Go [here](https://console.cloud.google.com/security/iap)
  2. Click the three vertical dots next to the IAP secured resource, go to "Edit OAuth Client"
  3. Copy the "Client ID" at the top of the page.
  4. Make a new `config.json` file and paste your client ID in there, like this:
      ```
      {
        "clientID": "<the Client ID you copied>"
      }
      ```

## Code!
There's three main steps.
1. Generate and sign a JWT (Json Web Token)
2. Get an OpenID token
3. Use the OpenID token to do your requests to the IAP secured endpoints

### 1. Generate and sign a JWT
Create a JWT with the following properties:
```
const myJWTProperties = {
  iss: <service account name, i.e.: dev-test@firmware-dev.iam.gserviceaccount.com>,
  aud: "https://www.googleapis.com/oauth2/v4/token",
  iat: <current date/time in seconds since epoch, i.e. `Math.floor(new Date().getTime() / 1000)`>,
  exp: <iat + time in seconds the JWT should be valid for>,
  target_audience: <clientID property from the `config.json`>,
}
```
Sign the JWT with the `private_key` property from the `service_account.json` file. Use `"RS256"` as algorithm. I'm using the "jsonwebtoken" package from NPM here, which abstracts away all the JWT creation and signing into this simple one-liner solution:
```
const myJWT = jsonwebtoken.sign({...myJWTProperties}, privateKey, { algorithm: "RS256" });
```

### 2. Get an OpenID token
Send a post request to the openID token Url "https://www.googleapis.com/oauth2/v4/token", with the JWT and grant type in the form data.
```
request.post(openIDTokenURL, {
  grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
  assertion: myJWT,
}, (error, response) => {
  const data = JSON.parse(response.body);
  openIDToken = data.id_token
  // Do step 3
});
```
Parse the response body as JSON, it should have a property `id_token` which contains the id token.

### 3. Use the OpenID token to do your requests to the IAP secured endpoints
Create an authorization header, use this every time you do a request to the IAP secured endpoints/resource.
```
const requestHeader = {
  "User-Agent": "c2fIAP",
  "Authorization": `Bearer ${openIDToken}`
};
```
The authorization header will look something like this: `"Authorization": "Bearer c3NTk4IiwiZW1haWwiOiJkZ..."`

Now do your request!
```
request.get(
  "https://my-app.appspot.com/admin/banana", 
  { requestHeader },
  (err, res, body) => console.info("Got a healthy snack:", body)
);
```
