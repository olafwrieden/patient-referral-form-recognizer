import {
  AzureKeyCredential,
  DocumentAnalysisClient,
} from "@azure/ai-form-recognizer";
import { InvocationContext, app, output } from "@azure/functions";

const tableOutput = output.table({
  tableName: "referrals",
  connection: "STORAGE_ACCOUNT_KEY",
});

const completedOutput = output.storageBlob({
  path: "completed/{blobTrigger}",
  connection: "STORAGE_ACCOUNT_KEY",
});

const reviewOutput = output.storageBlob({
  path: "review/{blobTrigger}",
  connection: "STORAGE_ACCOUNT_KEY",
});

interface ReferralEntity {
  PartitionKey: string;
  RowKey: string;
  Overall_Confidence_Score: number;
}

export async function processReferrals(
  blob: Buffer,
  context: InvocationContext
): Promise<void> {
  context.log("BEGIN: A new blob was detected!");
  context.log(`Blob Name: ${context.triggerMetadata.name}`);
  context.log(`Blob Size: ${blob.length}`);
  context.log(`Blob URI: ${context.triggerMetadata.uri}`);

  // Service Variables (secrets defined in env)
  const DI_ENDPOINT = process.env["DOCUMENT_INTELLIGENCE_ENDPOINT"];
  const DI_API_KEY = process.env["DOCUMENT_INTELLIGENCE_API_KEY"];
  const DI_MODEL_ID = process.env["DOCUMENT_INTELLIGENCE_MODEL_ID"];
  const MIN_CONFIDENCE_SCORE = Number(process.env["MIN_CONFIDENCE_SCORE"]);

  // Configure Document Analysis Client
  const client = new DocumentAnalysisClient(
    DI_ENDPOINT,
    new AzureKeyCredential(DI_API_KEY)
  );

  // Analyse Input Blob Stream using Custom Trained Model
  const poller = await client.beginAnalyzeDocument(DI_MODEL_ID, blob);

  // Get Fields and Confidence from the Analysed Document
  const { documents } = await poller.pollUntilDone();
  const [{ fields, confidence }] = documents;

  // If overall confidence is low, move blob to manual container
  if (confidence < MIN_CONFIDENCE_SCORE) {
    context.log(`Confidence is ${confidence} (too low). Flagging for review.`);
    // Copy to Review Container
    context.extraOutputs.set(reviewOutput, blob);
  } else {
    context.log(`Confidence is ${confidence} (acceptable). Processing..`);

    // Construct Referral
    let referral: ReferralEntity = {
      PartitionKey: "referral",
      RowKey: String(
        `${fields["Patient Medical Number"].content}_${new Date().getTime()}`
      ),
      Overall_Confidence_Score: confidence,
    };

    // Add fields
    for (const [name, field] of Object.entries(fields)) {
      referral[name.replace(/ /g, "_")] =
        field.kind === "selectionMark"
          ? field.value === "selected"
            ? true
            : false
          : String(field.content);
    }

    // Write to Table Storage
    context.extraOutputs.set(tableOutput, referral);
    // Copy to Completed Container
    context.extraOutputs.set(completedOutput, blob);
  }
}

app.storageBlob("processReferrals", {
  path: "incoming/{name}",
  connection: "STORAGE_ACCOUNT_KEY",
  extraOutputs: [tableOutput, completedOutput, reviewOutput],
  handler: processReferrals,
});
