  import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey =
    Deno.env.get("SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    "";

  const supabaseAdmin = supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

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

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/Bearer\s+/i, "").trim();
    if (!token) {
      return jsonResponse({ error: "Missing authorization token." }, 401);
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData || !userData.user) {
      return jsonResponse({ error: userError?.message || "Invalid session." }, 401);
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return jsonResponse({ error: "Admin access required." }, 403);
    }

    let payload: {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    } = {};

    try {
      payload = await req.json();
    } catch (_error) {
      return jsonResponse({ error: "Invalid request body." }, 400);
    }

    const name = (payload.name || "").trim();
    const email = (payload.email || "").trim().toLowerCase();
    const password = payload.password || "";
    const role = payload.role === "admin" ? "admin" : "salesperson";

    if (!name || !email || !password) {
      return jsonResponse({ error: "Name, email, and password are required." }, 400);
    }

    if (password.length < 6) {
      return jsonResponse({ error: "Password must be at least 6 characters." }, 400);
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (createError || !created || !created.user) {
      return jsonResponse({ error: createError?.message || "Unable to create user." }, 400);
    }

    const { error: profileInsertError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: created.user.id,
        name,
        role,
      },
      { onConflict: "id" },
    );

    if (profileInsertError) {
      return jsonResponse(
        { error: profileInsertError.message || "Unable to save profile." },
        400,
      );
    }

    return jsonResponse({
      id: created.user.id,
      email: created.user.email,
      role,
      name,
    });
  });
