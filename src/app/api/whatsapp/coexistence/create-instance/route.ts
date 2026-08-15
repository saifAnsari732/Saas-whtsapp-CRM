import { NextResponse } from "next/server";
import { connectToWhatsApp, getStatus } from "@/lib/whatsapp/baileys";
import QRCode from "qrcode";

export async function POST(request: Request) {
  try {
    // Fire and forget connection start
    connectToWhatsApp();

    // Wait a brief moment to see if QR generates immediately (it usually takes 1-2s)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const { status, qr } = getStatus();

    let base64Qr = null;
    if (qr) {
      base64Qr = await QRCode.toDataURL(qr);
    }

    return NextResponse.json({
      success: true,
      state: status,
      data: {
        qrcode: {
          base64: base64Qr
        }
      }
    });
  } catch (error: any) {
    console.error("Native Baileys Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
