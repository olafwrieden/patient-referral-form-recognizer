# Azure Form Recognizer: Patient Referrals

> The purpose of this repository is to demonstrate the use of [Azure Form Recognizer](https://azure.microsoft.com/en-au/services/form-recognizer) (v3) in evaluating a patient referral form sent from doctors and hospitals. It is assumed that doctors will attach a [standarized coversheet](/samples/empty-coversheet.pdf) when they refer a patient.

## Introduction

Forms are used to communicate information in every industry, every day. Many people still manually extract data from forms to exchange information. When doctors refer patients to hospitals, they frequently Fax (yes, many still do) the referral to the hospital for administrative purposes. This calls for a series of employees to review the documents upon arrival and enter its details into the system correctly - a laborious task that is prone to human error.

Each health provider has their own style of referral document and while intent and patient data fields are generally present, sometimes information is missing from these highly individual documents. To solve this, one state health authority is now providing a standardised coversheet to be attached to the fax referral, mandating which attributes must be supplied.

Our goal is now to train an Azure Form Recognizer model to label, train, and test the optical character recognition to detect the values supplied in these referral forms, minimising the cognitive effort by frontline workers.

## High-Level: What happens end-to-end?

![Overview](./media/overview.png)

1. When a new document is uploaded into the `incoming` container of the Storage Account, it is picked up for processing by the Azure Function (which listens for changes to blobs in this containers).
2. The Azure Function reads the data of the blob and makes a call to the Azure Form Recognizer service via the SDK.
3. Form Recognizer performs Optical Character Recognition (OCR) on the document and returns a result set with the text and fields it extracted. Because we trained a custom model, the custom fields we defined are returned in the response too.
4. When the response from Form Recognizer has been received by the calling function, it's overall confidence score is extracted from the result set:
   - If falls below our arbitrary "acceptable" threshold (default 0.8 or 80% overall confidence), it is deemed too inaccurate and moved to the `review` container for manual / human downstream processing.
   - If it it greater than or equal to our pre-defined threshold, it's custom fields are extracted and appended to an Azure Table Storage (this could be any database); and the document itself is moved to the `completed` container.
5. The file, regardless of the outcome is tagged (metadata) with the overall confidence score when it is moved between containers.
6. Once processing has completed and the file has been moved, it will disappear from the `incoming` (source) container.

## Let's Build: Deploying the Resources

- **Azure Function:** An Azure Function is defined to perform the form recognition and perform conditional actions such as moving the form to a new storage container as per our arbitrary requirements. This function is triggered by a `BlobTrigger` - when a blob in a storage container changes, such as when it is added.
- **Storage Account:** The storage account is the underlying storage medium in our demo, it contains 3 containers and a table store called 'referrals':
  - Incoming: Where new patient referral forms get uploaded and automatically picked up for processing by our Azure Function.
  - Completed: Where processed patient referral forms get loaded into after they have been processed by the Azure Function and deemed "accurate enough" as per our arbitrary definition of overall confidence percentage.
  - Review: Where forms are moved to if the Form Recognizer determines that the overall confidence level of the text extraction is too low as per our arbitrary definition.
  - Referrals: This should not be a storage container but a table storage collection. This is the persistent store to which we will save our form data.
- **Form Recognizer:** The processing service in Azure, part of Azure Cognitive Services or standalone service that can be created as a new resource via the azure portal.

## Azure Form Recognizer (Custom Form)

In this interactive process, you tell Form Recognizer what text to extract from the coversheet, based on your training dataset of at least 5 images. You may use the [Form Recognizer Studio](https://formrecognizer.appliedai.azure.com) experience to upload a set of coversheet documents (supplied) with different values for the fields (e.g. fields, selection marks, signatures, and tables).

### Create a Custom Form Project

1. Navigate to [Form Recognizer Studio](https://formrecognizer.appliedai.azure.com) and select: _Custom form_ from the _Custom models_ section.
2. Select: _Create a project_ to create a new custom forms project that will house your patient referral project.
3. Follow the prompts to create a new Custom Forms project:

- **Project Details**
  - Project Name: _Patient Referrals_
  - Description: _Extracts patient referral data from standardized coversheet._
- **Service Resource**
  - Subscription: Select your subscription
  - Resource Group: Select the resource group with your Form Recognizer resource
  - Form Recognizer or Cognitive Service: Select your cognitive service
- **Training Data Source**
  - Subscription: Select your subscription
  - Resource Group: Select the resource group with your Storage Account
  - Storage Account: Select your storage account
  - Blob Container: Select the blob container where your model training data will be located ie. `training`
  - Folder path (optional): Path to your subfolder (if any)
- **Review & Create**
  - Ensure all details are correct and click: *Create Project*

### Label the Form Fields

1. Copy the sample taining data from the [training samples](samples/01-training) folder into the storage account container you specific for training when you created your project.
2. Open your Form Recognizer Custom Form project to the *Label data* tab. You should now see a preview of these files.
3. Begin to label the fields you wish to extract. Example: Select the "New Referral" checkbox (don't select the the text, just the checkbox). In the popup box. Type: "Is New Referral", now select "Selection Mark" to indicate this is selection mark field.
4. Repeat step 3 for all responses. Importantly, always select the written response text in the samples, not the header (ie. Referrer Last Name) and ensure you use the correct data type.
    - **Tip:** Give a description key to all data types you label (eg. patient_first_name or is_gender_female). Once all responses have been tagged appropriately, reuse the same labels on the remaining samples of training data.
5. Once at least 5 samples have been labeled, you are ready to Train the model.

### Training the Model

1. In the *Label data* tab, click the *Train* button in the top right corner
2. Enter a Model ID and Description
3. Click: *Train*

### Testing the Model

Once you have trained a model, you can test it:

1. Navigate to the *Test* tab
2. Select your model in the drop-down next to the "Test model" title
3. Add some sample testing data by clicking the `+ Add` button
4. Pick one or more files from the [testing samples](samples/02-testing) folder. These vary from the coversheet images used in the initial training set to avoid bias by 100% matching against the model's training data.
5. Click *Analyse* to process the file(s)
6. View the document analysis results (on the right)

Congratulations! You have successfully deployed, labeled, trained, and tested an Azure Form Recognizer Custom Form!

## Output: Table & Blob Storage (Processed)

This is the processed output in our storage medium of choice, Azure Table Storage.

![Azure Table Storage Screenshot](./media/table-storage-output.png)

Processed file with confidence metadata added:

![Metadata added to Blob](./media/processed-file-metadata.png)
