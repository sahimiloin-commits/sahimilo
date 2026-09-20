/* global supabase, SAHIMILO_CONFIG, SAHIMILO_SERVICE_CATALOG */
let catalog=Array.isArray(window.SAHIMILO_SERVICE_CATALOG)?window.SAHIMILO_SERVICE_CATALOG:[],locations=[],selectedServices=[];
const cfg=window.SAHIMILO_CONFIG||{},db=window.supabase?.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
const $=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const digits=v=>String(v||"").replace(/\D/g,""),normalPhone=v=>{let p=digits(v);if(p.length===10)p="91"+p;return "+"+p};
const sortText=(a,b)=>a.localeCompare(b,"en",{sensitivity:"base"});
const unique=values=>[...new Set(values.filter(Boolean))].sort(sortText);
const optionHtml=values=>values.map(value=>'<option value="'+esc(value)+'"></option>').join("");
const exact=(value,values)=>values.find(item=>item.localeCompare(value.trim(),"en",{sensitivity:"base"})===0)||"";

function categories(){return unique(catalog.map(row=>row.category))}
function services(category=""){return unique(catalog.filter(row=>!category||row.category===category).map(row=>row.service))}
function initCatalogInputs(){
  refreshServices();
  $("serviceSelect").addEventListener("input",showServiceDescription);
  $("serviceSelect").addEventListener("change",showServiceDescription);
  $("addElectricalWork").addEventListener("click",addElectricalWork);
  $("serviceSelect").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();addElectricalWork()}});
  renderSelectedElectricalWorks();
}
function refreshServices(){
  $("serviceOptions").innerHTML=optionHtml(services());
  $("serviceSelect").placeholder="Select karein ya electrical work type karein";
  showServiceDescription();
}
function showServiceDescription(){
  const service=exact($("serviceSelect").value,services());
  const row=catalog.find(item=>item.service===service);
  $("serviceDescription").textContent=row?.description||"List se select karein ya electrical work manually type karein.";
}
function renderPopularServices(){
  const featured=catalog.slice(0,12);
  $("serviceCards").innerHTML=featured.map(row=>'<button class="service-card catalog-card" type="button" data-category="'+esc(row.category)+'" data-service="'+esc(row.service)+'"><div class="service-icon">🛠️</div><h3>'+esc(row.service)+'</h3><p>'+esc(row.description)+'</p><small>'+esc(row.category)+'</small></button>').join("");
  document.querySelectorAll(".catalog-card").forEach(card=>card.onclick=()=>{
    $("serviceSelect").value=card.dataset.service;
    addElectricalWork();
    document.querySelector(".search-card").scrollIntoView({behavior:"smooth",block:"center"});
  });
}
function renderSelectedElectricalWorks(){
  $("selectedElectricalWorks").innerHTML=selectedServices.length?selectedServices.map(service=>'<button type="button" class="service-pick active" data-electrical-work="'+esc(service)+'">'+esc(service)+' ×</button>').join(""):'<span class="account-note">Abhi koi electrical work add nahi hai.</span>';
  document.querySelectorAll("[data-electrical-work]").forEach(button=>button.onclick=()=>{selectedServices=selectedServices.filter(service=>service!==button.dataset.electricalWork);renderSelectedElectricalWorks()});
}
function addElectricalWork(){
  const raw=$("serviceSelect").value.trim().replace(/\s+/g," ");
  if(raw.length<2||raw.length>80)return alert("Valid electrical work enter karein.");
  const service=exact(raw,services())||raw;
  if(!selectedServices.some(item=>item.toLowerCase()===service.toLowerCase()))selectedServices.push(service);
  selectedServices.sort(sortText);$("serviceSelect").value="";showServiceDescription();renderSelectedElectricalWorks();
}
async function loadLocations(){
  locations=[{block_subdistrict:"Sitamarhi Town",search_name:"Sitamarhi Town"},{block_subdistrict:"Dumra",search_name:"Dumra"}];
  $("locationOptions").innerHTML=['Sitamarhi Town — City','Dumra — City'].map(value=>'<option value="'+esc(value)+'"></option>').join("");
}
const nawadihAliases=["Nawadih","Nauwadih","Nauwadhih"];
function locationTerms(value){
  const cleaned=value.trim();
  return nawadihAliases.some(alias=>alias.localeCompare(cleaned,"en",{sensitivity:"base"})===0)
    ?nawadihAliases:[cleaned];
}
function selectedLocation(value){
  const cleaned=value.trim();
  return locations.find(row=>row.search_name.localeCompare(cleaned,"en",{sensitivity:"base"})===0)
    ||locations.find(row=>row.pincode===cleaned)||null;
}
async function loadCatalog(){
  if(db){const [{data:master},{data:custom}]=await Promise.all([db.from("service_catalog").select("category,service,description,sort_order").eq("active",true).order("sort_order"),db.from("professional_service_catalog").select("category,service,description").eq("active",true).order("service")]);const merged=[...(master||[]),...(custom||[])];if(merged.length)catalog=merged.filter((row,i,all)=>i===all.findIndex(x=>x.service.toLowerCase()===row.service.toLowerCase()))}
  initCatalogInputs();renderPopularServices();
}
function parseLocationQuery(raw){
  const cleaned=raw.trim(),parts=cleaned.split(/\s+—\s+/);if(parts.length===2)return{name:parts[0].trim(),type:parts[1].trim()};
  if(/^\d{6}$/.test(cleaned))return{name:cleaned,type:"PIN Code"};
  const same=v=>String(v||"").localeCompare(cleaned,"en",{sensitivity:"base"})===0;
  if(locations.some(r=>same(r.district)))return{name:cleaned,type:"District"};
  if(locations.some(r=>same(r.block_subdistrict)))return{name:cleaned,type:"City"};
  if(locations.some(r=>same(r.village)||same(r.search_name)))return{name:cleaned,type:"Village"};
  return null;
}
async function searchProfessionals(){
  if(!db)return alert("Supabase configuration missing hai.");
  if($("serviceSelect").value.trim())addElectricalWork();if(!selectedServices.length)return alert("Kam se kam ek electrical work add karein.");
  const location=parseLocationQuery($("locationInput").value);if(!location)return alert("List se Village, City, District ya PIN Code select karein.");
  let query=db.from("professionals").select("id,user_id,name,phone,whatsapp,services,service_villages,service_cities,service_districts,service_pincodes,experience_years,bio,photo_url,rating,reviews_count,status,verified_mobile,verified_whatsapp,verified_by_admin").eq("status","approved").eq("verified_by_admin",true).order("rating",{ascending:false}).limit(100);
  let {data,error}=await query;if(error)return alert("Profiles load nahi ho paaye: "+error.message);const userIds=[...new Set((data||[]).map(p=>p.user_id).filter(Boolean))];let verifiedIds=new Set();if(userIds.length){const {data:badges}=await db.from("identity_badges").select("user_id").eq("verified",true).in("user_id",userIds);verifiedIds=new Set((badges||[]).map(x=>x.user_id))}(data||[]).forEach(p=>p.identity_verified=verifiedIds.has(p.user_id));
  const field={Village:"service_villages",City:"service_cities",District:"service_districts","PIN Code":"service_pincodes"}[location.type],needle=location.name.toLowerCase();
  data=(data||[]).filter(p=>(p[field]||[]).some(v=>String(v).trim().toLowerCase()===needle));
  const wanted=selectedServices.map(service=>service.toLowerCase());data=data.filter(p=>(p.services||[]).some(service=>wanted.includes(String(service).toLowerCase())));
  const coverage=p=>[...(p.service_villages||[]),...(p.service_cities||[]),...(p.service_districts||[]),...(p.service_pincodes||[])].join(", ");
  const photo=p=>p.photo_url?'<img class="avatar-photo" src="'+esc(p.photo_url)+'" alt="'+esc(p.name)+' profile photo" loading="lazy">':esc((p.name||"P").slice(0,1).toUpperCase());
  const badges=p=>[p.identity_verified?'<span class="public-trust-badge verified">✓ ID Verified by SahiMilo</span>':'',p.verified_mobile?'<span class="public-trust-badge">✓ Mobile</span>':'',p.verified_whatsapp?'<span class="public-trust-badge">✓ WhatsApp</span>':''].filter(Boolean).join("");
  const rating=p=>Number(p.reviews_count||0)>0?'⭐ '+Number(p.rating||0).toFixed(1)+' · '+Number(p.reviews_count)+' review'+(Number(p.reviews_count)===1?'':'s'):'☆ New professional · No ratings yet';
  $("results").classList.remove("hidden");$("resultSummary").textContent=(data?.length||0)+" approved electrician mile.";$("noResults").classList.toggle("hidden",!!data?.length);
  $("resultsGrid").innerHTML=data.map(p=>'<article class="professional-card"><div class="pro-head"><div class="avatar">'+photo(p)+'</div><div><div class="pro-name">'+esc(p.name)+'</div><div class="public-trust-badges">'+badges(p)+'</div></div></div><div class="rating">'+rating(p)+' · '+(p.experience_years||0)+' yrs exp.</div><div class="pro-meta"><span>📍 '+esc(coverage(p))+'</span><span>🛠️ '+esc((p.services||[]).join(", "))+'</span><span>'+esc(p.bio||"")+'</span></div><a class="primary-btn call-btn" href="tel:'+esc(normalPhone(p.phone))+'">📞 Call professional</a><a class="secondary-btn call-btn" target="_blank" rel="noopener" href="https://wa.me/'+digits(p.whatsapp||p.phone)+'"><img class="whatsapp-logo" src="whatsapp-logo.svg" alt="" aria-hidden="true"> WhatsApp</a></article>').join("");
  $("results").scrollIntoView({behavior:"smooth"});
}
$("findBtn").onclick=searchProfessionals;
$("resetBtn").onclick=()=>{$("results").classList.add("hidden");selectedServices=[];renderSelectedElectricalWorks()};
$("year").textContent=new Date().getFullYear();
Promise.all([loadCatalog(),loadLocations()]);
