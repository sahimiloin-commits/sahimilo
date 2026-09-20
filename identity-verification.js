/* global supabase, SAHIMILO_CONFIG */
(()=>{
const db=window.supabase?.createClient(SAHIMILO_CONFIG.supabaseUrl,SAHIMILO_CONFIG.supabasePublishableKey);
const $=id=>document.getElementById(id),allowed=["image/jpeg","image/png","image/webp","application/pdf"],max=5242880;
let user,record;
const labels={not_submitted:"Not submitted",pending:"Pending review",verified:"Verified by SahiMilo",rejected:"Rejected",expired:"Expired"};
function message(text,ok=false){const el=$("identityMessage");el.textContent=text;el.className="notice "+(ok?"notice-ok":"notice-error")}
function render(){
 const status=record?.status||"not_submitted",badge=$("identityStatus");
 badge.textContent=(status==="verified"?"✓ ":"")+labels[status];
 badge.className="identity-status identity-"+status;
 $("identityForm").classList.toggle("hidden",!!record);
 $("identitySubmitted").classList.toggle("hidden",!record);
 $("identitySubmittedText").textContent=record?("ID type: "+record.document_type.replaceAll("_"," ")+" · Submitted: "+new Date(record.submitted_at).toLocaleString("en-IN")):"";
 $("identityReason").textContent=record?.rejection_reason?("Reason: "+record.rejection_reason):"";
 $("identityReset").classList.toggle("hidden",!record||record.status==="verified");
}
async function load(){
 if(!db)return;
 const {data:{session}}=await db.auth.getSession();if(!session)return;
 user=session.user;
 const {data,error}=await db.from("identity_verifications").select("id,document_type,document_paths,status,rejection_reason,submitted_at").eq("user_id",user.id).maybeSingle();
 if(error)return message("Verification status load nahi hua: "+error.message);
 record=data;render();const {data:ownerProfile}=await db.from("user_profiles").select("account_claim_status").eq("id",user.id).maybeSingle();const claimed=ownerProfile?.account_claim_status==="claimed",customerBadge=$("customerClaimStatus"),professionalBadge=$("accountClaimBadge");if(customerBadge){customerBadge.textContent=claimed?"Account claimed":"Account access pending";customerBadge.className="status-badge "+(claimed?"status-approved":"status-pending")}if(professionalBadge){professionalBadge.textContent=(claimed?"✓ ":"○ ")+(claimed?"Account claimed":"Account access pending");professionalBadge.className="trust-badge "+(claimed?"verified":"pending")}
}
function valid(file){if(!file)return true;if(!allowed.includes(file.type)){message("Sirf JPG, PNG, WebP ya PDF upload karein.");return false}if(file.size>max){message("Har file maximum 5 MB honi chahiye.");return false}return true}
async function upload(file,side){
 const ext=(file.name.split(".").pop()||"bin").toLowerCase().replace(/[^a-z0-9]/g,"");
 const path=user.id+"/"+crypto.randomUUID()+"-"+side+"."+ext;
 const {error}=await db.storage.from("identity-documents").upload(path,file,{contentType:file.type,upsert:false});
 if(error)throw error;return path;
}
async function submit(e){
 e.preventDefault();if(record)return;
 const front=$("identityFront").files[0],back=$("identityBack").files[0];
 if(!front)return message("Government ID ka front upload karein.");
 if(!valid(front)||!valid(back))return;
 if(!$("identityConsent").checked)return message("Verification consent confirm karein.");
 const button=$("identitySubmit");button.disabled=true;button.textContent="Uploading securely...";
 const paths=[];
 try{
  paths.push(await upload(front,"front"));if(back)paths.push(await upload(back,"back"));
  const {data,error}=await db.from("identity_verifications").insert({user_id:user.id,account_type:$("identityVerificationSection").dataset.accountType,document_type:$("identityType").value,document_paths:paths,consent_given:true,status:"pending"}).select("id,document_type,document_paths,status,rejection_reason,submitted_at").single();
  if(error)throw error;record=data;render();message("ID securely submit ho gayi. Admin review pending hai.",true);
 }catch(error){if(paths.length)await db.storage.from("identity-documents").remove(paths);message("ID submit nahi hui: "+error.message)}
 finally{button.disabled=false;button.textContent="Submit for Verification"}
}
async function reset(){
 if(!record||record.status==="verified")return;
 if(!confirm("Current submission remove karke nayi ID submit karni hai?"))return;
 const paths=record.document_paths||[];
 const {error}=await db.from("identity_verifications").delete().eq("id",record.id);
 if(error)return message("Submission remove nahi hui: "+error.message);
 if(paths.length)await db.storage.from("identity-documents").remove(paths);
 record=null;$("identityForm").reset();render();message("Ab nayi ID submit kar sakte hain.",true);
}
document.addEventListener("DOMContentLoaded",()=>{if(!$("identityVerificationSection"))return;$("identityForm").addEventListener("submit",submit);$("identityReset").addEventListener("click",reset);$("identityType").addEventListener("change",()=>{$("aadhaarNote").classList.toggle("hidden",$("identityType").value!=="aadhaar")});load()});
})();