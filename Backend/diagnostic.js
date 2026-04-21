require("dotenv").config();
const supabase = require("./supabaseClient");
console.log("URL from ENV:", process.env.VITE_SUPABASE_URL);

async function check() {
  try {
    const { data, error } = await supabase.from("users").select("*").limit(1);
    console.log("Data:", data, "Error:", error);
  } catch (err) {
    console.error("Fetch threw an exception:", err);
  }
}
check();
