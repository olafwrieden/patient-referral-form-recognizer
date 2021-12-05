import {
  AzureKeyCredential,
  DocumentAnalysisClient,
} from "@azure/ai-form-recognizer";
import { AzureFunction, Context } from "@azure/functions";
import {
  createBlobService,
  createTableService,
  TableUtilities,
} from "azure-storage";

/**
 * Blob Trigger Function to Process Patient Referral Forms.
 * @param context Function App Context
 * @param myBlob The Blob which triggered the Function
 */
const blobTrigger: AzureFunction = async function (
  context: Context,
  myBlob: any
): Promise<void> {
  context.log("BEGIN: A new blob was detected!");
  context.log(`Blob Name: ${context.bindingData.name}`);
  context.log(`Blob Size: ${myBlob.length}`);
  context.log(`Blob URI: ${context.bindingData.uri}`);

  // Service Variables (secrets defined in env)
  const endpoint = process.env["FORM_RECOGNIZER_ENDPOINT"];
  const apiKey = process.env["FORM_RECOGNIZER_API_KEY"];
  const modelId = process.env["FORM_RECOGNIZER_MODEL_ID"];
  const storageKey = process.env["FORM_RECOGNIZER_STORAGE"];
  const MIN_CONFIDENCE_SCORE = Number(process.env["MIN_CONFIDENCE_SCORE"]);

  // Configure Document Analysis Client
  const credential = new AzureKeyCredential(apiKey);
  const client = new DocumentAnalysisClient(endpoint, credential);

  // Instantiate Table & Blob Storage
  const tableService = createTableService(storageKey);
  const blobService = createBlobService(storageKey);

  // Analyse Input Blob Stream using Custom Trained Model
  const poller = await client.beginAnalyzeDocuments(modelId, myBlob);

  // Get Fields and Confidence from the Analysed Document
  const { documents } = await poller.pollUntilDone();
  const [{ fields, confidence }] = documents;

  // If overall confidence is low, move blob to manual container
  if (confidence < MIN_CONFIDENCE_SCORE) {
    // Move Blob to 'manual' container
    blobService.startCopyBlob(
      context.bindingData.uri,
      "manual",
      context.bindingData.name,
      function (error, result, response) {
        if (error) {
          context.log(JSON.stringify(response));
        }
        // When moved, update metadata with confidence score
        if (response.isSuccessful) {
          blobService.setBlobMetadata(
            "manual",
            result.name,
            { scan_confidence: String(confidence) },
            function (error, result, response) {
              if (error) {
                context.log(JSON.stringify(response));
              }
              if (response.isSuccessful) {
                context.log(
                  `Blob '${context.bindingData.name}' moved to 'manual'`
                );
                blobService.deleteBlobIfExists(
                  "incoming",
                  context.bindingData.name,
                  function (error, result, response) {
                    if (error) {
                      context.log(JSON.stringify(response));
                    }
                    if (response.isSuccessful) {
                      context.log(
                        `Blob '${context.bindingData.name}' was deleted.`
                      );
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  } else {
    // Check if To Recipient is present, else don't save
    const entGen = TableUtilities.entityGenerator;

    // Construct Referral
    let referral = {
      PartitionKey: entGen.String("referral"),
      RowKey: entGen.String(
        String(`M${fields["Medicare Number"].content}_${new Date().getTime()}`)
      ),
      Overall_Confidence_Score: entGen.Int32(confidence),
    };

    // Add fields
    for (const [name, field] of Object.entries(fields)) {
      referral[name.replace(/ /g, "_")] =
        field.kind === "selectionMark"
          ? entGen.Boolean(field.content === "selected" ? true : false)
          : entGen.String(field.content);
    }

    // Save Referral
    tableService.insertEntity(
      "referrals",
      referral,
      function (error, result, response) {
        if (error) {
          context.log(JSON.stringify(response));
        }
        if (response.isSuccessful) {
          blobService.startCopyBlob(
            context.bindingData.uri,
            "processed",
            String(
              `M${fields["Medicare Number"].content}_${new Date().getTime()}`
            ),
            function (error, result, response) {
              if (error) {
                context.log(JSON.stringify(response));
              }
              if (response.isSuccessful) {
                blobService.setBlobMetadata(
                  "processed",
                  result.name,
                  { scan_confidence: String(confidence) },
                  function (error, result, response) {
                    if (error) {
                      context.log(JSON.stringify(response));
                    }
                    if (response.isSuccessful) {
                      context.log(
                        `Blob '${context.bindingData.name}' moved to 'processed'`
                      );
                      blobService.deleteBlobIfExists(
                        "incoming",
                        context.bindingData.name,
                        function (error, result, response) {
                          if (error) {
                            context.log(JSON.stringify(response));
                          }
                          if (response.isSuccessful) {
                            context.log(
                              `Blob '${context.bindingData.name}' was deleted.`
                            );
                          }
                        }
                      );
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  }
};

export default blobTrigger;
