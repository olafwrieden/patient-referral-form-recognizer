import { BlobServiceClient, Metadata } from "@azure/storage-blob";

// Storage Key to Blob Store
const STORAGE_KEY = process.env["FORM_RECOGNIZER_STORAGE"] || "";

/**
 * Moves a given blob from a source to a target container with optional metadata.
 * @param blobName name of the blob to be moved
 * @param sourceContainer name of the source container containing the blob to be moved
 * @param targetContainer name of the target container to which the blob is to be moved
 * @param metadata optional metadata to add to the blob once moved
 */
export const moveBlob = async (
  blobName: string,
  sourceContainer: string,
  targetContainer: string,
  metadata?: Metadata
) => {
  // Instantiate Blob Service Client
  const blobClient = BlobServiceClient.fromConnectionString(STORAGE_KEY);

  // Blob Connections
  const srcContainerClient = blobClient.getContainerClient(sourceContainer);
  const destContainerClient = blobClient.getContainerClient(targetContainer);
  const srcBlobClient = srcContainerClient.getBlobClient(blobName);
  const destBlobClient = destContainerClient.getBlobClient(blobName);

  // Copy the Blob to the target
  const copyPoller = await destBlobClient.beginCopyFromURL(srcBlobClient.url, {
    metadata,
  });

  // Poll Until Copy is Complete
  await copyPoller.pollUntilDone();

  // Delete blob from source when done
  await srcBlobClient.delete();
};
