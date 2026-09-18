/* global supabase, SAHIMILO_CONFIG, SAHIMILO_SERVICE_CATALOG */
let catalog=Array.isArray(window.SAHIMILO_SERVICE_CATALOG)?window.SAHIMILO_SERVICE_CATALOG:[];
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
  $("categoryOptions").innerHTML=optionHtml(categories());
  refreshServices();
  $("categorySelect").addEventListener("input",refreshServices);
  $("categorySelect").addEventListener("change",refreshServices);
  $("serviceSelect").addEventListener("input",showServiceDescription);
  $("serviceSelect").addEventListener("change",showServiceDescription);
}
function refreshServices(){
  const category=exact($("categorySelect").value,categories());
  const list=services(category);
  $("serviceOptions").innerHTML=optionHtml(list);
  $("serviceSelect").placeholder=category?"Type ya alphabet se service chunein":"Sabhi services mein type karein";
  showServiceDescription();
}
function showServiceDescription(){
  const category=exact($("categorySelect").value,categories());
  const service=exact($("serviceSelect").value,services(category));
  const row=catalog.find(item=>item.service===service&&(!category||item.category===category));
  $("serviceDescription").textContent=row?.description||"Service select karne par uska description yahan dikhega.";
}
function renderPopularServices(){
  const featured=catalog.filter((row,index)=>index===catalog.findIndex(x=>x.category===row.category)).slice(0,12);
  $("serviceCards").innerHTML=featured.map(row=>'<button class="service-card catalog-card" type="button" data-category="'+esc(row.category)+'" data-service="'+esc(row.service)+'"><div class="service-icon">🛠️</div><h3>'+esc(row.service)+'</h3><p>'+esc(row.description)+'</p><small>'+esc(row.category)+'</small></button>').join("");
  document.querySelectorAll(".catalog-card").forEach(card=>card.onclick=()=>{
    $("categorySelect").value=card.dataset.category;
    refreshServices();
    $("serviceSelect").value=card.dataset.service;
    showServiceDescription();
    document.querySelector(".search-card").scrollIntoView({behavior:"smooth",block:"center"});
  });
}
async function loadCatalog(){
  if(db){
    const {data,error}=await db.from("service_catalog").select("category,service,description,sort_order").eq("active",true).order("sort_order");
    if(!error&&data?.length)catalog=data;
  }
  initCatalogInputs();
  renderPopularServices();
}
async function searchProfessionals(){
  if(!db)return alert("Supabase configuration missing hai.");
  const rawCategory=$("categorySelect").value.trim(),rawService=$("serviceSelect").value.trim();
  const category=exact(rawCategory,categories()),service=exact(rawService,services(category));
  if(rawCategory&&!category)return alert("List se valid category select karein.");
  if(rawService&&!service)return alert("List se valid service select karein.");
  const location=$("locationInput").value.trim();
  let q=db.from("professionals").select("id,name,phone,whatsapp,category,services,area,city,pincode,experience_years,bio,rating,reviews_count,status,verified_by_admin").eq("status","approved").eq("verified_by_admin",true).order("rating",{ascending:false}).limit(30);
  if(category)q=q.eq("category",category);if(service)q=q.contains("services",[service]);if(location){const safe=location.replace(/[%_,()]/g,"");q=q.or("area.ilike.%"+safe+"%,city.ilike.%"+safe+"%,pincode.eq."+safe)}
  const {data,error}=await q;if(error)return alert("Profiles load nahi ho paaye: "+error.message);
  $("results").classList.remove("hidden");$("resultSummary").textContent=(data?.length||0)+" approved professional mile.";
  $("noResults").classList.toggle("hidden",!!data?.length);
  $("resultsGrid").innerHTML=(data||[]).map(p=>'<article class="professional-card"><div class="pro-head"><div class="avatar">'+esc((p.name||"P").slice(0,1).toUpperCase())+'</div><div><div class="pro-name">'+esc(p.name)+'</div><div class="pro-service">✓ SahiMilo approved · '+esc(p.category)+'</div></div></div><div class="rating">⭐ '+Number(p.rating||0).toFixed(1)+" · "+(p.experience_years||0)+' yrs exp.</div><div class="pro-meta"><span>📍 '+esc([p.area,p.city,p.pincode].filter(Boolean).join(", "))+'</span><span>🛠️ '+esc((p.services||[]).join(", "))+'</span><span>'+esc(p.bio||"")+'</span></div><a class="primary-btn call-btn" href="tel:'+esc(normalPhone(p.phone))+'">📞 Call professional</a><a class="secondary-btn call-btn" target="_blank" rel="noopener" href="https://wa.me/'+digits(p.whatsapp||p.phone)+'">WhatsApp</a></article>').join("");
  $("results").scrollIntoView({behavior:"smooth"});
}
$("findBtn").onclick=searchProfessionals;
$("resetBtn").onclick=()=>$("results").classList.add("hidden");
$("year").textContent=new Date().getFullYear();
loadCatalog();
