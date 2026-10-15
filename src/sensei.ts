import "./style.css";
import { CLASS_OF_16, type FarmJob } from "./game/classRoster.ts";
import { loadFarmState, publishFarmCommand } from "./game/farmBus.ts";

const roster = () => document.getElementById("roster") as HTMLElement;
const note = () => document.getElementById("sensei-note") as HTMLElement;

function paint(): void {
  const state = loadFarmState();
  roster().innerHTML = CLASS_OF_16.map((student) => {
    const row = state.students.find((s) => s.id === student.id);
    const job = row?.job ?? "farm";
    const locked = row?.locked ?? false;
    return `<article class="ninja-card ${locked ? "locked" : ""}" data-id="${student.id}">
      <h2>${student.name}</h2>
      <p>${locked ? "Locked" : "Open"} · ${job} · ${row?.pumpkins ?? 0} gourds · ${row?.ore ?? 0} ore</p>
      <div class="actions">
        <button type="button" data-job="farm">Farm</button>
        <button type="button" data-job="mine">Mine</button>
        <button type="button" data-job="idle">Idle</button>
        <button type="button" data-lock="${locked ? "0" : "1"}">${locked ? "Unlock" : "Lock"}</button>
      </div>
    </article>`;
  }).join("");

  roster().querySelectorAll<HTMLButtonElement>("[data-job]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest("[data-id]") as HTMLElement;
      const studentId = Number(card.dataset.id);
      publishFarmCommand({ type: "job", studentId, job: btn.dataset.job as FarmJob });
      note().textContent = `${CLASS_OF_16[studentId].name} → ${btn.dataset.job}`;
      paint();
    });
  });
  roster().querySelectorAll<HTMLButtonElement>("[data-lock]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest("[data-id]") as HTMLElement;
      const studentId = Number(card.dataset.id);
      const locked = btn.dataset.lock === "1";
      publishFarmCommand({ type: "lock", studentId, locked });
      note().textContent = `${CLASS_OF_16[studentId].name} ${locked ? "locked" : "unlocked"}`;
      paint();
    });
  });
}

document.getElementById("btn-meteor")?.addEventListener("click", () => {
  publishFarmCommand({ type: "meteor" });
  note().textContent = "Meteor queued on the pumpkin patch.";
  paint();
});
document.getElementById("btn-farm-all")?.addEventListener("click", () => {
  publishFarmCommand({ type: "jobAll", job: "farm" });
  note().textContent = "Whole class is farming.";
  paint();
});
document.getElementById("btn-mine-all")?.addEventListener("click", () => {
  publishFarmCommand({ type: "jobAll", job: "mine" });
  note().textContent = "Whole class is mining.";
  paint();
});

paint();
window.addEventListener("storage", (event) => {
  if (event.key === "block-dojo-pumpkin-state") paint();
});
