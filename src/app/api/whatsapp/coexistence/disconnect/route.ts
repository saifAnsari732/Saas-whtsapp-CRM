import { NextResponse } from "next/server";
import { cleanUserSession } from "@/lib/whatsapp/baileys";
import { getCoexistenceUser } from "@/lib/whatsapp/coexistence-auth";

export async function POST(request: Request) {
  try {
    const { userId } = await getCoexistenceUser(request);

    cleanUserSession(userId);

    return NextResponse.json({
      success: true,
      message: "Disconnected successfully"
    });
  } catch (error: any) {
    console.error("Disconnect error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
