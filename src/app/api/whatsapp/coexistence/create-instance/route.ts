import { NextResponse } from "next/server";
import { connectToWhatsApp, getStatus } from "@/lib/whatsapp/baileys";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fire and forget connection start
    connectToWhatsApp(user.id);

    // Wait a brief moment to see if QR generates immediately (it usually takes 1-2s)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const { status, qr } = getStatus(user.id);

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
