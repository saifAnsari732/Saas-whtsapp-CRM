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

    const statusRes = await fetch(`${serverUrl}/instance/connectionState/${instanceName}`, {
      method: "GET",
      headers: {
        apikey: globalApiKey,
      },
    });

    if (!statusRes.ok) {
      const errorText = await statusRes.text();
      throw new Error(`Failed to fetch status: ${errorText}`);
    }

    const data = await statusRes.json();
    
    // Check if the state is "open" or "connecting"
    return NextResponse.json({ success: true, state: data?.instance?.state || "unknown" });
  } catch (error: any) {
    console.error("Evolution API Status Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
