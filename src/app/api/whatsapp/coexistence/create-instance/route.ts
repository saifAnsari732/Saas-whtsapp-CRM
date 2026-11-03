import { NextResponse } from "next/server";
import { connectToWhatsApp, getStatus } from "@/lib/whatsapp/baileys";
import QRCode from "qrcode";
import { getCoexistenceUser } from "@/lib/whatsapp/coexistence-auth";

export async function POST(request: Request) {
  try {
    const { userId } = await getCoexistenceUser(request);

    // Fire and forget connection start
    connectToWhatsApp(userId);

    // Wait for QR code to generate (up to 8 seconds) to prevent returning null too early
    let currentStatus = getStatus(userId);
    let attempts = 0;
    while (!currentStatus.qr && currentStatus.status !== 'connected' && attempts < 16) {
      await new Promise(resolve => setTimeout(resolve, 500));
      currentStatus = getStatus(userId);
      attempts++;
    }

    let base64Qr = null;
    if (currentStatus.qr) {
      base64Qr = await QRCode.toDataURL(currentStatus.qr);
    }

    const normalizedState = currentStatus.status === "connected" ? "open" : currentStatus.status;

    return NextResponse.json({
      success: true,
      state: normalizedState,
      status: normalizedState,
      qr: base64Qr,
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
