export const createMetadata = `INSERT INTO
dbo.ReferralMetadata(
  referral_guid,
  sending_fax_number,
  receiving_fax_number,
  is_coversheet,
  is_referral,
  number_detected_pages,
  referral_type_new,
  referral_type_new_confidence,
  referral_type_update,
  referral_type_update_confidence,
  referral_type_rfi,
  referral_type_rfi_confidence,
  service_name,
  service_name_confidence,
  referred_to_facility,
  referred_to_facility_confidence,
  destination_fax_number,
  destination_fax_number_confidence,
  number_pages_label,
  number_pages_label_confidence,
  referral_id,
  referral_id_confidence,
  referrer_given_name,
  referrer_given_name_confidence,
  referrer_family_name,
  referrer_family_name_confidence,
  referrer_practice_name,
  referrer_practice_name_confidence,
  referrer_provider_number,
  referrer_provider_number_confidence,
  referrer_phone_number,
  referrer_phone_number_confidence,
  is_emergency_referral,
  filename,
  is_successful_sink,
  aggregate_confidence,
  fr_model_id,
  fr_api_version,
  received_at,
  analysed_at,
  stored_at
)
VALUES
(
  @referral_guid,
  @sending_fax_number,
  @receiving_fax_number,
  @is_coversheet,
  @is_referral,
  @number_detected_pages,
  @referral_type_new,
  @referral_type_new_confidence,
  @referral_type_update,
  @referral_type_update_confidence,
  @referral_type_rfi,
  @referral_type_rfi_confidence,
  @service_name,
  @service_name_confidence,
  @referred_to_facility,
  @referred_to_facility_confidence,
  @destination_fax_number,
  @destination_fax_number_confidence,
  @number_pages_label,
  @number_pages_label_confidence,
  @referral_id,
  @referral_id_confidence,
  @referrer_given_name,
  @referrer_given_name_confidence,
  @referrer_family_name,
  @referrer_family_name_confidence,
  @referrer_practice_name,
  @referrer_practice_name_confidence,
  @referrer_provider_number,
  @referrer_provider_number_confidence,
  @referrer_phone_number,
  @referrer_phone_number_confidence,
  @is_emergency_referral,
  @filename,
  @is_successful_sink,
  @aggregate_confidence,
  @fr_model_id,
  @fr_api_version,
  @received_at,
  @analysed_at,
  @stored_at
)`