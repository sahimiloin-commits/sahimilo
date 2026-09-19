/* global supabase, SAHIMILO_CONFIG, SAHIMILO_SERVICE_CATALOG */
const db=window.supabase?.createClient(SAHIMILO_CONFIG.supabaseUrl,SAHIMILO_CONFIG.supabasePublishableKey),$=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
let profile=null,user,catalog=Array.isArray(window.SAHIMILO_SERVICE_CATALOG)?window.SAHIMILO_SERVICE_CATALOG:[],selectedServices=[],locations=[];
const sortText=(a,b)=>a.localeCompare(b,"en",{sensitivity:"base"}),unique=values=>[...new Set(values.filter(Boolean))].sort(sortText);
const exact=(value,values)=>values.find(item=>item.localeCompare(value.trim(),"en",{sensitivity:"base"})===0)||"";
const options=values=>values.map(value=>'<option value="'+esc(value)+'"></option>').join("");
function msg(text,ok=false){$("profileMessage").textContent=text;$("profileMessage").className="notice "+(ok?"notice-ok":"notice-error")}
function digits(v){return String(v||"").replace(/\D/g,"")}
function categories(){return unique(catalog.map(row=>row.category))}
function services(category=""){return unique(catalog.filter(row=>!category||row.category===category).map(row=>row.service))}
function renderSelectedServices(){
  $("selectedProfileServices").innerHTML=selectedServices.length?selectedServices.map(service=>'<button class="service-pick active" type="button" data-service="'+esc(service)+'">'+esc(service)+' ×</button>').join(""):'<span class="account-note">Abhi koi service select nahi hai.</span>';
  document.querySelectorAll("#selectedProfileServices [data-service]").forEach(button=>button.onclick=()=>{selectedServices=selectedServices.filter(service=>service!==button.dataset.service);renderSelectedServices()});
}
function refreshProfessionalServices(){
  const category=exact($("profileCategory").value,categories());
  $("profileServiceOptions").innerHTML=options(services(category));
  if(category){selectedServices=selectedServices.filter(service=>services(category).includes(service));renderSelectedServices()}
  $("profileServiceSearch").value="";
  $("profileServiceDescription").textContent=category?"Type karke ya alphabetical list se service add karein.":"Pehle list se valid category chunein.";
}
function describeProfessionalService(){
  const category=exact($("profileCategory").value,categories());
  const service=exact($("profileServiceSearch").value,services(category));
  const row=catalog.find(item=>item.category===category&&item.service===service);
  $("profileServiceDescription").textContent=row?.description||"List se service select karein.";
}
function addProfessionalService(){
  const category=exact($("profileCategory").value,categories());
  if(!category)return msg("List se valid category select karein.");
  const service=exact($("profileServiceSearch").value,services(category));
  if(!service)return msg("List se valid service select karein.");
  if(!selectedServices.includes(service))selectedServices.push(service);
  selectedServices.sort(sortText);renderSelectedServices();$("profileServiceSearch").value="";describeProfessionalService();
}
async function loadLocations(){
  const rows=[];
  for(let from=0;;from+=1000){
    const {data,error}=await db.from("location_directory")
      .select("entity_type,search_name,state,district,block_subdistrict,village,post_office,pincode")
      .eq("active",true).order("search_name").range(from,from+999);
    if(error){msg("Locations load nahi hui: "+error.message);return}
    rows.push(...(data||[]));
    if(!data||data.length<1000)break;
  }
  locations=rows;
  const villages=unique(rows.filter(row=>row.entity_type==="village").map(row=>row.village||row.search_name));
  $("profileVillageOptions").innerHTML=options(villages);
  $("profileBlockOptions").innerHTML=options(unique(rows.map(row=>row.block_subdistrict)));
  $("profileCityOptions").innerHTML=options(unique(rows.flatMap(row=>[row.block_subdistrict,row.district])));
  $("profileDistrictOptions").innerHTML=options(unique(rows.map(row=>row.district)));
  $("profilePincodeOptions").innerHTML=options(unique(rows.map(row=>/^\d{6}$/.test(row.pincode||"")?row.pincode:"")));
}
function applyVillageDetails(){
  const value=$("profileVillage").value.trim();
  const row=locations.find(item=>item.entity_type==="village"&&(item.village||item.search_name).localeCompare(value,"en",{sensitivity:"base"})===0);
  if(!row)return;
  if(row.block_subdistrict)$("profileBlock").value=row.block_subdistrict;
  if(row.district){$("profileDistrict").value=row.district;if(!$("profileCity").value)$("profileCity").value=row.district}
  if(row.state)$("profileState").value=row.state;
  if(row.pincode)$("profilePincode").value=row.pincode;
}
async function loadCatalog(){
  const {data,error}=await db.from("service_catalog").select("category,service,description,sort_order").eq("active",true).order("sort_order");
  if(!error&&data?.length)catalog=data;
  $("profileCategoryOptions").innerHTML=options(categories());
  refreshProfessionalServices();
}
async function init(){
  const {data:{session}}=await db.auth.getSession();if(!session)return location.replace("professional-auth.html");
  user=session.user;$("profileEmail").value=user.email||"";
  await Promise.all([loadCatalog(),loadLocations()]);
  const {data,error}=await db.from("professionals").select("*").eq("user_id",user.id).maybeSingle();if(error)return msg(error.message);
  profile=data||null;fill();$("pageLoading").classList.add("hidden");$("professionalApp").classList.remove("hidden");loadAssigned();
}
function fill(){
  const p=profile||{};$("profileStatus").textContent=p.status||"Not submitted";$("profileStatus").className="status-badge status-"+(p.status||"pending");
  $("profileName").value=p.name||"";$("profileExperience").value=p.experience_years||0;$("profilePhone").value=p.phone||"";$("profileWhatsapp").value=p.whatsapp||"";
  $("profileCategory").value=p.category||"";selectedServices=Array.isArray(p.services)?[...p.services]:[];refreshProfessionalServices();renderSelectedServices();
  $("profileVillage").value=p.village||"";$("profileArea").value=p.area||"";$("profileBlock").value=p.block_name||"";$("profilePincode").value=p.pincode||"";$("profileCity").value=p.city||"";$("profileDistrict").value=p.district||"";$("profileState").value=p.state||"Bihar";$("profileBio").value=p.bio||"";
}
$("profileCategory").addEventListener("input",refreshProfessionalServices);
$("profileCategory").addEventListener("change",refreshProfessionalServices);
$("profileServiceSearch").addEventListener("input",describeProfessionalService);
$("profileServiceSearch").addEventListener("change",describeProfessionalService);
$("addProfileService").onclick=addProfessionalService;
$("profileVillage").addEventListener("change",applyVillageDetails);
$("profileServiceSearch").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();addProfessionalService()}});
$("profileForm").onsubmit=async e=>{
  e.preventDefault();
  const category=exact($("profileCategory").value,categories());
  const village=$("profileVillage").value.trim(),district=$("profileDistrict").value.trim();
  const changes={name:$("profileName").value.trim(),experience_years:Number($("profileExperience").value||0),phone:$("profilePhone").value.trim(),whatsapp:$("profileWhatsapp").value.trim(),category,services:selectedServices,village,area:$("profileArea").value.trim()||village,block_name:$("profileBlock").value.trim(),pincode:$("profilePincode").value.trim(),city:$("profileCity").value.trim()||district,district,state:$("profileState").value.trim(),bio:$("profileBio").value.trim()};
  if(digits(changes.phone).length<10)return msg("Valid mobile number enter karein.");
  if(!changes.category||!changes.services.length||!changes.village||!changes.district||!changes.state)return msg("Category, kam se kam ek service, village, district aur state enter karein.");
  if(!/^\d{6}$/.test(changes.pincode))return msg("Valid 6-digit pincode enter karein.");
  let data,error;if(profile)({data,error}=await db.from("professionals").update(changes).eq("id",profile.id).eq("user_id",user.id).select().single());else({data,error}=await db.from("professionals").insert({...changes,user_id:user.id,status:"pending",verified_mobile:false,verified_whatsapp:false,verified_by_admin:false}).select().single());
  if(error)return msg(error.message);profile=data;fill();msg(profile.status==="pending"?"Profile save ho gayi. Admin approval pending hai.":"Profile details update ho gayi.",true);loadAssigned();
};
async function loadAssigned(){
  if(!profile){$("assignedHistory").innerHTML='<p class="account-note">Profile save karne ke baad assigned customer requests yahan dikhengi.</p>';return}
  const {data,error}=await db.from("service_requests").select("id,category,service,location,description,status,created_at").eq("professional_id",profile.id).order("created_at",{ascending:false});
  if(error){$("assignedHistory").innerHTML="<p>"+esc(error.message)+"</p>";return}
  $("assignedHistory").innerHTML=data?.length?data.map(r=>'<article class="history-card"><div class="history-top"><strong>'+esc(r.service)+'</strong><span class="status-badge">'+esc(r.status)+'</span></div><p>'+esc(r.location)+'</p><p>'+esc(r.description||"No details")+'</p></article>').join(""):'<p class="account-note">Abhi koi customer request assign nahi hui hai.</p>';
}
$("logoutBtn").onclick=async()=>{await db.auth.signOut();location.replace("professional-auth.html")};
init();
