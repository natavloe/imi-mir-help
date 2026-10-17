/* IMI MIR - Help: чаты, файлы, отмена сделок, профили, отзывы (подключается после app.js) */
Object.assign(lab,{paid:'Оплачен',done:'Завершён',cancelled:'Отменён'});
Object.assign(ERR,{file_too_big:'Файл больше 50 МБ',bad_file:'Этот тип файла запрещён',already_reviewed:'Отзыв уже оставлен',name_check:'Имя: от 2 до 50 символов'});
const BAD=/\.(exe|bat|cmd|com|msi|scr|ps1|vbs|js|jar|sh|apk|dll|lnk)$/i,MAXF=50*1024*1024;
let FURL={},PF=null,PREV=[],MYREV=false;

/* ---------- данные ---------- */
async function loadReq(){const {data,error}=await sb.from('v_requests').select('*').order('created_at',{ascending:false});if(!error)R=(data||[]).map(x=>({id:x.id,s:x.subject,text:x.body,amount:x.amount,due:x.due,status:x.status,role:x.my_role,cid:x.customer_id,pid:x.performer_id,cn:x.customer_name,pn:x.performer_name,cb:x.cancel_by}))}
async function loadMsgs(){
 if(!st.rid)return;
 const {data}=await sb.from('messages').select('*').eq('request_id',st.rid).order('created_at');MSG=data||[];
 const ps=MSG.filter(m=>m.file_path&&!FURL[m.file_path]).map(m=>m.file_path);
 if(ps.length){const {data:u}=await sb.storage.from('chat-files').createSignedUrls(ps,3600);(u||[]).forEach(x=>{if(x.signedUrl)FURL[x.path]=x.signedUrl})}
 if(st.me){const {data:rv}=await sb.from('reviews').select('id').eq('request_id',st.rid).eq('author_id',st.me.id);MYREV=!!(rv&&rv.length)}
}
async function loadPf(id){
 const [a,b]=await Promise.all([sb.from('v_public_profiles').select('*').eq('id',id).maybeSingle(),sb.from('reviews').select('*').eq('target_id',id).order('created_at',{ascending:false}).limit(20)]);
 PF=a.data||{id,name:'Студент',about:'',done:0,reviews:0};PREV=b.data||[];st.noAnim=true;render();
}

/* ---------- помощники ---------- */
const other=r=>r.role==='customer'?{id:r.pid,n:r.pn}:{id:r.cid,n:r.cn};
const roleTag=r=>r.role==='customer'?'<span class="role cust">Вы заказчик</span>':r.role==='moderator'?'<span class="role mod">Модератор</span>':'<span class="role perf">Вы исполнитель</span>';
const plink=(id,n)=>`<button class="lnk" onclick="openProfile('${id}')">${esc(n||'Студент')}</button>`;
function openProfile(id){st.pbReq=null;st.pb={v:st.view,id:st.view==='chat'?st.rid:st.sid};go('profile',id)}
function needChats(){if(!st.me)return needAuth('Войдите, чтобы увидеть чаты');go('chats')}

/* ---------- навигация и рендер ---------- */
const _go=go;
go=function(v,id){
 if(v!=='profile')st.pbReq=null;
 if(v==='profile'){st.view='profile';st.form=false;st.pid=id;PF=null;PREV=[];render();window.scrollTo(0,0);loadPf(id);return}
 if(v==='reports'){st.from=null;leaveChat();st.view='reports';render();window.scrollTo(0,0);loadRep();return}
 if(v==='disputes'){st.from=null;leaveChat();st.view='disputes';render();window.scrollTo(0,0);loadDisp();return}
 if(v==='chats'){st.from=null;leaveChat();st.view='chats';render();window.scrollTo(0,0);refresh();return}
 _go(v,id);
};
const _render=render;
render=function(){
 if(st.view==='chats'||st.view==='profile'||st.view==='disputes'||st.view==='reports'){k=0;$('seg').dataset.r=st.role;$('acc').innerHTML=accHtml();$('nav').innerHTML=navHtml();$('app').innerHTML=st.view==='chats'?chatsHtml():st.view==='disputes'?disputesHtml():st.view==='reports'?reportsHtml():profileHtml();if(st.view==='profile')drawQr();st.noAnim=false;st.pop=false}
 else{_render();addFileUi();fl()}
};
function accHtml(){return st.me?`<div class="who"><button class="bal" onclick="go('wallet')">${fm((st.prof&&st.prof.balance)||0)}</button><button class="who-p" onclick="openProfile('${st.me.id}')"><span class="av">${st.prof&&st.prof.avatar_path?`<img src="${avUrl(st.prof.avatar_path,st.prof.avatar_at)}" alt="">`:esc(((st.prof&&st.prof.name)||st.me.email||'?')[0].toUpperCase())}</span><span class="nm">${esc((st.prof&&st.prof.name)||'')}</span></button><button class="lnk" onclick="logout()">Выйти</button></div>`:`<button class="btn" style="padding:8px 16px" onclick="needAuth('')">Войти</button>`}
function navHtml(){
 const v=st.view,ch=v==='chats'||st.from==='chats',d=v==='deals'||st.from==='deals',p=st.role==='p',mod=st.prof&&st.prof.is_moderator,n=Object.values(SUM).reduce((s,x)=>s+(x.unread||0),0);
 const b=(c,l,f)=>`<button class="${c?'on':''}" onclick="${f}">${l}</button>`;
 return `<div class="tabs" style="max-width:${mod?700:p?460:300}px;margin:6px 0 0">${b(!ch&&!d,'Запросы',"go('home')")}${b(ch,'Все чаты'+(n?`<span class="badge">${n}</span>`:''),'needChats()')}${p?b(d,'Мои сделки','needDeals()'):''}${mod?b(v==='disputes','Споры',"go('disputes')")+b(v==='reports','Жалобы',"go('reports')"):''}</div>`;
}
const _rc=reqCard;
reqCard=function(r){
 const rb=r.status==='open'&&r.role!=='customer'?` · <button class="lnk" onclick="event.stopPropagation();reportModal('request',${r.id})">Пожаловаться</button>`:'';const who=st.role==='p'&&r.cn?`<div class="sub">Заказчик: ${plink(r.cid,r.cn)}${rb}</div>`:(st.role==='c'&&r.pid?`<div class="sub">Исполнитель: ${plink(r.pid,r.pn)}</div>`:'');
 let h=_rc(r);
 if(st.role==='p'&&r.status==='open'&&r.role!=='customer')h=h.replace(`<button class="btn" onclick="take(${r.id})">Откликнуться</button>`,`<div class="two"><button class="btn" onclick="take(${r.id})">Откликнуться</button><button class="btn ghost" onclick="viewCustomer(${r.id})">Профиль заказчика</button></div>`);
 return h.replace('<div class="meta">',who+filesHtml(r.id)+'<div class="meta">');
};

/* ---------- экраны ---------- */
function chatsHtml(){
 const f=st.cf||'active',all=R.filter(r=>r.role&&r.status!=='open'),G={active:/^(taken|paid)$/,done:/^done$/,cancelled:/^cancelled$/};
 const T=[['active','Активные'],['done','Завершённые'],['cancelled','Отменённые']],list=all.filter(r=>G[f].test(r.status)).sort((x,y)=>((SUM[y.id]||{}).last_at||'').localeCompare((SUM[x.id]||{}).last_at||''));
 return `<h1 class="${ra()}">Все чаты</h1><div class="tabs ${ra()}" style="max-width:460px">${T.map(x=>`<button class="${f===x[0]?'on':''}" onclick="st.cf='${x[0]}';st.noAnim=true;render()">${x[1]} ${all.filter(r=>G[x[0]].test(r.status)).length}</button>`).join('')}</div><div class="list">${list.length?list.map(r=>`<button class="card ${ra()}" onclick="st.from='chats';go('chat',${r.id})"><div class="row">${roleTag(r)}<span class="tag ${r.status}">${lab[r.status]}</span></div><div class="row"><b>${esc(other(r).n||'Студент')}</b>${un(r)}</div><span class="sub">${S[r.s]}</span><div class="sub">${pv(r)}</div></button>`).join(''):'<div class="sub">Здесь пока пусто</div>'}</div>`;
}
function profileHtml(){
 const b=st.pb,own=st.me&&st.pid===st.me.id,p=PF,back=`<button class="back" onclick="go('${(b&&b.v)||'home'}'${b&&b.id!=null?','+b.id:''})">← ${st.pbReq?'К заявке':'Назад'}</button>`;
 if(!p)return back+'<div class="sub" style="margin-top:12px">Загрузка…</div>';
 const dt=x=>new Date(x).toLocaleDateString('ru-RU'),rt=p.reviews?`★ ${(+p.rating).toFixed(1)} · отзывов: ${p.reviews}`:'Отзывов пока нет';
 return `${back}${reqBar()}<div class="prh">${bigAv(p)}<h1 class="${ra()}" style="margin:0">${esc(p.name)}${own?' <span class="sub">(это вы)</span>':''}</h1></div><div class="card ${ra()}"><div class="meta"><span>На сайте с: <b>${p.created_at?dt(p.created_at):'—'}</b></span><span>Завершённых сделок: <b>${p.done}</b></span><span>${rt}</span></div><div>${p.about?esc(p.about):'<span class="sub">О себе ничего не указано</span>'}</div></div>${own?`<button class="btn ghost" style="margin-top:12px" onclick="openSettings()">⚙️ Настройки профиля</button>`:(st.me?`<button class="lnk" style="margin-top:12px" onclick="reportModal('user','${p.id}')">Пожаловаться на пользователя</button>`:'')}${own?shareHtml(p.id):''}<h2 class="sec">Отзывы</h2><div class="list" style="margin-top:0">${PREV.length?PREV.map(x=>`<div class="card"><div class="row"><b>${'★'.repeat(x.rating)}${'☆'.repeat(5-x.rating)}</b><span class="sub">${esc(x.author_name||'')}</span></div>${x.body?`<div>${esc(x.body)}</div>`:''}</div>`).join(''):'<div class="sub">Пока нет отзывов</div>'}</div>`;
}
function chatHtml(r){
 const step=r.status==='taken'?1:2,meId=st.me&&st.me.id,cust=r.role==='customer',o=other(r),live=/^(taken|paid)$/.test(r.status),w='style="margin-top:12px;width:100%"';
 const bk=st.from==='disputes'?`<button class="back" onclick="go('disputes')">← Споры</button>`:st.from==='chats'?`<button class="back" onclick="go('chats')">← Все чаты</button>`:st.from==='deals'?`<button class="back" onclick="go('deals')">← Мои сделки</button>`:`<button class="back" onclick="go('subject',${r.s})">← ${S[r.s]}</button>`;
 let act='';
 if(r.status==='taken'&&cust)act=`<button class="btn" ${w} onclick="payIt(${r.id})">Оплатить ${r.amount} ₽</button><p class="hint" style="margin-top:8px;text-align:center">Деньги удержатся до вашего подтверждения. На балансе: ${fm((st.prof&&st.prof.balance)||0)}</p>`;
 if(r.status==='paid')act=cust?`<button class="btn" ${w} onclick="confirmIt(${r.id})">Подтвердить выполнение</button><p class="hint" style="margin-top:8px;text-align:center">Нажми, когда работа тебя устроила: деньги уйдут исполнителю</p>`:`<div class="pay">Заказчик оплатил, деньги удержаны. Вы получите <b>${r.amount} ₽</b> после подтверждения.</div>`;
 if(r.status==='done')act=`<div class="pay">${cust?'Сделка завершена. Спасибо!':`Сделка завершена. На баланс зачислено: <b>${r.amount} ₽</b>`}</div>`+(MYREV?'<p class="hint">Отзыв оставлен</p>':`<div class="rv"><label>Оценка собеседнику</label><select id="rv_n">${[5,4,3,2,1].map(n=>`<option>${n}</option>`).join('')}</select><textarea id="rv_t" placeholder="Короткий отзыв (по желанию)"></textarea><button class="btn" onclick="review(${r.id})">Оставить отзыв</button></div>`);
 if(r.status==='cancelled')act='<div class="pay">Сделка отменена по согласию сторон. Если деньги были оплачены, они вернулись заказчику.</div>';
 if(live)act+=!r.cb?`<button class="btn ghost" ${w} onclick="cancelAsk(${r.id})">Предложить отмену сделки</button>`:r.cb===meId?`<div class="pay" style="margin-top:10px">Вы предложили отменить сделку. Ждём ответа.</div><button class="btn ghost" ${w} onclick="cancelAns(${r.id},false)">Отозвать предложение</button>`:`<div class="pay" style="margin-top:10px">Собеседник предлагает отменить сделку.</div><div class="two" style="margin-top:8px"><button class="btn" onclick="cancelAns(${r.id},true)">Согласиться</button><button class="btn ghost" onclick="cancelAns(${r.id},false)">Отклонить</button></div>`;
 if(live&&!r.disputed&&r.role!=='moderator')act+=`<button class="btn ghost" ${w} onclick="openDispute(${r.id})">Позвать модератора</button>`;
 if(r.disputed&&r.role!=='moderator')act='<div class="pay">⚖️ Открыт спор. Модератор рассмотрит сделку. Оплата, подтверждение и отмена приостановлены, но писать в чат можно.</div>';
 if(r.role==='moderator')act=modPanel(r);
 const n=MSG.length,msgs=MSG.map((m,i)=>{const u=m.file_path&&FURL[m.file_path],ty=m.file_type||'',f=m.file_path?(u?(/^image\//.test(ty)?`<img src="${u}" class="att" alt="">`:/^video\//.test(ty)?`<video src="${u}" class="att" controls></video>`:`<a href="${u}" target="_blank" rel="noopener">📎 ${esc(m.file_name||'файл')}</a>`):'📎 …'):'';return `<div class="msg ${m.kind==='sys'?'sys':m.sender_id===meId?'me':''} ${st.pop&&i===n-1?'pop':''}">${m.sender_id&&m.sender_id!==r.cid&&m.sender_id!==r.pid?'<b>Модератор</b>':''}${f}${m.body?`<div>${esc(m.body)}</div>`:''}</div>`}).join('')||'<div class="msg sys">Начните диалог</div>';
 const inp=live?`<div class="send"><label class="btn ghost clip" title="Прикрепить файл (до 50 МБ)">📎<input type="file" hidden onchange="attach(${r.id},this)"></label><input type="text" id="mt" placeholder="Сообщение…" maxlength="2000" onkeydown="if(event.key==='Enter')send(${r.id})"><button class="btn" onclick="send(${r.id})">➤</button></div>`:'';
 return `${bk}<div class="card ${ra()}" style="margin-top:12px"><div class="row">${roleTag(r)}<span>${r.role==='moderator'?'Заказчик: '+plink(r.cid,r.cn)+' · Исполнитель: '+plink(r.pid,r.pn):(cust?'Исполнитель':'Заказчик')+': '+plink(o.id,o.n)}</span></div><div>${esc(r.text)}</div>${filesHtml(r.id)}<div class="meta">${money(r)}<span>Срок: <b>${fmtD(r.due)}</b></span></div></div><div class="steps ${ra()}"><div class="on">Запрос</div><div class="${step>=1?'on':''}">В работе</div><div class="${step>=2?'on':''}">Оплачено</div></div><div class="card ${ra()}"><div class="chat" id="chat">${msgs}</div>${inp}${act}</div>`;
}

/* ---------- действия ---------- */
async function rpc(n,a,ok){
 const {error}=await sb.rpc(n,a);if(error){t(em(error));return false}
 await Promise.all([loadReq(),loadProf(),loadMsgs()]);st.noAnim=true;st.pop=true;render();if(ok)t(ok);return true;
}
const confirmIt=id=>rpc('confirm_request',{p_id:id},'Выполнение подтверждено');
const cancelAsk=id=>rpc('propose_cancel',{p_id:id},'Предложение отправлено');
const cancelAns=(id,a)=>rpc('answer_cancel',{p_id:id,p_accept:a});
const review=id=>rpc('leave_review',{p_id:id,p_rating:+$('rv_n').value,p_text:$('rv_t').value.trim()},'Спасибо за отзыв');
async function attach(id,inp){
 const f=inp.files[0];inp.value='';if(!f)return;
 if(f.size>MAXF)return t('Файл больше 50 МБ');
 if(BAD.test(f.name))return t('Этот тип файла запрещён');
 t('Загрузка…');
 const ext=(f.name.split('.').pop()||'bin').replace(/[^a-z0-9]/gi,'').slice(0,8)||'bin',p=`${id}/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
 const u=await sb.storage.from('chat-files').upload(p,f,{contentType:f.type||'application/octet-stream'});
 if(u.error)return t('Не удалось загрузить файл');
 const body=($('mt')&&$('mt').value.trim())||'';
 const {error}=await sb.rpc('send_attachment',{p_id:id,p_path:p,p_name:f.name.slice(0,200),p_type:f.type||'',p_size:f.size,p_body:body});
 if(error)return t(em(error));
 if($('mt'))$('mt').value='';await loadMsgs();st.noAnim=true;st.pop=true;render();t('Файл отправлен');
}
async function saveProf(){
 if(prof($('pf_n').value)||prof($('pf_a').value))return t(ERR.profanity);
 const {error}=await sb.rpc('update_profile',{p_name:$('pf_n').value.trim(),p_about:$('pf_a').value.trim()});
 if(error)return t(em(error));
 await Promise.all([loadProf(),loadPf(st.me.id)]);closeModal();t('Профиль сохранён');
}

/* ---------- v3: последнее сообщение и непрочитанные ---------- */
let SUM={},allCh=null;
const pv=r=>{const x=SUM[r.id];if(!x||x.last_at==null)return 'Сообщений пока нет';const b=(x.has_file?'📎 ':'')+(x.last_body||(x.has_file?'Файл':''));return esc((x.last_sender===(st.me&&st.me.id)?'Вы: ':'')+b.slice(0,90))};
const un=r=>{const n=(SUM[r.id]||{}).unread;return n?`<span class="badge">${n}</span>`:''};
async function loadSum(){if(!st.me){SUM={};return}const {data}=await sb.rpc('my_chat_summary');SUM={};(data||[]).forEach(x=>SUM[x.request_id]=x)}
const _rf=refresh;
refresh=async function(){await _rf();await loadSum();st.noAnim=true;render()};
const _lm=loadMsgs;
loadMsgs=async function(){await _lm();if(st.me&&st.view==='chat'&&st.rid){sb.rpc('mark_read',{p_id:st.rid});if(SUM[st.rid])SUM[st.rid].unread=0}};
function subAll(){
 if(allCh||!st.me)return;
 allCh=sb.channel('all-msgs').on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},async p=>{
  if(st.view==='chat'&&p.new.request_id===st.rid)return;
  await loadSum();$('nav').innerHTML=navHtml();if(st.view==='chats'){st.noAnim=true;render()}
 }).subscribe();
}
sb.auth.onAuthStateChange((ev,s)=>{if(s)setTimeout(subAll,0);else if(allCh){sb.removeChannel(allCh);allCh=null}});

/* ---------- v4: модератор и споры ---------- */
Object.assign(ERR,{dispute_open:'Идёт спор: действие недоступно до решения модератора',already_open:'Спор уже открыт',bad_reason:'Опишите проблему хотя бы в паре слов',not_paid:'Выплата возможна только после оплаты',no_dispute:'Спор уже закрыт'});
let DISP={};
loadProf=async function(){if(!st.me){st.prof=null;return}const {data}=await sb.from('profiles').select('name,balance,is_moderator,avatar_path,avatar_at').eq('id',st.me.id).maybeSingle();st.prof=data||{name:'Студент',balance:0}};
async function loadDisp(){const {data}=await sb.rpc('mod_disputes');DISP={};(data||[]).forEach(x=>DISP[x.request_id]=x);await loadReq();st.noAnim=true;render()}
function disputesHtml(){
 const l=R.filter(r=>r.role==='moderator'&&r.disputed);
 return `<h1 class="${ra()}">Споры</h1><div class="list">${l.length?l.map(r=>{const d=DISP[r.id]||{};return `<button class="card ${ra()}" onclick="st.from='disputes';go('chat',${r.id})"><div class="row"><span class="role mod">Спор</span><span class="tag ${r.status}">${lab[r.status]}</span></div><b>${esc(r.cn||'')} → ${esc(r.pn||'')}</b><span class="sub">${S[r.s]} · ${r.amount} ₽</span><div class="sub">Причина: ${esc((d.reason||'').slice(0,120))}</div></button>`}).join(''):'<div class="sub">Открытых споров нет</div>'}</div>`;
}
const modPanel=r=>`<div class="pay">⚖️ Спор по сделке. Заказчик заплатил: <b>${r.amount} ₽</b>. Статус: ${lab[r.status]}.<br>Причина (${esc((DISP[r.id]||{}).opened_by_name||'')}): ${esc((DISP[r.id]||{}).reason||'—')}</div><textarea id="md_n" placeholder="Комментарий к решению (увидят обе стороны)" maxlength="500"></textarea><div class="two" style="margin-top:8px"><button class="btn" onclick="resolveIt(${r.id},'refund')">Вернуть заказчику</button>${r.status==='paid'?`<button class="btn" onclick="resolveIt(${r.id},'release')">Выплатить исполнителю</button>`:''}</div>`;
function openDispute(id){const x=prompt('Опишите проблему (хотя бы пару слов). Оплата и отмена будут приостановлены до решения модератора.');if(x===null)return;rpc('open_dispute',{p_id:id,p_reason:x.trim()},'Спор открыт, модератор подключится')}
async function resolveIt(id,d){
 if(!confirm(d==='refund'?'Вернуть деньги заказчику и отменить сделку?':'Выплатить исполнителю и завершить сделку?'))return;
 const {error}=await sb.rpc('resolve_dispute',{p_id:id,p_decision:d,p_note:($('md_n')&&$('md_n').value.trim())||''});
 if(error)return t(em(error));
 t('Спор решён');go('disputes');
}

/* ---------- v5: ссылка и QR профиля, проверка баланса ---------- */
const profLink=id=>location.origin+location.pathname+'#u='+id;
const shareHtml=id=>`<h2 class="sec">Поделиться профилем</h2><div class="card"><input type="text" id="pl" readonly value="${profLink(id)}" onclick="this.select()"><div class="two" style="margin-top:8px"><button class="btn" onclick="copyLink()">Скопировать ссылку</button><button class="btn" onclick="showQr()">QR-код</button>${navigator.share?`<button class="btn ghost" onclick="shareLink()">Отправить…</button>`:''}</div><p class="hint" style="text-align:center">QR-код ведёт на твой профиль. Друзьям нужно войти в аккаунт, чтобы его открыть.</p></div>`;
function drawQr(){const e=$('qr');if(!e)return;if(typeof qrcode==='undefined'){e.textContent='QR-код не загрузился, но ссылка работает';return}const q=qrcode(0,'M');q.addData(profLink(st.me.id));q.make();e.innerHTML='<img alt="QR-код профиля" src="'+q.createDataURL(6,4)+'">'}
function copyLink(){const l=profLink(st.me.id);(navigator.clipboard?navigator.clipboard.writeText(l):Promise.reject()).then(()=>t('Ссылка скопирована')).catch(()=>{const i=$('pl');i.select();document.execCommand('copy');t('Ссылка скопирована')})}
function shareLink(){navigator.share({title:'Мой профиль в IMI MIR - Help',url:profLink(st.me.id)}).catch(()=>{})}
let HID=(location.hash.match(/^#u=([0-9a-f-]{36})$/i)||[])[1]||null;
function hashGo(){if(!HID||!st.me)return;const i=HID;HID=null;history.replaceState(null,'',location.pathname);st.pb={v:'home'};go('profile',i)}
sb.auth.onAuthStateChange((ev,s)=>{if(!HID)return;if(s)setTimeout(hashGo,400);else if(ev==='INITIAL_SESSION')setTimeout(()=>needAuth('Войдите, чтобы открыть профиль'),400)});

function modal(h){closeModal();const d=document.createElement('div');d.id='ovl';d.className='ovl';d.onclick=e=>{if(e.target===d)closeModal()};d.innerHTML='<div class="mbox">'+h+'</div>';document.body.appendChild(d)}
function closeModal(){const d=$('ovl');if(d)d.remove()}
function lowBal(need){const a=Math.max(need,100);modal(`<h2 style="margin:0 0 8px">Не хватает ${need} ₽</h2><p class="sub" style="margin:0 0 14px">Чтобы опубликовать запрос, на балансе должна быть вся сумма. Пополните баланс, и запрос опубликуется сразу.</p><button class="btn" style="width:100%" onclick="topAndPost(${a})">Пополнить на ${a} ₽ и опубликовать</button><div class="two" style="margin-top:8px"><button class="btn ghost" onclick="closeModal();go('wallet')">Другая сумма</button><button class="btn ghost" onclick="closeModal()">Отмена</button></div>`)}
async function topAndPost(a){const {error}=await sb.rpc('demo_top_up',{p_amount:a});if(error)return t(em(error));closeModal();await loadProf();$('acc').innerHTML=accHtml();t('Баланс пополнен (демо)');addReq()}
addReq=async function(){
 const x=$('f_text').value.trim(),b=+$('f_b').value;
 if(x.length<10)return t('Опиши запрос подробнее');
 if(!b||b<50)return t('Укажи бюджет от 50 ₽');
 if(!$('f_ok').checked)return t('Подтверди условие про помощь в обучении');
 if(prof(x))return t(ERR.profanity);
 await loadProf();const need=Math.round(b)-((st.prof&&st.prof.balance)||0);
 if(need>0)return lowBal(need);
 const {data:nid,error}=await sb.rpc('create_request',{p_subject:st.sid,p_body:x,p_budget:Math.round(b),p_due:$('f_d').value||null});
 if(error){if(/insufficient_funds/.test(error.message||''))return lowBal(Math.round(b));return t(em(error))}
 const up=PEND.length?await uploadReqFiles(nid):true;PEND=[];st.form=false;await loadReq();render();t(up?'Запрос опубликован':'Запрос опубликован, но часть файлов не загрузилась');
};

function showQr(){
 if(typeof qrcode==='undefined')return t('QR-код не загрузился, используй ссылку');
 const q=qrcode(0,'M');q.addData(profLink(st.me.id));q.make();
 modal(`<h2 style="margin:0 0 12px;text-align:center">Мой профиль</h2><div class="qr"><img alt="QR-код профиля" src="${q.createDataURL(6,4)}"></div><p class="hint" style="text-align:center">Покажи код другу: он откроет твой профиль</p><button class="btn" style="width:100%" onclick="closeModal()">Закрыть</button>`);
}

function openSettings(){
 const p=PF||{};
 modal(`<h2 style="margin:0 0 12px">Настройки профиля</h2><div class="avrow">${bigAv(p)}<label class="btn ghost" style="cursor:pointer">Сменить фото<input type="file" accept="image/*" hidden onchange="setAvatar(this)"></label>${p.avatar_path?`<button class="btn ghost" onclick="delAvatar()">Удалить</button>`:''}</div><label>Имя</label><input type="text" id="pf_n" maxlength="50" value="${esc(p.name||'')}"><label style="margin-top:10px;display:block">О себе</label><textarea id="pf_a" maxlength="500" style="width:100%;min-height:110px">${esc(p.about||'')}</textarea><div class="two" style="margin-top:12px"><button class="btn" onclick="saveProf()">Сохранить</button><button class="btn ghost" onclick="closeModal()">Отмена</button></div>`);
}

/* ---------- v6: аватарки ---------- */
const avUrl=(p,at)=>p?sb.storage.from('avatars').getPublicUrl(p).data.publicUrl+'?v='+(at?new Date(at).getTime():1):'';
const bigAv=p=>`<div class="bigav">${p&&p.avatar_path?`<img src="${avUrl(p.avatar_path,p.avatar_at)}" alt="">`:esc(((p&&p.name)||'?')[0].toUpperCase())}</div>`;
function toJpeg(f){return new Promise((res,rej)=>{const i=new Image(),u=URL.createObjectURL(f);i.onload=()=>{const s=Math.min(i.width,i.height),c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').drawImage(i,(i.width-s)/2,(i.height-s)/2,s,s,0,0,256,256);URL.revokeObjectURL(u);c.toBlob(b=>b?res(b):rej(),'image/jpeg',.85)};i.onerror=rej;i.src=u})}
async function setAvatar(inp){
 const f=inp.files[0];inp.value='';if(!f)return;
 if(!/^image\//.test(f.type))return t('Нужна картинка');
 if(f.size>10*1024*1024)return t('Фото больше 10 МБ');
 t('Загрузка…');let b;try{b=await toJpeg(f)}catch(e){return t('Не удалось прочитать фото')}
 const p=st.me.id+'/avatar.jpg',u=await sb.storage.from('avatars').upload(p,b,{upsert:true,contentType:'image/jpeg'});
 if(u.error)return t('Не удалось загрузить фото');
 const {error}=await sb.rpc('set_avatar',{p_path:p});if(error)return t(em(error));
 avDone('Фото обновлено');
}
async function delAvatar(){await sb.storage.from('avatars').remove([st.me.id+'/avatar.jpg']);const {error}=await sb.rpc('set_avatar',{p_path:null});if(error)return t(em(error));avDone('Фото удалено')}
async function avDone(m){await Promise.all([loadProf(),loadPf(st.me.id)]);$('acc').innerHTML=accHtml();openSettings();t(m)}

/* ---------- v7: жалобы, блокировка, фильтр нецензурных слов ---------- */
Object.assign(ERR,{profanity:'В тексте есть недопустимые слова. Перефразируй, пожалуйста',not_open:'Скрыть можно только открытый запрос',blocked:'Аккаунт заблокирован'});
const PRF=new RegExp("пизд|(^|[^а-я])ху(й|е|я|и)|(^|[^а-я])(за|вы|на|по|при|от|про|с|у|раз|до|под|об)?еб(ан|ат|ал|ну|уч|ло|ыр|ис|ет|ут|ешь|аш)|(^|[^а-я])бля($|[^а-я])|бляд|блят|муда(к|ч)|мудил|мудозв|(^|[^а-я])сук(а|и|у|ой)($|[^а-я])|пидор|пидар|пидр|залуп|гандон|шлюх|долб[оа]еб|дроч",'i');
const LAT={x:'х',y:'у',a:'а',e:'е',o:'о',p:'р',c:'с'};
const prof=s=>PRF.test(String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[xyaeopc]/g,c=>LAT[c]));
const RSN={abuse:'Оскорбления, мат',cheating:'Просят сделать работу на сдачу',spam:'Спам, реклама',scam:'Мошенничество',other:'Другое'};
let REP=[];
function reportModal(type,id){
 if(!st.me)return needAuth('Войдите, чтобы отправить жалобу');
 modal(`<h2 style="margin:0 0 12px">Пожаловаться</h2><label>Причина</label><select id="rp_r" style="width:100%;padding:10px;border-radius:10px;font:inherit">${Object.keys(RSN).map(k=>`<option value="${k}">${RSN[k]}</option>`).join('')}</select><label style="margin-top:10px;display:block">Подробности (по желанию)</label><textarea id="rp_d" maxlength="500" style="width:100%;min-height:90px"></textarea><div class="two" style="margin-top:12px"><button class="btn" onclick="sendReport('${type}','${id}')">Отправить</button><button class="btn ghost" onclick="closeModal()">Отмена</button></div>`);
}
async function sendReport(type,id){
 const a=type==='user'?{p_user:id,p_reason:$('rp_r').value,p_details:$('rp_d').value.trim()}:{p_id:+id,p_reason:$('rp_r').value,p_details:$('rp_d').value.trim()};
 const {error}=await sb.rpc(type==='user'?'report_user':'report_request',a);
 if(error)return t(error.code==='23505'?'Вы уже отправляли жалобу, модератор её рассмотрит':em(error));
 closeModal();t('Жалоба отправлена, модератор рассмотрит');
}
async function loadRep(){const {data}=await sb.rpc('mod_reports');REP=data||[];st.noAnim=true;render()}
function reportsHtml(){
 return `<h1 class="${ra()}">Жалобы</h1><div class="list">${REP.length?REP.map(x=>`<div class="card ${ra()}"><div class="row"><span class="role mod">${x.target_type==='user'?'На пользователя':'На запрос'}</span><span class="sub">${RSN[x.reason]||x.reason}</span></div><div class="sub">Пожаловался: ${esc(x.reporter_name||'')}</div>${x.target_type==='request'?`<div>${esc((x.request_body||'').slice(0,300))}</div><div class="sub">Автор: ${plink(x.target_user,x.target_user_name)} · статус запроса: ${lab[x.request_status]||x.request_status}</div>`:`<div>${plink(x.target_user,x.target_user_name)}${x.target_blocked?' <span class="sub">(уже заблокирован)</span>':''}</div>`}${x.details?`<div class="sub">«${esc(x.details)}»</div>`:''}<div class="two" style="margin-top:6px"><button class="btn ghost" onclick="resolveRep(${x.report_id},'dismiss')">Закрыть жалобу</button>${x.target_type==='request'&&x.request_status==='open'?`<button class="btn ghost" onclick="resolveRep(${x.report_id},'hide_request')">Скрыть запрос</button>`:''}${!x.target_blocked?`<button class="btn" onclick="resolveRep(${x.report_id},'block_user')">Заблокировать пользователя</button>`:''}</div></div>`).join(''):'<div class="sub">Открытых жалоб нет</div>'}</div>`;
}
async function resolveRep(id,act){
 if(act==='block_user'&&!confirm('Заблокировать пользователя? Он не сможет войти в аккаунт.'))return;
 const {error}=await sb.rpc('resolve_report',{p_id:id,p_action:act});
 if(error)return t(em(error));
 t(act==='dismiss'?'Жалоба закрыта':act==='hide_request'?'Запрос скрыт':'Пользователь заблокирован');loadRep();
}

/* ---------- v8: файлы и фото в запросах ---------- */
Object.assign(ERR,{too_many_files:'Не больше 5 файлов в запросе'});
let PEND=[],RF={},RFU={},RFT=Date.now();
function addFileUi(){
 const c=$('f_ok');if(!c||$('f_files'))return;
 const d=document.createElement('div');
 d.innerHTML='<label class="btn ghost" style="cursor:pointer;display:inline-block">📎 Прикрепить фото или файлы<input type="file" id="f_files" multiple hidden onchange="pickFiles(this)"></label><p class="hint" style="margin:6px 0 0">До 5 файлов, каждый до 50 МБ. Исполняемые файлы (.exe, .bat и т.п.) запрещены.</p><div id="f_list"></div>';
 (c.closest('.chk')||c.parentNode).before(d);
}
function fl(){
 const e=$('f_list');if(!e){PEND=[];return}
 e.innerHTML=PEND.map((f,i)=>`<div class="fitem">📎 ${esc(f.name)} <button class="lnk" onclick="PEND.splice(${i},1);fl()">убрать</button></div>`).join('');
}
function pickFiles(inp){
 for(const f of inp.files){
  if(PEND.length>=5){t('Не больше 5 файлов');break}
  if(f.size>MAXF){t('«'+f.name+'» больше 50 МБ');continue}
  if(BAD.test(f.name)){t('Тип файла «'+f.name+'» запрещён');continue}
  PEND.push(f);
 }
 inp.value='';fl();
}
async function uploadReqFiles(id){
 const meta=[];let ok=true;
 for(const f of PEND){
  const ext=(f.name.split('.').pop()||'bin').replace(/[^a-z0-9]/gi,'').slice(0,8)||'bin',p=`${id}/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
  const u=await sb.storage.from('request-files').upload(p,f,{contentType:f.type||'application/octet-stream'});
  if(u.error){ok=false;continue}
  meta.push({path:p,name:f.name.slice(0,200),type:f.type||'',size:f.size});
 }
 if(meta.length){const {error}=await sb.rpc('add_request_files',{p_id:id,p_files:meta});if(error)ok=false}
 return ok;
}
async function loadFiles(){
 if(!st.me||!R.length){RF={};return}
 const {data}=await sb.from('v_request_files').select('*').in('request_id',R.map(r=>r.id));
 RF={};(data||[]).forEach(f=>(RF[f.request_id]=RF[f.request_id]||[]).push(f));
 if(Date.now()-RFT>3000000){RFU={};RFT=Date.now()}
 const ps=(data||[]).map(f=>f.path).filter(p=>!RFU[p]);
 if(ps.length){const {data:u}=await sb.storage.from('request-files').createSignedUrls(ps,3600);(u||[]).forEach(x=>{if(x.signedUrl)RFU[x.path]=x.signedUrl})}
}
const _lr=loadReq;
loadReq=async function(){await _lr();await loadFiles()};
function filesHtml(id){
 const l=RF[id]||[];if(!l.length)return '';
 return '<div class="files">'+l.map(f=>{const u=RFU[f.path];if(!u)return '';
  return /^image\//.test(f.type)?`<a href="${u}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><img class="thumb" src="${u}" alt=""></a>`:`<a class="fl" href="${u}" target="_blank" rel="noopener" onclick="event.stopPropagation()">📎 ${esc(f.name)}</a>`}).join('')+'</div>';
}

/* ---------- v9: профиль заказчика из карточки заявки ---------- */
function viewCustomer(rid){
 const r=R.find(x=>x.id===rid);if(!r||!r.cid)return;
 if(!st.me)return needAuth('Войдите, чтобы посмотреть профиль заказчика');
 st.pb={v:st.view,id:st.sid};st.pbReq=rid;go('profile',r.cid);
}
function reqBar(){
 const r=st.pbReq&&R.find(x=>x.id===st.pbReq);if(!r)return '';
 return `<div class="card ${ra()}" style="margin-top:12px"><span class="sub">Заявка, из которой вы пришли</span><div>${esc(r.text.slice(0,300))}</div><div class="meta">${money(r)}<span>Срок: <b>${fmtD(r.due)}</b></span></div>${r.status==='open'&&r.role!=='customer'?`<button class="btn" onclick="take(${r.id})">Откликнуться на заявку</button><p class="hint" style="margin:6px 0 0">Профиль можно смотреть без обязательств: заявка остаётся открытой, пока вы не откликнетесь.</p>`:'<p class="hint" style="margin:6px 0 0">Эта заявка уже не открыта</p>'}</div>`;
}
