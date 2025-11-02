import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendMessage } from "@/lib/integrations";
import { prisma } from "@/lib/db";

const SendMessageSchema = z.object({
  contactId: z.string(),
  content: z.string().min(1),
  channelType: z.enum(["SMS", "WHATSAPP", "EMAIL", "TWITTER", "FACEBOOK", "SLACK"]),
  mediaUrl: z.array(z.string().url()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = SendMessageSchema.parse(json);

    // Get contact
    const contact = await prisma.contact.findUnique({
      where: { id: data.contactId },
      include: { team: true },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Determine recipient based on channel
    let to: string;
    switch (data.channelType) {
      case "SMS":
        to = contact.phone || "";
        break;
      case "WHATSAPP":
        to = contact.whatsappPhone || contact.phone || "";
        break;
      case "EMAIL":
        to = contact.email || "";
        break;
      default:
        return NextResponse.json({ error: "Channel not supported" }, { status: 400 });
    }

    if (!to) {
      return NextResponse.json(
        { error: `No ${data.channelType} contact info available` },
        { status: 400 }
      );
    }

    // Send message
    const result = await sendMessage({
      to,
      content: data.content,
      channelType: data.channelType,
      mediaUrl: data.mediaUrl,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Find or create channel
    let channel = await prisma.channel.findFirst({
      where: {
        type: data.channelType,
        teamId: contact.teamId,
      },
    });

    if (!channel) {
      channel = await prisma.channel.create({
        data: {
          name: `${data.channelType} Channel`,
          type: data.channelType,
          config: {},
          teamId: contact.teamId,
        },
      });
    }

    // Save to database
    const message = await prisma.message.create({
      data: {
        content: data.content,
        channelType: data.channelType,
        direction: "OUTBOUND",
        status: "SENT",
        metadata: result.metadata ? JSON.parse(JSON.stringify(result.metadata)) : undefined,
        contactId: contact.id,
        channelId: channel.id,
      },
    });

    return NextResponse.json({ success: true, message, result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error("Send message error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send message" },
      { status: 500 }
    );
  }
}
