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

    // 1. Try to create the instance on Evolution API
    let createRes = await fetch(`${serverUrl}/instance/create`, {
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

    let data;

    // If it already exists (403/409), try to connect to it to get the QR code
    if (createRes.status === 403 || createRes.status === 409 || !createRes.ok) {
      const connectRes = await fetch(`${serverUrl}/instance/connect/${instanceName}`, {
        method: "GET",
        headers: {
          apikey: globalApiKey,
        },
      });

      if (!connectRes.ok) {
        const errorText = await connectRes.text();
        throw new Error(`Failed to create or connect to instance: ${errorText}`);
      }
      
      const connectData = await connectRes.json();
      // Evolution API /connect returns { base64: "..." } directly sometimes, or wrapped
      data = {
        qrcode: {
          base64: connectData.base64 || connectData.qrcode?.base64 || connectData.qrcode
        }
      };
    } else {
      data = await createRes.json();
    }
    
    // Returns the base64 QR code and instance info
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Evolution API Create Instance Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
