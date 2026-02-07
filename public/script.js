function getText(item) {
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    return item.text || JSON.stringify(item);
  }
  return "";
}

async function uploadResume() {
  const fileInput = document.getElementById("resumeFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a PDF resume first!");
    return;
  }

  const formData = new FormData();
  formData.append("resume", file);

  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("result").classList.add("hidden");

  const response = await fetch("/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  document.getElementById("loading").classList.add("hidden");

  if (data.error) {
    alert(data.error);
    return;
  }

  // Summary
  document.getElementById("summary").innerText = getText(data.summary);

  // Rating
  document.getElementById("rating").innerText = data.rating + "/10";

  // Strengths
  const strengthsList = document.getElementById("strengths");
  strengthsList.innerHTML = "";
  (data.strengths || []).forEach(item => {
    const li = document.createElement("li");
    li.innerText = getText(item);
    strengthsList.appendChild(li);
  });

  // Weaknesses
  const weaknessesList = document.getElementById("weaknesses");
  weaknessesList.innerHTML = "";
  (data.weaknesses || []).forEach(item => {
    const li = document.createElement("li");
    li.innerText = getText(item);
    li.classList.add("weakness");
    weaknessesList.appendChild(li);
  });

  // References
  const refList = document.getElementById("references");
  refList.innerHTML = "";
  (data.references || []).forEach(ref => {
    const li = document.createElement("li");

    if (ref.link) {
      li.innerHTML = `<strong>${ref.title}</strong> — <a href="${ref.link}" target="_blank">${ref.link}</a>`;
    } else {
      li.innerHTML = `<strong>${ref.title}</strong> by ${ref.author || "Unknown"}`;
    }

    refList.appendChild(li);
  });

  document.getElementById("result").classList.remove("hidden");
}
