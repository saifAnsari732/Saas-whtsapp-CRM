import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the account ID for the user
    const { data: member } = await (await supabase)
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "No account found" }, { status: 403 });
    }

    const accountId = member.account_id;

    // 1. Fetch the user's WhatsApp Business Accounts
    const wabaResponse = await fetch(
      `https://graph.facebook.com/v20.0/me/client_whatsapp_business_accounts?access_token=${accessToken}`
    );
    const wabaData = await wabaResponse.json();

    if (!wabaResponse.ok || !wabaData.data || wabaData.data.length === 0) {
      // If client_whatsapp_business_accounts doesn't work (for direct apps vs solution partners), try direct
      const directWabaResponse = await fetch(
        `https://graph.facebook.com/v20.0/me/whatsapp_business_accounts?access_token=${accessToken}`
      );
      const directWabaData = await directWabaResponse.json();

      if (!directWabaResponse.ok || !directWabaData.data || directWabaData.data.length === 0) {
          console.error("Failed to fetch WABA IDs", wabaData, directWabaData);
          return NextResponse.json(
            { error: "Could not find any WhatsApp Business Accounts associated with this login." },
            { status: 400 }
          );
      }
      wabaData.data = directWabaData.data;
    }

    const wabaId = wabaData.data[0].id;

    // 2. Fetch the phone numbers for this WABA
    const phoneResponse = await fetch(
      `https://graph.facebook.com/v20.0/${wabaId}/phone_numbers?access_token=${accessToken}`
    );
    const phoneData = await phoneResponse.json();

    if (!phoneResponse.ok || !phoneData.data || phoneData.data.length === 0) {
      console.error("Failed to fetch Phone Numbers", phoneData);
      return NextResponse.json(
        { error: "Could not find any phone numbers associated with this WABA." },
        { status: 400 }
      );
    }

    const phoneNumberId = phoneData.data[0].id;

    // 3. Save to database
    // We encrypt the token if the existing logic expects it, but looking at the current API
    // the POST /api/whatsapp/config handles encryption. Let's just use that logic by calling it directly,
    // or replicating the upsert here.
    // It's better to just replicate the payload and call the existing config logic if possible, 
    // or encrypt it here.
    // Let's just do a direct upsert here and let the token be plaintext for a moment, or we need to encrypt it.
    // Looking at `/api/whatsapp/config`, it encrypts using `process.env.ENCRYPTION_KEY`.
    
    // Instead of duplicating encryption logic, we can return the fetched details to the frontend, 
    // and let the frontend call the existing `handleSave` with the new data!
    // Yes! That's much safer and reuses existing logic.

    return NextResponse.json({
      wabaId,
      phoneNumberId,
      accessToken,
      message: "Successfully fetched WhatsApp details"
    });
  } catch (error: any) {
    console.error("Exchange error:", error);
    return NextResponse.json(
      { error: "Internal server error during token exchange." },
      { status: 500 }
    );
  }
}
