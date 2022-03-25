import { TediousType } from "tedious";
import { IMetadata } from "../interfaces/IMetadata";

export interface IReferralData {
  resourceType: string;
  from?: {
    organization?: {
      name: string;
    };
    referredFrom?: {
      name?: {
        family?: string;
        given?: string;
      };
      providerNo?: string;
    };
    sourceFaxNo?: string;
    received?: string;
  };
  to: {
    organization: {
      name: string;
    };
    facility?: {
      name: string;
    };
    service?: {
      name: string;
    };
    referredTo?: {
      name: {
        family: string;
        given: string;
        title: string;
      };
    };
    destinationFaxNo: string;
  };
  patient?: {
    medicare: string;
    name: {
      family: string;
      given: string;
    };
    gender: string;
    birthDate: string;
    phoneHome: string;
    mobile: string;
    email: string;
  };
  referral?: {
    urgency: string;
    communicationConsent: string;
    prefCommunicationMethod: string;
  };
  payload: {
    filename: string;
    type: string;
    numberOfPages?: string;
    content: string;
  };
}

export interface IReferralFile {
  /** Raw timestamp string as found in the filename */
  timestamp: string;
  /** JavaScript Date() formatted timestamp */
  formattedTimestamp: Date | null;
  /** Receiving Fax Number as per the filename */
  receivingNumber: string;
  /** Sending Fax Number as per the filename */
  sendingNumber: string;
  /** Fax Serial Number as per the filename */
  faxSerial: string;
  /** Filename of the blob */
  filename: string;
}

export interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
}

export interface SqlColumn {
  /** Name of the SQL Column */
  name: keyof IMetadata;
  /** Tedious SQL Column Type */
  sqlType: TediousType;
  /** Should this column be mapped to database */
  isMetadata?: boolean;
}

interface ApiPath {
  path: string;
  default?: string;
}

export interface KeyMappingData {
  report: SqlColumn | null;
  api: ApiPath | null;
}

export interface IColumn {
  column: string;
  type: TediousType;
  value: string | number | boolean | Date;
}
