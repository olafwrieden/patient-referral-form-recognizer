import {
  AzureKeyCredential,
  DocumentAnalysisClient,
} from "@azure/ai-form-recognizer";
import { AzureFunction, Context } from "@azure/functions";
import { writeMetadata } from "./utils/database";
import { acquireToken, submitReferral } from "./utils/endpoints";
import { IReferralData } from "./utils/Interfaces";
import { mergeDeep } from "./utils/json";
import { moveBlob } from "./utils/blob";
import { parseFilename, parseMetadata } from "./utils/metadata";

// Service Variables (secrets defined in env)
const FR_ENDPOINT = process.env["FORM_RECOGNIZER_ENDPOINT"] || "";
const FR_API_KEY = process.env["FORM_RECOGNIZER_API_KEY"] || "";
const FR_MODEL_ID = process.env["FORM_RECOGNIZER_MODEL_ID"] || "";

// Configure Document Analysis Client
const credential = new AzureKeyCredential(FR_API_KEY);
const client = new DocumentAnalysisClient(FR_ENDPOINT, credential);

// Indicator if API call was successful
let sinkSuccess: boolean = false;

/**
 * Blob Trigger Function to Process Patient Referral Forms.
 * @param context Function App Context
 * @param myBlob The Blob which triggered the Function
 */
const blobTrigger: AzureFunction = async function (
  context: Context,
  myBlob: any
): Promise<void> {
  context.log("BEGIN: A new file was detected!");
  context.log(`Blob Name: ${context.bindingData.name}`);
  context.log(`Blob Size: ${myBlob.length}`);
  context.log(`Blob URI: ${context.bindingData.uri}`);

  // Step 1: Parse Filename Metadata
  const fileMetadata = await parseFilename(context.bindingData.name);

  // Step 2: Analyse Input Blob Stream using Custom Trained Model
  const poller = await client.beginAnalyzeDocument(FR_MODEL_ID, myBlob);

  // Get Fields and Confidence from the Analysed Document
  const result = await poller.pollUntilDone();

  // Extract Referral Metadata from Coversheet
  const { reportData, apiData, isCoversheet, isReferral } = await parseMetadata(
    result
  );

  // If the document is a coversheet or a referral, post it to the API
  if (isCoversheet || isReferral) {
    // Build Referral Header Data (minimum API Payload)
    const headerdata: Partial<IReferralData> = {
      resourceType: "Fax",
      to: {
        organization: { name: process.env["RECEIVING_ORGANIZATION"] || "" },
        destinationFaxNo: fileMetadata.receivingNumber,
      },
      from: { sourceFaxNo: fileMetadata.sendingNumber },
      payload: {
        filename: context.bindingData.name,
        type: context.bindingData.properties.contentType,
        content: myBlob.toString("base64"),
      },
    };

    // Merge Header Data and API (form field) data
    const submissionData = await mergeDeep(headerdata, apiData);

    // Step 3: Submit data to the API Endpoint
    const { access_token } = await acquireToken();
    const submission = await submitReferral(submissionData, access_token);
    console.log(`Submission Status Code: ${submission}`);
    if (submission === 200) {
      sinkSuccess = true;
    }
  }

  // Step 4: Move blob to final container (and add metadata) depending on outcome of submission
  const moveTo: string = sinkSuccess ? "passed" : "failed";
  console.log(`Blob will be moved to: '${moveTo}' container`);

  await moveBlob(context.bindingData.name, "incoming", moveTo, {
    is_coversheet: String(isCoversheet),
    sending_fax_number: String(fileMetadata.sendingNumber),
    destination_fax_number: String(fileMetadata.receivingNumber),
  });

  // Step 5: Report Metadata to SQL Database for reporting
  await writeMetadata(
    fileMetadata,
    reportData,
    sinkSuccess,
    new Date(), // TODO: Get time that the payload was analysed
    new Date() // TODO: If API returns a timestamp, use it instead
  )
    .then(() => console.log("Metadata Reported Successfully"))
    .catch((err) => console.log("Metadata Reporting Error: ", err));
};

export default blobTrigger;
