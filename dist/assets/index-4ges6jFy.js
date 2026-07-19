var q=Object.defineProperty;var K=(e,t,s)=>t in e?q(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s;var c=(e,t,s)=>K(e,typeof t!="symbol"?t+"":t,s);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function s(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(i){if(i.ep)return;i.ep=!0;const o=s(i);fetch(i.href,o)}})();(!globalThis.EventTarget||!globalThis.Event)&&console.error(`
  PartySocket requires a global 'EventTarget' class to be available!
  You can polyfill this global by adding this to your code before any partysocket imports: 
  
  \`\`\`
  import 'partysocket/event-target-polyfill';
  \`\`\`
  Please file an issue at https://github.com/partykit/partykit if you're still having trouble.
`);var B=class extends Event{constructor(t,s){super("error",s);c(this,"message");c(this,"error");this.message=t.message,this.error=t}},W=class extends Event{constructor(t=1e3,s="",n){super("close",n);c(this,"code");c(this,"reason");c(this,"wasClean",!0);this.code=t,this.reason=s}};const S={Event,ErrorEvent:B,CloseEvent:W};function F(e,t){if(!e)throw new Error(t)}function Q(e){return new e.constructor(e.type,e)}function Y(e){return"data"in e?new MessageEvent(e.type,e):"code"in e||"reason"in e?new W(e.code||1999,e.reason||"unknown reason",e):"error"in e?new B(e.error,e):new Event(e.type,e)}var H;const J=typeof process<"u"&&typeof((H=process.versions)==null?void 0:H.node)<"u",z=typeof navigator<"u"&&navigator.product==="ReactNative",x=J||z?Y:Q,_={maxReconnectionDelay:1e4,minReconnectionDelay:3e3,minUptime:5e3,reconnectionDelayGrowFactor:1.3,connectionTimeout:4e3,maxRetries:Number.POSITIVE_INFINITY,maxEnqueuedMessages:Number.POSITIVE_INFINITY};let M=!1;function X(){}var Z=class v extends EventTarget{constructor(s,n,i={}){super();c(this,"_ws");c(this,"_retryCount",-1);c(this,"_uptimeTimeout");c(this,"_connectTimeout");c(this,"_shouldReconnect",!0);c(this,"_connectLock",!1);c(this,"_binaryType","blob");c(this,"_closeCalled",!1);c(this,"_didWarnAboutClosedSend",!1);c(this,"_messageQueue",[]);c(this,"_debugLogger",console.log.bind(console));c(this,"_url");c(this,"_protocols");c(this,"_options");c(this,"onclose",null);c(this,"onerror",null);c(this,"onmessage",null);c(this,"onopen",null);c(this,"_handleOpen",s=>{this._debug("open event");const{minUptime:n=_.minUptime}=this._options;clearTimeout(this._connectTimeout),this._uptimeTimeout=setTimeout(()=>this._acceptOpen(),n),F(this._ws,"WebSocket is not defined"),this._ws.binaryType=this._binaryType,this._messageQueue.forEach(i=>{var o;(o=this._ws)==null||o.send(i)}),this._messageQueue=[],this.onopen&&this.onopen(s),this.dispatchEvent(x(s))});c(this,"_handleMessage",s=>{this._debug("message event"),this.onmessage&&this.onmessage(s),this.dispatchEvent(x(s))});c(this,"_handleError",s=>{this._debug("error event",s.message),this._disconnect(void 0,s.message==="TIMEOUT"?"timeout":void 0),this.onerror&&this.onerror(s),this._debug("exec error listeners"),this.dispatchEvent(x(s)),this._connect()});c(this,"_handleClose",s=>{this._debug("close event"),this._clearTimeouts(),this._options.shouldReconnectOnClose&&!this._options.shouldReconnectOnClose(s)&&(this._shouldReconnect=!1),this._shouldReconnect&&this._connect(),this.onclose&&this.onclose(s),this.dispatchEvent(x(s))});this._url=s,this._protocols=n,this._options=i,this._options.startClosed&&(this._shouldReconnect=!1),this._options.debugLogger&&(this._debugLogger=this._options.debugLogger),this._connect()}static get CONNECTING(){return 0}static get OPEN(){return 1}static get CLOSING(){return 2}static get CLOSED(){return 3}get CONNECTING(){return v.CONNECTING}get OPEN(){return v.OPEN}get CLOSING(){return v.CLOSING}get CLOSED(){return v.CLOSED}get binaryType(){return this._ws?this._ws.binaryType:this._binaryType}set binaryType(s){this._binaryType=s,this._ws&&(this._ws.binaryType=s)}get retryCount(){return Math.max(this._retryCount,0)}get bufferedAmount(){return this._messageQueue.reduce((s,n)=>(typeof n=="string"?s+=n.length:n instanceof Blob?s+=n.size:s+=n.byteLength,s),0)+(this._ws?this._ws.bufferedAmount:0)}get extensions(){return this._ws?this._ws.extensions:""}get protocol(){return this._ws?this._ws.protocol:""}get readyState(){return this._closeCalled?v.CLOSED:this._ws?this._ws.readyState:this._options.startClosed?v.CLOSED:v.CONNECTING}get url(){return this._ws?this._ws.url:""}get shouldReconnect(){return this._shouldReconnect}close(s=1e3,n){if(this._closeCalled=!0,this._shouldReconnect=!1,this._clearTimeouts(),!this._ws){this._debug("close enqueued: no ws instance");return}if(this._ws.readyState===this.CLOSED||this._ws.readyState===this.CLOSING){this._debug("close: already closing or closed");return}this._disconnect(s,n)}reconnect(s,n){this._shouldReconnect=!0,this._closeCalled=!1,this._didWarnAboutClosedSend=!1,this._retryCount=-1,!this._ws||this._ws.readyState===this.CLOSED||this._ws.readyState===this.CLOSING?this._connect():(this._disconnect(s,n),this._connect())}send(s){if(this._ws&&this._ws.readyState===this.OPEN)return this._debug("send",s),this._ws.send(s),!0;this._closeCalled&&!this._didWarnAboutClosedSend&&(this._didWarnAboutClosedSend=!0,console.warn("ReconnectingWebSocket: send() was called after close(). The message has been buffered, but it will only be delivered if reconnect() is called on this socket. If this socket has been discarded, the message is lost — this usually means a stale socket reference is being used."));const{maxEnqueuedMessages:n=_.maxEnqueuedMessages}=this._options;return this._messageQueue.length<n&&(this._debug("enqueue",s),this._messageQueue.push(s)),!1}drainQueuedMessages(){const s=this._messageQueue;return this._messageQueue=[],s}_debug(...s){this._options.debug&&this._debugLogger("RWS>",...s)}_getNextDelay(){const{reconnectionDelayGrowFactor:s=_.reconnectionDelayGrowFactor,minReconnectionDelay:n=_.minReconnectionDelay,maxReconnectionDelay:i=_.maxReconnectionDelay}=this._options;let o=0;return this._retryCount>0&&(o=n*s**(this._retryCount-1),o>i&&(o=i)),this._debug("next delay",o),o}_wait(){return new Promise(s=>{setTimeout(s,this._getNextDelay())})}_getNextProtocols(s){if(!s)return Promise.resolve(null);if(typeof s=="string"||Array.isArray(s))return Promise.resolve(s);if(typeof s=="function"){const n=s();if(!n)return Promise.resolve(null);if(typeof n=="string"||Array.isArray(n))return Promise.resolve(n);if(n.then)return n}throw Error("Invalid protocols")}_getNextUrl(s){if(typeof s=="string")return Promise.resolve(s);if(typeof s=="function"){const n=s();if(typeof n=="string")return Promise.resolve(n);if(n.then)return n}throw Error("Invalid URL")}_connect(){if(this._connectLock||!this._shouldReconnect)return;this._connectLock=!0;const{maxRetries:s=_.maxRetries,connectionTimeout:n=_.connectionTimeout}=this._options;if(this._retryCount>=s){this._debug("max retries reached",this._retryCount,">=",s),this._connectLock=!1;return}this._retryCount++,this._debug("connect",this._retryCount),this._removeListeners(),this._wait().then(()=>Promise.all([this._getNextUrl(this._url),this._getNextProtocols(this._protocols||null)])).then(([i,o])=>{if(this._closeCalled){this._connectLock=!1;return}!this._options.WebSocket&&typeof WebSocket>"u"&&!M&&(console.error(`‼️ No WebSocket implementation available. You should define options.WebSocket. 

For example, if you're using node.js, run \`npm install ws\`, and then in your code:

import PartySocket from 'partysocket';
import WS from 'ws';

const partysocket = new PartySocket({
  host: "127.0.0.1:1999",
  room: "test-room",
  WebSocket: WS
});

`),M=!0);const a=this._options.WebSocket||WebSocket;this._debug("connect",{url:i,protocols:o}),this._ws=o?new a(i,o):new a(i),this._ws.binaryType=this._binaryType,this._connectLock=!1,this._addListeners(),this._connectTimeout=setTimeout(()=>this._handleTimeout(),n)}).catch(i=>{this._connectLock=!1,this._handleError(new S.ErrorEvent(Error(i.message),this))})}_handleTimeout(){this._debug("timeout event"),this._handleError(new S.ErrorEvent(Error("TIMEOUT"),this))}_disconnect(s=1e3,n){if(this._clearTimeouts(),!!this._ws){this._removeListeners();try{(this._ws.readyState===this.OPEN||this._ws.readyState===this.CONNECTING)&&this._ws.close(s,n),this._handleClose(new S.CloseEvent(s,n,this))}catch{}}}_acceptOpen(){this._debug("accept open"),this._retryCount=0}_removeListeners(){this._ws&&(this._debug("removeListeners"),this._ws.removeEventListener("open",this._handleOpen),this._ws.removeEventListener("close",this._handleClose),this._ws.removeEventListener("message",this._handleMessage),this._ws.removeEventListener("error",this._handleError),this._ws.addEventListener("error",X))}_addListeners(){this._ws&&(this._debug("addListeners"),this._ws.addEventListener("open",this._handleOpen),this._ws.addEventListener("close",this._handleClose),this._ws.addEventListener("message",this._handleMessage),this._ws.addEventListener("error",this._handleError))}_clearTimeouts(){clearTimeout(this._connectTimeout),clearTimeout(this._uptimeTimeout)}};const ee=e=>e[1]!==null&&e[1]!==void 0;function te(){if(crypto!=null&&crypto.randomUUID)return crypto.randomUUID();let e=Date.now(),t=(performance==null?void 0:performance.now)&&performance.now()*1e3||0;return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(s){let n=Math.random()*16;return e>0?(n=(e+n)%16|0,e=Math.floor(e/16)):(n=(t+n)%16|0,t=Math.floor(t/16)),(s==="x"?n:n&3|8).toString(16)})}function j(e,t,s={}){const{host:n,path:i,protocol:o,room:a,party:d,basePath:l,prefix:m,query:y}=e;let h=n.replace(/^(http|https|ws|wss):\/\//,"");if(h.endsWith("/")&&(h=h.slice(0,-1)),i!=null&&i.startsWith("/"))throw new Error("path must not start with a slash");const $=d??"main",P=i?`/${i}`:"",A=o||(h.startsWith("localhost:")||h.startsWith("127.0.0.1:")||h.startsWith("192.168.")||h.startsWith("10.")||h.startsWith("172.")&&h.split(".")[1]>="16"&&h.split(".")[1]<="31"||h.startsWith("[::ffff:7f00:1]:")?t:`${t}s`),R=`${A}://${h}/${l||`${m||"parties"}/${$}/${a}`}${P}`,I=(V={})=>`${R}?${new URLSearchParams([...Object.entries(s),...Object.entries(V).filter(ee)])}`,D=typeof y=="function"?async()=>I(await y()):I(y);return{host:h,path:P,room:a,name:$,protocol:A,partyUrl:R,urlProvider:D}}var se=class extends Z{constructor(t){var n,i;const s=O(t);super(s.urlProvider,s.protocols,s.socketOptions);c(this,"_pk");c(this,"_pkurl");c(this,"name");c(this,"room");c(this,"host");c(this,"path");c(this,"basePath");if(this.partySocketOptions=t,this.setWSProperties(s),!t.startClosed&&!this.room&&!this.basePath)throw this.close(),new Error("Either room or basePath must be provided to connect. Use startClosed: true to create a socket and set them via updateProperties before calling reconnect().");t.disableNameValidation||((n=t.party)!=null&&n.includes("/")&&console.warn(`PartySocket: party name "${t.party}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`),(i=t.room)!=null&&i.includes("/")&&console.warn(`PartySocket: room name "${t.room}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`))}updateProperties(t){const s=O({...this.partySocketOptions,...t,host:t.host??this.host,room:t.room??this.room,path:t.path??this.path,basePath:t.basePath??this.basePath});this._url=s.urlProvider,this._protocols=s.protocols,this._options=s.socketOptions,this.setWSProperties(s)}setWSProperties(t){const{_pk:s,_pkurl:n,name:i,room:o,host:a,path:d,basePath:l}=t;this._pk=s,this._pkurl=n,this.name=i,this.room=o,this.host=a,this.path=d,this.basePath=l}reconnect(t,s){if(!this.host)throw new Error("The host must be set before connecting, use `updateProperties` method to set it or pass it to the constructor.");if(!this.room&&!this.basePath)throw new Error("The room (or basePath) must be set before connecting, use `updateProperties` method to set it or pass it to the constructor.");super.reconnect(t,s)}get id(){return this._pk}get roomUrl(){return this._pkurl}static async fetch(t,s){const n=j(t,"http"),i=typeof n.urlProvider=="string"?n.urlProvider:await n.urlProvider();return(t.fetch??fetch)(i,s)}};function O(e){const{id:t,host:s,path:n,party:i,room:o,protocol:a,query:d,protocols:l,...m}=e,y=t||te(),h=j(e,"ws",{_pk:y});return{_pk:y,_pkurl:h.partyUrl,name:h.name,room:h.room,host:h.host,path:h.path,basePath:e.basePath,protocols:l,socketOptions:m,urlProvider:h.urlProvider}}let f=null,u=null,C=null;const E=["var(--kw-1)","var(--kw-2)","var(--kw-3)","var(--kw-4)"],r=e=>document.getElementById(e),k=e=>{document.querySelectorAll(".screen").forEach(t=>t.classList.remove("active")),r(e).classList.add("active")};function g(e){const t=r("toast");t.textContent=e,t.classList.add("show"),setTimeout(()=>t.classList.remove("show"),2500)}function U(e,t){const s=location.hostname==="localhost"||location.hostname==="127.0.0.1"||location.hostname.startsWith("192.168.")||location.hostname.startsWith("10.")?location.host:"decrypto-online.kennyphan123.partykit.dev";f=new se({host:s,room:e}),f.addEventListener("open",()=>{f.send(JSON.stringify({type:"join",name:t}))}),f.addEventListener("message",n=>{const i=JSON.parse(n.data);i.type==="state"?(u=i.state,ie()):i.type==="error"&&g(i.message)}),f.addEventListener("close",()=>{g("Mất kết nối. Tải lại trang để chơi lại.")})}function w(e){f&&f.send(JSON.stringify(e))}function T(e){r("menu-main").style.display="none",r("menu-create").style.display="none",r("menu-join").style.display="none",r(e).style.display="flex"}r("btn-menu-create").addEventListener("click",()=>{T("menu-create"),r("create-name").focus()});r("btn-menu-join").addEventListener("click",()=>{T("menu-join"),r("join-name").focus()});r("btn-back-create").addEventListener("click",()=>T("menu-main"));r("btn-back-join").addEventListener("click",()=>T("menu-main"));r("btn-create").addEventListener("click",()=>{const e=r("create-name").value.trim();if(!e){g("Vui lòng nhập tên");return}const t=ne();U(t,e),k("lobby-screen")});r("btn-join").addEventListener("click",()=>{const e=r("join-name").value.trim(),t=r("join-code").value.trim().toUpperCase();if(!e){g("Vui lòng nhập tên");return}if(!t||t.length<4){g("Vui lòng nhập mã phòng");return}U(t,e),k("lobby-screen")});r("create-name").addEventListener("keydown",e=>{e.key==="Enter"&&r("btn-create").click()});r("join-name").addEventListener("keydown",e=>{e.key==="Enter"&&(r("join-code").value.trim()?r("btn-join").click():r("join-code").focus())});r("join-code").addEventListener("keydown",e=>{e.key==="Enter"&&r("btn-join").click()});function ne(){const e="ABCDEFGHJKLMNPQRSTUVWXYZ";let t="";for(let s=0;s<4;s++)t+=e[Math.floor(Math.random()*e.length)];return t}r("btn-copy-code").addEventListener("click",()=>{const e=r("room-code-text").textContent;if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(e).then(()=>g("Đã sao chép"));else{const t=document.createElement("textarea");t.value=e,document.body.appendChild(t),t.select();try{document.execCommand("copy"),g("Đã sao chép")}catch{g("Sao chép thất bại")}document.body.removeChild(t)}});r("btn-start").addEventListener("click",()=>w({type:"start"}));r("team-a-col").addEventListener("click",()=>w({type:"switch-team",target:"A"}));r("team-b-col").addEventListener("click",()=>w({type:"switch-team",target:"B"}));r("history-toggle").addEventListener("click",()=>{r("history-panel").classList.toggle("open")});r("btn-play-again").addEventListener("click",()=>w({type:"play-again"}));r("btn-back-home").addEventListener("click",()=>{f&&f.close(),f=null,u=null,T("menu-main"),k("home-screen")});function ie(){u&&(C&&(clearInterval(C),C=null),u.phase==="LOBBY"?(re(),k("lobby-screen")):u.phase==="GAME_OVER"?(ke(),k("gameover-screen")):(ae(),k("game-screen"),oe()))}function oe(){const e=u,t=r("topbar-timer");if(e.phase==="ENCRYPT"&&e.timerEnd){t.style.display="block";const s=()=>{const n=Math.max(0,Math.floor((e.timerEnd-Date.now())/1e3));if(t.textContent=n+"s",n<=0){clearInterval(C);const i=r("btn-submit-clues");i&&!i.disabled&&i.click()}};s(),C=setInterval(s,1e3)}else t.style.display="none"}function re(){var o;const e=u;r("room-code-text").textContent=e.roomCode;const t=(o=e.players.find(a=>a.id===e.myId))==null?void 0:o.isHost,s=e.players.length;s<3?(r("lobby-mode-info").textContent=`${s} người chơi — Cần ít nhất 3 người`,r("team-a-title").textContent="Đội A",r("team-b-title").textContent="Đội B"):s===3?(r("lobby-mode-info").textContent="3 người chơi — Chế độ độc lập",r("team-a-title").textContent="Đội Mã Hóa (Cần 2)",r("team-b-title").textContent="Kẻ Chặn Mã (Cần 1)"):(r("lobby-mode-info").textContent=`${s} người chơi — Chế độ đội`,r("team-a-title").textContent="Đội A",r("team-b-title").textContent="Đội B");const n=e.players.filter(a=>a.team==="A"),i=e.players.filter(a=>a.team==="B");G("team-a-list",n,e.myId),G("team-b-list",i,e.myId),r("btn-start").style.display=t&&s>=3?"block":"none",r("lobby-waiting").style.display=t?"none":"block"}function G(e,t,s){r(e).innerHTML=t.map(n=>`
    <li>${p(n.name)}${n.id===s?" (bạn)":""}${n.isHost?' <span class="lobby-player-host" style="font-size:10px; margin-left:4px;">Chủ phòng</span>':""}</li>
  `).join("")}function ae(){const e=u;ce(),r("round-display").textContent=`${e.round}/${e.maxRounds}`,le(),de(),ue(),he(),be()}function ce(){const e=u,t=e.players.find(i=>i.id===e.myId);if(!t)return;let s=`<strong>${p(t.name)}</strong>`;e.mode==="3p"?s+=e.myRole==="interceptor"?" (Người chặn)":" (Đội mã hóa)":s+=e.myTeam?` (Đội ${e.myTeam})`:" (Khán giả)";const n=r("player-identity");n&&(n.innerHTML=s)}function le(){const e=u,t=r("topbar-tokens");e.mode==="3p"?t.innerHTML=`
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
    `}function de(){const e=u,t=r("keywords-panel");e.keywords?(t.style.display="block",r("keywords-list").innerHTML=e.keywords.map((s,n)=>`
      <div class="keyword-chip kw-${n+1}">
        <span class="kw-number">${n+1}</span>
        <span>${p(s)}</span>
      </div>
    `).join("")):t.style.display="none"}function ue(){var s;const e=u;let t="";if(e.mode==="3p"){const n=((s=e.encryptors.find(i=>i.id===e.currentEncryptorId))==null?void 0:s.name)||"";switch(e.phase){case"ENCRYPT":t=e.myRole==="encryptor"?"Bạn là người mã hóa — Nhập gợi ý":`Đang chờ ${n} mã hóa...`;break;case"GUESS":t="Đoán mã số";break;case"REVEAL":t="Kết quả";break}}else{const n=e.currentTeamTurn;switch(e.phase){case"ENCRYPT":t=e.myRole==="encryptor"?"Bạn là người mã hóa — Nhập gợi ý":"Đang chờ mã hóa...";break;case"GUESS_A":case"GUESS_B":t=`Đội ${n} — Đoán mã số`;break;case"REVEAL_A":case"REVEAL_B":t=`Đội ${n} — Kết quả`;break}}r("phase-status").textContent=t}function he(){const e=u,t=r("action-area");e.phase==="ENCRYPT"?me(t):e.phase==="GUESS"||e.phase==="GUESS_A"||e.phase==="GUESS_B"?pe(t):(e.phase==="REVEAL"||e.phase==="REVEAL_A"||e.phase==="REVEAL_B")&&ve(t)}function me(e){const t=u,s=t.mode==="3p"?t.cluesSubmitted:t.myTeam?t["team"+t.myTeam].cluesSubmitted:!1;if(t.myRole==="encryptor"&&t.code&&!s)e.innerHTML=`
      <div class="encrypt-code-display fade-in">
        <div class="encrypt-code-label">Mã số cần truyền đạt</div>
        <div class="encrypt-code-numbers">
          ${t.code.map(n=>`<div class="code-digit" style="background:${E[n-1]}">${n}</div>`).join("")}
        </div>
      </div>
      <div class="clue-inputs fade-in">
        ${t.code.map((n,i)=>`
          <div class="clue-input-row">
            <div class="clue-number" style="background:${E[n-1]}">${["A","B","C"][i]}</div>
            <input type="text" class="clue-input" id="clue-${i}" placeholder="Gợi ý cho từ khóa số ${n}..." autocomplete="off" />
          </div>
        `).join("")}
      </div>
      <button class="btn btn-primary" id="btn-submit-clues">Gửi gợi ý</button>
    `,r("btn-submit-clues").addEventListener("click",n=>{const i=!n.isTrusted;let o=[0,1,2].map(a=>r(`clue-${a}`).value.trim());if(!i&&o.some(a=>!a)){g("Vui lòng nhập đủ 3 gợi ý");return}i&&(o=o.map(a=>a||"(Hết giờ)")),w({type:"submit-clues",clues:o}),e.innerHTML=`
        <div class="waiting-indicator fade-in">
          <p>Đang gửi gợi ý...<span class="waiting-dots"></span></p>
        </div>
      `}),setTimeout(()=>{var n;return(n=r("clue-0"))==null?void 0:n.focus()},100);else{let n="";if(t.mode==="3p"){const i=t.encryptors.find(o=>o.id===t.currentEncryptorId);n=`Đang chờ ${(i==null?void 0:i.name)||""} nhập gợi ý`}else{const i=[];if(t.teamA.cluesSubmitted&&i.push("A"),t.teamB.cluesSubmitted&&i.push("B"),i.length===0)n="Đang chờ cả 2 người mã hóa...";else{const o=i.includes("A")?"B":"A";n=`Đội ${i[0]} đã xong. Đang chờ đội ${o}...`}}e.innerHTML=`
      <div class="waiting-indicator fade-in">
        <p>${n}<span class="waiting-dots"></span></p>
      </div>
    `}}function pe(e){const t=u,s=t.currentClues||t.clues;if(!s)return;let n="";t.mode==="3p"?n+=ye(s):n+=fe(s),e.innerHTML=n,ge()}function b(e){return`
    <div class="clues-display fade-in" style="margin-bottom:14px">
      <div class="clues-display-header">Gợi ý</div>
      ${e.map((t,s)=>`
        <div class="clue-display-item">
          <div class="clue-number" style="background:var(--text-muted)">${["A","B","C"][s]}</div>
          <span>${p(t)}</span>
        </div>
      `).join("")}
    </div>
  `}function ye(e){const t=u;let s="";return t.myRole==="encryptor"&&t.currentEncryptorId===t.myId?(s+=b(e),s+='<div class="waiting-indicator">Bạn là người mã hóa — Hãy chờ đồng đội đoán</div>'):t.myRole==="interceptor"?t.round<2?(s+=b(e),s+='<div class="waiting-indicator">Vòng 1 — Chưa thể chặn mã</div>',t.decryptSubmitted||(s+='<div class="waiting-indicator">Đang chờ đội mã hóa đoán<span class="waiting-dots"></span></div>')):t.interceptSubmitted?(s+=b(e),s+='<div class="guess-submitted">Bạn đã gửi dự đoán<span class="waiting-dots"></span></div>'):s+=L("intercept","Chặn mã",e,null):t.decryptSubmitted?(s+=b(e),s+='<div class="guess-submitted">Đội bạn đã gửi dự đoán<span class="waiting-dots"></span></div>'):s+=L("decrypt","Giải mã",e,t.keywords),s}function fe(e){const t=u,s=t.currentTeamTurn,n=t.myTeam===s,i=s==="A"?"B":"A";let o="";if(n){const a=s==="A"?t.teamA:t.teamB;a.encryptorId===t.myId?(o+=b(e),o+='<div class="waiting-indicator">Bạn là người mã hóa — Không được gợi ý</div>'):t.decryptSubmitted?(o+=b(e),o+=`<div class="guess-submitted">Đội bạn đã gửi dự đoán. Đang chờ đội ${i}<span class="waiting-dots"></span></div>`):o+=L("decrypt","Giải mã",e,a.keywords)}else t.round<2?(o+=b(e),o+='<div class="waiting-indicator">Vòng 1 — Chưa thể chặn mã</div>'):t.interceptSubmitted?(o+=b(e),o+='<div class="guess-submitted">Đội bạn đã gửi dự đoán<span class="waiting-dots"></span></div>'):o+=L("intercept","Chặn mã",e,null);return o}function L(e,t,s,n){return`
    <div class="guess-section fade-in">
      <div class="guess-section-title">${t}</div>
      <div class="guess-connection-container">
        ${[0,1,2].map(i=>`
          <div class="guess-connection-row" id="guess-row-${i}" data-clue-index="${i}">
            <div class="guess-clue-box">
              <div class="clue-number" style="background:var(--text-muted)">${["A","B","C"][i]}</div>
              <span>${p(s[i])}</span>
            </div>
            <div class="guess-options">
              ${[1,2,3,4].map(o=>`
                <button class="guess-opt" data-val="${o}">
                  <span class="kw-number" style="background:${E[o-1]}">${o}</span>
                  ${n?`<span>${p(n[o-1])}</span>`:""}
                </button>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
      <button class="btn btn-primary" id="btn-submit-guess" data-type="${e}" disabled>Gửi</button>
    </div>
  `}function ge(){const e=r("btn-submit-guess");if(!e)return;const t=[0,1,2].map(n=>r(`guess-row-${n}`)),s={0:null,1:null,2:null};t.forEach((n,i)=>{if(!n)return;const o=n.querySelectorAll(".guess-opt");o.forEach(a=>{a.addEventListener("click",()=>{o.forEach(l=>l.classList.remove("selected","kw-1","kw-2","kw-3","kw-4"));const d=parseInt(a.dataset.val);s[i]=d,a.classList.add("selected",`kw-${d}`),s[0]&&s[1]&&s[2]&&(e.disabled=!1)})})}),e.addEventListener("click",()=>{if(!s[0]||!s[1]||!s[2])return;const n=[s[0],s[1],s[2]],i=e.dataset.type;w({type:"submit-guess",guess:n,guessType:i}),e.disabled=!0,e.textContent="Đã gửi"})}function ve(e){var a,d;const t=u,s=(a=t.players.find(l=>l.id===t.myId))==null?void 0:a.isHost;let n="";const i=t.mode==="3p"?t.clues:t.currentClues;n+=`
    <div class="reveal-section fade-in">
      <div class="reveal-title">Mã số đúng</div>
      <div class="reveal-code-row" style="flex-direction: column; gap: 8px;">
        ${t.revealCode.map((l,m)=>`
          <div style="display: flex; align-items: center; gap: 12px; background: var(--surface-alt); padding: 8px 16px; border-radius: 8px; width: 100%; max-width: 300px; margin: 0 auto;">
            <div class="code-digit" style="background:${E[l-1]}">${l}</div>
            <div style="color:${E[l-1]}; font-weight: 600; font-size: 1.1rem">${p(i[m])}</div>
          </div>
        `).join("")}
      </div>
  `;const o=l=>l.map((m,y)=>`<div class="code-digit" style="background:${m===t.revealCode[y]?"var(--success)":"var(--error)"}; transform: scale(0.8)">${m}</div>`).join("");if(t.decryptGuess){const l=t.decryptCorrect?"result-correct":"result-incorrect",m=t.decryptCorrect?"Giải mã thành công":"Giải mã thất bại";n+=`
      <div class="reveal-result ${l}">
        <span class="result-label">${m}</span>
        <div style="display:flex; gap:4px; justify-content:center; margin-top:8px;">${o(t.decryptGuess)}</div>
      </div>
    `}if(t.interceptGuess){const l=t.interceptCorrect?"result-correct":"result-incorrect",m=t.interceptCorrect?"Chặn mã thành công!":"Chặn mã thất bại";n+=`
      <div class="reveal-result ${l}">
        <span class="result-label">${m}</span>
        <div style="display:flex; gap:4px; justify-content:center; margin-top:8px;">${o(t.interceptGuess)}</div>
      </div>
    `}else t.round<2||t.needIntercept;n+="</div>",s?n+='<button class="btn btn-primary" id="btn-continue">Tiếp tục</button>':n+='<div class="waiting-indicator">Đang chờ chủ phòng tiếp tục<span class="waiting-dots"></span></div>',e.innerHTML=n,(d=r("btn-continue"))==null||d.addEventListener("click",()=>{w({type:"continue"})})}function be(){const e=u,t=r("history-tables");e.mode==="3p"?_e(t):we(t)}function _e(e){const s=u.history||[];if(s.length===0){e.innerHTML='<div class="history-empty">Chưa có lịch sử</div>';return}const n={1:[],2:[],3:[],4:[]},i=[];for(const o of s){i.push(o.round);for(let a=0;a<3;a++){const d=o.code[a];n[d].push({round:o.round,clue:o.clues[a]})}}e.innerHTML=`
    <div class="history-section-label">Theo từ khóa</div>
    ${N(n,i)}
  `}function we(e){const t=u,s=t.myHistory||[],n=t.opponentHistory||[];if(s.length===0&&n.length===0){e.innerHTML='<div class="history-empty">Chưa có lịch sử</div>';return}let i="";if(n.length>0){const o=t.myTeam==="A"?"B":"A",a={1:[],2:[],3:[],4:[]},d=[];for(const l of n){d.push(l.round);for(let m=0;m<3;m++){const y=l.code[m];a[y].push({round:l.round,clue:l.clues[m]})}}i+=`<div class="history-section-label">Đội ${o} (đối phương)</div>`,i+=N(a,d)}if(s.length>0){const o={1:[],2:[],3:[],4:[]},a=[];for(const d of s){a.push(d.round);for(let l=0;l<3;l++){const m=d.code[l];o[m].push({round:d.round,clue:d.clues[l]})}}i+=`<div class="history-section-label">Đội ${t.myTeam} (đội bạn)</div>`,i+=N(o,a)}e.innerHTML=i}function N(e,t){const s=[...new Set(t)].sort((i,o)=>i-o);let n='<table class="history-table"><thead><tr><th>Từ khóa</th>';for(const i of s)n+=`<th class="kw-col-header">V${i}</th>`;n+="</tr></thead><tbody>";for(let i=1;i<=4;i++){n+=`<tr style="color:${E[i-1]}"><td style="font-weight:600">#${i}</td>`;for(const o of s){const a=e[i].find(d=>d.round===o);n+=`<td class="kw-cell">${a?p(a.clue):"—"}</td>`}n+="</tr>"}return n+="</tbody></table>",n}function ke(){var s;const e=u,t=(s=e.players.find(n=>n.id===e.myId))==null?void 0:s.isHost;if(e.mode==="3p")e.winner==="interceptor"?r("gameover-title").textContent=e.myRole==="interceptor"?"Bạn đã thắng!":"Người chặn mã đã thắng!":r("gameover-title").textContent=e.myRole==="interceptor"?"Bạn đã thua!":"Đội mã hóa đã thắng!",r("gameover-summary").innerHTML=`
      <p>Token chặn: ${e.interceptorTokens}/2</p>
      <p>Số vòng: ${e.round}/${e.maxRounds}</p>
    `,e.allKeywords&&(r("gameover-keywords").innerHTML=`
        <div class="gameover-team-keywords">
          <div class="gameover-team-header" style="background:var(--surface-alt)">Từ khóa</div>
          <div class="gameover-kw-list">
            ${e.allKeywords.map((n,i)=>`
              <div class="keyword-chip kw-${i+1}">
                <span class="kw-number">${i+1}</span>
                <span>${p(n)}</span>
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
                <span>${p(n)}</span>
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
                <span>${p(n)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `)}r("btn-play-again").style.display=t?"block":"none"}function p(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}
