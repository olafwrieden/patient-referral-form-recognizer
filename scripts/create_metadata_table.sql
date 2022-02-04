/*
 The following script creates the ReferralMetadata table into which the Azure Function deposits information about
 the patient referral (metadata only, no patient PII).
 */
CREATE TABLE ReferralMetadata (
  ID INT IDENTITY(1, 1) NOT NULL,
  -- Referral Data
  referral_guid NVARCHAR(100) NOT NULL,
  sending_fax_number NVARCHAR(100) NOT NULL,
  receiving_fax_number NVARCHAR(100) NOT NULL,
  is_coversheet BIT,
  is_referral BIT,
  number_detected_pages SMALLINT,
  -- Referral Type
  referral_type_new BIT,
  referral_type_new_confidence FLOAT,
  referral_type_update BIT,
  referral_type_update_confidence FLOAT,
  referral_type_rfi BIT,
  referral_type_rfi_confidence FLOAT,
  referred_to_facility NVARCHAR(100),
  referred_to_facility_confidence FLOAT,
  destination_fax_number NVARCHAR(100),
  destination_fax_number_confidence FLOAT,
  number_pages_label SMALLINT,
  number_pages_label_confidence FLOAT,
  referral_id NVARCHAR(100),
  referral_id_confidence FLOAT,
  referrer_given_name NVARCHAR(100),
  referrer_given_name_confidence FLOAT,
  referrer_family_name NVARCHAR(100),
  referrer_family_name_confidence FLOAT,
  referrer_practice_name NVARCHAR(100),
  referrer_practice_name_confidence FLOAT,
  referrer_provider_number NVARCHAR(100),
  referrer_provider_number_confidence FLOAT,
  is_emergency_referral BIT,
  is_emergency_referral_confidence FLOAT,
  -- Metadata
  aggregate_confidence FLOAT,
  fr_model_id NVARCHAR(100),
  fr_api_version NVARCHAR(100),
  received_at DATETIME,
  analysed_at DATETIME,
  stored_at DATETIME,
  reported_at DATETIME NOT NULL DEFAULT GetDate()
)