require("dotenv").config();
const supabase = require("./supabaseClient");

async function check() {
  const s = await supabase.from("sessions").select("*").limit(1);
  console.log("Sessions:", s.data?.[0] ? Object.keys(s.data[0]) : s.error);
  
  const a = await supabase.from("attendance").select("*").limit(1);
  console.log("Attendance:", a.data?.[0] ? Object.keys(a.data[0]) : a.error);
}
check();
