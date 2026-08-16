import { NextResponse } from "next/server";
import { connectToWhatsApp, getStatus } from "@/lib/whatsapp/baileys";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fire and forget connection start
    connectToWhatsApp(user.id);

    // Wait for QR code to generate (up to 8 seconds) to prevent returning null too early
    let currentStatus = getStatus(user.id);
    let attempts = 0;
    while (!currentStatus.qr && currentStatus.status !== 'connected' && attempts < 16) {
      await new Promise(resolve => setTimeout(resolve, 500));
      currentStatus = getStatus(user.id);
      attempts++;
    }

    let base64Qr = null;
    if (currentStatus.qr) {
      base64Qr = await QRCode.toDataURL(currentStatus.qr);
    }

    return NextResponse.json({
      success: true,
      state: currentStatus.status,
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
