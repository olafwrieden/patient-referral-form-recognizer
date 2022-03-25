import { AnalyzeResult } from "@azure/ai-form-recognizer";
import { parse } from "date-fns";
import { TYPES } from "tedious";
import {
  CommsMapping,
  GenderMapping,
  KeyToColumnMapping,
  UrgencyMapping,
} from "./fields";
import { IColumn, IReferralData, IReferralFile } from "./Interfaces";
import { set } from "./json";

// Global Properties
const COVERSHEET_IDENTIFIERS = ["fax coversheet"];
const REFERAL_PHRASES = ["thank you for seeing", "opinion and management"];

/**
 * Parses the Form Recognizer return payload into reporting data and API data.
 * @param result analysis result from form recognizer
 * @returns coversheet metadata parsed for downstream consumption
 */
export const parseMetadata = async (result: AnalyzeResult) => {
  const isReferral = isReferralDoc(result.content);

  // Metadata variables (for custom business logic)
  let isCoversheet = false;
  let prefCommsMethod: string;
  let patientGender: string;
  let urgency: string;

  // Return Variables
  let reportData: IColumn[] = [];
  let apiData: Partial<IReferralData> = {};

  result.documents.map((document) => {
    // Enumerate fields returned by Azure Form Recognizer
    for (const [name, field] of Object.entries(document.fields)) {
      // Get our custom field mappings for the current label
      let dbCol = KeyToColumnMapping.get(name);
      if (!dbCol) {
        continue; // Move to next field if this field has no custom mapping
      }

      // +++++++++++++++++++++++++++++
      //  Start Custom Business Logic
      // +++++++++++++++++++++++++++++

      // Check if this field is the coversheet
      if (
        dbCol.report &&
        dbCol.report.name === "is_coversheet" &&
        COVERSHEET_IDENTIFIERS.includes(field.content.toLowerCase())
      ) {
        // When detected, toggle isCoversheet to 'true'
        isCoversheet = true;
        const coversheetPageNum = field.boundingRegions[0].pageNumber;
        console.log(`Detected coversheet on page ${coversheetPageNum}`);
        continue; // break on coversheet - we handle this later
      }

      /**
       * Gender Formatting:
       * If the global variable doesn't have a gender value,
       * set it to the first detected gender,
       * if there are multiple, set to "unknown"
       */
      if (["Is Male Sex", "Is Female Sex", "Is Other Sex"].includes(name)) {
        if (field.content === "selected") {
          !patientGender
            ? (patientGender = GenderMapping.get(name) || "unknown")
            : (patientGender = "unknown");
        }
        continue; // skip to next iteration
      }

      /**
       * Communication Preferences:
       * If the global variable doesn't have a value,
       * set it to the first detected method
       */
      if (
        [
          "Prefers Contact by SMS",
          "Prefers Contact by Post",
          "Prefers Contact by Email",
          "Prefers Contact by Phone",
        ].includes(name)
      ) {
        if (field.content === "selected") {
          if (!prefCommsMethod) {
            prefCommsMethod = CommsMapping.get(name);
          }
        }
        continue; // Skip to next iteration
      }

      /**
       * Urgency Logic:
       * If global variable doesn't have a value,
       * set it to first value,
       * if both is_urgent and is_not_urgent are checked, mark it as urgent
       */
      if (["Is Urgent Referral", "Is Not Urgent Referral"].includes(name)) {
        if (field.content === "selected") {
          !urgency
            ? (urgency = UrgencyMapping.get(name) || "routine")
            : (urgency = "urgent");
        }
        continue; // Skip to next iteration
      }

      // +++++++++++++++++++++++++++++
      //  End Custom Business Logic
      // +++++++++++++++++++++++++++++

      if (!!dbCol.report) {
        // If this field should be reported
        // Report field metadata (value and confidence)
        reportData.push(
          {
            column: dbCol.report.name,
            type: dbCol.report.sqlType,
            value:
              field.kind === "selectionMark"
                ? field.content === "selected"
                  ? true
                  : false
                : field.content,
          },
          {
            column: `${dbCol.report.name}_confidence`,
            type: TYPES.Float,
            value: field.confidence,
          }
        );
      }

      // If the field value needs to be sent to the destination API
      if (!!dbCol.api) {
        // Read JSON path and set it's data to the field value
        set(dbCol.api.path, apiData, field.content);
      }
    }
  });

  // Get General Metadata about Form Recognizer
  const FrToColumnMapping: IColumn[] = [
    {
      column: "is_coversheet",
      type: TYPES.TinyInt,
      value: isCoversheet,
    },
    {
      column: "is_referral",
      type: TYPES.TinyInt,
      value: isReferral,
    },
    {
      column: "is_emergency_referral",
      type: TYPES.TinyInt,
      value: urgency === "urgent",
    },
    {
      column: "number_detected_pages",
      type: TYPES.SmallInt,
      value: result.pages.length,
    },
    {
      column: "fr_api_version",
      type: TYPES.NVarChar,
      value: result.apiVersion,
    },
    { column: "fr_model_id", type: TYPES.NVarChar, value: result.modelId },
    {
      column: "aggregate_confidence",
      type: TYPES.Float,
      value:
        result.documents.reduce((sum, doc) => sum + doc.confidence, 0) /
        result.documents.length,
    },
  ];

  reportData.push(...FrToColumnMapping);

  // Add skipped matadata back in (after custom logic was applied)
  set("patient.gender", apiData, patientGender);
  set("referral.urgency", apiData, urgency ? urgency : "routine");
  set("referral.communicationConsent", apiData, prefCommsMethod ? "Y" : "N");
  prefCommsMethod &&
    set("referral.prefCommunicationMethod", apiData, prefCommsMethod);

  // Retuen reporting, api, coversheet, referral data
  return { reportData, apiData, isCoversheet, isReferral };
};

/**
 * Checks whether this document is a referal, based on substring matching across any page of the document.
 * @param content the entire detected content to be searched
 * @returns true if the document is likely a referral, else false
 */
const isReferralDoc = (content: string): boolean => {
  if (
    REFERAL_PHRASES.some((phrase: string) =>
      content.toLowerCase().includes(phrase.toLowerCase())
    )
  ) {
    console.log("Document is likely a referral!");
    return true;
  } else {
    console.log("Document is not a referral");
    return false;
  }
};

/**
 * Parses the filename input string to extract and return the metadata in the filename.
 * @param filename string filename such as `2021-12-02_13h47m20s_DISTRICT Fax Service_0266207730_fax000001028.pdf`
 * @returns an object with the filename metadata inside
 */
export const parseFilename = async (filename: string) => {
  let data: IReferralFile = {
    timestamp: "",
    formattedTimestamp: null,
    receivingNumber: "",
    sendingNumber: "",
    faxSerial: "",
    filename: filename,
  };

  try {
    const parts = filename.split("_");

    // Parse timestamp string ('2021-12-02_13h47m20s') to Date
    data.timestamp = `${parts[0]}_${parts[1]}` || "";
    data.formattedTimestamp =
      parse(
        `${parts[0]}_${parts[1]}`,
        "yyyy-MM-dd_kk'h'm'm's's'",
        new Date()
      ) || null;
    data.receivingNumber = parts[3] || "";
    data.sendingNumber = parts[2] || "";
    data.faxSerial = parts[4].split(".")[0] || "";
  } catch (error) {
    // Error parsing file
    console.log("Could not parse the filename", filename);
  } finally {
    // Return empty data object
    return data;
  }
};
