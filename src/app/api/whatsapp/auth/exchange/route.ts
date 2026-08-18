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

    // 1. Fetch WABA ID by debugging the access token
    // In Meta Embedded Signup, the granted WABA IDs are found in the token's granular_scopes
    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Missing Facebook App configuration" }, { status: 500 });
    }

    const appAccessToken = `${clientId}|${clientSecret}`;
    const debugResponse = await fetch(
      `https://graph.facebook.com/v20.0/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`
    );
    const debugData = await debugResponse.json();

    if (!debugResponse.ok || !debugData.data || !debugData.data.is_valid) {
      console.error("Failed to validate access token", debugData);
      return NextResponse.json(
        { error: "Invalid access token or failed to validate with Meta." },
        { status: 400 }
      );
    }

    // Extract WABA ID from granular_scopes
    let wabaId = null;
    const granularScopes = debugData.data.granular_scopes;
    if (granularScopes && Array.isArray(granularScopes)) {
      const waScope = granularScopes.find((s: any) => s.scope === 'whatsapp_business_management');
      if (waScope && waScope.target_ids && waScope.target_ids.length > 0) {
        wabaId = waScope.target_ids[0]; // Take the first granted WABA
      }
    }

    if (!wabaId) {
      console.error("No WABA ID found in granular_scopes", debugData);
      return NextResponse.json(
        { error: `Could not find any WhatsApp Business Accounts. Debug info: ${JSON.stringify(debugData)}` },
        { status: 400 }
      );
    }

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
