var Y=Object.defineProperty;var F=(e,t,s)=>t in e?Y(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s;var d=(e,t,s)=>F(e,typeof t!="symbol"?t+"":t,s);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function s(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(i){if(i.ep)return;i.ep=!0;const o=s(i);fetch(i.href,o)}})();(!globalThis.EventTarget||!globalThis.Event)&&console.error(`
  PartySocket requires a global 'EventTarget' class to be available!
  You can polyfill this global by adding this to your code before any partysocket imports: 
  
  \`\`\`
  import 'partysocket/event-target-polyfill';
  \`\`\`
  Please file an issue at https://github.com/partykit/partykit if you're still having trouble.
`);var U=class extends Event{constructor(t,s){super("error",s);d(this,"message");d(this,"error");this.message=t.message,this.error=t}},D=class extends Event{constructor(t=1e3,s="",n){super("close",n);d(this,"code");d(this,"reason");d(this,"wasClean",!0);this.code=t,this.reason=s}};const B={Event,ErrorEvent:U,CloseEvent:D};function Q(e,t){if(!e)throw new Error(t)}function z(e){return new e.constructor(e.type,e)}function J(e){return"data"in e?new MessageEvent(e.type,e):"code"in e||"reason"in e?new D(e.code||1999,e.reason||"unknown reason",e):"error"in e?new U(e.error,e):new Event(e.type,e)}var j;const X=typeof process<"u"&&typeof((j=process.versions)==null?void 0:j.node)<"u",Z=typeof navigator<"u"&&navigator.product==="ReactNative",R=X||Z?J:z,T={maxReconnectionDelay:1e4,minReconnectionDelay:3e3,minUptime:5e3,reconnectionDelayGrowFactor:1.3,connectionTimeout:4e3,maxRetries:Number.POSITIVE_INFINITY,maxEnqueuedMessages:Number.POSITIVE_INFINITY};let H=!1;function ee(){}var te=class E extends EventTarget{constructor(s,n,i={}){super();d(this,"_ws");d(this,"_retryCount",-1);d(this,"_uptimeTimeout");d(this,"_connectTimeout");d(this,"_shouldReconnect",!0);d(this,"_connectLock",!1);d(this,"_binaryType","blob");d(this,"_closeCalled",!1);d(this,"_didWarnAboutClosedSend",!1);d(this,"_messageQueue",[]);d(this,"_debugLogger",console.log.bind(console));d(this,"_url");d(this,"_protocols");d(this,"_options");d(this,"onclose",null);d(this,"onerror",null);d(this,"onmessage",null);d(this,"onopen",null);d(this,"_handleOpen",s=>{this._debug("open event");const{minUptime:n=T.minUptime}=this._options;clearTimeout(this._connectTimeout),this._uptimeTimeout=setTimeout(()=>this._acceptOpen(),n),Q(this._ws,"WebSocket is not defined"),this._ws.binaryType=this._binaryType,this._messageQueue.forEach(i=>{var o;(o=this._ws)==null||o.send(i)}),this._messageQueue=[],this.onopen&&this.onopen(s),this.dispatchEvent(R(s))});d(this,"_handleMessage",s=>{this._debug("message event"),this.onmessage&&this.onmessage(s),this.dispatchEvent(R(s))});d(this,"_handleError",s=>{this._debug("error event",s.message),this._disconnect(void 0,s.message==="TIMEOUT"?"timeout":void 0),this.onerror&&this.onerror(s),this._debug("exec error listeners"),this.dispatchEvent(R(s)),this._connect()});d(this,"_handleClose",s=>{this._debug("close event"),this._clearTimeouts(),this._options.shouldReconnectOnClose&&!this._options.shouldReconnectOnClose(s)&&(this._shouldReconnect=!1),this._shouldReconnect&&this._connect(),this.onclose&&this.onclose(s),this.dispatchEvent(R(s))});this._url=s,this._protocols=n,this._options=i,this._options.startClosed&&(this._shouldReconnect=!1),this._options.debugLogger&&(this._debugLogger=this._options.debugLogger),this._connect()}static get CONNECTING(){return 0}static get OPEN(){return 1}static get CLOSING(){return 2}static get CLOSED(){return 3}get CONNECTING(){return E.CONNECTING}get OPEN(){return E.OPEN}get CLOSING(){return E.CLOSING}get CLOSED(){return E.CLOSED}get binaryType(){return this._ws?this._ws.binaryType:this._binaryType}set binaryType(s){this._binaryType=s,this._ws&&(this._ws.binaryType=s)}get retryCount(){return Math.max(this._retryCount,0)}get bufferedAmount(){return this._messageQueue.reduce((s,n)=>(typeof n=="string"?s+=n.length:n instanceof Blob?s+=n.size:s+=n.byteLength,s),0)+(this._ws?this._ws.bufferedAmount:0)}get extensions(){return this._ws?this._ws.extensions:""}get protocol(){return this._ws?this._ws.protocol:""}get readyState(){return this._closeCalled?E.CLOSED:this._ws?this._ws.readyState:this._options.startClosed?E.CLOSED:E.CONNECTING}get url(){return this._ws?this._ws.url:""}get shouldReconnect(){return this._shouldReconnect}close(s=1e3,n){if(this._closeCalled=!0,this._shouldReconnect=!1,this._clearTimeouts(),!this._ws){this._debug("close enqueued: no ws instance");return}if(this._ws.readyState===this.CLOSED||this._ws.readyState===this.CLOSING){this._debug("close: already closing or closed");return}this._disconnect(s,n)}reconnect(s,n){this._shouldReconnect=!0,this._closeCalled=!1,this._didWarnAboutClosedSend=!1,this._retryCount=-1,!this._ws||this._ws.readyState===this.CLOSED||this._ws.readyState===this.CLOSING?this._connect():(this._disconnect(s,n),this._connect())}send(s){if(this._ws&&this._ws.readyState===this.OPEN)return this._debug("send",s),this._ws.send(s),!0;this._closeCalled&&!this._didWarnAboutClosedSend&&(this._didWarnAboutClosedSend=!0,console.warn("ReconnectingWebSocket: send() was called after close(). The message has been buffered, but it will only be delivered if reconnect() is called on this socket. If this socket has been discarded, the message is lost — this usually means a stale socket reference is being used."));const{maxEnqueuedMessages:n=T.maxEnqueuedMessages}=this._options;return this._messageQueue.length<n&&(this._debug("enqueue",s),this._messageQueue.push(s)),!1}drainQueuedMessages(){const s=this._messageQueue;return this._messageQueue=[],s}_debug(...s){this._options.debug&&this._debugLogger("RWS>",...s)}_getNextDelay(){const{reconnectionDelayGrowFactor:s=T.reconnectionDelayGrowFactor,minReconnectionDelay:n=T.minReconnectionDelay,maxReconnectionDelay:i=T.maxReconnectionDelay}=this._options;let o=0;return this._retryCount>0&&(o=n*s**(this._retryCount-1),o>i&&(o=i)),this._debug("next delay",o),o}_wait(){return new Promise(s=>{setTimeout(s,this._getNextDelay())})}_getNextProtocols(s){if(!s)return Promise.resolve(null);if(typeof s=="string"||Array.isArray(s))return Promise.resolve(s);if(typeof s=="function"){const n=s();if(!n)return Promise.resolve(null);if(typeof n=="string"||Array.isArray(n))return Promise.resolve(n);if(n.then)return n}throw Error("Invalid protocols")}_getNextUrl(s){if(typeof s=="string")return Promise.resolve(s);if(typeof s=="function"){const n=s();if(typeof n=="string")return Promise.resolve(n);if(n.then)return n}throw Error("Invalid URL")}_connect(){if(this._connectLock||!this._shouldReconnect)return;this._connectLock=!0;const{maxRetries:s=T.maxRetries,connectionTimeout:n=T.connectionTimeout}=this._options;if(this._retryCount>=s){this._debug("max retries reached",this._retryCount,">=",s),this._connectLock=!1;return}this._retryCount++,this._debug("connect",this._retryCount),this._removeListeners(),this._wait().then(()=>Promise.all([this._getNextUrl(this._url),this._getNextProtocols(this._protocols||null)])).then(([i,o])=>{if(this._closeCalled){this._connectLock=!1;return}!this._options.WebSocket&&typeof WebSocket>"u"&&!H&&(console.error(`‼️ No WebSocket implementation available. You should define options.WebSocket. 

For example, if you're using node.js, run \`npm install ws\`, and then in your code:

import PartySocket from 'partysocket';
import WS from 'ws';

const partysocket = new PartySocket({
  host: "127.0.0.1:1999",
  room: "test-room",
  WebSocket: WS
});

`),H=!0);const a=this._options.WebSocket||WebSocket;this._debug("connect",{url:i,protocols:o}),this._ws=o?new a(i,o):new a(i),this._ws.binaryType=this._binaryType,this._connectLock=!1,this._addListeners(),this._connectTimeout=setTimeout(()=>this._handleTimeout(),n)}).catch(i=>{this._connectLock=!1,this._handleError(new B.ErrorEvent(Error(i.message),this))})}_handleTimeout(){this._debug("timeout event"),this._handleError(new B.ErrorEvent(Error("TIMEOUT"),this))}_disconnect(s=1e3,n){if(this._clearTimeouts(),!!this._ws){this._removeListeners();try{(this._ws.readyState===this.OPEN||this._ws.readyState===this.CONNECTING)&&this._ws.close(s,n),this._handleClose(new B.CloseEvent(s,n,this))}catch{}}}_acceptOpen(){this._debug("accept open"),this._retryCount=0}_removeListeners(){this._ws&&(this._debug("removeListeners"),this._ws.removeEventListener("open",this._handleOpen),this._ws.removeEventListener("close",this._handleClose),this._ws.removeEventListener("message",this._handleMessage),this._ws.removeEventListener("error",this._handleError),this._ws.addEventListener("error",ee))}_addListeners(){this._ws&&(this._debug("addListeners"),this._ws.addEventListener("open",this._handleOpen),this._ws.addEventListener("close",this._handleClose),this._ws.addEventListener("message",this._handleMessage),this._ws.addEventListener("error",this._handleError))}_clearTimeouts(){clearTimeout(this._connectTimeout),clearTimeout(this._uptimeTimeout)}};const se=e=>e[1]!==null&&e[1]!==void 0;function ne(){if(crypto!=null&&crypto.randomUUID)return crypto.randomUUID();let e=Date.now(),t=(performance==null?void 0:performance.now)&&performance.now()*1e3||0;return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(s){let n=Math.random()*16;return e>0?(n=(e+n)%16|0,e=Math.floor(e/16)):(n=(t+n)%16|0,t=Math.floor(t/16)),(s==="x"?n:n&3|8).toString(16)})}function V(e,t,s={}){const{host:n,path:i,protocol:o,room:a,party:h,basePath:u,prefix:l,query:c}=e;let m=n.replace(/^(http|https|ws|wss):\/\//,"");if(m.endsWith("/")&&(m=m.slice(0,-1)),i!=null&&i.startsWith("/"))throw new Error("path must not start with a slash");const y=h??"main",f=i?`/${i}`:"",g=o||(m.startsWith("localhost:")||m.startsWith("127.0.0.1:")||m.startsWith("192.168.")||m.startsWith("10.")||m.startsWith("172.")&&m.split(".")[1]>="16"&&m.split(".")[1]<="31"||m.startsWith("[::ffff:7f00:1]:")?t:`${t}s`),b=`${g}://${m}/${u||`${l||"parties"}/${y}/${a}`}${f}`,A=(M={})=>`${b}?${new URLSearchParams([...Object.entries(s),...Object.entries(M).filter(se)])}`,I=typeof c=="function"?async()=>A(await c()):A(c);return{host:m,path:f,room:a,name:y,protocol:g,partyUrl:b,urlProvider:I}}var ie=class extends te{constructor(t){var n,i;const s=G(t);super(s.urlProvider,s.protocols,s.socketOptions);d(this,"_pk");d(this,"_pkurl");d(this,"name");d(this,"room");d(this,"host");d(this,"path");d(this,"basePath");if(this.partySocketOptions=t,this.setWSProperties(s),!t.startClosed&&!this.room&&!this.basePath)throw this.close(),new Error("Either room or basePath must be provided to connect. Use startClosed: true to create a socket and set them via updateProperties before calling reconnect().");t.disableNameValidation||((n=t.party)!=null&&n.includes("/")&&console.warn(`PartySocket: party name "${t.party}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`),(i=t.room)!=null&&i.includes("/")&&console.warn(`PartySocket: room name "${t.room}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`))}updateProperties(t){const s=G({...this.partySocketOptions,...t,host:t.host??this.host,room:t.room??this.room,path:t.path??this.path,basePath:t.basePath??this.basePath});this._url=s.urlProvider,this._protocols=s.protocols,this._options=s.socketOptions,this.setWSProperties(s)}setWSProperties(t){const{_pk:s,_pkurl:n,name:i,room:o,host:a,path:h,basePath:u}=t;this._pk=s,this._pkurl=n,this.name=i,this.room=o,this.host=a,this.path=h,this.basePath=u}reconnect(t,s){if(!this.host)throw new Error("The host must be set before connecting, use `updateProperties` method to set it or pass it to the constructor.");if(!this.room&&!this.basePath)throw new Error("The room (or basePath) must be set before connecting, use `updateProperties` method to set it or pass it to the constructor.");super.reconnect(t,s)}get id(){return this._pk}get roomUrl(){return this._pkurl}static async fetch(t,s){const n=V(t,"http"),i=typeof n.urlProvider=="string"?n.urlProvider:await n.urlProvider();return(t.fetch??fetch)(i,s)}};function G(e){const{id:t,host:s,path:n,party:i,room:o,protocol:a,query:h,protocols:u,...l}=e,c=t||ne(),m=V(e,"ws",{_pk:c});return{_pk:c,_pkurl:m.partyUrl,name:m.name,room:m.room,host:m.host,path:m.path,basePath:e.basePath,protocols:u,socketOptions:l,urlProvider:m.urlProvider}}let w=null,p=null,S=null;const x=["var(--kw-1)","var(--kw-2)","var(--kw-3)","var(--kw-4)"],r=e=>document.getElementById(e),$=e=>{document.querySelectorAll(".screen").forEach(t=>t.classList.remove("active")),r(e).classList.add("active")};function _(e){const t=r("toast");t.textContent=e,t.classList.add("show"),setTimeout(()=>t.classList.remove("show"),2500)}function q(e,t){const s=location.hostname==="localhost"||location.hostname==="127.0.0.1"||location.hostname.startsWith("192.168.")||location.hostname.startsWith("10.")?location.host:"decrypto-online.kennyphan123.partykit.dev";w=new ie({host:s,room:e}),w.addEventListener("open",()=>{w.send(JSON.stringify({type:"join",name:t}))}),w.addEventListener("message",n=>{const i=JSON.parse(n.data);i.type==="state"?(p=i.state,re()):i.type==="error"&&_(i.message)}),w.addEventListener("close",()=>{_("Mất kết nối. Tải lại trang để chơi lại.")})}function L(e){w&&w.send(JSON.stringify(e))}function N(e){r("menu-main").style.display="none",r("menu-create").style.display="none",r("menu-join").style.display="none",r(e).style.display="flex"}r("btn-menu-create").addEventListener("click",()=>{N("menu-create"),r("create-name").focus()});r("btn-menu-join").addEventListener("click",()=>{N("menu-join"),r("join-name").focus()});r("btn-back-create").addEventListener("click",()=>N("menu-main"));r("btn-back-join").addEventListener("click",()=>N("menu-main"));r("btn-create").addEventListener("click",()=>{const e=r("create-name").value.trim();if(!e){_("Vui lòng nhập tên");return}const t=oe();q(t,e),$("lobby-screen")});r("btn-join").addEventListener("click",()=>{const e=r("join-name").value.trim(),t=r("join-code").value.trim().toUpperCase();if(!e){_("Vui lòng nhập tên");return}if(!t||t.length<4){_("Vui lòng nhập mã phòng");return}q(t,e),$("lobby-screen")});r("create-name").addEventListener("keydown",e=>{e.key==="Enter"&&r("btn-create").click()});r("join-name").addEventListener("keydown",e=>{e.key==="Enter"&&(r("join-code").value.trim()?r("btn-join").click():r("join-code").focus())});r("join-code").addEventListener("keydown",e=>{e.key==="Enter"&&r("btn-join").click()});function oe(){const e="ABCDEFGHJKLMNPQRSTUVWXYZ";let t="";for(let s=0;s<4;s++)t+=e[Math.floor(Math.random()*e.length)];return t}r("btn-copy-code").addEventListener("click",()=>{const e=r("room-code-text").textContent;if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(e).then(()=>_("Đã sao chép"));else{const t=document.createElement("textarea");t.value=e,document.body.appendChild(t),t.select();try{document.execCommand("copy"),_("Đã sao chép")}catch{_("Sao chép thất bại")}document.body.removeChild(t)}});r("btn-start").addEventListener("click",()=>L({type:"start"}));r("team-a-col").addEventListener("click",()=>L({type:"switch-team",target:"A"}));r("team-b-col").addEventListener("click",()=>L({type:"switch-team",target:"B"}));r("history-toggle").addEventListener("click",()=>{r("history-panel").classList.toggle("open")});r("btn-play-again").addEventListener("click",()=>L({type:"play-again"}));r("btn-back-home").addEventListener("click",()=>{w&&w.close(),w=null,p=null,N("menu-main"),$("home-screen")});function re(){p&&(S&&(clearInterval(S),S=null),p.phase==="LOBBY"?(ce(),$("lobby-screen")):p.phase==="GAME_OVER"?(Ce(),$("gameover-screen")):(le(),$("game-screen"),ae()))}function ae(){const e=p,t=r("topbar-timer");if(e.phase==="ENCRYPT"&&e.timerEnd){t.style.display="block";const s=()=>{const n=Math.max(0,Math.floor((e.timerEnd-Date.now())/1e3));if(t.textContent=n+"s",n<=0){clearInterval(S);const i=r("btn-submit-clues");i&&!i.disabled&&i.click()}};s(),S=setInterval(s,1e3)}else t.style.display="none"}function ce(){var o;const e=p;r("room-code-text").textContent=e.roomCode;const t=(o=e.players.find(a=>a.id===e.myId))==null?void 0:o.isHost,s=e.players.length;s<3?(r("lobby-mode-info").textContent=`${s} người chơi — Cần ít nhất 3 người`,r("team-a-title").textContent="Đội A",r("team-b-title").textContent="Đội B"):s===3?(r("lobby-mode-info").textContent="3 người chơi — Chế độ độc lập",r("team-a-title").textContent="Đội Mã Hóa (Cần 2)",r("team-b-title").textContent="Kẻ Chặn Mã (Cần 1)"):(r("lobby-mode-info").textContent=`${s} người chơi — Chế độ đội`,r("team-a-title").textContent="Đội A",r("team-b-title").textContent="Đội B");const n=e.players.filter(a=>a.team==="A"),i=e.players.filter(a=>a.team==="B");W("team-a-list",n,e.myId),W("team-b-list",i,e.myId),r("btn-start").style.display=t&&s>=3?"block":"none",r("lobby-waiting").style.display=t?"none":"block"}function W(e,t,s){r(e).innerHTML=t.map(n=>`
    <li>${v(n.name)}${n.id===s?" (bạn)":""}${n.isHost?' <span class="lobby-player-host" style="font-size:10px; margin-left:4px;">Chủ phòng</span>':""}</li>
  `).join("")}function le(){const e=p;de(),r("round-display").textContent=`${e.round}/${e.maxRounds}`,ue(),he(),me(),pe(),_e()}function de(){const e=p,t=e.players.find(i=>i.id===e.myId);if(!t)return;let s=`<strong>${v(t.name)}</strong>`;e.mode==="3p"?s+=e.myRole==="interceptor"?" (Người chặn)":" (Đội mã hóa)":s+=e.myTeam?` (Đội ${e.myTeam})`:" (Khán giả)";const n=r("player-identity");n&&(n.innerHTML=s)}function ue(){const e=p,t=r("topbar-tokens");e.mode==="3p"?t.innerHTML=`
      <div class="token-3p">
        <span>Chặn: <strong>${e.interceptorTokens}</strong>/2</span>
      </div>
    `:t.innerHTML=`
      <div class="token-group token-group-a">
        <span class="token-team-label" style="color:var(--team-a)">A</span>
        <span class="token-item"><span class="token-count token-label-i">${e.teamA.interceptions}</span>C</span>
        <span class="token-item"><span class="token-count token-label-m">${e.teamA.miscommunications}</span>L</span>
      </div>
      <div class="token-group token-group-b">
        <span class="token-team-label" style="color:var(--team-b)">B</span>
        <span class="token-item"><span class="token-count token-label-i">${e.teamB.interceptions}</span>C</span>
        <span class="token-item"><span class="token-count token-label-m">${e.teamB.miscommunications}</span>L</span>
      </div>
    `}function he(){const e=p,t=r("keywords-panel");e.keywords?(t.style.display="block",r("keywords-list").innerHTML=e.keywords.map((s,n)=>`
      <div class="keyword-chip kw-${n+1}">
        <span class="kw-number">${n+1}</span>
        <span>${v(s)}</span>
      </div>
    `).join("")):t.style.display="none"}function me(){var s;const e=p;let t="";if(e.mode==="3p"){const n=((s=e.encryptors.find(i=>i.id===e.currentEncryptorId))==null?void 0:s.name)||"";switch(e.phase){case"ENCRYPT":t=e.myRole==="encryptor"?"Bạn là người mã hóa — Nhập gợi ý":`Đang chờ ${n} mã hóa...`;break;case"GUESS":t="Đoán mã số";break;case"REVEAL":t="Kết quả";break}}else{const n=e.currentTeamTurn;switch(e.phase){case"ENCRYPT":t=e.myRole==="encryptor"?"Bạn là người mã hóa — Nhập gợi ý":"Đang chờ mã hóa...";break;case"GUESS_A":case"GUESS_B":t=`Đội ${n} — Đoán mã số`;break;case"REVEAL_A":case"REVEAL_B":t=`Đội ${n} — Kết quả`;break}}r("phase-status").textContent=t}function pe(){const e=p,t=r("action-area");e.phase==="ENCRYPT"?ye(t):e.phase==="GUESS"||e.phase==="GUESS_A"||e.phase==="GUESS_B"?fe(t):(e.phase==="REVEAL"||e.phase==="REVEAL_A"||e.phase==="REVEAL_B")&&we(t)}function ye(e){const t=p,s=t.mode==="3p"?t.cluesSubmitted:t.myTeam?t["team"+t.myTeam].cluesSubmitted:!1;if(t.myRole==="encryptor"&&t.code&&!s)e.innerHTML=`
      <div class="encrypt-code-display fade-in">
        <div class="encrypt-code-label">Mã số cần truyền đạt</div>
        <div class="encrypt-code-numbers">
          ${t.code.map(n=>`<div class="code-digit" style="background:${x[n-1]}">${n}</div>`).join("")}
        </div>
      </div>
      <div class="clue-inputs fade-in">
        ${t.code.map((n,i)=>`
          <div class="clue-input-row">
            <div class="clue-number" style="background:${x[n-1]}">${["A","B","C"][i]}</div>
            <input type="text" class="clue-input" id="clue-${i}" placeholder="Gợi ý cho từ khóa số ${n}..." autocomplete="off" />
          </div>
        `).join("")}
      </div>
      <button class="btn btn-primary" id="btn-submit-clues">Gửi gợi ý</button>
    `,r("btn-submit-clues").addEventListener("click",n=>{const i=!n.isTrusted;let o=[0,1,2].map(a=>r(`clue-${a}`).value.trim());if(!i&&o.some(a=>!a)){_("Vui lòng nhập đủ 3 gợi ý");return}i&&(o=o.map(a=>a||"(Hết giờ)")),L({type:"submit-clues",clues:o}),e.innerHTML=`
        <div class="waiting-indicator fade-in">
          <p>Đang gửi gợi ý...<span class="waiting-dots"></span></p>
        </div>
      `}),setTimeout(()=>{var n;return(n=r("clue-0"))==null?void 0:n.focus()},100);else{let n="";if(t.mode==="3p"){const i=t.encryptors.find(o=>o.id===t.currentEncryptorId);n=`Đang chờ ${(i==null?void 0:i.name)||""} nhập gợi ý`}else{const i=[];if(t.teamA.cluesSubmitted&&i.push("A"),t.teamB.cluesSubmitted&&i.push("B"),i.length===0)n="Đang chờ cả 2 người mã hóa...";else{const o=i.includes("A")?"B":"A";n=`Đội ${i[0]} đã xong. Đang chờ đội ${o}...`}}e.innerHTML=`
      <div class="waiting-indicator fade-in">
        <p>${n}<span class="waiting-dots"></span></p>
      </div>
    `}}function fe(e){const t=p,s=t.currentClues||t.clues;if(!s)return;let n="";t.mode==="3p"?n+=ge(s):n+=ve(s),e.innerHTML=n,be()}function C(e){return`
    <div class="clues-display fade-in" style="margin-bottom:14px">
      <div class="clues-display-header">Gợi ý</div>
      ${e.map((t,s)=>`
        <div class="clue-display-item">
          <div class="clue-number" style="background:var(--text-muted)">${["A","B","C"][s]}</div>
          <span>${v(t)}</span>
        </div>
      `).join("")}
    </div>
  `}function ge(e){const t=p;let s="";return t.myRole==="encryptor"&&t.currentEncryptorId===t.myId?(s+=C(e),s+='<div class="waiting-indicator">Bạn là người mã hóa — Hãy chờ đồng đội đoán</div>'):t.myRole==="interceptor"?t.round<2?(s+=C(e),s+='<div class="waiting-indicator">Vòng 1 — Chưa thể chặn mã</div>',t.decryptSubmitted||(s+='<div class="waiting-indicator">Đang chờ đội mã hóa đoán<span class="waiting-dots"></span></div>')):t.interceptSubmitted?(s+=C(e),s+='<div class="guess-submitted">Bạn đã gửi dự đoán<span class="waiting-dots"></span></div>'):s+=P("intercept","Chặn mã",e,null):t.decryptSubmitted?(s+=C(e),s+='<div class="guess-submitted">Đội bạn đã gửi dự đoán<span class="waiting-dots"></span></div>'):s+=P("decrypt","Giải mã",e,t.keywords),s}function ve(e){const t=p,s=t.currentTeamTurn,n=t.myTeam===s,i=s==="A"?"B":"A";let o="";if(n){const a=s==="A"?t.teamA:t.teamB;a.encryptorId===t.myId?(o+=C(e),o+='<div class="waiting-indicator">Bạn là người mã hóa — Không được gợi ý</div>'):t.decryptSubmitted?(o+=C(e),o+=`<div class="guess-submitted">Đội bạn đã gửi dự đoán. Đang chờ đội ${i}<span class="waiting-dots"></span></div>`):o+=P("decrypt","Giải mã",e,a.keywords)}else t.round<2?(o+=C(e),o+='<div class="waiting-indicator">Vòng 1 — Chưa thể chặn mã</div>'):t.interceptSubmitted?(o+=C(e),o+='<div class="guess-submitted">Đội bạn đã gửi dự đoán<span class="waiting-dots"></span></div>'):o+=P("intercept","Chặn mã",e,null);return o}function P(e,t,s,n){return`
    <div class="guess-section fade-in">
      <div class="guess-section-title">${t}</div>
      <div class="wire-task-container" id="wire-task">
        <svg class="wire-svg" id="wire-svg"></svg>
        <div class="wire-col left-col">
          ${[0,1,2].map(i=>`
            <div class="wire-item">
              <div class="wire-box">
                <span class="clue-number" style="background:var(--text-muted); width:20px; height:20px; font-size:11px">${["A","B","C"][i]}</span>
                <span>${v(s[i])}</span>
              </div>
              <div class="wire-node left-node" data-clue="${i}"></div>
            </div>
          `).join("")}
        </div>
        <div class="wire-col right-col">
          ${[1,2,3,4].map(i=>`
            <div class="wire-item">
              <div class="wire-box" style="border-color:${x[i-1]}">
                <span class="kw-number" style="background:${x[i-1]}; width:20px; height:20px; font-size:11px">${i}</span>
                ${n?`<span>${v(n[i-1])}</span>`:""}
              </div>
              <div class="wire-node right-node" data-val="${i}" style="color:${x[i-1]}"></div>
            </div>
          `).join("")}
        </div>
      </div>
      <button class="btn btn-primary" id="btn-submit-guess" data-type="${e}" disabled style="width:100%">Gửi</button>
    </div>
  `}function be(){const e=r("btn-submit-guess");if(!e)return;const t=r("wire-task"),s=r("wire-svg");if(!t||!s)return;const n=document.querySelectorAll(".left-node"),i=document.querySelectorAll(".right-node"),o={0:null,1:null,2:null};let a=null,h=null;function u(){s.innerHTML="";const l=t.getBoundingClientRect();if(h){const c=document.createElementNS("http://www.w3.org/2000/svg","line");c.setAttribute("x1",h.x1),c.setAttribute("y1",h.y1),c.setAttribute("x2",h.x2),c.setAttribute("y2",h.y2),c.setAttribute("stroke","var(--text-muted)"),c.setAttribute("stroke-width","4"),c.setAttribute("stroke-linecap","round"),s.appendChild(c)}i.forEach(c=>{c.classList.remove("connected"),c.style.backgroundColor=""});for(let c=0;c<3;c++){const m=o[c],y=n[c];if(m){const f=Array.from(i).find(g=>parseInt(g.dataset.val)===m);if(y&&f){const g=y.getBoundingClientRect(),b=f.getBoundingClientRect(),A=g.left+g.width/2-l.left,I=g.top+g.height/2-l.top,M=b.left+b.width/2-l.left,K=b.top+b.height/2-l.top,k=document.createElementNS("http://www.w3.org/2000/svg","line");k.setAttribute("x1",A),k.setAttribute("y1",I),k.setAttribute("x2",M),k.setAttribute("y2",K),k.setAttribute("stroke",f.style.color),k.setAttribute("stroke-width","6"),k.setAttribute("stroke-linecap","round"),s.appendChild(k),y.classList.add("connected"),y.style.color=f.style.color,f.classList.add("connected"),f.style.backgroundColor=f.style.color}}else y.classList.remove("connected"),y.style.color=""}e.disabled=!(o[0]&&o[1]&&o[2])}t.addEventListener("pointerdown",l=>{const c=l.target.closest(".left-node");if(!c)return;const m=parseInt(c.dataset.clue);o[m]=null,a=c;const y=t.getBoundingClientRect(),f=c.getBoundingClientRect();h={x1:f.left+f.width/2-y.left,y1:f.top+f.height/2-y.top,x2:l.clientX-y.left,y2:l.clientY-y.top},u(),t.setPointerCapture(l.pointerId)}),t.addEventListener("pointermove",l=>{if(!a)return;const c=t.getBoundingClientRect();h.x2=l.clientX-c.left,h.y2=l.clientY-c.top,u()}),t.addEventListener("pointerup",l=>{var y;if(!a)return;t.releasePointerCapture(l.pointerId);const c=document.elementFromPoint(l.clientX,l.clientY),m=(c==null?void 0:c.closest(".right-node"))||((y=c==null?void 0:c.closest(".wire-item"))==null?void 0:y.querySelector(".right-node"));if(m){const f=parseInt(a.dataset.clue),g=parseInt(m.dataset.val);for(let b in o)o[b]===g&&(o[b]=null);o[f]=g}a=null,h=null,u()}),window.addEventListener("resize",u),setTimeout(u,50),e.addEventListener("click",()=>{if(!o[0]||!o[1]||!o[2])return;const l=[o[0],o[1],o[2]],c=e.dataset.type;L({type:"submit-guess",guess:l,guessType:c}),e.disabled=!0,e.textContent="Đã gửi"})}function we(e){var a,h;const t=p,s=(a=t.players.find(u=>u.id===t.myId))==null?void 0:a.isHost;let n="";const i=t.mode==="3p"?t.clues:t.currentClues;n+=`
    <div class="reveal-section fade-in">
      <div class="reveal-title">Từ khóa đúng</div>
      <div class="reveal-code-row">
        ${t.revealCode.map((u,l)=>`
          <div class="reveal-code-item">
            <div class="code-digit" style="background:${x[u-1]}">${u}</div>
            <div class="reveal-guess-arrow">←</div>
            <div style="font-weight: 600; font-size: 1.1rem; color: var(--text)">${v(i[l])}</div>
          </div>
        `).join("")}
      </div>
  `;const o=u=>u.map((l,c)=>{const y=l===t.revealCode[c]?'<svg class="reveal-icon-correct" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>':'<svg class="reveal-icon-wrong" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';return`
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="code-digit" style="background:${x[l-1]}; transform: scale(0.8)">${l}</div>
          ${y}
        </div>
      `}).join("");if(t.decryptGuess){const u=t.decryptCorrect?"result-correct":"result-incorrect",l=t.decryptCorrect?"Giải mã thành công":"Giải mã thất bại";n+=`
      <div class="reveal-result ${u}">
        <span class="result-label">${l}</span>
        <div style="display:flex; gap:12px;">${o(t.decryptGuess)}</div>
      </div>
    `}if(t.interceptGuess){const u=t.interceptCorrect?"result-correct":"result-incorrect",l=t.interceptCorrect?"Chặn mã thành công!":"Chặn mã thất bại";n+=`
      <div class="reveal-result ${u}">
        <span class="result-label">${l}</span>
        <div style="display:flex; gap:12px;">${o(t.interceptGuess)}</div>
      </div>
    `}else t.round<2||t.needIntercept;n+="</div>",s?n+='<button class="btn btn-primary" id="btn-continue">Tiếp tục</button>':n+='<div class="waiting-indicator">Đang chờ chủ phòng tiếp tục<span class="waiting-dots"></span></div>',e.innerHTML=n,(h=r("btn-continue"))==null||h.addEventListener("click",()=>{L({type:"continue"})})}function _e(){const e=p,t=r("history-tables");e.mode==="3p"?ke(t):Ee(t)}function ke(e){const s=p.history||[];if(s.length===0){e.innerHTML='<div class="history-empty">Chưa có lịch sử</div>';return}const n={1:[],2:[],3:[],4:[]},i=[];for(const o of s){i.push(o.round);for(let a=0;a<3;a++){const h=o.code[a];n[h].push({round:o.round,clue:o.clues[a]})}}e.innerHTML=`
    <div class="history-section-label">Theo từ khóa</div>
    ${O(n,i)}
  `}function Ee(e){const t=p,s=t.myHistory||[],n=t.opponentHistory||[];if(s.length===0&&n.length===0){e.innerHTML='<div class="history-empty">Chưa có lịch sử</div>';return}let i="";if(n.length>0){const o=t.myTeam==="A"?"B":"A",a={1:[],2:[],3:[],4:[]},h=[];for(const u of n){h.push(u.round);for(let l=0;l<3;l++){const c=u.code[l];a[c].push({round:u.round,clue:u.clues[l]})}}i+=`<div class="history-section-label">Đội ${o} (đối phương)</div>`,i+=O(a,h)}if(s.length>0){const o={1:[],2:[],3:[],4:[]},a=[];for(const h of s){a.push(h.round);for(let u=0;u<3;u++){const l=h.code[u];o[l].push({round:h.round,clue:h.clues[u]})}}i+=`<div class="history-section-label">Đội ${t.myTeam} (đội bạn)</div>`,i+=O(o,a)}e.innerHTML=i}function O(e,t){const s=[...new Set(t)].sort((i,o)=>i-o);let n='<table class="history-table"><thead><tr><th>Từ khóa</th>';for(const i of s)n+=`<th class="kw-col-header">V${i}</th>`;n+="</tr></thead><tbody>";for(let i=1;i<=4;i++){n+=`<tr style="color:${x[i-1]}"><td style="font-weight:600">#${i}</td>`;for(const o of s){const a=e[i].find(h=>h.round===o);n+=`<td class="kw-cell">${a?v(a.clue):"—"}</td>`}n+="</tr>"}return n+="</tbody></table>",n}function Ce(){var s;const e=p,t=(s=e.players.find(n=>n.id===e.myId))==null?void 0:s.isHost;if(e.mode==="3p")e.winner==="interceptor"?r("gameover-title").textContent=e.myRole==="interceptor"?"Bạn đã thắng!":"Người chặn mã đã thắng!":r("gameover-title").textContent=e.myRole==="interceptor"?"Bạn đã thua!":"Đội mã hóa đã thắng!",r("gameover-summary").innerHTML=`
      <p>Token chặn: ${e.interceptorTokens}/2</p>
      <p>Số vòng: ${e.round}/${e.maxRounds}</p>
    `,e.allKeywords&&(r("gameover-keywords").innerHTML=`
        <div class="gameover-team-keywords">
          <div class="gameover-team-header" style="background:var(--surface-alt)">Từ khóa</div>
          <div class="gameover-kw-list">
            ${e.allKeywords.map((n,i)=>`
              <div class="keyword-chip kw-${i+1}">
                <span class="kw-number">${i+1}</span>
                <span>${v(n)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `);else{if(e.winner==="TIE")r("gameover-title").textContent="Hòa!";else{const n=e.winner,i=e.myTeam===n;r("gameover-title").textContent=i?`Đội bạn thắng! (Đội ${n})`:`Đội ${n} thắng!`}r("gameover-summary").innerHTML=`
      <p>Đội A — Chặn: ${e.teamA.interceptions} | Lỗi: ${e.teamA.miscommunications}</p>
      <p>Đội B — Chặn: ${e.teamB.interceptions} | Lỗi: ${e.teamB.miscommunications}</p>
      <p>Số vòng: ${e.round}/${e.maxRounds}</p>
    `,e.allKeywords&&(r("gameover-keywords").innerHTML=`
        <div class="gameover-team-keywords">
          <div class="gameover-team-header team-a-header">Từ khóa Đội A</div>
          <div class="gameover-kw-list">
            ${e.allKeywords.A.map((n,i)=>`
              <div class="keyword-chip kw-${i+1}">
                <span class="kw-number">${i+1}</span>
                <span>${v(n)}</span>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="gameover-team-keywords">
          <div class="gameover-team-header team-b-header">Từ khóa Đội B</div>
          <div class="gameover-kw-list">
            ${e.allKeywords.B.map((n,i)=>`
              <div class="keyword-chip kw-${i+1}">
                <span class="kw-number">${i+1}</span>
                <span>${v(n)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `)}r("btn-play-again").style.display=t?"block":"none"}function v(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}
