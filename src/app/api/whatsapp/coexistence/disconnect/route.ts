import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clean up the global WhatsApp instance for this user
    if (global.waSockets?.[user.id]) {
      try {
        // Gracefully close the connection
        await global.waSockets[user.id].logout();
      } catch (error) {
        console.log("Error during logout:", error);
      }
      
      // Remove from global state
      delete global.waSockets[user.id];
      delete global.waQrs?.[user.id];
      delete global.waStores?.[user.id];
      
      if (global.waStatuses) {
        global.waStatuses[user.id] = 'disconnected';
      }
    }

    // Clean up local files
    const authFolder = `baileys_auth_info_${user.id}`;
    const storeFile = `baileys_store_${user.id}.json`;
    
    try {
      const fs = await import('fs');
      if (fs.existsSync(authFolder)) {
        fs.rmSync(authFolder, { recursive: true, force: true });
      }
      if (fs.existsSync(storeFile)) {
        fs.rmSync(storeFile, { force: true });
      }
    } catch (error) {
      console.error("Error cleaning up files:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Disconnected successfully"
    });
  } catch (error: any) {
    console.error("Disconnect error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}