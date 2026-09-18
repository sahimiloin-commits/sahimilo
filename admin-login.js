/* global supabase, SAHIMILO_CONFIG */
const cfg=window.SAHIMILO_CONFIG||{};
const db=window.supabase?.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
const form=document.getElementById("adminLoginForm");
const email=document.getElementById("adminEmail");
const password=document.getElementById("adminPassword");
const button=document.getElementById("adminLoginBtn");
const message=document.getElementById("adminMessage");

function showMessage(text){
  message.textContent=text;
  message.className="notice notice-error";
}

async function isAdmin(userId){
  const {data,error}=await db.from("user_profiles").select("role").eq("id",userId).maybeSingle();
  return !error&&data?.role==="admin";
}

async function redirectExistingAdmin(){
  if(!db)return showMessage("Supabase configuration missing hai.");
  const {data:{session}}=await db.auth.getSession();
  if(session&&await isAdmin(session.user.id))location.replace("admin-dashboard.html");
}

form.addEventListener("submit",async event=>{
  event.preventDefault();
  if(!db)return showMessage("Supabase configuration missing hai.");
  message.classList.add("hidden");
  button.disabled=true;
  button.textContent="Logging in...";
  const {data,error}=await db.auth.signInWithPassword({email:email.value.trim(),password:password.value});
  if(error){
    button.disabled=false;
    button.textContent="Login to Dashboard";
    return showMessage(error.message);
  }
  if(!await isAdmin(data.user.id)){
    await db.auth.signOut();
    button.disabled=false;
    button.textContent="Login to Dashboard";
    return showMessage("Yeh account SahiMilo admin nahi hai.");
  }
  location.replace("admin-dashboard.html");
});

redirectExistingAdmin();