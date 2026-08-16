import { NextResponse } from "next/server";
import { getStatus } from "@/lib/whatsapp/baileys";
import QRCode from "qrcode";

export async function POST(request: Request) {
  try {
    const { status, qr } = getStatus();

    let base64Qr = null;
    if (qr) {
      base64Qr = await QRCode.toDataURL(qr);
    }

    return NextResponse.json({
      success: true,
      state: status === "connected" ? "open" : status,
      qr: base64Qr,
      user: getStatus().user
    });
  } catch (error: any) {
    console.error("Native Baileys Status Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
