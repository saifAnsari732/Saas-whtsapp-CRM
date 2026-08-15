import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serverUrl, globalApiKey, instanceName } = body;

    if (!serverUrl || !globalApiKey || !instanceName) {
      return NextResponse.json(
        { error: "Missing required Evolution API parameters" },
        { status: 400 }
      );
    }

    // 1. Create the instance on Evolution API
    const createRes = await fetch(`${serverUrl}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: globalApiKey,
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`Failed to create instance: ${errorText}`);
    }

    const data = await createRes.json();
    
    // Returns the base64 QR code and instance info
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Evolution API Create Instance Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
