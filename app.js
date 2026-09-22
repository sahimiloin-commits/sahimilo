/* global supabase, SAHIMILO_CONFIG, SAHIMILO_SERVICE_CATALOG */
let catalog=Array.isArray(window.SAHIMILO_SERVICE_CATALOG)?window.SAHIMILO_SERVICE_CATALOG:[],locations=[];
const PILOT_CATEGORIES=["Electrician","Plumber","AC Technician","Home Painter","CCTV Technician"];
const CATEGORY_ALIASES={"Electrician":["electrician","electric","electrical","wiring","switch","socket","mcb","fan","light","inverter"],"Plumber":["plumber","plumbing","pipe","tap","nal","leak","leakage","toilet","bathroom"],"AC Technician":["ac","ac technician","ac repair","ac service","air conditioner","cooling"],"Home Painter":["home painter","painter","painting","paint","putty","whitewash","colour","color"],"CCTV Technician":["cctv","cctv technician","camera","security camera","surveillance"]};
const cfg=window.SAHIMILO_CONFIG||{},db=window.supabase?.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
const $=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const digits=v=>String(v||"").replace(/\D/g,""),normalPhone=v=>{let p=digits(v);if(p.length===10)p="91"+p;return "+"+p};
const sortText=(a,b)=>a.localeCompare(b,"en",{sensitivity:"base"});
const unique=values=>[...new Set(values.filter(Boolean))].sort(sortText);
const optionHtml=values=>values.map(value=>'<option value="'+esc(value)+'"></option>').join("");
const exact=(value,values)=>values.find(item=>item.localeCompare(value.trim(),"en",{sensitivity:"base"})===0)||"";

function categories(){return PILOT_CATEGORIES}
function matchCategory(value){const q=value.trim().toLowerCase();if(!q)return "";return PILOT_CATEGORIES.find(x=>x.toLowerCase()===q)||PILOT_CATEGORIES.find(x=>CATEGORY_ALIASES[x].some(k=>k.includes(q)||q.includes(k)))||""}
function suggestCategories(){const q=$("serviceSelect").value.trim().toLowerCase();const matches=!q?PILOT_CATEGORIES:PILOT_CATEGORIES.filter(category=>category.toLowerCase().includes(q)||CATEGORY_ALIASES[category].some(keyword=>keyword.includes(q)||q.includes(keyword)));$("serviceOptions").innerHTML=optionHtml(matches)}
function initCatalogInputs(){
  $("serviceOptions").innerHTML=optionHtml(categories());
  $("serviceSelect").addEventListener("input",suggestCategories);
  $("serviceSelect").addEventListener("change",()=>{const category=matchCategory($("serviceSelect").value);if(category)$("serviceSelect").value=category});
}
function renderPopularServices(){
  const descriptions={"Electrician":"Wiring, switch, socket, MCB, fan aur electrical repair.","Plumber":"Pipe, tap, leakage, bathroom aur water-line work.","AC Technician":"AC service, repair, installation aur cooling issue.","Home Painter":"Interior-exterior painting, putty aur wall finishing.","CCTV Technician":"CCTV installation, repair aur mobile viewing setup."};
  const featured=PILOT_CATEGORIES.map(category=>({category,service:category,description:descriptions[category]}));
  $("serviceCards").innerHTML=featured.map(row=>'<button class="service-card catalog-card" type="button" data-category="'+esc(row.category)+'" data-service="'+esc(row.service)+'"><div class="service-icon">🛠️</div><h3>'+esc(row.service)+'</h3><p>'+esc(row.description)+'</p><small>'+esc(row.category)+'</small></button>').join("");
  document.querySelectorAll(".catalog-card").forEach(card=>card.onclick=()=>{
    $("serviceSelect").value=card.dataset.category;
    document.querySelector(".search-card").scrollIntoView({behavior:"smooth",block:"center"});
  });
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
  if(db){const [{data:master},{data:custom}]=await Promise.all([db.from("service_catalog").select("category,service,description,sort_order").eq("active",true).in("category",PILOT_CATEGORIES).order("sort_order"),db.from("professional_service_catalog").select("category,service,description").eq("active",true).in("category",PILOT_CATEGORIES).order("service")]);const merged=[...(master||[]),...(custom||[])];if(merged.length)catalog=merged}
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
  const category=matchCategory($("serviceSelect").value);if(!category)return alert("Dropdown se valid service category select karein.");$("serviceSelect").value=category;
  const location=parseLocationQuery($("locationInput").value);if(!location)return alert("List se Village, City, District ya PIN Code select karein.");
  let query=db.from("professionals").select("id,user_id,name,phone,whatsapp,category,services,service_villages,service_cities,service_districts,service_pincodes,experience_years,bio,photo_url,rating,reviews_count,status,verified_mobile,verified_whatsapp,verified_by_admin,availability_status,availability_updated_at").eq("status","approved").eq("verified_by_admin",true).eq("category",category).order("rating",{ascending:false}).limit(100);
  let {data,error}=await query;if(error)return alert("Profiles load nahi ho paaye: "+error.message);const userIds=[...new Set((data||[]).map(p=>p.user_id).filter(Boolean))];let verifiedIds=new Set();if(userIds.length){const {data:badges}=await db.from("identity_badges").select("user_id").eq("verified",true).in("user_id",userIds);verifiedIds=new Set((badges||[]).map(x=>x.user_id))}(data||[]).forEach(p=>p.identity_verified=verifiedIds.has(p.user_id));
  const field={Village:"service_villages",City:"service_cities",District:"service_districts","PIN Code":"service_pincodes"}[location.type],needle=location.name.toLowerCase();
  data=(data||[]).filter(p=>(p[field]||[]).some(v=>String(v).trim().toLowerCase()===needle));
  const priority={available_today:0,available_tomorrow:1,currently_busy:2,temporarily_unavailable:3};data=data.filter(p=>p.availability_status!=="temporarily_unavailable").sort((a,b)=>(priority[a.availability_status]??3)-(priority[b.availability_status]??3)||Number(b.rating||0)-Number(a.rating||0));
  const coverage=p=>[...(p.service_villages||[]),...(p.service_cities||[]),...(p.service_districts||[]),...(p.service_pincodes||[])].join(", ");
  const photo=p=>p.photo_url?'<img class="avatar-photo" src="'+esc(p.photo_url)+'" alt="'+esc(p.name)+' profile photo" loading="lazy">':esc((p.name||"P").slice(0,1).toUpperCase());
  const badges=p=>[p.identity_verified?'<span class="public-trust-badge verified">✓ ID Verified by SahiMilo</span>':'',p.verified_mobile?'<span class="public-trust-badge">✓ Mobile</span>':'',p.verified_whatsapp?'<span class="public-trust-badge">✓ WhatsApp</span>':''].filter(Boolean).join("");
  const availabilityLabels={available_today:"● Available today",available_tomorrow:"◷ Available tomorrow",currently_busy:"● Currently busy",temporarily_unavailable:"Temporarily unavailable"};const availability=p=>'<span class="status-badge status-'+(p.availability_status==="available_today"?"approved":"pending")+'">'+esc(availabilityLabels[p.availability_status]||"Availability not updated")+'</span>';const rating=p=>Number(p.reviews_count||0)>0?'⭐ '+Number(p.rating||0).toFixed(1)+' · '+Number(p.reviews_count)+' review'+(Number(p.reviews_count)===1?'':'s'):'☆ New professional · No ratings yet';
  $("results").classList.remove("hidden");$("resultSummary").textContent=(data?.length||0)+" approved "+category.toLowerCase()+" mile.";$("noResults").classList.toggle("hidden",!!data?.length);
  $("resultsGrid").innerHTML=data.map(p=>'<article class="professional-card"><div class="pro-head"><div class="avatar">'+photo(p)+'</div><div><div class="pro-name">'+esc(p.name)+'</div><div class="public-trust-badges">'+badges(p)+'</div></div></div><div class="rating">'+rating(p)+' · '+(p.experience_years||0)+' yrs exp.</div><div class="pro-meta"><span>📍 '+esc(coverage(p))+'</span><span>🛠️ '+esc((p.services||[]).join(", "))+'</span><span>'+esc(p.bio||"")+'</span></div><a class="primary-btn call-btn" href="tel:'+esc(normalPhone(p.phone))+'">📞 Call professional</a><a class="secondary-btn call-btn" target="_blank" rel="noopener" href="https://wa.me/'+digits(p.whatsapp||p.phone)+'"><img class="whatsapp-logo" src="whatsapp-logo.svg" alt="" aria-hidden="true"> WhatsApp</a></article>').join("");
  $("results").scrollIntoView({behavior:"smooth"});
}
$("findBtn").onclick=searchProfessionals;
$("resetBtn").onclick=()=>{$("results").classList.add("hidden");$("serviceSelect").value=""};
$("year").textContent=new Date().getFullYear();
Promise.all([loadCatalog(),loadLocations()]);
