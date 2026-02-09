async function uploadResume() {
  const fileInput = document.getElementById("resumeFile");
  const file = fileInput.files[0];
  const dropZone = document.getElementById("dropZone");
  const statusLog = document.getElementById("statusLog");
  const resultWrapper = document.getElementById("resultWrapper");

  if (!file) {
    statusLog.innerText = "❌ CRITICAL_ERROR: No source file detected.";
    return;
  }

  // Set Scanning State
  dropZone.classList.add('is-scanning');
  resultWrapper.classList.add('hidden');
  statusLog.innerText = ">>> Transmitting Data: " + file.name + " | Please standby...";

  const formData = new FormData();
  formData.append("resume", file);

  try {
    const response = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Link Failed");

    const data = await response.json();
    
    // Success State
    dropZone.classList.remove('is-scanning');
    statusLog.innerText = ">>> Analysis complete. Rendering subject report...";
    
    renderAgentResults(data);

  } catch (error) {
    console.error(error);
    statusLog.innerText = "❌ ERROR: Neural link severed. Verify server connectivity.";
    dropZone.classList.remove('is-scanning');
  }
}

function renderAgentResults(data) {
  const wrapper = document.getElementById("resultWrapper");
  wrapper.classList.remove('hidden');

  // 1. Animate Rating Score
  const ratingEl = document.getElementById("ratingScore");
  let count = 0;
  const target = data.rating;
  const timer = setInterval(() => {
    if (count >= target) {
      ratingEl.innerText = target;
      clearInterval(timer);
    } else {
      count++;
      ratingEl.innerText = count;
    }
  }, 120);

  // 2. Set Summary
  document.getElementById("summaryText").innerText = 
    (typeof data.summary === "string") ? data.summary : JSON.stringify(data.summary);

  // 3. Render Strengths
  const strengthsList = document.getElementById("strengthsList");
  strengthsList.innerHTML = data.strengths.map(s => 
    `<li class="flex items-start gap-2"><span class="text-green-500">▹</span> ${s}</li>`
  ).join("");

  // 4. Render Weaknesses
  const weaknessesList = document.getElementById("weaknessesList");
  weaknessesList.innerHTML = data.weaknesses.map(w => 
    `<li class="flex items-start gap-2"><span class="text-red-500">▹</span> ${w}</li>`
  ).join("");

  // 5. Render References
  const refGrid = document.getElementById("referencesGrid");
  refGrid.innerHTML = data.references.map(r => `
    <div class="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors group">
      <div class="text-[9px] text-purple-400 uppercase font-bold mb-1 tracking-widest">${r.type}</div>
      <div class="text-sm font-semibold text-slate-100">${r.title}</div>
      ${r.author ? `<div class="text-xs text-slate-400">Authored by: ${r.author}</div>` : ""}
      ${r.link ? `<a href="${r.link}" target="_blank" class="text-xs text-cyan-400 mt-2 inline-block group-hover:underline">Secure Link →</a>` : ""}
    </div>
  `).join("");
}

// Add subtle 3D tilt effect to glass cards
document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.glass-card');
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const cardX = rect.left + rect.width / 2;
        const cardY = rect.top + rect.height / 2;

        const angleX = (cardY - mouseY) / 40;
        const angleY = (mouseX - cardX) / 40;

        card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
    });
});