import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const body = Object.fromEntries(formData);

    // Validate Twilio signature
    const twilioSignature = req.headers.get("x-twilio-signature") || "";
    const url = req.url;
    const authToken = process.env.TWILIO_AUTH_TOKEN || "";

    const isValid = twilio.validateRequest(authToken, twilioSignature, url, body);

    if (!isValid && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Extract message data
    const { MessageSid, From, To, Body, NumMedia, MediaUrl0, MessageStatus, SmsStatus } =
      body as Record<string, string>;

    const isWhatsApp = From.startsWith("whatsapp:") || To.startsWith("whatsapp:");
    const channelType = isWhatsApp ? "WHATSAPP" : "SMS";

    // Find or create contact
    const phone = From.replace("whatsapp:", "");
    let contact = await prisma.contact.findFirst({
      where: {
        OR: [{ phone }, { whatsappPhone: phone }],
      },
    });

    if (!contact) {
      const defaultTeam = await prisma.team.findFirst();
      if (!defaultTeam) {
        return NextResponse.json({ error: "No team found" }, { status: 400 });
      }

      contact = await prisma.contact.create({
        data: {
          phone: isWhatsApp ? undefined : phone,
          whatsappPhone: isWhatsApp ? phone : undefined,
          teamId: defaultTeam.id,
        },
      });
    }

    // Find channel
    let channel = await prisma.channel.findFirst({
      where: {
        type: channelType,
        teamId: contact.teamId,
      },
    });

    if (!channel) {
      channel = await prisma.channel.create({
        data: {
          name: `${channelType} Channel`,
          type: channelType,
          config: {},
          teamId: contact.teamId,
        },
      });
    }

    // Create message
    const metadata: Record<string, unknown> = {
      twilioSid: MessageSid,
      status: MessageStatus || SmsStatus,
    };

    if (NumMedia && parseInt(NumMedia) > 0) {
      metadata.mediaUrl = MediaUrl0;
    }

    await prisma.message.create({
      data: {
        content: Body || "",
        channelType,
        direction: "INBOUND",
        status: "DELIVERED",
        metadata: JSON.parse(JSON.stringify(metadata)),
        contactId: contact.id,
        channelId: channel.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Twilio webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 }
    );
  }
}
