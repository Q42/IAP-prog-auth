import * as request from "request";
import * as jsonwebtoken from "jsonwebtoken";

const openIDTokenURL = "https://www.googleapis.com/oauth2/v4/token";

const doIAPEndpointRequest = async (): Promise<void> => {
  const secrets = {
    clientID: "clientID", // Get the clientID from the oauth settings of the IAP secured resource
    private_key: "supersecret", // Get this from the key json file you can download when creating a key for a service account
    client_email: "notassecret", // Get this from the same file as above
  };

  const privateKey = secrets.private_key;
  const clientId = secrets.clientID;
  const serviceAccountEmail = secrets.client_email;

  // 1: Generate JWT
  const now = Math.floor(new Date().getTime() / 1000);
  const jwt = jsonwebtoken.sign({
    iss: serviceAccountEmail,
    aud: openIDTokenURL,
    iat: now,
    exp: now + 120, // Valid for 2 minutes
    target_audience: clientId, // This needs to be the client id of the IAP protected resource (find me in the google cloud console)
  }, privateKey, { algorithm: "RS256" });

  // 2: Get OpenID Token
  const openIDToken = await getOpenIDToken(jwt);

  // 3: Make the header
  const headers = {
    "User-Agent": "c2fIAP",
    "Authorization": `Bearer ${openIDToken}`
  }

  // 3: Use the header in our request to the IAP-secured endpoint
  const bananaResponse = await getBanana(headers);
  console.info("Did request to IAP secured endpoint: ", bananaResponse.body);
}

const getOpenIDToken = async (jwt: string): Promise<string> => {
  // Wrap the request in a promise so we can do stuff synchronously
  const response = await new Promise<request.Response>((resolve, reject) => {
    request.post({ 
      url: openIDTokenURL, 
      form: {
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      } 
    }, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
  const data = JSON.parse(response.body);
  return data.id_token;
}

const getBanana = async (headers: request.Headers): Promise<request.Response> => {
  return new Promise((resolve, reject) => {
    request.get(
      "https://my-app.appspot.com/admin/banana", 
      { headers },
      (err, res) => {
        if (err) {
          reject();
        } else {
          resolve(res);
        }
      }
    );
  });
}

export interface Secrets {
  clientID: string;
  private_key: string,
  client_email: string,
}

try {
  doIAPEndpointRequest()
    .then(() => {
      console.info("Done!");
    });
} catch(err) {
  console.info("Something went wrong while authenticating:", err);
}
