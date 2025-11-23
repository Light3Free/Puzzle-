const emojiList = ["🍰","🧁","🍩","🍪","🥧","🍫"]; // scegli qui le emoji possibili
const logoUrl = 'https://raw.githubusercontent.com/Light3Free/lightfree-puzzle/main/ChatGPT-Image-5-lug-2025_-15_30_12.svg'; // logo usato come sfondo della tessera
const logoOpacity = 0.12; // opacità del logo dentro la tessera (0..1)

/* ---------- ELEMENTI DOM ---------- */
const game = document.getElementById("game");
const modal = document.getElementById("modal");
const modalMessage = document.getElementById("modal-message");
const levelDisplay = document.getElementById("level-display");
const totalTimeDisplay = document.getElementById("total-time-display");
const restartBtn = document.getElementById("restart-btn");
const pauseBtn = document.getElementById("pause-btn");
const langLabel = document.getElementById("lang-label");

/* ---------- STATO GIOCO ---------- */
let currentLang = "it";
let paused = false;
let startTime, totalTime = 0;
let moves = 0;
let gameStarted = false;
let modalMode = "start";
let currentLevel = 0;
let grid = [];
let emptyPos = { row: 0, col: 0 };
let difficulty = "medium";
const levels = [{ size: 3 }, { size: 4 }];
let tileEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];

/* ---------- LINGUA ---------- */
function setLanguage(lang){
  currentLang = lang;
  if (langLabel) langLabel.textContent = lang==="it" ? "Seleziona lingua:" : "Select language:";
  const subtitle = document.querySelector(".subtitle");
  if (subtitle) subtitle.textContent = lang==="it"
    ? "Fai clic sulle tessere intorno alla tessera vuota per spostarle e completare il puzzle."
    : "Click on the tiles next to the empty space to move them and complete the puzzle.";
  if (restartBtn) restartBtn.textContent = lang==="it" ? "🔄 Ricomincia da capo" : "🔄 Restart";
  if (pauseBtn) pauseBtn.textContent = paused ? (lang==="it"?"▶️ Riprendi":"▶️ Resume") : (lang==="it"?"⏸️ Pausa":"⏸️ Pause");
}
document.getElementById("lang-it").onclick = ()=>setLanguage("it");
document.getElementById("lang-en").onclick = ()=>setLanguage("en");

/* ---------- UTIL ---------- */
function formatTime(sec){ const m=Math.floor(sec/60); const s=sec%60; return `${m}:${s.toString().padStart(2,"0")}`; }

/* ---------- GRIGLIA / GENERAZIONE SOLVABILE ---------- */
function generateSolvableGrid(size, mixMoves=50){
  let arr=[];
  for(let i=1;i<size*size;i++) arr.push(i);
  arr.push(null);
  let emptyIndex = size*size-1;
  for(let i=0;i<mixMoves;i++){
    const moves = getValidMoves(emptyIndex,size);
    const randomMove = moves[Math.floor(Math.random()*moves.length)];
    [arr[emptyIndex],arr[randomMove]]=[arr[randomMove],arr[emptyIndex]];
    emptyIndex = randomMove;
  }
  return arr;
}
function getValidMoves(emptyIndex,size){
  const moves=[];
  const row = Math.floor(emptyIndex/size);
  const col = emptyIndex%size;
  if(row>0) moves.push(emptyIndex-size);
  if(row<size-1) moves.push(emptyIndex+size);
  if(col>0) moves.push(emptyIndex-1);
  if(col<size-1) moves.push(emptyIndex+1);
  return moves;
}

/* ---------- SETUP PARTITA ---------- */
function chooseNewTileEmoji(){
  if (emojiList.length <= 1) { tileEmoji = emojiList[0]; return; }
  let pick;
  do {
    pick = emojiList[Math.floor(Math.random() * emojiList.length)];
  } while (pick === tileEmoji);
  tileEmoji = pick;
}

function setupGame(){
  chooseNewTileEmoji();
  const size = levels[currentLevel].size;
  game.style.gridTemplateColumns = `repeat(${size}, 80px)`;
  const mixMoves = difficulty==="easy"?65:difficulty==="medium"?90:150;
  const nums = generateSolvableGrid(size,mixMoves);
  grid=[]; game.innerHTML=""; moves=0; gameStarted=false;
  let k=0;
  for(let r=0;r<size;r++){
    let row=[];
    for(let c=0;c<size;c++){
      const val=nums[k++];
      const tile=document.createElement("div");
      tile.classList.add("tile");
      tile.style.position = "relative";
      tile.style.overflow = "hidden";

      if(val===null){
        tile.classList.add("empty");
        tile.textContent = "";
        emptyPos={row:r,col:c};
      } else {
        const span = document.createElement("div");
        span.className = "tile-label";
        span.style.cssText = [
          "position:relative",
          "z-index:2",
          "font-size:20px",
          "line-height:1",
          "display:flex",
          "flex-direction:column",
          "align-items:center",
          "justify-content:center",
          "height:100%"
        ].join(";");

        const em = document.createElement("div");
        em.textContent = tileEmoji;
        em.style.fontSize = "28px";

        const num = document.createElement("div");
        num.textContent = val;
        num.style.fontSize = "16px";
        num.style.opacity = "0.95";

        span.appendChild(em);
        span.appendChild(num);
        tile.appendChild(span);
      }

      tile.dataset.row=r; tile.dataset.col=c;
      tile.onclick=()=>moveTile(r,c);
      game.appendChild(tile); row.push(tile);
    }
    grid.push(row);
  }
  updateStatus();
  startTime=Date.now(); paused=false;
}

/* ---------- MOVIMENTO ---------- */
function moveTile(r,c){
  if(paused) return;
  const dr=Math.abs(r-emptyPos.row), dc=Math.abs(c-emptyPos.col);
  if(!((dr===1 && dc===0)||(dr===0 && dc===1))) return;
  const clicked = grid[r][c], empty=grid[emptyPos.row][emptyPos.col];

  if (clicked.classList.contains("empty")) return;

  const clickedNumber = clicked.querySelector(".tile-label > div:nth-child(2)").textContent;

  clicked.classList.add("empty");
  clicked.innerHTML = "";

  empty.classList.remove("empty");
  empty.style.position = "relative";

  const span = document.createElement("div");
  span.className = "tile-label";
  span.style.cssText = [
    "position:relative",
    "z-index:2",
    "font-size:20px",
    "line-height:1",
    "display:flex",
    "flex-direction:column",
    "align-items:center",
    "justify-content:center",
    "height:100%"
  ].join(";");

  const em = document.createElement("div");
  em.textContent = tileEmoji;
  em.style.fontSize = "28px";

  const num = document.createElement("div");
  num.textContent = clickedNumber;
  num.style.fontSize = "16px";

  span.appendChild(em);
  span.appendChild(num);
  empty.appendChild(span);

  emptyPos={row:r,col:c};
  moves++;
  if(!gameStarted){ gameStarted=true; startTimer(); }
  updateStatus();
  checkComplete();
}

/* ---------- COMPLETAMENTO ---------- */
function checkComplete(){
  const size=levels[currentLevel].size;
  let k=1;
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(r===size-1 && c===size-1) continue;
      const tile = grid[r][c];
      const label = tile.querySelector && tile.querySelector(".tile-label > div:nth-child(2)");
      if(!label) return;
      const val = label.textContent;
      if(parseInt(val)!==k) return;
      k++;
    }
  }
  stopTimer(); gameStarted=false; showLevelModal(currentLevel);
}

/* ---------- STATUS & TIMER ---------- */
function updateStatus(){
  levelDisplay.textContent=`Lv: ${currentLevel+1} | ${currentLang==="it"?"Mosse":"Moves"}: ${moves}`;
  totalTimeDisplay.textContent=`⏱️ ${formatTime(totalTime+(gameStarted?Math.floor((Date.now()-startTime)/1000):0))}`;
}
let timerInterval;
function startTimer(){ clearInterval(timerInterval); startTime=Date.now();
  timerInterval=setInterval(()=>{ if(!paused) updateStatus(); },1000);
}
function stopTimer(){ totalTime+=Math.floor((Date.now()-startTime)/1000); clearInterval(timerInterval);}

/* ---------- MODALI ---------- */
function showModal({message="",buttons=[]}={}){
  modalMessage.innerHTML=message;
  const container=document.getElementById("modal-buttons"); if(container) container.innerHTML="";
  buttons.forEach(btn=>{
    const b=document.createElement("button");
    b.textContent=btn.text; b.className=btn.className||"";
    if(btn.onClick) b.onclick=btn.onClick;
    if(container) container.appendChild(b);
  });
  modal.classList.remove("hidden");
}
function showStartModal(){
  modalMode="start";
  showModal({
    message:`<h3>${currentLang==="it"?"Seleziona la difficoltà":"Select difficulty"}</h3>`,
    buttons:[
      { text:`🥦 ${currentLang==="it"?"Facile":"Easy"}`, className:"btn-easy", onClick:()=>{difficulty="easy"; modal.classList.add("hidden"); setupGame();} },
      { text:`🍅 ${currentLang==="it"?"Medio":"Medium"}`, className:"btn-medium", onClick:()=>{difficulty="medium"; modal.classList.add("hidden"); setupGame();} },
      { text:`🌶️ ${currentLang==="it"?"Difficile":"Hard"}`, className:"btn-hard", onClick:()=>{difficulty="hard"; modal.classList.add("hidden"); setupGame();} },
      { text:`🌍 ${currentLang==="it"?"Scopri il mondo Light&Free":"Discover Light&Free world"}`, className:"btn-blue", onClick:()=>window.open("https://lightfree6.wordpress.com/", "_blank") },
      { text:`📸 ${currentLang==="it"?"Condividi su Instagram":"Share on Instagram"}`, className:"btn-red", onClick:()=>showShareMessage() },
      { text:`✖ ${currentLang==="it"?"Chiudi":"Close"}`, className:"btn-close", onClick:()=>closeShareMessage() }
    ]
  });
}
function showShareMessage(){
  modalMessage.innerHTML=`📸 ${currentLang==="it"?"Fai uno screenshot del tuo risultato!<br>Poi condividilo su Instagram e tagga <b>@light3free</b> 🚀":"Take a screenshot of your result!<br>Then share it on Instagram and tag <b>@light3free</b> 🚀"}<br><a href="https://instagram.com/light3free" target="_blank">${currentLang==="it"?"Vai al profilo Instagram":"Go to Instagram profile"}</a>`;
}
function closeShareMessage(){ if(modalMode==="start") showStartModal(); else if(modalMode==="level") showLevelModal(currentLevel); }

function showLevelModal(level){
  modalMode="level";
  const isLast=level>=levels.length-1;
  const msg=isLast ? `🎉 ${currentLang==="it"?"Hai completato il gioco in":"You completed the game in"} ${moves} ${currentLang==="it"?"mosse":"moves"} e ${formatTime(totalTime)}!` :
                     `🎉 ${currentLang==="it"?"Hai completato la modalità":"You completed the"} ${difficulty} ${currentLang==="it"?"in":"in"} ${moves} ${currentLang==="it"?"mosse":"moves"} e ${formatTime(totalTime)}!`;
  const buttons=[
    ...(isLast?[
      { text:`🔄 ${currentLang==="it"?"Ricomincia da capo":"Restart"}`, className:"btn-green", onClick:()=>{ totalTime=0; moves=0; currentLevel=0; gameStarted=false; modalMode="start"; modal.classList.add("hidden"); setupGame(); setLanguage(currentLang);} },
      { text:`🎮 ${currentLang==="it"?"Scopri altri giochi nella Game Room":"Discover other games in the Game Room"}`, className:"btn-gameroom", onClick:()=>window.open("https://lightfree6.wordpress.com/game-room/", "_blank")} 
    ]:[
      { text:`➡️ ${currentLang==="it"?"Prossimo livello":"Next Level"}`, className:"btn-green", onClick:()=>{ modal.classList.add("hidden"); currentLevel++; showStartModal();} }
    ]),
    { text:`🌍 ${currentLang==="it"?"Scopri il mondo Light&Free":"Discover Light&Free world"}`, className:"btn-blue", onClick:()=>window.open("https://lightfree6.wordpress.com/", "_blank")},
    { text:`📸 ${currentLang==="it"?"Condividi su Instagram":"Share on Instagram"}`, className:"btn-red", onClick:()=>showShareMessage()},
    { text:`✖ ${currentLang==="it"?"Chiudi":"Close"}`, className:"btn-close", onClick:()=>closeShareMessage()}
  ];
  showModal({message:msg,buttons});
}

/* ---------- PULSANTI STATUS ---------- */
restartBtn.onclick = ()=>{ chooseNewTileEmoji(); totalTime=0;moves=0;currentLevel=0;gameStarted=false;modalMode="start"; modal.classList.add("hidden"); setupGame(); setLanguage(currentLang); }
pauseBtn.onclick = ()=>{ paused=!paused; pauseBtn.textContent=paused?(currentLang==="it"?"▶️ Riprendi":"▶️ Resume"):(currentLang==="it"?"⏸️ Pausa":"⏸️ Pause"); if(!paused) startTime=Date.now(); }

/* ---------- INIT ---------- */
window.onload = ()=>{ showStartModal(); setLanguage("it"); }

