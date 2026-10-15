const S=['Интеллектуальные системы и технологии','Устройство и функционирование информационных систем','Внедрение информационных систем','Инженерно-техническая поддержка сопровождения ИС','Иностранный язык в ПД','Основы предпринимательства','Социально-значимая деятельность','Управление и автоматизация баз данных','Учебная и производственная практика ПМ.06','Физическая культура','Экономика отрасли','Стандартизация, сертификация и техническая документация'];
let R=[
{id:1,s:7,text:'Не понимаю, как связать три таблицы через внешние ключи. Нужно объяснить на примере моей схемы.',budget:500,due:'2026-10-19',status:'open',mine:false,msgs:[]},
{id:2,s:7,text:'Нужна проверка моих SQL-запросов: где ошибки и как оптимизировать.',budget:400,due:'2026-10-21',status:'open',mine:false,msgs:[]},
{id:3,s:0,text:'Хочу разобраться, чем отличаются обучение с учителем и без. Нужна консультация на пальцах.',budget:350,due:'2026-10-22',status:'open',mine:false,msgs:[]},
{id:4,s:4,text:'Нужна разговорная практика по IT-английскому перед зачётом.',budget:600,due:'2026-10-25',status:'open',mine:false,msgs:[]},
{id:5,s:10,text:'Помогите разобраться с расчётом рентабельности, не понимаю формулы.',budget:450,due:'2026-10-24',status:'open',mine:false,msgs:[]}];
let st={role:'c',view:'home',sid:null,rid:null,form:false,noAnim:false,pop:false,mode:'login',prev:null,me:null,authMsg:''},nid=10,k=0;
const mem={};
const ls={get(x){try{return localStorage.getItem(x)}catch(e){return mem[x]||null}},set(x,v){try{localStorage.setItem(x,v)}catch(e){mem[x]=v}},del(x){try{localStorage.removeItem(x)}catch(e){delete mem[x]}}};
const users=()=>{try{return JSON.parse(ls.get('imi_users')||'{}')}catch(e){return {}}};
const me=()=>st.me?users()[st.me]||null:null;
const fm=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';
function adj(e,d,txt){const U=users();if(!U[e])return;U[e].bal=Math.round((U[e].bal||0)+d);U[e].tx=[{d,txt,at:Date.now()}].concat(U[e].tx||[]).slice(0,30);ls.set('imi_users',JSON.stringify(U))}
async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
st.me=ls.get('imi_session');
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtD=d=>d?d.split('-').reverse().join('.'):'—';
const ra=()=>st.noAnim?'':`rise" style="--i:${Math.min(k++,9)}`;
function t(m){const e=$('toast');e.textContent=m;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),2400)}
function go(v,id){if(v!=='chat')st.from=null;st.view=v;st.form=false;if(v==='subject')st.sid=id;if(v==='chat')st.rid=id;render();window.scrollTo(0,0)}
function setRole(r){st.role=r;if(r==='c'&&st.view==='deals')st.view='home';render()}
const lab={open:'Открыт',taken:'В работе',paid:'Оплачен'};
const pay80=r=>Math.round(r.budget*0.8);
const money=r=>st.role==='c'?`<span>Бюджет: <b>${r.budget} ₽</b></span>`:`<span>Вы получите: <b>${pay80(r)} ₽</b></span>`;
function reqCard(r){
 let act;
 if(st.role==='p')act=r.status==='open'?`<button class="btn" onclick="take(${r.id})">Откликнуться</button>`:`<button class="btn ghost" onclick="go('chat',${r.id})">Открыть чат</button>`;
 else act=r.status==='open'?'<span class="sub">Ждём отклика исполнителя…</span>':`<button class="btn ghost" onclick="go('chat',${r.id})">Открыть чат</button>`;
 return `<div class="card ${ra()}"><span class="tag ${r.status}">${lab[r.status]}</span><div>${esc(r.text)}</div><div class="meta">${money(r)}<span>Срок: <b>${fmtD(r.due)}</b></span></div>${act}</div>`}
function render(){
 k=0;$('seg').dataset.r=st.role;$('acc').innerHTML=accHtml();$('nav').innerHTML=navHtml();
 const a=$('app');
 if(st.view==='home'){
  a.innerHTML=`<div class="eyebrow ${ra()}">Помощь студентов студентам</div><h1 class="${ra()}">${st.role==='c'?'Выбери предмет и <span class="grad">оставь запрос</span>':'Выбери предмет и <span class="grad">найди запросы</span>'}</h1><p class="lead ${ra()}">${st.role==='c'?'Опиши, с чем нужна помощь. Исполнитель откликнется, и вы договоритесь в чате.':'Смотри запросы по предмету и откликайся на те, с которыми можешь помочь.'}</p><div class="pills ${ra()}"><span>${S.length} предметов</span><span>${R.filter(r=>r.status==='open').length} открытых запросов</span><span>Оплата с баланса</span></div><div class="grid">${S.map((n,i)=>{const c=R.filter(r=>r.s===i&&r.status==='open').length;return `<button class="card ${ra()}" onclick="go('subject',${i})"><div class="row"><div class="ico">${String(i+1).padStart(2,'0')}</div><span class="arr">→</span></div><b>${n}</b><span class="sub">${c?'Открытых запросов: '+c:'Пока нет запросов'}</span></button>`}).join('')}</div>${howHtml()}`;
 }else if(st.view==='subject'){
  const list=R.filter(r=>r.s===st.sid&&(st.role==='p'?true:(!!st.me&&r.owner===st.me)));
  a.innerHTML=`<button class="back" onclick="go('home')">← Все предметы</button><h1 class="${ra()}" style="margin-top:10px">${S[st.sid]}</h1>${st.role==='c'?`<div class="${ra()}"><button class="btn" onclick="if(!me())return needAuth('Войдите, чтобы оставить запрос');st.form=!st.form;st.noAnim=false;render()">${st.form?'Скрыть форму':'+ Оставить запрос'}</button></div>`:''}${st.form&&st.role==='c'?formHtml():''}<div class="list">${list.length?list.map(reqCard).join(''):`<div class="sub ${ra()}">${st.role==='c'?'У тебя пока нет запросов по этому предмету.':'Запросов по этому предмету пока нет.'}</div>`}</div>`;
 }else if(st.view==='wallet'){
  a.innerHTML=walletHtml();
 }else if(st.view==='deals'){
  a.innerHTML=dealsHtml();
 }else if(st.view==='auth'){
  a.innerHTML=authHtml();
 }else{
  const r=R.find(x=>x.id===st.rid),step=r.status==='open'?0:r.status==='taken'?1:2,n=r.msgs.length;
  const pay=r.status==='taken'&&st.role==='c'?`<button class="btn" style="margin-top:12px;width:100%" onclick="payIt(${r.id})">Оплатить ${r.budget} ₽</button><p class="hint" style="margin-top:8px;text-align:center">На балансе: ${fm((me()||{}).bal||0)}</p>`:'';
  const info=r.status==='paid'?`<div class="pay">${st.role==='p'?`Оплата получена. На ваш баланс зачислено: <b>${pay80(r)} ₽</b>.`:'Оплата получена. Спасибо!'}</div>`:'';
  const msgs=r.msgs.map((m,i)=>`<div class="msg ${m.w==='sys'?'sys':m.w===st.role?'me':''} ${st.pop&&i===n-1?'pop':''}">${esc(m.x)}</div>`).join('')||'<div class="msg sys">Начните диалог</div>';
  a.innerHTML=`${st.from==='deals'?`<button class="back" onclick="go('deals')">← Мои сделки</button>`:`<button class="back" onclick="go('subject',${r.s})">← ${S[r.s]}</button>`}<div class="card ${ra()}" style="margin-top:12px"><div>${esc(r.text)}</div><div class="meta">${money(r)}<span>Срок: <b>${fmtD(r.due)}</b></span></div></div><div class="steps ${ra()}"><div class="${step>=0?'on':''}">Запрос</div><div class="${step>=1?'on':''}">В работе</div><div class="${step>=2?'on':''}">Оплачено</div></div><div class="card ${ra()}"><div class="chat" id="chat">${msgs}</div><div class="send"><input type="text" id="mt" placeholder="Сообщение…" onkeydown="if(event.key==='Enter')send(${r.id})"><button class="btn" onclick="send(${r.id})">➤</button></div>${pay}${info}</div>`;
  const c=$('chat');c.scrollTop=c.scrollHeight;
 }
 st.noAnim=false;st.pop=false;
}
function accHtml(){const u=me();return u?`<div class="who"><button class="bal" onclick="go('wallet')">${fm(u.bal||0)}</button><span class="av">${esc(u.name[0].toUpperCase())}</span><span class="nm">${esc(u.name)}</span><button class="lnk" onclick="logout()">Выйти</button></div>`:`<button class="btn" style="padding:8px 16px" onclick="needAuth('')">Войти</button>`}
function needAuth(msg){st.prev={view:st.view,sid:st.sid,rid:st.rid};st.authMsg=msg;st.mode='login';go('auth')}
function setMode(m){st.mode=m;st.noAnim=true;render()}
function authHtml(){const r=st.mode==='reg';return `<div class="authbox card ${ra()}"><h1 style="font-size:26px;margin:0">${r?'Создать аккаунт':'Вход'}</h1>${st.authMsg?`<p class="hint">${esc(st.authMsg)}</p>`:''}<div class="tabs"><button class="${r?'':'on'}" onclick="setMode('login')">Вход</button><button class="${r?'on':''}" onclick="setMode('reg')">Регистрация</button></div>${r?'<label>Имя</label><input type="text" id="a_name" autocomplete="name">':''}<label>Email</label><input type="email" id="a_email" autocomplete="email"><label>Пароль${r?' (от 8 символов)':''}</label><input type="password" id="a_pass" autocomplete="${r?'new-password':'current-password'}" onkeydown="if(event.key==='Enter')submitAuth()"><div class="err" id="a_err"></div><button class="btn" style="width:100%" onclick="submitAuth()">${r?'Создать аккаунт':'Войти'}</button><p class="hint" style="margin-top:6px">Демо: аккаунт хранится только в этом браузере. Настоящая регистрация появится после подключения базы данных.</p></div>`}
async function submitAuth(){
 const e=($('a_email').value||'').trim().toLowerCase(),p=$('a_pass').value,err=m=>{$('a_err').textContent=m};
 if(!/^\S+@\S+\.\S+$/.test(e))return err('Проверь email');
 if(p.length<8)return err('Пароль — минимум 8 символов');
 const U=users();
 if(st.mode==='reg'){
  const n=($('a_name').value||'').trim();
  if(n.length<2)return err('Введи имя');
  if(U[e])return err('Этот email уже зарегистрирован. Войди в аккаунт');
  const salt=[...crypto.getRandomValues(new Uint8Array(8))].map(x=>x.toString(16).padStart(2,'0')).join('');
  U[e]={name:n,salt,hash:await sha(salt+p),bal:0,tx:[]};ls.set('imi_users',JSON.stringify(U));
 }else{
  const u=U[e];
  if(!u||u.hash!==await sha(u.salt+p))return err('Неверный email или пароль');
 }
 const reg=st.mode==='reg';ls.set('imi_session',e);st.me=e;
 const pv=st.prev||{view:'home'};st.view=pv.view;st.sid=pv.sid;st.rid=pv.rid;st.prev=null;st.authMsg='';render();t(reg?'Аккаунт создан':'Вы вошли');
}
function logout(){ls.del('imi_session');st.me=null;go('home');t('Вы вышли')}
const myDeals=()=>R.filter(r=>st.me&&r.performer===st.me);
function navHtml(){if(st.role!=='p')return '';const d=st.view==='deals'||st.from==='deals',n=myDeals().filter(r=>r.status==='taken').length;return `<div class="tabs" style="max-width:340px;margin:6px 0 0"><button class="${d?'':'on'}" onclick="go('home')">Запросы</button><button class="${d?'on':''}" onclick="needDeals()">Мои сделки${n?`<span class="badge">${n}</span>`:''}</button></div>`}
function needDeals(){if(!me())return needAuth('Войдите, чтобы увидеть свои сделки');go('deals')}
function dealsHtml(){
 const all=myDeals(),act=all.filter(r=>r.status==='taken'),done=all.filter(r=>r.status==='paid');
 const wait=act.reduce((s,r)=>s+pay80(r),0),got=done.reduce((s,r)=>s+pay80(r),0);
 const card=r=>`<button class="card ${ra()}" onclick="st.from='deals';go('chat',${r.id})"><div class="row"><span class="tag ${r.status}">${lab[r.status]}</span><span class="sub">${S[r.s]}</span></div><div>${esc(r.text)}</div><div class="meta"><span>Вы получите: <b>${pay80(r)} ₽</b></span><span>Срок: <b>${fmtD(r.due)}</b></span></div></button>`;
 const stat=(l,v)=>`<div class="card"><span class="sub">${l}</span><b style="font-size:26px">${v}</b></div>`;
 return `<h1 class="${ra()}">Мои сделки</h1><div class="grid ${ra()}" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${stat('В работе',act.length)}${stat('Ожидается',wait+' ₽')}${stat('Получено',got+' ₽')}</div><h2 class="sec">Актуальные</h2><div class="list" style="margin-top:0">${act.length?act.map(card).join(''):`<div class="card ${ra()}"><span class="sub">Актуальных сделок пока нет. Откликнись на запрос по нужному предмету.</span><div><button class="btn" onclick="go('home')">Найти запросы</button></div></div>`}</div>${done.length?`<h2 class="sec">Завершённые</h2><div class="list" style="margin-top:0">${done.map(card).join('')}</div>`:''}`}
function howHtml(){const s=[['01','Опиши задачу','Выбери предмет и расскажи, с чем нужна помощь.'],['02','Найди исполнителя','Исполнитель откликается, и вы договариваетесь в чате.'],['03','Оплати с баланса','Деньги списываются с баланса аккаунта по твоей кнопке.']];return `<h2 class="sec ${ra()}">Как это работает</h2><div class="how">${s.map(x=>`<div class="card ${ra()}"><span class="num">${x[0]}</span><b>${x[1]}</b><span class="sub">${x[2]}</span></div>`).join('')}</div>`}
function formHtml(){return `<div class="card ${ra()}" style="margin-top:14px"><label>С чем нужна помощь? Опиши, что хочешь понять или проверить</label><textarea id="f_text" placeholder="Например: не понимаю, как работает JOIN, хочу разобрать на примере"></textarea><div class="two"><div><label>Бюджет, ₽</label><input type="number" id="f_b" min="50" value="500"></div><div><label>Срок</label><input type="date" id="f_d"></div></div><div class="chk"><input type="checkbox" id="f_ok"><span>Мне нужна помощь, чтобы разобраться: объяснение, проверка или консультация. Я не прошу сделать работу, которую сдам как свою.</span></div><button class="btn" onclick="addReq()">Отправить запрос</button></div>`}
function addReq(){
 const x=$('f_text').value.trim(),b=+$('f_b').value;
 if(x.length<10)return t('Опиши запрос подробнее');
 if(!b||b<50)return t('Укажи бюджет от 50 ₽');
 if(!$('f_ok').checked)return t('Подтверди условие про помощь в обучении');
 R.unshift({id:nid++,s:st.sid,text:x,budget:b,due:$('f_d').value,status:'open',mine:true,owner:st.me,msgs:[]});
 st.form=false;render();t('Запрос отправлен исполнителям');
}
function take(id){if(!me())return needAuth('Войдите, чтобы откликнуться на запрос');const r=R.find(x=>x.id===id);r.status='taken';r.performer=st.me;r.msgs.push({w:'sys',x:'Исполнитель откликнулся на запрос'});go('chat',id);t('Вы откликнулись. Договоритесь в чате')}
function send(id){const i=$('mt'),x=i.value.trim();if(!x)return;R.find(r=>r.id===id).msgs.push({w:st.role,x});st.noAnim=true;st.pop=true;render();$('mt').focus()}
function payIt(id){const r=R.find(x=>x.id===id),u=me();if(!u)return needAuth('Войдите, чтобы оплатить');if((u.bal||0)<r.budget){t('Недостаточно средств. Пополни баланс');return go('wallet')}adj(st.me,-r.budget,'Оплата запроса');if(r.performer)adj(r.performer,pay80(r),'Выплата по сделке');r.status='paid';r.msgs.push({w:'sys',x:'Заказчик оплатил запрос'});st.noAnim=true;st.pop=true;render();t('Оплачено с баланса')}
function walletHtml(){
 const u=me();if(!u)return '<p class="sub">Войдите, чтобы увидеть баланс</p>';
 const tx=u.tx||[],dt=x=>new Date(x).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
 return `<button class="back" onclick="go('home')">← Назад</button><h1 class="${ra()}" style="margin-top:10px">Баланс</h1><div class="card ${ra()}"><span class="sub">Доступно</span><div class="big">${fm(u.bal||0)}</div><label>Сумма, ₽</label><input type="number" id="w_amt" min="1" value="500"><div class="qk">${[500,1000,2000].map(v=>`<button class="chip" onclick="document.getElementById('w_amt').value=${v}">${v} ₽</button>`).join('')}</div><div class="two" style="margin-top:8px"><button class="btn" onclick="topUp()">Пополнить</button><button class="btn ghost" onclick="withdraw()">Вывести</button></div><p class="hint">Демо: пополнение и вывод условные. Реальные платежи подключатся позже.</p></div><h2 class="sec">История</h2><div class="card ${ra()}">${tx.length?tx.map(x=>`<div class="tx"><span>${esc(x.txt)}<br><span class="sub">${dt(x.at)}</span></span><span class="${x.d>0?'plus':'minus'}">${x.d>0?'+':'−'}${fm(Math.abs(x.d))}</span></div>`).join(''):'<span class="sub">Операций пока нет</span>'}</div>`}
function topUp(){const a=Math.round(+$('w_amt').value);if(!a||a<100)return t('Минимум 100 ₽');adj(st.me,a,'Пополнение');st.noAnim=true;render();t('Баланс пополнен')}
function withdraw(){const a=Math.round(+$('w_amt').value),u=me();if(!a||a<1)return t('Укажи сумму');if(a>(u.bal||0))return t('Недостаточно средств');adj(st.me,-a,'Вывод средств');st.noAnim=true;render();t('Заявка на вывод создана (демо)')}
render();
