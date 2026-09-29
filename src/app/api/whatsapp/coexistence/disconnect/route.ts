import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import { cleanUserSession } from "@/lib/whatsapp/baileys";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    cleanUserSession(user.id);

    return NextResponse.json({
      success: true,
      message: "Disconnected successfully"
    });
  } catch (error: any) {
    console.error("Disconnect error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}