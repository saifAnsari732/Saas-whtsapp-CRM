import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, service, message } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Please provide a valid full name." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string" || phone.trim().length < 8) {
      return NextResponse.json(
        { error: "Please provide a valid phone or WhatsApp number." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json(
        { error: "Please provide a detailed message (at least 5 characters)." },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (db) {
      await db.collection("contact_inquiries").add({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        service: service || "General Inquiry",
        message: message.trim(),
        createdAt: new Date().toISOString(),
        status: "new",
        source: "contact_form",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for reaching out! Our team will connect with you on WhatsApp / Email within 2 hours.",
    });
  } catch (error: unknown) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry. Please try again or chat with us directly on WhatsApp." },
      { status: 500 }
    );
  }
}
