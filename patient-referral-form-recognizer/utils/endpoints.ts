import axios, { AxiosError, AxiosResponse } from "axios";
import { IReferralData, TokenResponse } from "./Interfaces";
// import { writeFile } from "fs";

// Import relevant environment variables
const {
  ENDPOINT_URI,
  TOKEN_ENDPOINT_URI,
  ENDPOINT_AUTH_USER,
  ENDPOINT_AUTH_PASS,
} = process.env;

/**
 * Sends a basic auth request to the API to acquire and access token.
 * @returns JWT Token to access the API
 */
export const acquireToken = async () => {
  return axios({
    method: "post",
    url: TOKEN_ENDPOINT_URI,
    auth: { username: ENDPOINT_AUTH_USER, password: ENDPOINT_AUTH_PASS },
  }).then((resonse: AxiosResponse) => resonse.data as TokenResponse);
};

/**
 * Submits a payload to the API endpoint.
 * @param data payload to be sent to API endpoint
 * @param token JWT bearer token to authenticate with
 * @returns API response to this POST request
 */
export const submitReferral = async (
  data: Partial<IReferralData>,
  token: string
) => {
  // Uncomment to save payload to filesystem as JSON
  // writeFile("output.json", JSON.stringify(data), "utf-8", (err) => {
  //   if (err) {
  //     console.log(err);
  //     return err;
  //   }
  //   console.log("JSON Saved");
  // });

  return axios({
    method: "post",
    url: ENDPOINT_URI,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {
      "Content-Type": "text/plain",
      authentication: `Bearer ${token}`,
      client_id: ENDPOINT_AUTH_USER,
      client_secret: ENDPOINT_AUTH_PASS,
    },
    data: JSON.stringify(data),
  })
    .then((response) => {
      console.log(response?.data);
      return response.status;
    })
    .catch((error: AxiosError) => {
      console.log(
        `Status: ${error.response?.status} - Message: ${error.message}`
      );
      return error.response?.status || 408;
    });
};
