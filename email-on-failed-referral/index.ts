import { AzureFunction, Context } from "@azure/functions";

// Import Environment Variables
const { EMAIL_TO_ADDRESSES, SENDGRID_FROM_ADDRESS } = process.env;

/**
 * Blob Trigger Function to Send Failed Referral Emails.
 * @param context Function App Context
 * @param myBlob The Blob which triggered the Function
 */
const sendFailedReferralEmail: AzureFunction = async function (
  context: Context,
  myBlob: any
): Promise<Object> {
  context.log("BEGIN: Sending email for failed referral.");
  context.log(`Blob Name: ${context.bindingData.name}`);
  context.log(`Blob URI: ${context.bindingData.uri}`);

  // Get make a list of all To Addresses
  const toAddresses = EMAIL_TO_ADDRESSES.split(";").map((to) => {
    return { email: to };
  });

  // Construct the SendGrid Message
  const message = {
    personalizations: [{ to: toAddresses }],
    from: { email: SENDGRID_FROM_ADDRESS },
    subject: "ACTION: New Manual Referral",
    content: [
      {
        type: "text/plain",
        value: `Hi,\n\nThe following submission could not be automatically processed and thus requires manual intervention.\n\nSubmission: ${context.bindingData.name}\n\nThank you!`,
      },
    ],
    // Attach Blob to the Email
    attachments: [
      {
        content: myBlob.toString("base64"),
        filename: context.bindingData.name,
        type: context.bindingData.properties.contentType,
        disposition: "attachment",
      },
    ],
  };

  return message; // Return Message to SendGrid Output Binding
};

export default sendFailedReferralEmail;
