import { NextResponse } from "next/server";
import { getStatus } from "@/lib/whatsapp/baileys";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, qr, user: deviceUser } = getStatus(user.id);

    let base64Qr = null;
    if (qr) {
      base64Qr = await QRCode.toDataURL(qr);
    }

    return NextResponse.json({
      success: true,
      state: status === "connected" ? "open" : status,
      qr: base64Qr,
      user: deviceUser
    });
  } catch (error: any) {
    console.error("Native Baileys Status Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
