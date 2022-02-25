# Email on Failed Referral

> This is the function used to send automated emails to a given mailbox when a new blob lands in the connected container, pending human review.

Details on the SendGrid setup are: [Documented here](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-sendgrid?tabs=javascript).

This comprises of several steps:

1. Deploy a SendGrid Resource from the Azure Marketplace.
2. Configure Sender (or Domain) Verification
3. Update the Function App Configuration
