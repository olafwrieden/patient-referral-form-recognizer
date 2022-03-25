import { TYPES } from "tedious";
import { KeyMappingData } from "./Interfaces";

// prettier-ignore
/**
 * Maps the custom labels we assigned in Form Recognizer
 * to their respective columns in the database.
 */
export const KeyToColumnMapping = new Map<string, KeyMappingData>([
  ["Is Referral Coversheet", { report: { name: "is_coversheet", sqlType: TYPES.TinyInt }, api: null }],
  ["Is New Referral", { report: { name: "referral_type_new", sqlType: TYPES.TinyInt }, api: null }],
  ["Update Existing Referral", { report: { name: "referral_type_update", sqlType: TYPES.TinyInt }, api: null }],
  ["Providing Missing Info to Existing Referral", { report: { name: "referral_type_rfi", sqlType: TYPES.TinyInt }, api: null }],
  ["To Recipient", { report: { name: "referred_to_facility", sqlType: TYPES.NVarChar }, api: { path: "to.facility.name" } }],
  ["Recipient Fax Number", { report: { name: "destination_fax_number", sqlType: TYPES.NVarChar }, api: { path: "to.destinationFaxNo" } }],
  ["Number of Pages", { report: { name: "number_pages_label", sqlType: TYPES.SmallInt }, api: null }],
  ["Referral ID", { report: { name: "referral_id", sqlType: TYPES.NVarChar }, api: null }],
  ["Referrer First Name", { report: { name: "referrer_given_name", sqlType: TYPES.NVarChar }, api: {path: "from.referredFrom.name.given" } }],
  ["Referrer Last Name", { report: { name: "referrer_family_name", sqlType: TYPES.NVarChar }, api: {path: "from.referredFrom.name.family" } }],
  ["Referrer Practice Name", { report: { name: "referrer_practice_name", sqlType: TYPES.NVarChar }, api: { path: "from.organization.name" } }],
  ["Referrer Provider Number", { report: { name: "referrer_provider_number", sqlType: TYPES.NVarChar }, api: { path: "from.referredFrom.providerNo" } }],
  ["Is Urgent Referral", { report: { name: "is_emergency_referral", sqlType: TYPES.TinyInt }, api: { path: "referral.urgency", default: "urgent" } }],
  ["Is Not Urgent Referral", { report: { name: "is_emergency_referral", sqlType: TYPES.TinyInt }, api: { path: "referral.urgency", default: "routine" } }],
  // Other fields
  ["Patient First Name", { report: null, api: { path: "patient.name.given" } }],
  ["Patient Last Name", { report: null, api: { path: "patient.name.family" } }],
  ["Medicare Number", { report: null, api: { path: "patient.medicare" } }],
  ["Patient DOB", { report: null, api: { path: "patient.birthDate" } }],
  ["Patient Home Number", { report: null, api: { path: "patient.phoneHome" } }],
  ["Patient Mobile Number", { report: null, api: { path: "patient.mobile" } }],
  ["Patient Email Address", { report: null, api: { path: "patient.email" } }],
  ["Referred to Service Name", { report: null, api: { path: "from.referredFrom.providerNo" } }],
  ["Is Male Sex", { report: null, api: { path: "patient.gender", default: "male" } }],
  ["Is Female Sex", { report: null, api: { path: "patient.gender", default: "female" } }],
  ["Is Other Sex", { report: null, api: { path: "patient.gender", default: "other" } }],
  ["Prefers Contact by SMS", { report: null, api: null }],
  ["Prefers Contact by Phone", { report: null, api: null }],
  ["Prefers Contact by Post", { report: null, api: null }],
  ["Prefers Contact by Email", { report: null, api: null }],
  ["Prefers Contact by Post", { report: null, api: null }],
]);

export const GenderMapping = new Map<string, string>([
  ["Is Male Sex", "male"],
  ["Is Female Sex", "female"],
  ["Is Other Sex", "other"],
]);

export const CommsMapping = new Map<string, string>([
  ["Prefers Contact by SMS", "sms"],
  ["Prefers Contact by Phone", "female"],
  ["Prefers Contact by Post", "other"],
  ["Prefers Contact by Email", "email"],
]);

export const UrgencyMapping = new Map<string, string>([
  ["Is Urgent Referral", "urgent"],
  ["Is Not Urgent Referral", "routine"],
]);
