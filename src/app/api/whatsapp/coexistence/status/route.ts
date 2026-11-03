import { NextResponse } from "next/server";
import { getStatus } from "@/lib/whatsapp/baileys";
import QRCode from "qrcode";
import { getCoexistenceUser } from "@/lib/whatsapp/coexistence-auth";

export async function GET(request: Request) {
  return handleStatus(request);
}

export async function POST(request: Request) {
  return handleStatus(request);
}

async function handleStatus(request: Request) {
  try {
    const { userId } = await getCoexistenceUser(request);

    const { status, qr, user: deviceUser } = getStatus(userId);

    let base64Qr = null;
    if (qr) {
      base64Qr = await QRCode.toDataURL(qr);
    }

    const normalizedState = status === "connected" ? "open" : status;

    return NextResponse.json({
      success: true,
      state: normalizedState,
      status: normalizedState,
      qr: base64Qr,
      user: deviceUser,
    });
  } catch (error: any) {
    console.error("Native Baileys Status Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
