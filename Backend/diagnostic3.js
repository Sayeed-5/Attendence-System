require("dotenv").config();
const supabase = require("./supabaseClient");

async function check() {
  const { data: sessionData } = await supabase.from("sessions").select("id").limit(1);
  if (!sessionData || sessionData.length === 0) return console.log("No sessions");
  
  const sid = sessionData[0].id;
  const res = await supabase.from("sessions").update({ is_active: false }).eq("id", sid).select();
  console.log("Update output:", res.data, "Error:", res.error);
}
check();
