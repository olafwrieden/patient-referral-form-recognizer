import axios from "axios";
import { stringify } from "qs";
import {
  IAttachment,
  IEmail,
  IGraphRecipient,
  IRecipientList,
} from "./interfaces";

// Environment Variables
const TENANT_ID = process.env.TENANT_ID || "";
const CLIENT_ID = process.env.CLIENT_ID || "";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "";
const AAD_ENDPOINT = process.env.AAD_ENDPOINT || "";
const GRAPH_ENDPOINT = process.env.GRAPH_ENDPOINT || "";
const FROM_ADDRESS = process.env.FROM || "";

/**
 * Returns a Graph API-compatible email object.
 * @param recipients recipients object
 * @param subject email subject line
 * @param body email body
 * @param attachments optional array of attachments
 * @returns a json representation of the email
 */
export const createEmailAsJson = (
  recipients: any,
  subject: string,
  body: string,
  attachments: Array<IAttachment> = [] // default to empty array
) => {
  let email: IEmail = {
    message: {
      subject: subject,
      body: {
        contentType: "HTML",
        content: body,
      },
      from: {
        emailAddress: { address: FROM_ADDRESS },
      },
      attachments: attachments,
    },
    saveToSentItems: "true",
  };

  return addRecipients(email, recipients);
};

/**
 * Adds recipients to the email object.
 * @param email email object
 * @param recipients recipients object
 * @returns email object with recipients added
 */
const addRecipients = (
  email: Omit<IEmail, "toRecipient" | "ccRecipients" | "bccRecipients">,
  recipients: IRecipientList = {}
) => {
  let cloned = Object.assign({}, email);

  Object.keys(recipients).forEach((recipient) => {
    if (recipient.length > 0) {
      cloned.message[`${recipient}Recipients`] = createRecipients(
        recipients[recipient]
      );
    }
  });

  return cloned;
};

/**
 * Formats to, cc, bcc fields to be used in the Graph API.
 * @param recipients Recipients object
 */
const createRecipients = (
  recipients: Array<{ email: string; name: string }>
): Array<IGraphRecipient> => {
  return recipients.map((recipient) => {
    return {
      emailAddress: {
        address: recipient.email,
        name: recipient.name || "",
      },
    };
  });
};

/**
 * Retrieves an Access Token from Azure AD.
 * @returns the AAD access token
 */
export const getAuthToken = async (): Promise<string> => {
  const data = {
    grant_type: "client_credentials",
    scope: `${GRAPH_ENDPOINT}/.default`,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  };

  console.log(
    "Acquiring Token",
    `${AAD_ENDPOINT}/${TENANT_ID}/oauth2/v2.0/token`
  );

  const tokenObject = await axios({
    url: `${AAD_ENDPOINT}/${TENANT_ID}/oauth2/v2.0/token`,
    method: "POST",
    data: stringify(data),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const {
    data: { access_token },
  } = tokenObject;

  return access_token;
};

/**
 * Send an email via the Graph API.
 * @param from the email address of the sender
 * @param email the json request body to send
 */
export const sendEmail = async (from: string, email: IEmail) => {
  const access_token = await getAuthToken();

  try {
    const response = await axios({
      url: `${GRAPH_ENDPOINT}/v1.0/users/${from}/sendMail`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify(email),
    });

    console.log("Send Email status", response.statusText);
  } catch (error) {
    console.log("Send Email error", error);
  }
};
