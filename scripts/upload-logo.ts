/**
 * Upload Logo to Supabase Storage Script
 *
 * Uploads the logo from the ecommerce frontend to Supabase storage
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import fs from "node:fs";

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const LOGO_SOURCE_PATH =
  "C:/Users/Noel/Documents/ecommerce/public/images/logo.png";
const STORAGE_BUCKET = "logo";
const STORAGE_FILE_NAME = "logo.png";

async function uploadLogo() {
  console.log("📤 Starting logo upload to Supabase storage...\n");

  try {
    // Read the logo file
    const fileBuffer = fs.readFileSync(LOGO_SOURCE_PATH);
    console.log(
      `✅ Read logo file: ${LOGO_SOURCE_PATH} (${fileBuffer.length} bytes)`,
    );

    // First, try to delete existing logo if it exists
    try {
      await supabase.storage.from(STORAGE_BUCKET).remove([STORAGE_FILE_NAME]);
      console.log("✅ Removed existing logo (if any)");
    } catch (removeError) {
      // Ignore errors from removal - logo might not exist yet
      console.log(
        "⚠️ No existing logo to remove or removal failed:",
        removeError,
      );
    }

    // Upload the logo
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(STORAGE_FILE_NAME, fileBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("❌ Error uploading logo:", error.message);
      process.exit(1);
    }

    console.log(`✅ Logo uploaded successfully!`);
    console.log(`   Path: ${data.path}`);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(STORAGE_FILE_NAME);

    console.log(`\n📋 Public URL:`);
    console.log(`   ${urlData.publicUrl}`);

    console.log("\n✨ Logo upload completed successfully!");
  } catch (err) {
    console.error("❌ Upload failed:", err);
    process.exit(1);
  }
}

uploadLogo()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
  });
