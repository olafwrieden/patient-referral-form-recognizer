import { AzureFunction, Context } from "@azure/functions";
import { createEmailAsJson, sendEmail } from "./utils/email";
import { htmlEmail } from "./utils/html";

const recipientAddresses = {
  to: [{ address: "me1@example.com", name: "A Test Display Name" }],
  // cc: [{ address: "me2@example.com", name: "Another Test Display Name" }],
  // bcc: [{ address: "me3@example.com", name: "A Third Test Display Name" }],
};

/**
 * Blob Trigger Function to Send Failed Referral Emails.
 * @param context Function App Context
 * @param myBlob The Blob which triggered the Function
 */
const sendFailedReferralEmail: AzureFunction = async (
  context: Context,
  myBlob: any
): Promise<void> => {
  context.log("BEGIN: Sending email for failed referral via Graph API.");
  context.log(`Blob Name: ${context.bindingData.name}`);
  context.log(`Blob URI: ${context.bindingData.uri}`);

  // Read the key metadata from the blob
  const metadata = formatMetadata(context.bindingData.metadata);

  // Construct Subject Line
  const subject = `A Possible Referral Failed for Fax Destination: ${metadata.destinationFaxNo}`;

  // Construct Email Body
  const message = createEmailAsJson(recipientAddresses, subject, htmlEmail, [
    {
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: context.bindingData.name,
      contentBytes: myBlob,
      contentType: context.bindingData.properties.contentType,
    },
  ]);
  context.log(JSON.stringify(message, null, 2));

  // Send Email
  sendEmail(process.env.FROM_ADDRESS, message);
};

/**
 * Extracts and returns given metadata from the blob.
 * @param metadata The metadata from the blob
 * @returns strucuted metadata as it was extracted from the blob
 */
const formatMetadata = (metadata: Object) => {
  return {
    destinationFaxNo: metadata["destination_fax_number"] || "",
    // TODO: Add any other metadata here that may exist on the blob.
  };
};

export default sendFailedReferralEmail;
