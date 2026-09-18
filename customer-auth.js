/* global supabase, SAHIMILO_CONFIG */
const db=window.supabase?.createClient(SAHIMILO_CONFIG.supabaseUrl,SAHIMILO_CONFIG.supabasePublishableKey),$=id=>document.getElementById(id);
function message(text){$("customerMessage").textContent=text;$("customerMessage").className="notice notice-error"}
$("googleLogin").onclick=async()=>{const button=$("googleLogin");button.disabled=true;const {error}=await db.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+"/customer-auth.html",queryParams:{prompt:"select_account"}}});if(error){button.disabled=false;message(error.message)}};
(async()=>{const {data:{session},error}=await db.auth.getSession();if(error)return message(error.message);if(session)location.replace("customer-dashboard.html")})();