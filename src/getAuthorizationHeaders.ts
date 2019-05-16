import * as jsonwebtoken from "jsonwebtoken";
import * as request from "request";
import { Secrets } from ".";

const openIDTokenURL = "https://www.googleapis.com/oauth2/v4/token";

const getAuthorizationHeaders = async (secrets: Secrets) => {
  const privateKey = secrets.private_key;
  const clientId = secrets.clientID;
  const serviceAccountEmail = secrets.client_email;

  // Generate JWT
  const jwt = getSignedJwt(privateKey, clientId, serviceAccountEmail);

  // Get OpenID Token
  const openIDToken = await getOpenIDToken(jwt);

  // return the header with Authorization: Bearer <openIDToken>
  return createRequestHeader(openIDToken);
}
export default getAuthorizationHeaders;

const getSignedJwt = (privateKey: string, clientId: string, serviceAccountEmail: string): string => {
  // Return JWT token
  const now = Math.floor(new Date().getTime() / 1000);
  return jsonwebtoken.sign({
    iss: serviceAccountEmail,
    aud: openIDTokenURL,
    iat: now,
    exp: now + 120, // Valid for 2 minutes
    target_audience: clientId, // This needs to be the client id of the IAP protected resource (find me in the google cloud console)
  }, privateKey, { algorithm: "RS256" });
}

const getOpenIDToken = async (jwt: string): Promise<string> => {
  const response = await postRequest(openIDTokenURL, {
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });
  const data = JSON.parse(response.body);
  return data.id_token;
}

const createRequestHeader = (openIDToken: string): request.Headers => ({
  "User-Agent": "c2fIAP",
  "Authorization": `Bearer ${openIDToken}`
});

// Wrap request in a promise so it can be awaited
const postRequest = (url: string, form: any): Promise<request.Response> =>
  new Promise((resolve, reject): void => {
    request.post({ url, form }, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });