var j=Object.defineProperty;var V=(e,t,s)=>t in e?j(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s;var c=(e,t,s)=>V(e,typeof t!="symbol"?t+"":t,s);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function s(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(i){if(i.ep)return;i.ep=!0;const o=s(i);fetch(i.href,o)}})();(!globalThis.EventTarget||!globalThis.Event)&&console.error(`
  PartySocket requires a global 'EventTarget' class to be available!
  You can polyfill this global by adding this to your code before any partysocket imports: 
  
  \`\`\`
  import 'partysocket/event-target-polyfill';
  \`\`\`
  Please file an issue at https://github.com/partykit/partykit if you're still having trouble.
`);var G=class extends Event{constructor(t,s){super("error",s);c(this,"message");c(this,"error");this.message=t.message,this.error=t}},H=class extends Event{constructor(t=1e3,s="",n){super("close",n);c(this,"code");c(this,"reason");c(this,"wasClean",!0);this.code=t,this.reason=s}};const L={Event,ErrorEvent:G,CloseEvent:H};function q(e,t){if(!e)throw new Error(t)}function K(e){return new e.constructor(e.type,e)}function F(e){return"data"in e?new MessageEvent(e.type,e):"code"in e||"reason"in e?new H(e.code||1999,e.reason||"unknown reason",e):"error"in e?new G(e.error,e):new Event(e.type,e)}var O;const Q=typeof process<"u"&&typeof((O=process.versions)==null?void 0:O.node)<"u",Y=typeof navigator<"u"&&navigator.product==="ReactNative",T=Q||Y?F:K,_={maxReconnectionDelay:1e4,minReconnectionDelay:3e3,minUptime:5e3,reconnectionDelayGrowFactor:1.3,connectionTimeout:4e3,maxRetries:Number.POSITIVE_INFINITY,maxEnqueuedMessages:Number.POSITIVE_INFINITY};let R=!1;function J(){}var z=class b extends EventTarget{constructor(s,n,i={}){super();c(this,"_ws");c(this,"_retryCount",-1);c(this,"_uptimeTimeout");c(this,"_connectTimeout");c(this,"_shouldReconnect",!0);c(this,"_connectLock",!1);c(this,"_binaryType","blob");c(this,"_closeCalled",!1);c(this,"_didWarnAboutClosedSend",!1);c(this,"_messageQueue",[]);c(this,"_debugLogger",console.log.bind(console));c(this,"_url");c(this,"_protocols");c(this,"_options");c(this,"onclose",null);c(this,"onerror",null);c(this,"onmessage",null);c(this,"onopen",null);c(this,"_handleOpen",s=>{this._debug("open event");const{minUptime:n=_.minUptime}=this._options;clearTimeout(this._connectTimeout),this._uptimeTimeout=setTimeout(()=>this._acceptOpen(),n),q(this._ws,"WebSocket is not defined"),this._ws.binaryType=this._binaryType,this._messageQueue.forEach(i=>{var o;(o=this._ws)==null||o.send(i)}),this._messageQueue=[],this.onopen&&this.onopen(s),this.dispatchEvent(T(s))});c(this,"_handleMessage",s=>{this._debug("message event"),this.onmessage&&this.onmessage(s),this.dispatchEvent(T(s))});c(this,"_handleError",s=>{this._debug("error event",s.message),this._disconnect(void 0,s.message==="TIMEOUT"?"timeout":void 0),this.onerror&&this.onerror(s),this._debug("exec error listeners"),this.dispatchEvent(T(s)),this._connect()});c(this,"_handleClose",s=>{this._debug("close event"),this._clearTimeouts(),this._options.shouldReconnectOnClose&&!this._options.shouldReconnectOnClose(s)&&(this._shouldReconnect=!1),this._shouldReconnect&&this._connect(),this.onclose&&this.onclose(s),this.dispatchEvent(T(s))});this._url=s,this._protocols=n,this._options=i,this._options.startClosed&&(this._shouldReconnect=!1),this._options.debugLogger&&(this._debugLogger=this._options.debugLogger),this._connect()}static get CONNECTING(){return 0}static get OPEN(){return 1}static get CLOSING(){return 2}static get CLOSED(){return 3}get CONNECTING(){return b.CONNECTING}get OPEN(){return b.OPEN}get CLOSING(){return b.CLOSING}get CLOSED(){return b.CLOSED}get binaryType(){return this._ws?this._ws.binaryType:this._binaryType}set binaryType(s){this._binaryType=s,this._ws&&(this._ws.binaryType=s)}get retryCount(){return Math.max(this._retryCount,0)}get bufferedAmount(){return this._messageQueue.reduce((s,n)=>(typeof n=="string"?s+=n.length:n instanceof Blob?s+=n.size:s+=n.byteLength,s),0)+(this._ws?this._ws.bufferedAmount:0)}get extensions(){return this._ws?this._ws.extensions:""}get protocol(){return this._ws?this._ws.protocol:""}get readyState(){return this._closeCalled?b.CLOSED:this._ws?this._ws.readyState:this._options.startClosed?b.CLOSED:b.CONNECTING}get url(){return this._ws?this._ws.url:""}get shouldReconnect(){return this._shouldReconnect}close(s=1e3,n){if(this._closeCalled=!0,this._shouldReconnect=!1,this._clearTimeouts(),!this._ws){this._debug("close enqueued: no ws instance");return}if(this._ws.readyState===this.CLOSED||this._ws.readyState===this.CLOSING){this._debug("close: already closing or closed");return}this._disconnect(s,n)}reconnect(s,n){this._shouldReconnect=!0,this._closeCalled=!1,this._didWarnAboutClosedSend=!1,this._retryCount=-1,!this._ws||this._ws.readyState===this.CLOSED||this._ws.readyState===this.CLOSING?this._connect():(this._disconnect(s,n),this._connect())}send(s){if(this._ws&&this._ws.readyState===this.OPEN)return this._debug("send",s),this._ws.send(s),!0;this._closeCalled&&!this._didWarnAboutClosedSend&&(this._didWarnAboutClosedSend=!0,console.warn("ReconnectingWebSocket: send() was called after close(). The message has been buffered, but it will only be delivered if reconnect() is called on this socket. If this socket has been discarded, the message is lost — this usually means a stale socket reference is being used."));const{maxEnqueuedMessages:n=_.maxEnqueuedMessages}=this._options;return this._messageQueue.length<n&&(this._debug("enqueue",s),this._messageQueue.push(s)),!1}drainQueuedMessages(){const s=this._messageQueue;return this._messageQueue=[],s}_debug(...s){this._options.debug&&this._debugLogger("RWS>",...s)}_getNextDelay(){const{reconnectionDelayGrowFactor:s=_.reconnectionDelayGrowFactor,minReconnectionDelay:n=_.minReconnectionDelay,maxReconnectionDelay:i=_.maxReconnectionDelay}=this._options;let o=0;return this._retryCount>0&&(o=n*s**(this._retryCount-1),o>i&&(o=i)),this._debug("next delay",o),o}_wait(){return new Promise(s=>{setTimeout(s,this._getNextDelay())})}_getNextProtocols(s){if(!s)return Promise.resolve(null);if(typeof s=="string"||Array.isArray(s))return Promise.resolve(s);if(typeof s=="function"){const n=s();if(!n)return Promise.resolve(null);if(typeof n=="string"||Array.isArray(n))return Promise.resolve(n);if(n.then)return n}throw Error("Invalid protocols")}_getNextUrl(s){if(typeof s=="string")return Promise.resolve(s);if(typeof s=="function"){const n=s();if(typeof n=="string")return Promise.resolve(n);if(n.then)return n}throw Error("Invalid URL")}_connect(){if(this._connectLock||!this._shouldReconnect)return;this._connectLock=!0;const{maxRetries:s=_.maxRetries,connectionTimeout:n=_.connectionTimeout}=this._options;if(this._retryCount>=s){this._debug("max retries reached",this._retryCount,">=",s),this._connectLock=!1;return}this._retryCount++,this._debug("connect",this._retryCount),this._removeListeners(),this._wait().then(()=>Promise.all([this._getNextUrl(this._url),this._getNextProtocols(this._protocols||null)])).then(([i,o])=>{if(this._closeCalled){this._connectLock=!1;return}!this._options.WebSocket&&typeof WebSocket>"u"&&!R&&(console.error(`‼️ No WebSocket implementation available. You should define options.WebSocket. 

For example, if you're using node.js, run \`npm install ws\`, and then in your code:

import PartySocket from 'partysocket';
import WS from 'ws';

const partysocket = new PartySocket({
  host: "127.0.0.1:1999",
  room: "test-room",
  WebSocket: WS
});

`),R=!0);const a=this._options.WebSocket||WebSocket;this._debug("connect",{url:i,protocols:o}),this._ws=o?new a(i,o):new a(i),this._ws.binaryType=this._binaryType,this._connectLock=!1,this._addListeners(),this._connectTimeout=setTimeout(()=>this._handleTimeout(),n)}).catch(i=>{this._connectLock=!1,this._handleError(new L.ErrorEvent(Error(i.message),this))})}_handleTimeout(){this._debug("timeout event"),this._handleError(new L.ErrorEvent(Error("TIMEOUT"),this))}_disconnect(s=1e3,n){if(this._clearTimeouts(),!!this._ws){this._removeListeners();try{(this._ws.readyState===this.OPEN||this._ws.readyState===this.CONNECTING)&&this._ws.close(s,n),this._handleClose(new L.CloseEvent(s,n,this))}catch{}}}_acceptOpen(){this._debug("accept open"),this._retryCount=0}_removeListeners(){this._ws&&(this._debug("removeListeners"),this._ws.removeEventListener("open",this._handleOpen),this._ws.removeEventListener("close",this._handleClose),this._ws.removeEventListener("message",this._handleMessage),this._ws.removeEventListener("error",this._handleError),this._ws.addEventListener("error",J))}_addListeners(){this._ws&&(this._debug("addListeners"),this._ws.addEventListener("open",this._handleOpen),this._ws.addEventListener("close",this._handleClose),this._ws.addEventListener("message",this._handleMessage),this._ws.addEventListener("error",this._handleError))}_clearTimeouts(){clearTimeout(this._connectTimeout),clearTimeout(this._uptimeTimeout)}};const X=e=>e[1]!==null&&e[1]!==void 0;function Z(){if(crypto!=null&&crypto.randomUUID)return crypto.randomUUID();let e=Date.now(),t=(performance==null?void 0:performance.now)&&performance.now()*1e3||0;return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(s){let n=Math.random()*16;return e>0?(n=(e+n)%16|0,e=Math.floor(e/16)):(n=(t+n)%16|0,t=Math.floor(t/16)),(s==="x"?n:n&3|8).toString(16)})}function W(e,t,s={}){const{host:n,path:i,protocol:o,room:a,party:h,basePath:l,prefix:p,query:m}=e;let u=n.replace(/^(http|https|ws|wss):\/\//,"");if(u.endsWith("/")&&(u=u.slice(0,-1)),i!=null&&i.startsWith("/"))throw new Error("path must not start with a slash");const $=h??"main",S=i?`/${i}`:"",N=o||(u.startsWith("localhost:")||u.startsWith("127.0.0.1:")||u.startsWith("192.168.")||u.startsWith("10.")||u.startsWith("172.")&&u.split(".")[1]>="16"&&u.split(".")[1]<="31"||u.startsWith("[::ffff:7f00:1]:")?t:`${t}s`),P=`${N}://${u}/${l||`${p||"parties"}/${$}/${a}`}${S}`,I=(D={})=>`${P}?${new URLSearchParams([...Object.entries(s),...Object.entries(D).filter(X)])}`,U=typeof m=="function"?async()=>I(await m()):I(m);return{host:u,path:S,room:a,name:$,protocol:N,partyUrl:P,urlProvider:U}}var ee=class extends z{constructor(t){var n,i;const s=A(t);super(s.urlProvider,s.protocols,s.socketOptions);c(this,"_pk");c(this,"_pkurl");c(this,"name");c(this,"room");c(this,"host");c(this,"path");c(this,"basePath");if(this.partySocketOptions=t,this.setWSProperties(s),!t.startClosed&&!this.room&&!this.basePath)throw this.close(),new Error("Either room or basePath must be provided to connect. Use startClosed: true to create a socket and set them via updateProperties before calling reconnect().");t.disableNameValidation||((n=t.party)!=null&&n.includes("/")&&console.warn(`PartySocket: party name "${t.party}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`),(i=t.room)!=null&&i.includes("/")&&console.warn(`PartySocket: room name "${t.room}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`))}updateProperties(t){const s=A({...this.partySocketOptions,...t,host:t.host??this.host,room:t.room??this.room,path:t.path??this.path,basePath:t.basePath??this.basePath});this._url=s.urlProvider,this._protocols=s.protocols,this._options=s.socketOptions,this.setWSProperties(s)}setWSProperties(t){const{_pk:s,_pkurl:n,name:i,room:o,host:a,path:h,basePath:l}=t;this._pk=s,this._pkurl=n,this.name=i,this.room=o,this.host=a,this.path=h,this.basePath=l}reconnect(t,s){if(!this.host)throw new Error("The host must be set before connecting, use `updateProperties` method to set it or pass it to the constructor.");if(!this.room&&!this.basePath)throw new Error("The room (or basePath) must be set before connecting, use `updateProperties` method to set it or pass it to the constructor.");super.reconnect(t,s)}get id(){return this._pk}get roomUrl(){return this._pkurl}static async fetch(t,s){const n=W(t,"http"),i=typeof n.urlProvider=="string"?n.urlProvider:await n.urlProvider();return(t.fetch??fetch)(i,s)}};function A(e){const{id:t,host:s,path:n,party:i,room:o,protocol:a,query:h,protocols:l,...p}=e,m=t||Z(),u=W(e,"ws",{_pk:m});return{_pk:m,_pkurl:u.partyUrl,name:u.name,room:u.room,host:u.host,path:u.path,basePath:e.basePath,protocols:l,socketOptions:p,urlProvider:u.urlProvider}}let y=null,d=null,k=null;const g=["var(--kw-1)","var(--kw-2)","var(--kw-3)","var(--kw-4)"],r=e=>document.getElementById(e),w=e=>{document.querySelectorAll(".screen").forEach(t=>t.classList.remove("active")),r(e).classList.add("active")};function v(e){const t=r("toast");t.textContent=e,t.classList.add("show"),setTimeout(()=>t.classList.remove("show"),2500)}function B(e,t){const s=location.hostname==="localhost"||location.hostname==="127.0.0.1"||location.hostname.startsWith("192.168.")||location.hostname.startsWith("10.")?location.host:"decrypto-online.kennyphan123.partykit.dev";y=new ee({host:s,room:e}),y.addEventListener("open",()=>{y.send(JSON.stringify({type:"join",name:t}))}),y.addEventListener("message",n=>{const i=JSON.parse(n.data);i.type==="state"?(d=i.state,se()):i.type==="error"&&v(i.message)}),y.addEventListener("close",()=>{v("Mất kết nối. Tải lại trang để chơi lại.")})}function E(e){y&&y.send(JSON.stringify(e))}r("btn-create").addEventListener("click",()=>{const e=r("player-name").value.trim();if(!e){v("Vui lòng nhập tên");return}const t=te();B(t,e),w("lobby-screen")});r("btn-join").addEventListener("click",()=>{const e=r("player-name").value.trim(),t=r("room-code-input").value.trim().toUpperCase();if(!e){v("Vui lòng nhập tên");return}if(!t||t.length<4){v("Vui lòng nhập mã phòng");return}B(t,e),w("lobby-screen")});r("player-name").addEventListener("keydown",e=>{e.key==="Enter"&&r("btn-create").click()});r("room-code-input").addEventListener("keydown",e=>{e.key==="Enter"&&r("btn-join").click()});function te(){const e="ABCDEFGHJKLMNPQRSTUVWXYZ";let t="";for(let s=0;s<4;s++)t+=e[Math.floor(Math.random()*e.length)];return t}r("btn-copy-code").addEventListener("click",()=>{const e=r("room-code-text").textContent;navigator.clipboard.writeText(e).then(()=>v("Đã sao chép"))});r("btn-start").addEventListener("click",()=>E({type:"start"}));r("history-toggle").addEventListener("click",()=>{r("history-panel").classList.toggle("open")});r("btn-play-again").addEventListener("click",()=>E({type:"play-again"}));r("btn-back-home").addEventListener("click",()=>{y&&y.close(),y=null,d=null,w("home-screen")});function se(){d&&(k&&(clearInterval(k),k=null),d.phase==="LOBBY"?(ie(),w("lobby-screen")):d.phase==="GAME_OVER"?(_e(),w("gameover-screen")):(oe(),w("game-screen"),ne()))}function ne(){const e=d,t=r("topbar-timer");if(e.phase==="ENCRYPT"&&e.timerEnd){t.style.display="block";const s=()=>{const n=Math.max(0,Math.floor((e.timerEnd-Date.now())/1e3));if(t.textContent=n+"s",n<=0){clearInterval(k);const i=r("btn-submit-clues");i&&!i.disabled&&i.click()}};s(),k=setInterval(s,1e3)}else t.style.display="none"}function ie(){var n;const e=d;r("room-code-text").textContent=e.roomCode;const t=(n=e.players.find(i=>i.id===e.myId))==null?void 0:n.isHost,s=e.players.length;s<3?r("lobby-mode-info").textContent=`${s} người chơi — Cần ít nhất 3 người`:s===3?r("lobby-mode-info").textContent="3 người chơi — Chế độ độc lập (Interceptor)":r("lobby-mode-info").textContent=`${s} người chơi — Chế độ đội`,s>=4&&e.teamA&&e.teamB?(r("lobby-players").style.display="none",r("lobby-teams").style.display="flex",M("team-a-list",e.teamA.players,e.myId),M("team-b-list",e.teamB.players,e.myId)):(r("lobby-players").style.display="block",r("lobby-teams").style.display="none",r("lobby-players").innerHTML=e.players.map(i=>`
      <div class="lobby-player-item">
        <div class="lobby-player-dot"></div>
        <span class="lobby-player-name">${f(i.name)}</span>
        ${i.isHost?'<span class="lobby-player-host">Chủ phòng</span>':""}
        ${i.id===e.myId?'<span class="lobby-player-you">Bạn</span>':""}
      </div>
    `).join("")),r("btn-start").style.display=t&&s>=3?"block":"none",r("lobby-waiting").style.display=t?"none":"block"}function M(e,t,s){r(e).innerHTML=t.map(n=>`
    <li>${f(n.name)}${n.id===s?" (bạn)":""}</li>
  `).join("")}function oe(){const e=d;re(),r("round-display").textContent=`${e.round}/${e.maxRounds}`,ae(),ce(),le(),de(),ge()}function re(){const e=d,t=e.players.find(i=>i.id===e.myId);if(!t)return;let s=`<strong>${f(t.name)}</strong>`;e.mode==="3p"?s+=e.myRole==="interceptor"?" (Người chặn)":" (Đội mã hóa)":s+=e.myTeam?` (Đội ${e.myTeam})`:" (Khán giả)";const n=r("player-identity");n&&(n.innerHTML=s)}function ae(){const e=d,t=r("topbar-tokens");e.mode==="3p"?t.innerHTML=`
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
    `}function ce(){const e=d,t=r("keywords-panel");e.keywords?(t.style.display="block",r("keywords-list").innerHTML=e.keywords.map((s,n)=>`
      <div class="keyword-chip kw-${n+1}">
        <span class="kw-number">${n+1}</span>
        <span>${f(s)}</span>
      </div>
    `).join("")):t.style.display="none"}function le(){var s;const e=d;let t="";if(e.mode==="3p"){const n=((s=e.encryptors.find(i=>i.id===e.currentEncryptorId))==null?void 0:s.name)||"";switch(e.phase){case"ENCRYPT":t=e.myRole==="encryptor"?"Bạn là người mã hóa — Nhập gợi ý":`Đang chờ ${n} mã hóa...`;break;case"GUESS":t="Đoán mã số";break;case"REVEAL":t="Kết quả";break}}else{const n=e.currentTeamTurn;switch(e.phase){case"ENCRYPT":t=e.myRole==="encryptor"?"Bạn là người mã hóa — Nhập gợi ý":"Đang chờ mã hóa...";break;case"GUESS_A":case"GUESS_B":t=`Đội ${n} — Đoán mã số`;break;case"REVEAL_A":case"REVEAL_B":t=`Đội ${n} — Kết quả`;break}}r("phase-status").textContent=t}function de(){const e=d,t=r("action-area");e.phase==="ENCRYPT"?ue(t):e.phase==="GUESS"||e.phase==="GUESS_A"||e.phase==="GUESS_B"?he(t):(e.phase==="REVEAL"||e.phase==="REVEAL_A"||e.phase==="REVEAL_B")&&fe(t)}function ue(e){const t=d,s=t.mode==="3p"?t.cluesSubmitted:t.myTeam?t["team"+t.myTeam].cluesSubmitted:!1;if(t.myRole==="encryptor"&&t.code&&!s)e.innerHTML=`
      <div class="encrypt-code-display fade-in">
        <div class="encrypt-code-label">Mã số cần truyền đạt</div>
        <div class="encrypt-code-numbers">
          ${t.code.map(n=>`<div class="code-digit" style="background:${g[n-1]}">${n}</div>`).join("")}
        </div>
      </div>
      <div class="clue-inputs fade-in">
        ${t.code.map((n,i)=>`
          <div class="clue-input-row">
            <div class="clue-number" style="background:${g[n-1]}">${["A","B","C"][i]}</div>
            <input type="text" class="clue-input" id="clue-${i}" placeholder="Gợi ý cho từ khóa số ${n}..." autocomplete="off" />
          </div>
        `).join("")}
      </div>
      <button class="btn btn-primary" id="btn-submit-clues">Gửi gợi ý</button>
    `,r("btn-submit-clues").addEventListener("click",n=>{const i=!n.isTrusted;let o=[0,1,2].map(a=>r(`clue-${a}`).value.trim());if(!i&&o.some(a=>!a)){v("Vui lòng nhập đủ 3 gợi ý");return}i&&(o=o.map(a=>a||"(Hết giờ)")),E({type:"submit-clues",clues:o}),e.innerHTML=`
        <div class="waiting-indicator fade-in">
          <p>Đang gửi gợi ý...<span class="waiting-dots"></span></p>
        </div>
      `}),setTimeout(()=>{var n;return(n=r("clue-0"))==null?void 0:n.focus()},100);else{let n="";if(t.mode==="3p"){const i=t.encryptors.find(o=>o.id===t.currentEncryptorId);n=`Đang chờ ${(i==null?void 0:i.name)||""} nhập gợi ý`}else{const i=[];if(t.teamA.cluesSubmitted&&i.push("A"),t.teamB.cluesSubmitted&&i.push("B"),i.length===0)n="Đang chờ cả 2 người mã hóa...";else{const o=i.includes("A")?"B":"A";n=`Đội ${i[0]} đã xong. Đang chờ đội ${o}...`}}e.innerHTML=`
      <div class="waiting-indicator fade-in">
        <p>${n}<span class="waiting-dots"></span></p>
      </div>
    `}}function he(e){const t=d,s=t.currentClues||t.clues;if(!s)return;let n="";n+=`
    <div class="clues-display fade-in">
      <div class="clues-display-header">Gợi ý</div>
      ${s.map((i,o)=>`
        <div class="clue-display-item">
          <div class="clue-number" style="background:var(--text-muted)">${["A","B","C"][o]}</div>
          <span>${f(i)}</span>
        </div>
      `).join("")}
    </div>
  `,t.mode==="3p"?n+=pe():n+=me(),e.innerHTML=n,ye()}function pe(){const e=d;let t="";return e.myRole==="encryptor"&&e.currentEncryptorId===e.myId?t+='<div class="waiting-indicator">Bạn là người mã hóa — Hãy chờ đồng đội đoán</div>':e.myRole==="interceptor"?e.round<2?(t+='<div class="waiting-indicator">Vòng 1 — Chưa thể chặn mã</div>',e.decryptSubmitted||(t+='<div class="waiting-indicator">Đang chờ đội mã hóa đoán<span class="waiting-dots"></span></div>')):e.interceptSubmitted?t+='<div class="guess-submitted">Bạn đã gửi dự đoán<span class="waiting-dots"></span></div>':t+=C("intercept","Chặn mã"):e.decryptSubmitted?t+='<div class="guess-submitted">Đội bạn đã gửi dự đoán<span class="waiting-dots"></span></div>':t+=C("decrypt","Giải mã"),t}function me(){const e=d,t=e.currentTeamTurn,s=e.myTeam===t,n=t==="A"?"B":"A";let i="";return s?(t==="A"?e.teamA:e.teamB).encryptorId===e.myId?i+='<div class="waiting-indicator">Bạn là người mã hóa — Không được gợi ý</div>':e.decryptSubmitted?i+=`<div class="guess-submitted">Đội bạn đã gửi dự đoán. Đang chờ đội ${n}<span class="waiting-dots"></span></div>`:i+=C("decrypt","Giải mã"):e.round<2?i+='<div class="waiting-indicator">Vòng 1 — Chưa thể chặn mã</div>':e.interceptSubmitted?i+='<div class="guess-submitted">Đội bạn đã gửi dự đoán<span class="waiting-dots"></span></div>':i+=C("intercept","Chặn mã"),i}function C(e,t){return`
    <div class="guess-section fade-in">
      <div class="guess-section-title">${t}</div>
      <div class="guess-inputs">
        ${[0,1,2].map(s=>`
          <div class="guess-select-group">
            <span class="guess-label">Gợi ý ${["A","B","C"][s]}</span>
            <select class="guess-select" id="guess-${s}" onchange="this.style.color = this.options[this.selectedIndex].style.color">
              <option value="">?</option>
              <option value="1" style="color:${g[0]}; font-weight:bold;">1</option>
              <option value="2" style="color:${g[1]}; font-weight:bold;">2</option>
              <option value="3" style="color:${g[2]}; font-weight:bold;">3</option>
              <option value="4" style="color:${g[3]}; font-weight:bold;">4</option>
            </select>
          </div>
        `).join("")}
      </div>
      <button class="btn btn-primary" id="btn-submit-guess" data-type="${e}">Gửi</button>
    </div>
  `}function ye(){const e=r("btn-submit-guess");e&&e.addEventListener("click",()=>{const t=e.dataset.type,s=[0,1,2].map(n=>{var o;const i=(o=r(`guess-${n}`))==null?void 0:o.value;return i?parseInt(i):0});if(s.some(n=>n<1||n>4)){v("Vui lòng chọn đủ 3 số");return}E({type:"submit-guess",guess:s,guessType:t}),e.disabled=!0,e.textContent="Đã gửi"})}function fe(e){var a,h;const t=d,s=(a=t.players.find(l=>l.id===t.myId))==null?void 0:a.isHost;let n="";const i=t.mode==="3p"?t.clues:t.currentClues;n+=`
    <div class="reveal-section fade-in">
      <div class="reveal-title">Mã số đúng</div>
      <div class="reveal-code-row" style="flex-direction: column; gap: 8px;">
        ${t.revealCode.map((l,p)=>`
          <div style="display: flex; align-items: center; gap: 12px; background: var(--surface-alt); padding: 8px 16px; border-radius: 8px; width: 100%; max-width: 300px; margin: 0 auto;">
            <div class="code-digit" style="background:${g[l-1]}">${l}</div>
            <div style="color:${g[l-1]}; font-weight: 600; font-size: 1.1rem">${f(i[p])}</div>
          </div>
        `).join("")}
      </div>
  `;const o=l=>l.map((p,m)=>`<div class="code-digit" style="background:${p===t.revealCode[m]?"var(--success)":"var(--error)"}; transform: scale(0.8)">${p}</div>`).join("");if(t.decryptGuess){const l=t.decryptCorrect?"result-correct":"result-incorrect",p=t.decryptCorrect?"Giải mã thành công":"Giải mã thất bại";n+=`
      <div class="reveal-result ${l}">
        <span class="result-label">${p}</span>
        <div style="display:flex; gap:4px; justify-content:center; margin-top:8px;">${o(t.decryptGuess)}</div>
      </div>
    `}if(t.interceptGuess){const l=t.interceptCorrect?"result-correct":"result-incorrect",p=t.interceptCorrect?"Chặn mã thành công!":"Chặn mã thất bại";n+=`
      <div class="reveal-result ${l}">
        <span class="result-label">${p}</span>
        <div style="display:flex; gap:4px; justify-content:center; margin-top:8px;">${o(t.interceptGuess)}</div>
      </div>
    `}else t.round<2||t.needIntercept;n+="</div>",s?n+='<button class="btn btn-primary" id="btn-continue">Tiếp tục</button>':n+='<div class="waiting-indicator">Đang chờ chủ phòng tiếp tục<span class="waiting-dots"></span></div>',e.innerHTML=n,(h=r("btn-continue"))==null||h.addEventListener("click",()=>{E({type:"continue"})})}function ge(){const e=d,t=r("history-tables");e.mode==="3p"?be(t):ve(t)}function be(e){const s=d.history||[];if(s.length===0){e.innerHTML='<div class="history-empty">Chưa có lịch sử</div>';return}const n={1:[],2:[],3:[],4:[]},i=[];for(const o of s){i.push(o.round);for(let a=0;a<3;a++){const h=o.code[a];n[h].push({round:o.round,clue:o.clues[a]})}}e.innerHTML=`
    <div class="history-section-label">Theo từ khóa</div>
    ${x(n,i)}
  `}function ve(e){const t=d,s=t.myHistory||[],n=t.opponentHistory||[];if(s.length===0&&n.length===0){e.innerHTML='<div class="history-empty">Chưa có lịch sử</div>';return}let i="";if(n.length>0){const o=t.myTeam==="A"?"B":"A",a={1:[],2:[],3:[],4:[]},h=[];for(const l of n){h.push(l.round);for(let p=0;p<3;p++){const m=l.code[p];a[m].push({round:l.round,clue:l.clues[p]})}}i+=`<div class="history-section-label">Đội ${o} (đối phương)</div>`,i+=x(a,h)}if(s.length>0){const o={1:[],2:[],3:[],4:[]},a=[];for(const h of s){a.push(h.round);for(let l=0;l<3;l++){const p=h.code[l];o[p].push({round:h.round,clue:h.clues[l]})}}i+=`<div class="history-section-label">Đội ${t.myTeam} (đội bạn)</div>`,i+=x(o,a)}e.innerHTML=i}function x(e,t){const s=[...new Set(t)].sort((i,o)=>i-o);let n='<table class="history-table"><thead><tr><th>Từ khóa</th>';for(const i of s)n+=`<th class="kw-col-header">V${i}</th>`;n+="</tr></thead><tbody>";for(let i=1;i<=4;i++){n+=`<tr style="color:${g[i-1]}"><td style="font-weight:600">#${i}</td>`;for(const o of s){const a=e[i].find(h=>h.round===o);n+=`<td class="kw-cell">${a?f(a.clue):"—"}</td>`}n+="</tr>"}return n+="</tbody></table>",n}function _e(){var s;const e=d,t=(s=e.players.find(n=>n.id===e.myId))==null?void 0:s.isHost;if(e.mode==="3p")e.winner==="interceptor"?r("gameover-title").textContent=e.myRole==="interceptor"?"Bạn đã thắng!":"Người chặn mã đã thắng!":r("gameover-title").textContent=e.myRole==="interceptor"?"Bạn đã thua!":"Đội mã hóa đã thắng!",r("gameover-summary").innerHTML=`
      <p>Token chặn: ${e.interceptorTokens}/2</p>
      <p>Số vòng: ${e.round}/${e.maxRounds}</p>
    `,e.allKeywords&&(r("gameover-keywords").innerHTML=`
        <div class="gameover-team-keywords">
          <div class="gameover-team-header" style="background:var(--surface-alt)">Từ khóa</div>
          <div class="gameover-kw-list">
            ${e.allKeywords.map((n,i)=>`
              <div class="keyword-chip kw-${i+1}">
                <span class="kw-number">${i+1}</span>
                <span>${f(n)}</span>
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
                <span>${f(n)}</span>
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
                <span>${f(n)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `)}r("btn-play-again").style.display=t?"block":"none"}function f(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}
