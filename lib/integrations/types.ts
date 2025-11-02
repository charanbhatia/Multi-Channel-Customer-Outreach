export type ChannelType = "SMS" | "WHATSAPP" | "EMAIL" | "TWITTER" | "FACEBOOK" | "SLACK";

export interface MessagePayload {
  to: string;
  from?: string;
  content: string;
  channelType: ChannelType;
  metadata?: Record<string, unknown>;
  mediaUrl?: string[];
}

export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelSender {
  send(payload: MessagePayload): Promise<MessageResult>;
  validate(payload: MessagePayload): boolean;
}
