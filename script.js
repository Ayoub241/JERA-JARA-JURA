// script.js

// ========================
// INITIALISATION
// ========================

// Charger les tâches depuis le localStorage
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let trashTasks = JSON.parse(localStorage.getItem("trashTasks")) || [];

window.onload = () => {
  renderTasks();
  renderTrash();
};

// ========================
// AJOUT DE TÂCHE
// ========================

document.getElementById("taskForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("taskName").value.trim();
  const priority = document.getElementById("taskPriority").value;

  if (!name) return;

  const newTask = {
    id: Date.now(),
    name,
    priority,
    status: "TO DO"
  };

  tasks.push(newTask);
  localStorage.setItem("tasks", JSON.stringify(tasks));

  renderTasks();
  this.reset(); // vider le formulaire
});

// ========================
// AFFICHAGE DES TÂCHES
// ========================

function renderTasks() {
  applyFilters(); // Appliquer les filtres après le rendu des tâches
}

// ========================
// CRÉATION VISUELLE D'UNE TÂCHE
// ========================

function createTaskElement(task) {
  const div = document.createElement("div");
  div.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", task.id);
  });

  div.className = "task d-flex justify-content-between align-items-center";
  div.setAttribute("draggable", "true");
  div.setAttribute("data-id", task.id);

  const content = document.createElement("div");
  content.innerHTML = `
    <strong>${task.name}</strong><br>
    <span class="badge bg-${
      task.priority === "HIGH" ? "danger" :
      task.priority === "MEDIUM" ? "warning" :
      "success"
    }">${task.priority}</span>
  `;

  const btnEdit = document.createElement("button");
  btnEdit.className = "btn btn-sm btn-outline-primary ms-2";
  btnEdit.innerHTML = "✏️";
  btnEdit.onclick = () => openEditModal(task);

  const btnDelete = document.createElement("button");
  btnDelete.className = "btn btn-sm btn-outline-danger ms-2";
  btnDelete.innerHTML = "🗑️";
  btnDelete.onclick = () => deleteTask(task.id);

  div.appendChild(content);
  div.appendChild(btnEdit);
  div.appendChild(btnDelete);

  return div;
}

// ========================
// SUPPRESSION ET CORBEILLE
// ========================

function deleteTask(id) {
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    const removed = tasks.splice(index, 1)[0];
    trashTasks.push(removed);

    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("trashTasks", JSON.stringify(trashTasks));

    renderTasks();
    renderTrash();
  }
}

function renderTrash() {
  const trashDiv = document.getElementById("trash");
  trashDiv.innerHTML = "";

  trashTasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task d-flex justify-content-between align-items-center";
    div.innerHTML = `
      <div>
        <strong>${task.name}</strong><br>
        <span class="badge bg-secondary">${task.priority}</span>
      </div>
    `;

    // Bouton restaurer
    const btnRestore = document.createElement("button");
    btnRestore.className = "btn btn-sm btn-success ms-2";
    btnRestore.innerHTML = "Restaurer";
    btnRestore.onclick = () => restoreTask(task.id);

    div.appendChild(btnRestore);
    trashDiv.appendChild(div);
  });
}

// Fonction pour restaurer une tâche depuis la corbeille
function restoreTask(id) {
  const index = trashTasks.findIndex(t => t.id === id);
  if (index !== -1) {
    const restored = trashTasks.splice(index, 1)[0];
    // Si la tâche n'a pas de statut, on la remet dans TO DO
    if (!restored.status) restored.status = "TO DO";
    tasks.push(restored);

    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("trashTasks", JSON.stringify(trashTasks));
    renderTasks();
    renderTrash();
  }
}

document.getElementById("emptyTrash").addEventListener("click", () => {
  if (confirm("Confirmer la suppression définitive de toutes les tâches de la corbeille ?")) {
    trashTasks = [];
    localStorage.setItem("trashTasks", JSON.stringify(trashTasks));
    renderTrash();
  }
});

// ========================
// MODIFICATION DES TÂCHES
// ========================

function openEditModal(task) {
  document.getElementById("editTaskId").value = task.id;
  document.getElementById("editTaskName").value = task.name;
  document.getElementById("editTaskPriority").value = task.priority;

  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

document.getElementById("editForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const id = parseInt(document.getElementById("editTaskId").value);
  const name = document.getElementById("editTaskName").value.trim();
  const priority = document.getElementById("editTaskPriority").value;

  const task = tasks.find(t => t.id === id);
  if (task) {
    task.name = name;
    task.priority = priority;

    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();

    bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
  }
});

// ========================
// DRAG AND DROP
// ========================

document.querySelectorAll(".column").forEach(col => {
  col.addEventListener("dragover", e => e.preventDefault());

  col.addEventListener("drop", e => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData("text/plain"));
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.status = col.dataset.status;
      localStorage.setItem("tasks", JSON.stringify(tasks));
      renderTasks();
    }
  });
});

// ========================
// FILTRAGE DES TÂCHES
// ========================

document.getElementById("filterStatus").addEventListener("change", applyFilters);
document.getElementById("filterPriority").addEventListener("change", applyFilters);

function applyFilters() {
  const filterStatus = document.getElementById("filterStatus").value;
  const filterPriority = document.getElementById("filterPriority").value;

  // Vider toutes les colonnes
  const columns = ["todo", "inprogress", "inreview", "done"];
  columns.forEach(col => document.getElementById(col).innerHTML = "");

  tasks
    .filter(task => {
      const statusMatch = filterStatus === "ALL" || task.status === filterStatus;
      const priorityMatch = filterPriority === "ALL" || task.priority === filterPriority;
      return statusMatch && priorityMatch;
    })
    .forEach(task => {
      const taskEl = createTaskElement(task);

      switch (task.status) {
        case "TO DO":
          document.getElementById("todo").appendChild(taskEl);
          break;
        case "IN PROGRESS":
          document.getElementById("inprogress").appendChild(taskEl);
          break;
        case "IN REVIEW":
          document.getElementById("inreview").appendChild(taskEl);
          break;
        case "DONE":
          document.getElementById("done").appendChild(taskEl);
          break;
      }
    });
}