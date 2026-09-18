/* global supabase, SAHIMILO_CONFIG */
const cfg=window.SAHIMILO_CONFIG||{};
const db=window.supabase?.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
const $=id=>document.getElementById(id);
const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
let applications=[];

function showMessage(text,ok=false){
  const el=$("adminMessage");
  el.textContent=text;
  el.className="notice "+(ok?"notice-ok":"notice-error");
}
function statusBadge(status){return '<span class="status-badge status-'+esc(status)+'">'+esc(status)+'</span>'}
function statCard(label,value){return '<div class="admin-stat"><span>'+label+'</span><strong>'+value+'</strong></div>'}

async function requireAdmin(){
  if(!db){location.replace("admin-login.html");return false}
  const {data:{session}}=await db.auth.getSession();
  if(!session){location.replace("admin-login.html");return false}
  const {data,error}=await db.from("user_profiles").select("role").eq("id",session.user.id).maybeSingle();
  if(error||data?.role!=="admin"){
    await db.auth.signOut();
    location.replace("admin-login.html");
    return false;
  }
  $("adminLoading").classList.add("hidden");
  $("adminApp").classList.remove("hidden");
  return true;
}

async function loadApplications(){
  $("adminMessage").classList.add("hidden");
  const {data,error}=await db.from("professionals")
    .select("id,name,phone,whatsapp,category,services,area,city,state,pincode,experience_years,bio,rating,reviews_count,status,verified_mobile,verified_whatsapp,verified_by_admin,created_at")
    .order("created_at",{ascending:false});
  if(error)return showMessage("Applications load nahi hui: "+error.message);
  applications=data||[];
  render();
}

function render(){
  const query=$("adminSearch").value.trim().toLowerCase();
  const filter=$("adminFilter").value;
  const rows=applications.filter(item=>{
    const haystack=[item.name,item.phone,item.whatsapp,item.category,(item.services||[]).join(" "),item.area,item.city,item.state,item.pincode,item.bio].join(" ").toLowerCase();
    return (filter==="all"||item.status===filter)&&(!query||haystack.includes(query));
  });
  $("adminStats").innerHTML=
    statCard("Total",applications.length)+
    statCard("Pending",applications.filter(x=>x.status==="pending").length)+
    statCard("Approved",applications.filter(x=>x.status==="approved").length)+
    statCard("Suspended",applications.filter(x=>x.status==="suspended").length);
  if(!rows.length){
    $("adminTable").innerHTML='<div class="admin-empty">No matching professional applications found.</div>';
    return;
  }
  $("adminTable").innerHTML='<table class="admin-data-table"><thead><tr><th>Professional</th><th>Contact</th><th>Category & Services</th><th>Location</th><th>Experience / Details</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+
    rows.map(item=>'<tr>'+
      '<td><strong>'+esc(item.name)+'</strong><br><small>ID: '+esc(item.id)+'</small></td>'+
      '<td>'+esc(item.phone)+'<br>'+esc(item.whatsapp||"")+'</td>'+
      '<td><strong>'+esc(item.category)+'</strong><br>'+esc((item.services||[]).join(", "))+'</td>'+
      '<td>'+esc([item.area,item.city,item.state,item.pincode].filter(Boolean).join(", "))+'</td>'+
      '<td>'+esc(item.experience_years||0)+' years<br><small>'+esc(item.bio||"No details")+'</small></td>'+
      '<td>'+esc(new Date(item.created_at).toLocaleString("en-IN"))+'</td>'+
      '<td>'+statusBadge(item.status)+'</td>'+
      '<td><div class="admin-actions">'+
        '<button class="admin-action" data-action="status" data-status="approved" data-id="'+esc(item.id)+'">Approve</button>'+
        '<button class="admin-action" data-action="status" data-status="pending" data-id="'+esc(item.id)+'">Pending</button>'+
        '<button class="admin-action" data-action="status" data-status="suspended" data-id="'+esc(item.id)+'">Suspend</button>'+
        '<button class="admin-action admin-delete" data-action="delete" data-name="'+esc(item.name)+'" data-id="'+esc(item.id)+'">Delete</button>'+
      '</div></td></tr>').join("")+'</tbody></table>';
}

async function changeStatus(id,status,button){
  button.disabled=true;
  const {error}=await db.rpc("admin_set_professional_status",{professional_uuid:id,new_status:status});
  button.disabled=false;
  if(error)return showMessage("Status update nahi hua: "+error.message);
  showMessage("Application status "+status+" kar diya gaya.",true);
  await loadApplications();
}

async function deleteApplication(id,name,button){
  if(!confirm('Delete "'+name+'" application permanently? This cannot be undone.'))return;
  button.disabled=true;
  const {data,error}=await db.from("professionals").delete().eq("id",id).select("id");
  button.disabled=false;
  if(error)return showMessage("Application delete nahi hui: "+error.message);
  if(!data?.length)return showMessage("Delete permission denied ya application nahi mili.");
  showMessage("Professional application permanently delete kar di gayi.",true);
  await loadApplications();
}

document.addEventListener("click",event=>{
  const button=event.target.closest("[data-action]");
  if(!button)return;
  if(button.dataset.action==="status")changeStatus(button.dataset.id,button.dataset.status,button);
  if(button.dataset.action==="delete")deleteApplication(button.dataset.id,button.dataset.name,button);
});
$("adminSearch").addEventListener("input",render);
$("adminFilter").addEventListener("change",render);
$("adminRefresh").addEventListener("click",loadApplications);
$("adminLogout").addEventListener("click",async()=>{await db.auth.signOut();location.replace("admin-login.html")});

(async()=>{if(await requireAdmin())await loadApplications()})();