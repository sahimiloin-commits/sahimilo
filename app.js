/* global supabase, SAHIMILO_CONFIG */
const CATEGORIES={
"Home Repair":["Electrician","Plumber","Carpenter","Painter","AC Repair","RO Repair"],
"Construction & Labour":["Mason","Welder","Tile Worker","Labour","Contractor"],
"Electronics & Appliances":["Mobile Repair","TV Repair","Fridge Repair","Computer Repair","Inverter Repair"],
"Auto & Vehicle":["Bike Mechanic","Car Mechanic","Tyre Service","Auto Repair","Vehicle Wash"],
"Agriculture":["Farm Labour","Tractor Service","Irrigation","Pesticide Spraying","Harvester"],
"Beauty & Personal Care":["Barber","Salon","Makeup Artist","Mehndi Artist","Beautician"],
"Education":["Home Tutor","English Tutor","Computer Training","Exam Coaching","Music Teacher"],
"Events & Functions":["Catering","Tent House","DJ","Photography","Decorator"],
"Health & Care":["Home Nurse","Physiotherapist","Lab Technician","Caregiver","Ambulance"],
"Business Services":["Accountant","Printing","Data Entry","Digital Marketing","Legal Help"]
};
const cfg=window.SAHIMILO_CONFIG||{},db=window.supabase?.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
const $=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const digits=v=>String(v||"").replace(/\D/g,""),normalPhone=v=>{let p=digits(v);if(p.length===10)p="91"+p;return "+"+p};
function msg(id,text,ok=false){const el=$(id);el.textContent=text;el.className="notice "+(ok?"notice-ok":"notice-error")}
function initCategories(){Object.keys(CATEGORIES).forEach(c=>$("categorySelect").insertAdjacentHTML("beforeend",'<option value="'+esc(c)+'">'+esc(c)+"</option>"))}
function searchServiceOptions(){const c=$("categorySelect").value,s=$("serviceSelect");s.disabled=!c;s.innerHTML=c?'<option value="">Service select karein</option>'+CATEGORIES[c].map(x=>"<option>"+esc(x)+"</option>").join(""):'<option value="">Pehle category select karein</option>'}
async function searchProfessionals(){
 if(!db)return alert("Supabase configuration missing hai.");
 const category=$("categorySelect").value,service=$("serviceSelect").value,location=$("locationInput").value.trim();
 let q=db.from("professionals").select("id,name,phone,whatsapp,category,services,area,city,pincode,experience_years,bio,rating,reviews_count,status,verified_by_admin").eq("status","approved").eq("verified_by_admin",true).order("rating",{ascending:false}).limit(30);
 if(category)q=q.eq("category",category);if(service)q=q.contains("services",[service]);if(location){const safe=location.replace(/[%_,()]/g,"");q=q.or("area.ilike.%"+safe+"%,city.ilike.%"+safe+"%,pincode.eq."+safe)}
 const {data,error}=await q;if(error)return alert("Profiles load nahi ho paaye: "+error.message);
 $("results").classList.remove("hidden");$("resultSummary").textContent=(data?.length||0)+" approved professional mile.";
 $("noResults").classList.toggle("hidden",!!data?.length);
 $("resultsGrid").innerHTML=(data||[]).map(p=>'<article class="professional-card"><div class="pro-head"><div class="avatar">'+esc((p.name||"P").slice(0,1).toUpperCase())+'</div><div><div class="pro-name">'+esc(p.name)+'</div><div class="pro-service">✓ SahiMilo approved · '+esc(p.category)+'</div></div></div><div class="rating">⭐ '+Number(p.rating||0).toFixed(1)+" · "+(p.experience_years||0)+' yrs exp.</div><div class="pro-meta"><span>📍 '+esc([p.area,p.city,p.pincode].filter(Boolean).join(", "))+'</span><span>🛠️ '+esc((p.services||[]).join(", "))+'</span><span>'+esc(p.bio||"")+'</span></div><a class="primary-btn call-btn" href="tel:'+esc(normalPhone(p.phone))+'">📞 Call professional</a><a class="secondary-btn call-btn" target="_blank" rel="noopener" href="https://wa.me/'+digits(p.whatsapp||p.phone)+'">WhatsApp</a></article>').join("");
 $("results").scrollIntoView({behavior:"smooth"});
}
$("categorySelect").onchange=searchServiceOptions;
$("findBtn").onclick=searchProfessionals;
$("resetBtn").onclick=()=>$("results").classList.add("hidden");
$("year").textContent=new Date().getFullYear();
initCategories();
