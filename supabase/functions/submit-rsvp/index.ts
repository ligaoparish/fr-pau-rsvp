import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed." }, 405);

  try {
    const body = await req.json();
    const full_name = String(body.full_name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = body.email ? String(body.email).trim() : null;
    const affiliation = body.affiliation ? String(body.affiliation).trim() : null;
    const attendance = String(body.attendance ?? "");
    const seats = attendance === "attending" ? Number(body.seats) : 0;
    const guest_names = String(body.guest_names ?? "").trim();
    const message = body.message ? String(body.message).trim() : null;

    if (full_name.length < 2 || full_name.length > 120) return reply({ error: "Please enter your full name." }, 400);
    if (phone.length < 5 || phone.length > 30) return reply({ error: "Please enter a valid contact number." }, 400);
    if (email && (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return reply({ error: "Please check your email address." }, 400);
    if (!["attending", "declined"].includes(attendance)) return reply({ error: "Please choose an attendance response." }, 400);
    if (attendance === "attending" && (!Number.isInteger(seats) || seats < 1 || seats > 10)) return reply({ error: "Choose between 1 and 10 seats." }, 400);
    if (guest_names.length > 1300 || (message && message.length > 1000)) return reply({ error: "One of your answers is too long." }, 400);
    if (attendance === "attending") {
      const attendeeNames = guest_names.split("\n").map((name) => name.trim()).filter(Boolean);
      if (attendeeNames.length !== seats || attendeeNames.some((name) => name.length < 2 || name.length > 120)) {
        return reply({ error: "Please provide the full name of every person. The number of names must match the seats reserved." }, 400);
      }
      if (attendeeNames[0].toLowerCase() !== full_name.toLowerCase()) {
        return reply({ error: "The first attendee name must match the person making the reservation." }, 400);
      }
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return reply({ error: "Server configuration is incomplete." }, 500);

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Flag likely duplicates rather than blocking legitimate guests with shared contact details.
    const { data: possibleDuplicates, error: duplicateError } = await supabase
      .from("rsvps")
      .select("id,full_name,phone,attendance,seats,created_at")
      .ilike("full_name", full_name)
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1);
    if (duplicateError) throw duplicateError;
    if (possibleDuplicates && possibleDuplicates.length) {
      return reply({
        error: "A reservation with this name and contact number may already exist. Please contact the event organizers if you need to update it.",
        possible_duplicate: true
      }, 409);
    }

    const { data, error } = await supabase.from("rsvps").insert({
      full_name, phone, email, affiliation, attendance, seats, guest_names, message
    }).select("id,full_name,attendance,seats,created_at").single();

    if (error) throw error;
    return reply({ success: true, reservation: data });
  } catch (error) {
    console.error("submit-rsvp error", error);
    return reply({ error: "We couldn't save your RSVP. Please try again or contact the event organizers." }, 500);
  }
});
