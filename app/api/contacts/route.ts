import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateContactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsappPhone: z.string().optional(),
  teamId: z.string(),
});

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      include: {
        _count: {
          select: {
            messages: true,
            notes: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Get contacts error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = CreateContactSchema.parse(json);

    const contact = await prisma.contact.create({
      data,
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error("Create contact error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create contact" },
      { status: 500 }
    );
  }
}
