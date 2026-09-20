/* global supabase, SAHIMILO_CONFIG, SAHIMILO_SERVICE_CATALOG */
let catalog=Array.isArray(window.SAHIMILO_SERVICE_CATALOG)?window.SAHIMILO_SERVICE_CATALOG:[],locations=[];
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
}
function refreshServices(){
  $("serviceOptions").innerHTML=optionHtml(services());
  $("serviceSelect").placeholder="Type ya alphabet se service chunein";
  showServiceDescription();
}
function showServiceDescription(){
  const service=exact($("serviceSelect").value,services());
  const row=catalog.find(item=>item.service===service);
  $("serviceDescription").textContent=row?.description||"Service type karein ya alphabetical list se chunein.";
}
function renderPopularServices(){
  const featured=catalog.filter((row,index)=>index===catalog.findIndex(x=>x.category===row.category)).slice(0,12);
  $("serviceCards").innerHTML=featured.map(row=>'<button class="service-card catalog-card" type="button" data-category="'+esc(row.category)+'" data-service="'+esc(row.service)+'"><div class="service-icon">🛠️</div><h3>'+esc(row.service)+'</h3><p>'+esc(row.description)+'</p><small>'+esc(row.category)+'</small></button>').join("");
  document.querySelectorAll(".catalog-card").forEach(card=>card.onclick=()=>{
    $("serviceSelect").value=card.dataset.service;
    showServiceDescription();
    document.querySelector(".search-card").scrollIntoView({behavior:"smooth",block:"center"});
  });
}
async function loadLocations(){
  if(!db)return;const rows=[];
  for(let from=0;;from+=1000){const {data,error}=await db.from("location_directory").select("entity_type,search_name,state,district,block_subdistrict,village,pincode").eq("active",true).order("search_name").range(from,from+999);if(error){console.warn("Location directory load failed:",error.message);break}rows.push(...(data||[]));if(!data||data.length<1000)break}
  locations=rows;const map=new Map(),add=(name,type)=>{if(name){const value=String(name).trim()+" — "+type;map.set(value.toLowerCase(),value)}};
  rows.forEach(r=>{if(r.entity_type==="village")add(r.village||r.search_name,"Village");add(r.block_subdistrict,"City");add(r.district,"District");if(/^\d{6}$/.test(r.pincode||""))add(r.pincode,"PIN Code")});
  $("locationOptions").innerHTML=[...map.values()].sort(sortText).map(value=>'<option value="'+esc(value)+'"></option>').join("");
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
  if(db){
    const {data,error}=await db.from("service_catalog").select("category,service,description,sort_order").eq("active",true).order("sort_order");
    if(!error&&data?.length)catalog=data;
  }
  initCatalogInputs();
  renderPopularServices();
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
  const rawService=$("serviceSelect").value.trim(),service=exact(rawService,services());if(rawService&&!service)return alert("List se valid service select karein.");
  const location=parseLocationQuery($("locationInput").value);if(!location)return alert("List se Village, City, District ya PIN Code select karein.");
  let query=db.from("professionals").select("id,name,phone,whatsapp,services,service_villages,service_cities,service_districts,service_pincodes,experience_years,bio,rating,reviews_count,status,verified_by_admin").eq("status","approved").eq("verified_by_admin",true).order("rating",{ascending:false}).limit(100);if(service)query=query.contains("services",[service]);
  let {data,error}=await query;if(error)return alert("Profiles load nahi ho paaye: "+error.message);
  const field={Village:"service_villages",City:"service_cities",District:"service_districts","PIN Code":"service_pincodes"}[location.type],needle=location.name.toLowerCase();
  data=(data||[]).filter(p=>(p[field]||[]).some(v=>String(v).trim().toLowerCase()===needle));
  const coverage=p=>[...(p.service_villages||[]),...(p.service_cities||[]),...(p.service_districts||[]),...(p.service_pincodes||[])].join(", ");
  $("results").classList.remove("hidden");$("resultSummary").textContent=(data?.length||0)+" approved professional mile.";$("noResults").classList.toggle("hidden",!!data?.length);
  $("resultsGrid").innerHTML=data.map(p=>'<article class="professional-card"><div class="pro-head"><div class="avatar">'+esc((p.name||"P").slice(0,1).toUpperCase())+'</div><div><div class="pro-name">'+esc(p.name)+'</div><div class="pro-service">✓ SahiMilo approved</div></div></div><div class="rating">⭐ '+Number(p.rating||0).toFixed(1)+" · "+(p.experience_years||0)+' yrs exp.</div><div class="pro-meta"><span>📍 '+esc(coverage(p))+'</span><span>🛠️ '+esc((p.services||[]).join(", "))+'</span><span>'+esc(p.bio||"")+'</span></div><a class="primary-btn call-btn" href="tel:'+esc(normalPhone(p.phone))+'">📞 Call professional</a><a class="secondary-btn call-btn" target="_blank" rel="noopener" href="https://wa.me/'+digits(p.whatsapp||p.phone)+'">WhatsApp</a></article>').join("");
  $("results").scrollIntoView({behavior:"smooth"});
}
$("findBtn").onclick=searchProfessionals;
$("resetBtn").onclick=()=>$("results").classList.add("hidden");
$("year").textContent=new Date().getFullYear();
Promise.all([loadCatalog(),loadLocations()]);
