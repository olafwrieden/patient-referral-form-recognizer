import { Connection, ConnectionConfig, Request, TYPES } from "tedious";
import { v4 } from "uuid";
import { IColumn, IReferralFile } from "./Interfaces";
import { createMetadata } from "./queries";

// Import SQL Database Variables
const { SQL_USERNAME, SQL_PASSWORD, SQL_SERVER_NAME } = process.env;

// Configure SQL Database Connection
export const config: ConnectionConfig = {
  authentication: {
    options: {
      userName: SQL_USERNAME,
      password: SQL_PASSWORD,
    },
    type: "default",
  },
  server: SQL_SERVER_NAME,
  options: {
    database: "referraldb",
    encrypt: true,
  },
};

/**
 * @param fileMetadata object of processed filename metadata
 * @param coversheetMetadata object of metadata extracted from the coversheet
 * @param is_successful_sink true if data was submitted to API, else false
 * @param analysedAt time that Form Recognizer analysed the coversheet
 * @param storedAt time that the data was submitted to the API
 */
export const writeMetadata = (
  fileMetadata: IReferralFile,
  coversheetMetadata: IColumn[],
  is_successful_sink: boolean = false,
  analysedAt: Date,
  storedAt: Date
) =>
  new Promise((resolve, reject) => {
    let result = null;

    // Reporting DB Connection String
    const conn = new Connection(config);

    // DB Request Object to be executed
    const req = new Request(createMetadata, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });

    // Map Filename Metadata
    req.addParameter("referral_guid", TYPES.NVarChar, v4()); // Generate GUID
    req.addParameter(
      "received_at",
      TYPES.DateTime,
      fileMetadata.formattedTimestamp
    );
    req.addParameter(
      "sending_fax_number",
      TYPES.NVarChar,
      fileMetadata.sendingNumber
    );
    req.addParameter(
      "receiving_fax_number",
      TYPES.NVarChar,
      fileMetadata.receivingNumber
    );
    req.addParameter("filename", TYPES.NVarChar, fileMetadata.filename);
    req.addParameter("is_successful_sink", TYPES.TinyInt, is_successful_sink);

    // Store Timestamps
    req.addParameter("analysed_at", TYPES.DateTime, analysedAt);
    req.addParameter("stored_at", TYPES.DateTime, storedAt);

    // Map Coversheet Metadata to DB Columns
    coversheetMetadata.map((item) =>
      req.addParameter(item.column, item.type, item.value)
    );

    conn.on("end", () => conn.close());
    conn.on("connect", (err) => {
      if (err) {
        reject(err);
      } else {
        conn.execSql(req);
      }
    });

    conn.connect();
  });
