import twilio from "twilio";
import { ChannelSender, MessagePayload, MessageResult } from "./types";

export class TwilioSMSSender implements ChannelSender {
  private client: twilio.Twilio;
  private from: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.from = process.env.TWILIO_PHONE_NUMBER || "";

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }

    this.client = twilio(accountSid, authToken);
  }

  validate(payload: MessagePayload): boolean {
    return !!(payload.to && payload.content && this.from);
  }

  async send(payload: MessagePayload): Promise<MessageResult> {
    try {
      if (!this.validate(payload)) {
        return {
          success: false,
          error: "Invalid payload: missing required fields",
        };
      }

      const message = await this.client.messages.create({
        body: payload.content,
        from: payload.from || this.from,
        to: payload.to,
        mediaUrl: payload.mediaUrl,
      });

      return {
        success: true,
        messageId: message.sid,
        metadata: {
          status: message.status,
          dateCreated: message.dateCreated,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send SMS",
      };
    }
  }
}

export class TwilioWhatsAppSender implements ChannelSender {
  private client: twilio.Twilio;
  private from: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.from = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }

    this.client = twilio(accountSid, authToken);
  }

  validate(payload: MessagePayload): boolean {
    const whatsappTo = payload.to.startsWith("whatsapp:") ? payload.to : `whatsapp:${payload.to}`;
    return !!(whatsappTo && payload.content && this.from);
  }

  async send(payload: MessagePayload): Promise<MessageResult> {
    try {
      if (!this.validate(payload)) {
        return {
          success: false,
          error: "Invalid payload: missing required fields",
        };
      }

      const whatsappTo = payload.to.startsWith("whatsapp:") ? payload.to : `whatsapp:${payload.to}`;

      const message = await this.client.messages.create({
        body: payload.content,
        from: this.from,
        to: whatsappTo,
        mediaUrl: payload.mediaUrl,
      });

      return {
        success: true,
        messageId: message.sid,
        metadata: {
          status: message.status,
          dateCreated: message.dateCreated,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send WhatsApp message",
      };
    }
  }
}
