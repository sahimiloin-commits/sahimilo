/* global supabase, SAHIMILO_CONFIG */
(()=>{
const db=window.supabase?.createClient(SAHIMILO_CONFIG.supabaseUrl,SAHIMILO_CONFIG.supabasePublishableKey),$=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
let session,items=[],profiles={};
function note(text,ok=false){const el=$("identityAdminMessage");el.textContent=text;el.className="notice "+(ok?"notice-ok":"notice-error")}
async function load(){
 const s=await db.auth.getSession();session=s.data.session;if(!session)return;
 const {data,error}=await db.from("identity_verifications").select("id,user_id,account_type,document_type,document_paths,status,rejection_reason,submitted_at,reviewed_at").order("submitted_at",{ascending:false});
 if(error)return note("ID verifications load nahi hui: "+error.message);
 items=data||[];const ids=[...new Set(items.map(x=>x.user_id))];
 if(ids.length){const {data:p}=await db.from("user_profiles").select("id,display_name,phone,role").in("id",ids);profiles=Object.fromEntries((p||[]).map(x=>[x.id,x]))}
 render();
}
function render(){
 $("identityAdminCount").textContent=items.filter(x=>x.status==="pending").length+" pending";
 $("identityAdminList").innerHTML=items.length?items.map(x=>{const p=profiles[x.user_id]||{};return '<article class="history-card"><div class="history-top"><div><strong>'+esc(p.display_name||"Account holder")+'</strong><p>'+esc(x.account_type)+" · "+esc(x.document_type.replaceAll("_"," "))+" · "+esc(p.phone||"No phone")+'</p></div><span class="identity-status identity-'+esc(x.status)+'">'+esc(x.status)+'</span></div><p>Submitted: '+esc(new Date(x.submitted_at).toLocaleString("en-IN"))+'</p>'+(x.rejection_reason?'<p>Reason: '+esc(x.rejection_reason)+'</p>':'')+'<div class="admin-actions"><button class="admin-action" data-id-view="'+esc(x.id)+'">View ID</button><button class="admin-action" data-id-approve="'+esc(x.id)+'">Verify</button><button class="admin-action admin-delete" data-id-reject="'+esc(x.id)+'">Reject</button></div></article>'}).join(""):'<p class="account-note">No identity submissions yet.</p>';
}
async function view(id){
 const item=items.find(x=>x.id===id);if(!item)return;
 for(const path of item.document_paths){const {data,error}=await db.storage.from("identity-documents").createSignedUrl(path,300);if(error)return note("Document open nahi hua: "+error.message);window.open(data.signedUrl,"_blank","noopener")}
}
async function review(id,status){
 const item=items.find(x=>x.id===id);if(!item)return;
 let reason=null;if(status==="rejected"){reason=prompt("Rejection reason likhein:");if(!reason?.trim())return}
 if(status==="verified"&&!confirm("ID document dekh kar details match hone ki confirmation dete hain?"))return;
 const {error}=await db.from("identity_verifications").update({status,rejection_reason:reason,reviewed_at:new Date().toISOString(),reviewed_by:session.user.id}).eq("id",id);
 if(error)return note("Review update nahi hua: "+error.message);note(status==="verified"?"Account identity verified.":"Submission rejected.",true);await load();
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-id-view],[data-id-approve],[data-id-reject]");if(!b)return;if(b.dataset.idView)view(b.dataset.idView);if(b.dataset.idApprove)review(b.dataset.idApprove,"verified");if(b.dataset.idReject)review(b.dataset.idReject,"rejected")});
document.addEventListener("DOMContentLoaded",()=>{if($("identityAdminList"))load()});
})();