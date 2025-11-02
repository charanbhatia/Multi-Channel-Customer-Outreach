import { ChannelSender, MessagePayload, ChannelType } from "./types";
import { TwilioSMSSender, TwilioWhatsAppSender } from "./twilio";

export function createSender(channelType: ChannelType): ChannelSender {
  switch (channelType) {
    case "SMS":
      return new TwilioSMSSender();
    case "WHATSAPP":
      return new TwilioWhatsAppSender();
    default:
      throw new Error(`Channel type ${channelType} not implemented`);
  }
}

export async function sendMessage(payload: MessagePayload) {
  const sender = createSender(payload.channelType);
  return await sender.send(payload);
}

export * from "./types";
export * from "./twilio";
