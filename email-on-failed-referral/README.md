# Email on Failed Referral

> This is the function used to send automated emails to a given mailbox when a new blob lands in the connected container, pending human review.

Details on the SendGrid setup are: [Documented here](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-sendgrid?tabs=javascript).

This comprises of several steps:

1. Deploy a SendGrid Resource from the Azure Marketplace.
2. Configure Sender (or Domain) Verification
3. Update the Function App Configuration

## Deployment Steps

1. Deploy SendGrid (Azure SaaS Resource)
   ![SendGrid Deployment](../media/sendgrid/deploy-sendgrid.png)

2. Single Sender Verification (or domain verfication)
   ![Single Sender Verification](../media/sendgrid/set-up-sender-verification.png)

3. Go to the inbox of this sender and click on the link to verify
   ![Verify Sender](../media/sendgrid/verify-sender.jpg)

4. This sender has now been verified.
   ![Sender Verified](../media/sendgrid/sender-verified.png)
