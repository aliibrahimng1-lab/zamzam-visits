import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const nominatimEmail = Deno.env.get("NOMINATIM_EMAIL") || "support@zamzam.global";

const supabaseAdmin =
  supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!supabaseAdmin) {
    return jsonResponse({ error: "Server not configured." }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return jsonResponse({ error: "Missing authorization token." }, 401);
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return jsonResponse({ error: "Invalid session." }, 401);
  }

  let payload: { lat?: number; lon?: number } = {};
  try {
    payload = await req.json();
  } catch (error) {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const lat = Number(payload.lat);
  const lon = Number(payload.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return jsonResponse({ error: "Latitude and longitude are required." }, 400);
  }

  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": `ZamzamVisits/1.0 (${nominatimEmail})`,
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      return jsonResponse({ error: "Reverse geocoding failed." }, response.status);
    }
    const data = await response.json();
    return jsonResponse({ address: data.address || {} });
  } catch (error) {
    return jsonResponse({ error: "Reverse geocoding failed." }, 500);
  } finally {
    clearTimeout(timeout);
  }
});
