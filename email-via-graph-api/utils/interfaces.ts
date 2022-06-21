/**
 * User-friendly recipients interface.
 */
export interface IRecipientList {
  to?: Array<{ email: string; name: string }>;
  cc?: Array<{ email: string; name: string }>;
  bcc?: Array<{ email: string; name: string }>;
}

/**
 * Graph API-compatible recipients interface.
 */
export interface IGraphRecipient {
  emailAddress: { address: string; name?: string };
}

/**
 * Graph API-compatible attachment interface
 */
export interface IAttachment {
  "@odata.type": "#microsoft.graph.fileAttachment";
  name: string;
  contentType?: string;
  contentBytes: string;
}

/**
 * Graph API-compatible email message interface.
 */
export interface IEmail {
  message: {
    subject: string;
    body: {
      contentType: string;
      content: string;
    };
    from: IGraphRecipient;
    replyTo?: IGraphRecipient;
    toRecipients?: Array<IGraphRecipient>;
    ccRecipients?: Array<IGraphRecipient>;
    bccRecipients?: Array<IGraphRecipient>;
    bodyPreview?: string;
    importance?: "low" | "normal" | "high";
    attachments?: Array<IAttachment>;
  };
  saveToSentItems?: "true" | "false";
}
