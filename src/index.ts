import * as request from "request";
import getAuthorizationHeaders from "./getAuthorizationHeaders";

const doIAPEndpointRequest = async (): Promise<void> => {
  const secrets = {
    clientID: "clientID", // Get the clientID from the oauth settings of the IAP secured resource
    private_key: "supersecret", // Get this from the key json file you can download when creating a key for a service account
    client_email: "notassecret", // Get this from the same file as above
  };
  const headers = await getAuthorizationHeaders(secrets);
  const bananaResponse = await getBanana(headers);
  console.info("Did request to IAP secured endpoint: ", bananaResponse.body);
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
