// static/js/app.js

document.addEventListener("DOMContentLoaded", () => {
  // -------- initial profile guard --------
  try {
    const profileMenuInit = document.querySelector(".profile-menu");
    if (profileMenuInit) profileMenuInit.classList.remove("open");
    const possibleProfileModalIds = [
      "#profileModal",
      "#profile-settings",
      ".profile-modal",
      "#profileSettingsModal",
    ];
    possibleProfileModalIds.forEach((sel) => {
      document
        .querySelectorAll(sel)
        .forEach((el) => el.classList.remove("open"));
    });
    if (window.location.pathname === "/notes") {
      if (
        window.location.search.includes("open_profile") ||
        window.location.hash === "#profile"
      ) {
        history.replaceState(null, "", "/notes");
      }
    }
  } catch (err) {
    console.warn("Profile-close guard error", err);
  }

  const openModal = (el) => {
    if (el) el.classList.add("open");
  };
  const closeModal = (el) => {
    if (el) el.classList.remove("open");
  };

  // ---------- CONSTANTS ----------
  const CP_KEY = "cloudnotes_checkpoints";
  const DELETED_NOTES_KEY = "cloudnotes_deleted_notes";
  const DELETED_CPS_KEY = "cloudnotes_deleted_checkpoints";

  // ---------- ELEMENTS ----------
  // notes
  const newNoteBtn = document.getElementById("openNewNoteModal");
  const createFirstBtn = document.getElementById("createFirstNoteBtn");
  const newNoteModal = document.getElementById("editNoteModal");
  const viewNoteModal = document.getElementById("viewNoteModal");
  const lockPinModal = document.getElementById("lockPinModal");
  const profileSettingsModal = document.getElementById("profileSettingsModal");
  const openProfileModalBtn = document.getElementById("openProfileModal");
  const noteForm = document.getElementById("noteForm");
  const noteIdInput = document.getElementById("noteId");
  const noteTitle = document.getElementById("noteTitle");
  const noteContent = document.getElementById("noteContent");
  const noteDeleteBtn = document.getElementById("noteDeleteBtn");
  const lockPinForm = document.getElementById("lockPinForm");
  const lockPinInput = document.getElementById("lockPinInput");
  const lockPinTitle = document.getElementById("lockPinTitle");
  const lockPinMessage = document.getElementById("lockPinMessage");

  // checkpoints
  const cpAddBtn = document.getElementById("cpAddBtn");
  const cpModal = document.getElementById("normalChecklistModal");
  const cpModalTitle = document.getElementById("cpModalTitle");
  const addCheckpointForm = document.getElementById("addCheckpointForm");
  const cpEditingIdInput = document.getElementById("cpEditingId");
  const newCheckpointInput = document.getElementById("newCheckpointInput");
  const cpListMain = document.getElementById("cpListMain");
  const cpEmptyState = document.getElementById("cpEmptyState");
  const cpTotal = document.getElementById("cpTotal");
  const cpCompleted = document.getElementById("cpCompleted");
  const cpRemaining = document.getElementById("cpRemaining");

  // recently deleted
  const openRecentDeletedBtn = document.getElementById("openRecentDeleted");
  const recentDeletedModal = document.getElementById("recentDeletedModal");
  const recentDeletedList = document.getElementById("recentDeletedList");
  const recentDeletedCount = document.getElementById("recentDeletedCount");
  const recentClearAllBtn = document.getElementById("recentClearAllBtn");

  // profile
  const profileInfo = document.querySelector(".profile-info");
  const profileMenu = document.querySelector(".profile-menu");

  // sidebar
  const sidebar = document.querySelector(".sidebar");
  const sidebarToggleButtons = document.querySelectorAll(".sidebar-toggle");

  // ---------- HELPERS ----------
  function loadList(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }

  function saveList(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  }

  function updateRecentDeletedCount() {
    const deletedNotes = loadList(DELETED_NOTES_KEY);
    const deletedCps = loadList(DELETED_CPS_KEY);
    if (recentDeletedCount) {
      recentDeletedCount.textContent = deletedNotes.length + deletedCps.length;
    }
  }

  function renderCheckpoints() {
    if (!cpTotal || !cpCompleted || !cpRemaining) {
      updateRecentDeletedCount();
      return;
    }

    const list = loadList(CP_KEY);
    let completed = 0;
    list.forEach((it) => {
      if (it.completed) completed++;
    });

    if (cpListMain) {
      cpListMain.innerHTML = "";
      list.forEach((item) => {
        const li = document.createElement("li");
        li.className =
          "cp-item-main" + (item.completed ? " cp-item-done" : "");
        li.dataset.id = item.id;

        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.justifyContent = "space-between";
        row.style.gap = "8px";
        row.style.padding = "6px 0";

        const left = document.createElement("label");
        left.style.display = "flex";
        left.style.alignItems = "center";
        left.style.gap = "6px";
        left.style.cursor = "pointer";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "cp-checkbox-main";
        checkbox.checked = item.completed;

        const textSpan = document.createElement("span");
        textSpan.textContent = item.text;
        textSpan.style.fontSize = "14px";

        left.appendChild(checkbox);
        left.appendChild(textSpan);

        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.gap = "6px";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.textContent = "Edit";
        editBtn.className = "cp-edit-btn btn-secondary";
        editBtn.style.fontSize = "11px";
        editBtn.style.padding = "4px 8px";

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.textContent = "Delete";
        delBtn.className = "cp-delete-btn btn-danger";
        delBtn.style.fontSize = "11px";
        delBtn.style.padding = "4px 8px";

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        row.appendChild(left);
        row.appendChild(actions);
        li.appendChild(row);
        cpListMain.appendChild(li);
      });
    }

    cpTotal.textContent = list.length;
    cpCompleted.textContent = completed;
    cpRemaining.textContent = list.length - completed;

    if (cpEmptyState) {
      cpEmptyState.style.display = list.length ? "none" : "";
    }

    updateRecentDeletedCount();
  }

  function renderRecentDeletedList() {
    if (!recentDeletedList) return;

    const deletedNotes = loadList(DELETED_NOTES_KEY);
    const deletedCps = loadList(DELETED_CPS_KEY);

    recentDeletedList.innerHTML = "";

    if (deletedNotes.length === 0 && deletedCps.length === 0) {
      const li = document.createElement("li");
      li.style.fontSize = "14px";
      li.style.color = "#6b7280";
      li.textContent = "Nothing deleted yet.";
      recentDeletedList.appendChild(li);
      updateRecentDeletedCount();
      return;
    }

    // Notes first
    deletedNotes.forEach((item, index) => {
      const li = document.createElement("li");
      li.dataset.type = "note";
      li.dataset.index = index;
      li.style.padding = "6px 0";

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.gap = "8px";

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.flexDirection = "column";

      const badge = document.createElement("span");
      badge.textContent = "Note";
      badge.style.fontSize = "11px";
      badge.style.padding = "2px 6px";
      badge.style.borderRadius = "999px";
      badge.style.background = "#e5e7eb";
      badge.style.alignSelf = "flex-start";
      badge.style.marginBottom = "2px";

      const title = document.createElement("strong");
      title.textContent = item.title || "(Untitled note)";
      title.style.fontSize = "14px";

      left.appendChild(badge);
      left.appendChild(title);

      const undoBtn = document.createElement("button");
      undoBtn.type = "button";
      undoBtn.textContent = "Undo";
      undoBtn.className = "btn-secondary small recent-undo-btn";

      row.appendChild(left);
      row.appendChild(undoBtn);
      li.appendChild(row);
      recentDeletedList.appendChild(li);
    });

    // Checklists
    deletedCps.forEach((item, index) => {
      const li = document.createElement("li");
      li.dataset.type = "cp";
      li.dataset.index = index;
      li.style.padding = "6px 0";

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.gap = "8px";

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.flexDirection = "column";

      const badge = document.createElement("span");
      badge.textContent = "Checklist";
      badge.style.fontSize = "11px";
      badge.style.padding = "2px 6px";
      badge.style.borderRadius = "999px";
      badge.style.background = "#e5e7eb";
      badge.style.alignSelf = "flex-start";
      badge.style.marginBottom = "2px";

      const title = document.createElement("strong");
      title.textContent = item.text || "(Untitled checklist)";
      title.style.fontSize = "14px";

      left.appendChild(badge);
      left.appendChild(title);

      const undoBtn = document.createElement("button");
      undoBtn.type = "button";
      undoBtn.textContent = "Undo";
      undoBtn.className = "btn-secondary small recent-undo-btn";

      row.appendChild(left);
      row.appendChild(undoBtn);
      li.appendChild(row);
      recentDeletedList.appendChild(li);
    });

    updateRecentDeletedCount();
  }

  // ---------- PROFILE MENU ----------
  if (profileInfo) {
    profileInfo.addEventListener("click", (e) => {
      e.stopPropagation();
      if (profileMenu) profileMenu.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
      if (
        profileMenu &&
        !profileInfo.contains(e.target) &&
        !profileMenu.contains(e.target)
      ) {
        profileMenu.classList.remove("open");
      }
    });
  }

  if (openProfileModalBtn && profileSettingsModal) {
    openProfileModalBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (profileMenu) profileMenu.classList.remove("open");
      openModal(profileSettingsModal);
    });
  }

  // ---------- SIDEBAR TOGGLE ----------
  sidebarToggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!sidebar) return;
      sidebar.classList.toggle("sidebar-open");
    });
  });
  if (sidebar) {
    sidebar.querySelectorAll(".sidebar-link").forEach((link) => {
      link.addEventListener("click", () => {
        sidebar.classList.remove("sidebar-open");
      });
    });
  }

  // ---------- GLOBAL MODAL CLOSE ----------
  document.querySelectorAll(".modal-close-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal");
      if (modal) closeModal(modal);
    });
  });
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // ---------- NOTES LOGIC ----------
  if (newNoteBtn)
    newNoteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openNewNote();
    });
  if (createFirstBtn) createFirstBtn.addEventListener("click", openNewNote);

  function openNewNote() {
    if (!noteIdInput) return;
    noteIdInput.value = 0;
    if (noteTitle) noteTitle.value = "";
    if (noteContent) noteContent.value = "";
    if (noteDeleteBtn) noteDeleteBtn.style.display = "none";
    const titleEl = document.getElementById("noteModalTitle");
    if (titleEl) titleEl.textContent = "New Note";
    openModal(newNoteModal);
  }

  if (noteForm) {
    noteForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = parseInt(noteIdInput.value || 0, 10);
      const payload = {
        id,
        title: noteTitle.value.trim(),
        content: noteContent.value.trim(),
      };
      fetch("/note/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            closeModal(newNoteModal);
            window.location.reload();
          } else {
            alert(data.message || "Could not save.");
          }
        })
        .catch(() => alert("Save failed."));
    });
  }

  if (noteDeleteBtn) {
    noteDeleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = parseInt(noteIdInput.value || 0, 10);
      if (!id) return;
      if (!confirm("Delete this note?")) return;

      const deletedNote = {
        id,
        title: (noteTitle && noteTitle.value.trim()) || "",
        content: (noteContent && noteContent.value.trim()) || "",
        deletedAt: Date.now(),
      };
      const deletedNotes = loadList(DELETED_NOTES_KEY);
      deletedNotes.unshift(deletedNote);
      saveList(DELETED_NOTES_KEY, deletedNotes.slice(0, 50));
      updateRecentDeletedCount();

      fetch(`/note/delete/${id}`, { method: "POST" })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            closeModal(newNoteModal);
            window.location.reload();
          } else alert("Delete failed.");
        });
    });
  }

  document.querySelectorAll(".note-card").forEach((card) => {
    card.addEventListener("click", function (e) {
      if (e.target.closest(".note-actions")) return;
      const id = this.dataset.noteId;
      fetch(`/note/fetch/${id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            if (d.note.is_locked) {
              alert("Cannot edit a locked note directly. Please unlock it first.");
              return;
            }
            if (noteIdInput) noteIdInput.value = d.note.id;
            if (noteTitle) noteTitle.value = d.note.title;
            if (noteContent) noteContent.value = d.note.content;
            const titleEl = document.getElementById("noteModalTitle");
            if (titleEl) titleEl.textContent = "Edit Note";
            if (noteDeleteBtn) noteDeleteBtn.style.display = "inline-flex";
            openModal(newNoteModal);
          } else alert("Cannot edit note.");
        });
    });
  });

  document.querySelectorAll(".toggle-archive-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const noteId = btn.dataset.noteId;
      if (!noteId) return;
      fetch(`/note/toggle_archive/${noteId}`, { method: "POST" })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) window.location.reload();
          else alert(d.message || "Failed");
        });
    });
  });

  document.querySelectorAll(".toggle-lock-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const noteId = btn.dataset.noteId;
      const isLocked = btn.dataset.isLocked === "1";
      if (!noteId || !lockPinForm || !lockPinTitle || !lockPinMessage) return;

      lockPinTitle.textContent = isLocked ? "Unlock Note" : "Lock Note";
      lockPinMessage.textContent = isLocked
        ? "Enter your PIN to unlock this note."
        : "Enter your PIN to lock this note (set PIN in Profile if none).";
      lockPinForm.onsubmit = (ev) => {
        ev.preventDefault();
        fetch(`/note/toggle_lock/${noteId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: lockPinInput.value }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.success) {
              lockPinInput.value = "";
              closeModal(lockPinModal);
              window.location.reload();
            } else {
              alert(d.message || "Failed PIN");
              if (d.message && d.message.toLowerCase().includes("no lock pin")) {
                closeModal(lockPinModal);
                openModal(profileSettingsModal);
              } else lockPinInput.value = "";
            }
          })
          .catch(() => alert("Error toggling lock."));
      };
      openModal(lockPinModal);
    });
  });

  // ---------- CHECKLISTS ----------
  if (cpAddBtn && cpModal && cpModalTitle && cpEditingIdInput) {
    cpAddBtn.addEventListener("click", () => {
      cpEditingIdInput.value = "";
      if (newCheckpointInput) newCheckpointInput.value = "";
      cpModalTitle.textContent = "New Checklist";
      openModal(cpModal);
    });
  }

  if (addCheckpointForm && newCheckpointInput && cpEditingIdInput) {
    addCheckpointForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = newCheckpointInput.value.trim();
      if (!text) return;

      let list = loadList(CP_KEY);
      const editingId = cpEditingIdInput.value
        ? parseInt(cpEditingIdInput.value, 10)
        : null;

      if (editingId) {
        list = list.map((item) =>
          item.id === editingId ? { ...item, text } : item
        );
      } else {
        list.unshift({
          id: Date.now(),
          text,
          completed: false,
        });
      }

      saveList(CP_KEY, list);
      closeModal(cpModal);
      renderCheckpoints();
    });
  }

  if (cpListMain) {
    cpListMain.addEventListener("click", (e) => {
      const li = e.target.closest(".cp-item-main");
      if (!li) return;
      const id = parseInt(li.dataset.id, 10);
      let list = loadList(CP_KEY);

      // delete
      if (e.target.classList.contains("cp-delete-btn")) {
        const deleted = list.find((it) => it.id === id);
        if (deleted) {
          const deletedCps = loadList(DELETED_CPS_KEY);
          deletedCps.unshift({ ...deleted, deletedAt: Date.now() });
          saveList(DELETED_CPS_KEY, deletedCps.slice(0, 50));
        }
        list = list.filter((it) => it.id !== id);
        saveList(CP_KEY, list);
        renderCheckpoints();
        return;
      }

      // edit
      if (e.target.classList.contains("cp-edit-btn")) {
        const item = list.find((it) => it.id === id);
        if (item && cpModal && cpModalTitle && cpEditingIdInput) {
          cpEditingIdInput.value = String(id);
          newCheckpointInput.value = item.text;
          cpModalTitle.textContent = "Edit Checklist";
          openModal(cpModal);
        }
        return;
      }

      // toggle complete
      if (
        e.target.classList.contains("cp-checkbox-main") ||
        e.target.tagName === "SPAN"
      ) {
        list = list.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item
        );
        saveList(CP_KEY, list);
        renderCheckpoints();
      }
    });
  }

  // initial checkpoints render (if present)
  if (cpTotal && cpCompleted && cpRemaining) {
    renderCheckpoints();
  }

  // ---------- RECENTLY DELETED UI ----------
  if (openRecentDeletedBtn && recentDeletedModal) {
    openRecentDeletedBtn.addEventListener("click", (e) => {
      e.preventDefault();
      renderRecentDeletedList();
      openModal(recentDeletedModal);
    });
  }

  if (recentClearAllBtn) {
    recentClearAllBtn.addEventListener("click", () => {
      if (!confirm("Clear all recently deleted items?")) return;
      saveList(DELETED_NOTES_KEY, []);
      saveList(DELETED_CPS_KEY, []);
      renderRecentDeletedList();
      updateRecentDeletedCount();
    });
  }

  if (recentDeletedList) {
    recentDeletedList.addEventListener("click", (e) => {
      if (!e.target.classList.contains("recent-undo-btn")) return;
      const li = e.target.closest("li");
      if (!li) return;
      const type = li.dataset.type;
      const index = parseInt(li.dataset.index, 10);

      if (type === "note") {
        const deletedNotes = loadList(DELETED_NOTES_KEY);
        const item = deletedNotes[index];
        if (!item) return;
        // recreate note through backend
        fetch("/note/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: 0,
            title: item.title || "",
            content: item.content || "",
          }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.success) {
              deletedNotes.splice(index, 1);
              saveList(DELETED_NOTES_KEY, deletedNotes);
              renderRecentDeletedList();
              updateRecentDeletedCount();
              if (window.location.pathname.startsWith("/notes")) {
                window.location.reload();
              }
            } else {
              alert("Could not restore note.");
            }
          })
          .catch(() => alert("Restore failed."));
      } else if (type === "cp") {
        let deletedCps = loadList(DELETED_CPS_KEY);
        const item = deletedCps[index];
        if (!item) return;
        const list = loadList(CP_KEY);
        list.unshift({
          id: Date.now(),
          text: item.text || "",
          completed: item.completed || false,
        });
        saveList(CP_KEY, list);
        deletedCps.splice(index, 1);
        saveList(DELETED_CPS_KEY, deletedCps);
        renderCheckpoints();
        renderRecentDeletedList();
        updateRecentDeletedCount();
      }
    });
  }

  updateRecentDeletedCount();

  // ---------- NOTES COUNTS FROM BACKEND ----------
  function refreshCounts() {
    if (
      !window.location.pathname.startsWith("/notes") &&
      !window.location.pathname.startsWith("/checkpoints")
    )
      return;
    fetch("/notes/counts")
      .then((r) => r.json())
      .then((d) => {
        document.querySelectorAll(".sidebar .count").forEach((el) => {
          const parent = el.closest("a") || el.closest("div") || { href: "" };
          if (parent.href && parent.href.includes("view=archived")) {
            el.textContent = d.archived_count || 0;
          } else if (parent.href && parent.href.includes("view=locked")) {
            el.textContent = d.locked_count || 0;
          } else if (
            parent.href &&
            (parent.href.includes("/notes") || parent.href.endsWith("/notes"))
          ) {
            el.textContent = d.all_count || 0;
          }
        });
      })
      .catch(() => {
        /* ignore */
      });
  }
  refreshCounts();
});
