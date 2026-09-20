/* global supabase, SAHIMILO_CONFIG */
(()=>{
const db=window.supabase?.createClient(SAHIMILO_CONFIG.supabaseUrl,SAHIMILO_CONFIG.supabasePublishableKey);
document.addEventListener("DOMContentLoaded",async()=>{
 const customer=document.getElementById("customerClaimStatus"),professional=document.getElementById("accountClaimBadge");
 if(!customer&&!professional)return;
 const {data:{session}}=await db.auth.getSession();if(!session)return;
 const {data:profile}=await db.from("user_profiles").select("account_claim_status").eq("id",session.user.id).maybeSingle();
 const claimed=profile?.account_claim_status==="claimed";
 if(customer){customer.textContent=claimed?"Account claimed":"Account access pending";customer.className="status-badge "+(claimed?"status-approved":"status-pending")}
 if(professional){professional.textContent=(claimed?"✓ ":"○ ")+(claimed?"Account claimed":"Account access pending");professional.className="trust-badge "+(claimed?"verified":"pending")}
});
})();