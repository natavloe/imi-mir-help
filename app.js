const SB_URL='https://jitosarfgjvvdwpoigxz.supabase.co',SB_KEY='sb_publishable_z0R6eoYyE0PzwDMvvTEevg_8WbI76Z-';
const sb=supabase.createClient(SB_URL,SB_KEY);
const S=['Интеллектуальные системы и технологии','Устройство и функционирование информационных систем','Внедрение информационных систем','Инженерно-техническая поддержка сопровождения ИС','Иностранный язык в ПД','Основы предпринимательства','Социально-значимая деятельность','Управление и автоматизация баз данных','Учебная и производственная практика ПМ.06','Физическая культура','Экономика отрасли','Стандартизация, сертификация и техническая документация'];
let R=[],MSG=[],TX=[];
let st={role:'c',view:'home',sid:null,rid:null,form:false,noAnim:false,pop:false,mode:'login',prev:null,me:null,prof:null,authMsg:'',from:null,ch:null,busy:false},k=0;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtD=d=>d?d.split('-').reverse().join('.'):'—';
const fm=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';
const ra=()=>st.noAnim?'':`rise" style="--i:${Math.min(k++,9)}`;
const lab={open:'Открыт',taken:'В работе',paid:'Оплачен'};
const ERR={insufficient_funds:'Недостаточно средств',not_available:'Запрос уже занят или закрыт',own_request:'Нельзя откликнуться на свой запрос',not_allowed:'Действие недоступно',chat_closed:'Чат закрыт',not_authenticated:'Нужно войти',bad_amount:'Сумма от 100 до 10 000 ₽',budget_check:'Бюджет от 50 до 100 000 ₽',body_check:'Опиши запрос подробнее'};
const em=e=>{const m=(e&&e.message)||'';for(const x in ERR)if(m.includes(x))return ERR[x];return 'Что-то пошло не так. Попробуй ещё раз'};
const authErr=e=>{const m=(e&&e.message)||'';if(/invalid login/i.test(m))return 'Неверный email или пароль';if(/already registered/i.test(m))return 'Этот email уже зарегистрирован. Войди в аккаунт';if(/rate limit|too many/i.test(m))return 'Слишком много попыток, подожди немного';if(/password/i.test(m))return 'Пароль слишком простой, придумай посложнее';return 'Не получилось. Проверь данные и попробуй ещё раз'};
function t(m){const e=$('toast');e.textContent=m;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),2600)}

/* ---------- данные ---------- */
async function loadReq(){const {data,error}=await sb.from('v_requests').select('*').order('created_at',{ascending:false});if(!error)R=(data||[]).map(x=>({id:x.id,s:x.subject,text:x.body,amount:x.amount,due:x.due,status:x.status,role:x.my_role}))}
async function loadProf(){if(!st.me){st.prof=null;return}const {data}=await sb.from('profiles').select('name,balance').eq('id',st.me.id).maybeSingle();st.prof=data||{name:'Студент',balance:0}}
async function loadMsgs(){if(!st.rid)return;const {data}=await sb.from('messages').select('*').eq('request_id',st.rid).order('created_at');MSG=data||[]}
async function loadTx(){const {data}=await sb.from('transactions').select('*').order('created_at',{ascending:false}).limit(30);TX=data||[]}
async function refresh(){await Promise.all([loadReq(),loadProf()]);st.noAnim=true;render()}

/* ---------- навигация ---------- */
function leaveChat(){if(st.ch){sb.removeChannel(st.ch);st.ch=null}}
function go(v,id){
 if(v!=='chat'){st.from=null;leaveChat()}
 st.view=v;st.form=false;
 if(v==='subject')st.sid=id;
 if(v==='chat'){st.rid=id;MSG=[];leaveChat();
  st.ch=sb.channel('chat-'+id).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'request_id=eq.'+id},async()=>{await loadMsgs();if(MSG.length&&MSG[MSG.length-1].kind==='sys')await Promise.all([loadReq(),loadProf()]);st.noAnim=true;st.pop=true;render()}).subscribe()}
 render();window.scrollTo(0,0);
 if(v==='chat')Promise.all([loadMsgs(),loadReq()]).then(()=>{st.noAnim=true;render()});
 else if(v==='wallet')Promise.all([loadProf(),loadTx()]).then(()=>{st.noAnim=true;render()});
 else if(v!=='auth')refresh();
}
function setRole(r){st.role=r;if(r==='c'&&st.view==='deals')st.view='home';render()}
function needAuth(msg){st.prev={view:st.view,sid:st.sid,rid:st.rid};st.authMsg=msg;st.mode='login';st.view='auth';render()}
function needDeals(){if(!st.me)return needAuth('Войдите, чтобы увидеть свои сделки');go('deals')}
function setMode(m){st.mode=m;st.noAnim=true;render()}

/* ---------- отображение ---------- */
const mineReq=r=>r.role==='customer';
const money=r=>mineReq(r)?`<span>Бюджет: <b>${r.amount} ₽</b></span>`:`<span>Вы получите: <b>${r.amount} ₽</b></span>`;
function accHtml(){return st.me?`<div class="who"><button class="bal" onclick="go('wallet')">${fm((st.prof&&st.prof.balance)||0)}</button><span class="av">${esc(((st.prof&&st.prof.name)||st.me.email||'?')[0].toUpperCase())}</span><span class="nm">${esc((st.prof&&st.prof.name)||'')}</span><button class="lnk" onclick="logout()">Выйти</button></div>`:`<button class="btn" style="padding:8px 16px" onclick="needAuth('')">Войти</button>`}
const myDeals=()=>R.filter(r=>r.role==='performer');
function navHtml(){if(st.role!=='p')return '';const d=st.view==='deals'||st.from==='deals',n=myDeals().filter(r=>r.status==='taken').length;return `<div class="tabs" style="max-width:340px;margin:6px 0 0"><button class="${d?'':'on'}" onclick="go('home')">Запросы</button><button class="${d?'on':''}" onclick="needDeals()">Мои сделки${n?`<span class="badge">${n}</span>`:''}</button></div>`}
function reqCard(r){
 let act;
 if(st.role==='p')act=r.status==='open'?`<button class="btn" onclick="take(${r.id})">Откликнуться</button>`:`<button class="btn ghost" onclick="go('chat',${r.id})">Открыть чат</button>`;
 else act=r.status==='open'?'<span class="sub">Ждём отклика исполнителя…</span>':`<button class="btn ghost" onclick="go('chat',${r.id})">Открыть чат</button>`;
 return `<div class="card ${ra()}"><span class="tag ${r.status}">${lab[r.status]}</span><div>${esc(r.text)}</div><div class="meta">${money(r)}<span>Срок: <b>${fmtD(r.due)}</b></span></div>${act}</div>`}
function howHtml(){const s=[['01','Опиши задачу','Выбери предмет и расскажи, с чем нужна помощь.'],['02','Найди исполнителя','Исполнитель откликается, и вы договариваетесь в чате.'],['03','Оплати с баланса','Деньги списываются с баланса аккаунта по твоей кнопке.']];return `<h2 class="sec ${ra()}">Как это работает</h2><div class="how">${s.map(x=>`<div class="card ${ra()}"><span class="num">${x[0]}</span><b>${x[1]}</b><span class="sub">${x[2]}</span></div>`).join('')}</div>`}
function formHtml(){return `<div class="card ${ra()}" style="margin-top:14px"><label>С чем нужна помощь? Опиши, что хочешь понять или проверить</label><textarea id="f_text" placeholder="Например: не понимаю, как работает JOIN, хочу разобрать на примере"></textarea><div class="two"><div><label>Бюджет, ₽</label><input type="number" id="f_b" min="50" value="500"></div><div><label>Срок</label><input type="date" id="f_d"></div></div><div class="chk"><input type="checkbox" id="f_ok"><span>Мне нужна помощь, чтобы разобраться: объяснение, проверка или консультация. Я не прошу сделать работу, которую сдам как свою.</span></div><button class="btn" onclick="addReq()">Отправить запрос</button></div>`}
function authHtml(){const r=st.mode==='reg';return `<div class="authbox card ${ra()}"><h1 style="font-size:26px;margin:0">${r?'Создать аккаунт':'Вход'}</h1>${st.authMsg?`<p class="hint">${esc(st.authMsg)}</p>`:''}<div class="tabs"><button class="${r?'':'on'}" onclick="setMode('login')">Вход</button><button class="${r?'on':''}" onclick="setMode('reg')">Регистрация</button></div>${r?'<label>Имя</label><input type="text" id="a_name" autocomplete="name">':''}<label>Email</label><input type="email" id="a_email" autocomplete="email"><label>Пароль${r?' (от 8 символов)':''}</label><input type="password" id="a_pass" autocomplete="${r?'new-password':'current-password'}" onkeydown="if(event.key==='Enter')submitAuth()"><div class="err" id="a_err"></div><button class="btn" style="width:100%" onclick="submitAuth()">${r?'Создать аккаунт':'Войти'}</button><p class="hint" style="margin-top:6px">Тестовая версия: платежи пока условные.</p></div>`}
function walletHtml(){
 if(!st.me)return '<p class="sub">Войдите, чтобы увидеть баланс</p>';
 const dt=x=>new Date(x).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
 return `<button class="back" onclick="go('home')">← Назад</button><h1 class="${ra()}" style="margin-top:10px">Баланс</h1><div class="card ${ra()}"><span class="sub">Доступно</span><div class="big">${fm((st.prof&&st.prof.balance)||0)}</div><label>Сумма, ₽</label><input type="number" id="w_amt" min="1" value="500"><div class="qk">${[500,1000,2000].map(v=>`<button class="chip" onclick="document.getElementById('w_amt').value=${v}">${v} ₽</button>`).join('')}</div><div class="two" style="margin-top:8px"><button class="btn" onclick="topUp()">Пополнить</button><button class="btn ghost" onclick="withdraw()">Вывести</button></div><p class="hint">Демо: пополнение и вывод условные. Реальные платежи подключатся позже.</p></div><h2 class="sec">История</h2><div class="card ${ra()}">${TX.length?TX.map(x=>`<div class="tx"><span>${esc(x.note)}<br><span class="sub">${dt(x.created_at)}</span></span><span class="${x.delta>0?'plus':'minus'}">${x.delta>0?'+':'−'}${fm(Math.abs(x.delta))}</span></div>`).join(''):'<span class="sub">Операций пока нет</span>'}</div>`}
function dealsHtml(){
 const all=myDeals(),act=all.filter(r=>/^(taken|paid)$/.test(r.status)),done=all.filter(r=>r.status==='done');
 const wait=act.reduce((s,r)=>s+r.amount,0),got=done.reduce((s,r)=>s+r.amount,0);
 const card=r=>`<button class="card ${ra()}" onclick="st.from='deals';go('chat',${r.id})"><div class="row"><span class="tag ${r.status}">${lab[r.status]}</span><span class="sub">${S[r.s]}</span></div><div>${esc(r.text)}</div><div class="meta"><span>Вы получите: <b>${r.amount} ₽</b></span><span>Срок: <b>${fmtD(r.due)}</b></span></div></button>`;
 const stat=(l,v)=>`<div class="card"><span class="sub">${l}</span><b style="font-size:26px">${v}</b></div>`;
 return `<h1 class="${ra()}">Мои сделки</h1><div class="grid ${ra()}" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${stat('В работе',act.length)}${stat('Ожидается',wait+' ₽')}${stat('Получено',got+' ₽')}</div><h2 class="sec">Актуальные</h2><div class="list" style="margin-top:0">${act.length?act.map(card).join(''):`<div class="card ${ra()}"><span class="sub">Актуальных сделок пока нет. Откликнись на запрос по нужному предмету.</span><div><button class="btn" onclick="go('home')">Найти запросы</button></div></div>`}</div>${done.length?`<h2 class="sec">Завершённые</h2><div class="list" style="margin-top:0">${done.map(card).join('')}</div>`:''}`}
function chatHtml(r){
 const step=r.status==='open'?0:r.status==='taken'?1:2,meId=st.me&&st.me.id,cust=mineReq(r);
 const pay=r.status==='taken'&&cust?`<button class="btn" style="margin-top:12px;width:100%" onclick="payIt(${r.id})">Оплатить ${r.amount} ₽</button><p class="hint" style="margin-top:8px;text-align:center">На балансе: ${fm((st.prof&&st.prof.balance)||0)}</p>`:'';
 const info=r.status==='paid'?`<div class="pay">${cust?'Оплата получена. Спасибо!':`Оплата получена. На ваш баланс зачислено: <b>${r.amount} ₽</b>.`}</div>`:'';
 const n=MSG.length,msgs=MSG.map((m,i)=>`<div class="msg ${m.kind==='sys'?'sys':m.sender_id===meId?'me':''} ${st.pop&&i===n-1?'pop':''}">${esc(m.body)}</div>`).join('')||'<div class="msg sys">Начните диалог</div>';
 return `${st.from==='deals'?`<button class="back" onclick="go('deals')">← Мои сделки</button>`:`<button class="back" onclick="go('subject',${r.s})">← ${S[r.s]}</button>`}<div class="card ${ra()}" style="margin-top:12px"><div>${esc(r.text)}</div><div class="meta">${money(r)}<span>Срок: <b>${fmtD(r.due)}</b></span></div></div><div class="steps ${ra()}"><div class="on">Запрос</div><div class="${step>=1?'on':''}">В работе</div><div class="${step>=2?'on':''}">Оплачено</div></div><div class="card ${ra()}"><div class="chat" id="chat">${msgs}</div><div class="send"><input type="text" id="mt" placeholder="Сообщение…" maxlength="2000" onkeydown="if(event.key==='Enter')send(${r.id})"><button class="btn" onclick="send(${r.id})">➤</button></div>${pay}${info}</div>`}
function render(){
 k=0;$('seg').dataset.r=st.role;$('acc').innerHTML=accHtml();$('nav').innerHTML=navHtml();
 const a=$('app'),kept=$('mt')?$('mt').value:'',hadFocus=$('mt')&&document.activeElement===$('mt');
 if(st.view==='home'){
  const open=R.filter(r=>r.status==='open').length;
  a.innerHTML=`<div class="eyebrow ${ra()}">Помощь студентов студентам</div><h1 class="${ra()}">${st.role==='c'?'Выбери предмет и <span class="grad">оставь запрос</span>':'Выбери предмет и <span class="grad">найди запросы</span>'}</h1><p class="lead ${ra()}">${st.role==='c'?'Опиши, с чем нужна помощь. Исполнитель откликнется, и вы договоритесь в чате.':'Смотри запросы по предмету и откликайся на те, с которыми можешь помочь.'}</p><div class="pills ${ra()}"><span>${S.length} предметов</span><span>${open} открытых запросов</span><span>Оплата с баланса</span></div><div class="grid">${S.map((n,i)=>{const c=R.filter(r=>r.s===i&&r.status==='open').length;return `<button class="card ${ra()}" onclick="go('subject',${i})"><div class="row"><div class="ico">${String(i+1).padStart(2,'0')}</div><span class="arr">→</span></div><b>${n}</b><span class="sub">${c?'Открытых запросов: '+c:'Пока нет запросов'}</span></button>`}).join('')}</div>${howHtml()}`;
 }else if(st.view==='subject'){
  const list=R.filter(r=>r.s===st.sid&&(st.role==='p'?!mineReq(r):mineReq(r)));
  a.innerHTML=`<button class="back" onclick="go('home')">← Все предметы</button><h1 class="${ra()}" style="margin-top:10px">${S[st.sid]}</h1>${st.role==='c'?`<div class="${ra()}"><button class="btn" onclick="if(!st.me)return needAuth('Войдите, чтобы оставить запрос');st.form=!st.form;st.noAnim=false;render()">${st.form?'Скрыть форму':'+ Оставить запрос'}</button></div>`:''}${st.form&&st.role==='c'?formHtml():''}<div class="list">${list.length?list.map(reqCard).join(''):`<div class="sub ${ra()}">${st.role==='c'?'У тебя пока нет запросов по этому предмету.':'Запросов по этому предмету пока нет.'}</div>`}</div>`;
 }else if(st.view==='wallet'){a.innerHTML=walletHtml();
 }else if(st.view==='deals'){a.innerHTML=dealsHtml();
 }else if(st.view==='auth'){a.innerHTML=authHtml();
 }else{
  const r=R.find(x=>x.id===st.rid);
  a.innerHTML=r?chatHtml(r):'<div class="sub">Загрузка…</div>';
  const c=$('chat');if(c)c.scrollTop=c.scrollHeight;
  if(kept&&$('mt')){$('mt').value=kept;if(hadFocus)$('mt').focus()}
 }
 st.noAnim=false;st.pop=false;
}

/* ---------- действия ---------- */
async function addReq(){
 const x=$('f_text').value.trim(),b=+$('f_b').value;
 if(x.length<10)return t('Опиши запрос подробнее');
 if(!b||b<50)return t('Укажи бюджет от 50 ₽');
 if(!$('f_ok').checked)return t('Подтверди условие про помощь в обучении');
 const {error}=await sb.rpc('create_request',{p_subject:st.sid,p_body:x,p_budget:Math.round(b),p_due:$('f_d').value||null});
 if(error)return t(em(error));
 st.form=false;await loadReq();render();t('Запрос опубликован');
}
async function take(id){
 if(!st.me)return needAuth('Войдите, чтобы откликнуться на запрос');
 const {error}=await sb.rpc('take_request',{p_id:id});
 if(error)return t(em(error));
 await loadReq();go('chat',id);t('Вы откликнулись. Договоритесь в чате');
}
async function send(id){
 const i=$('mt'),x=i.value.trim();if(!x)return;i.value='';
 const {error}=await sb.rpc('send_message',{p_id:id,p_body:x});
 if(error){i.value=x;return t(em(error))}
 await loadMsgs();st.noAnim=true;st.pop=true;render();$('mt')&&$('mt').focus();
}
async function payIt(id){
 const {error}=await sb.rpc('pay_request',{p_id:id});
 if(error){if((error.message||'').includes('insufficient_funds')){t('Недостаточно средств. Пополни баланс');return go('wallet')}return t(em(error))}
 await Promise.all([loadReq(),loadProf(),loadMsgs()]);st.noAnim=true;st.pop=true;render();t('Оплачено с баланса');
}
async function topUp(){
 const a=Math.round(+$('w_amt').value);if(!a||a<100)return t('Минимум 100 ₽');
 const {error}=await sb.rpc('demo_top_up',{p_amount:a});if(error)return t(em(error));
 await Promise.all([loadProf(),loadTx()]);st.noAnim=true;render();t('Баланс пополнен (демо)');
}
async function withdraw(){
 const a=Math.round(+$('w_amt').value);if(!a||a<1)return t('Укажи сумму');
 const {error}=await sb.rpc('demo_withdraw',{p_amount:a});if(error)return t(em(error));
 await Promise.all([loadProf(),loadTx()]);st.noAnim=true;render();t('Заявка на вывод создана (демо)');
}
async function submitAuth(){
 if(st.busy)return;
 const e=($('a_email').value||'').trim().toLowerCase(),p=$('a_pass').value,err=m=>{$('a_err').textContent=m},reg=st.mode==='reg';
 if(!/^\S+@\S+\.\S+$/.test(e))return err('Проверь email');
 if(p.length<8)return err('Пароль — минимум 8 символов');
 let n='';if(reg){n=($('a_name').value||'').trim();if(n.length<2)return err('Введи имя')}
 st.busy=true;err('');
 try{
  if(reg){
   const {data,error}=await sb.auth.signUp({email:e,password:p,options:{data:{name:n}}});
   if(error)throw error;
   if(!data.session){err('Мы отправили письмо. Подтверди email и войди в аккаунт.');return}
   st.me=data.user;
  }else{
   const {data,error}=await sb.auth.signInWithPassword({email:e,password:p});
   if(error)throw error;st.me=data.user;
  }
  await Promise.all([loadProf(),loadReq()]);
  const pv=st.prev||{view:'home'};st.view=pv.view;st.sid=pv.sid;st.rid=pv.rid;st.prev=null;st.authMsg='';
  render();t(reg?'Аккаунт создан':'Вы вошли');
 }catch(x){err(authErr(x))}finally{st.busy=false}
}
async function logout(){await sb.auth.signOut();st.me=null;st.prof=null;go('home');t('Вы вышли')}

/* ---------- старт ---------- */
(async()=>{
 render();
 const {data}=await sb.auth.getSession();st.me=data.session?data.session.user:null;
 sb.auth.onAuthStateChange((ev,s)=>{st.me=s?s.user:null});
 await refresh();
})();
