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
let selectedServices=[];
function msg(id,text,ok=false){const el=$(id);el.textContent=text;el.className="notice "+(ok?"notice-ok":"notice-error")}
function initCategories(){["categorySelect","regCategory"].forEach(id=>Object.keys(CATEGORIES).forEach(c=>$(id).insertAdjacentHTML("beforeend",'<option value="'+esc(c)+'">'+esc(c)+"</option>")))}
function searchServiceOptions(){const c=$("categorySelect").value,s=$("serviceSelect");s.disabled=!c;s.innerHTML=c?'<option value="">Service select karein</option>'+CATEGORIES[c].map(x=>"<option>"+esc(x)+"</option>").join(""):'<option value="">Pehle category select karein</option>'}
function registrationServices(){selectedServices=[];const list=CATEGORIES[$("regCategory").value]||[];$("servicePicker").innerHTML=list.length?list.map(s=>'<button type="button" class="service-pick" data-service="'+esc(s)+'">'+esc(s)+"</button>").join(""):'<span class="tiny-note">Pehle category select karein.</span>'}
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
async function registerProfessional(e){
 e.preventDefault();if(!db)return msg("registerMessage","Supabase configuration missing hai.");
 if(!selectedServices.length)return msg("registerMessage","Kam se kam ek service select ya add karein.");
 const mobile=digits($("proPhone").value),pin=$("proPincode").value.trim();if(mobile.length<10||mobile.length>12)return msg("registerMessage","Sahi mobile number enter karein.");if(!/^\d{6}$/.test(pin))return msg("registerMessage","6-digit pincode enter karein.");
 const cs=$("proCity").value.split(",").map(x=>x.trim()),payload={name:$("proName").value.trim(),phone:normalPhone(mobile),whatsapp:normalPhone($("proWhatsapp").value||mobile),category:$("regCategory").value,services:selectedServices,area:$("proArea").value.trim(),city:cs[0]||"",state:cs.slice(1).join(", ")||"Bihar",pincode:pin,experience_years:Number($("proExperience").value||0),bio:$("proBio").value.trim(),verified_mobile:false,verified_whatsapp:false,verified_by_admin:false,status:"pending"};
 $("submitProBtn").disabled=true;const {error}=await db.from("professionals").insert(payload);$("submitProBtn").disabled=false;if(error)return msg("registerMessage",error.message);
 msg("registerMessage","Registration submit ho gaya. Admin approval tak profile pending rahegi.",true);$("registerForm").reset();selectedServices=[];registrationServices();
}
async function adminLogin(){const {data,error}=await db.auth.signInWithPassword({email:$("adminEmail").value.trim(),password:$("adminPassword").value});if(error)return msg("adminMessage",error.message);const {data:p}=await db.from("user_profiles").select("role").eq("id",data.user.id).maybeSingle();if(p?.role!=="admin"){await db.auth.signOut();return msg("adminMessage","Yeh account admin nahi hai.")}$("adminModal").classList.add("hidden");loadAdmin()}
async function loadAdmin(){const {data,error}=await db.from("professionals").select("id,name,phone,category,area,city,status,created_at").order("created_at",{ascending:false});if(error)return alert(error.message);$("adminDashboard").classList.remove("hidden");$("adminStats").innerHTML="<p><b>Total:</b> "+data.length+" &nbsp; <b>Pending:</b> "+data.filter(x=>x.status==="pending").length+" &nbsp; <b>Approved:</b> "+data.filter(x=>x.status==="approved").length+"</p>";$("adminTable").innerHTML='<table><thead><tr><th>Name</th><th>Phone</th><th>Category</th><th>Location</th><th>Status</th><th>Action</th></tr></thead><tbody>'+data.map(p=>'<tr><td>'+esc(p.name)+'</td><td>'+esc(p.phone)+'</td><td>'+esc(p.category)+'</td><td>'+esc(p.area)+", "+esc(p.city)+'</td><td>'+esc(p.status)+'</td><td><button class="secondary-btn admin-status" data-id="'+p.id+'" data-status="approved">Approve</button> <button class="secondary-btn admin-status" data-id="'+p.id+'" data-status="pending">Pending</button> <button class="secondary-btn admin-status" data-id="'+p.id+'" data-status="suspended">Suspend</button></td></tr>').join("")+"</tbody></table>"}
async function changeStatus(id,status){const {error}=await db.rpc("admin_set_professional_status",{professional_uuid:id,new_status:status});if(error)return alert(error.message);loadAdmin()}
document.addEventListener("click",e=>{if(e.target.classList.contains("service-pick")){const s=e.target.dataset.service;e.target.classList.toggle("active");selectedServices=e.target.classList.contains("active")?[...new Set([...selectedServices,s])]:selectedServices.filter(x=>x!==s)}if(e.target.classList.contains("admin-status"))changeStatus(e.target.dataset.id,e.target.dataset.status)});
$("categorySelect").onchange=searchServiceOptions;$("regCategory").onchange=registrationServices;$("findBtn").onclick=searchProfessionals;$("registerForm").onsubmit=registerProfessional;
$("addServiceBtn").onclick=()=>{const s=$("manualService").value.trim();if(s&&!selectedServices.includes(s)){selectedServices.push(s);$("servicePicker").insertAdjacentHTML("beforeend",'<button type="button" class="service-pick active" data-service="'+esc(s)+'">'+esc(s)+"</button>");$("manualService").value=""}};
$("adminLoginOpen").onclick=()=>$("adminModal").classList.remove("hidden");$("adminClose").onclick=()=>$("adminModal").classList.add("hidden");$("adminLoginBtn").onclick=adminLogin;$("adminLogout").onclick=async()=>{await db.auth.signOut();$("adminDashboard").classList.add("hidden")};$("resetBtn").onclick=()=>$("results").classList.add("hidden");$("year").textContent=new Date().getFullYear();initCategories();registrationServices();