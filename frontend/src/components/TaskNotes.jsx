import React, { useState, useEffect } from "react";
import { api } from "../api";

export function TaskNotes({ taskId }) {
  const [notes, setNotes] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newNoteBody, setNewNoteBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, taskId]);

  async function loadNotes() {
    setLoading(true);
    try {
      const data = await api.getNotes(taskId);
      setNotes(data || []);
    } catch (err) {
      console.error("Failed to load notes for task", taskId, err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteBody.trim()) return;

    setAdding(true);
    try {
      const created = await api.createNote(taskId, newNoteBody.trim());
      setNotes((prev) => [created, ...prev]);
      setNewNoteBody("");
    } catch (err) {
      alert("Не вдалося додати запис: " + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Ви дійсно хочете видалити цей запис?")) return;

    try {
      await api.deleteNote(taskId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      alert("Не вдалося видалити запис: " + err.message);
    }
  };

  return (
    <div className="notes-accordion">
      <div 
        className="notes-header" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Мої записи до завдання ({isOpen ? "Приховати" : "Показати"})</span>
        <span>{isOpen ? "▴" : "▾"}</span>
      </div>

      {isOpen && (
        <div className="notes-content">
          {loading && notes.length === 0 ? (
            <p className="text-center text-muted" style={{ fontSize: "0.85rem" }}>
              Завантаження записів...
            </p>
          ) : notes.length === 0 ? (
            <p className="empty-state" style={{ padding: "16px", fontSize: "0.85rem" }}>
              Ще немає записів.
            </p>
          ) : (
            <div className="notes-list-box">
              {notes.map((note) => (
                <div key={note.id} className="note-card">
                  <div className="note-card-meta">
                    <span>
                      {new Date(note.created_at).toLocaleString("uk-UA", {
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                    <button
                      type="button"
                      className="note-delete-btn"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      Видалити
                    </button>
                  </div>
                  <div className="note-card-text">{note.body}</div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddNote} className="note-input-row">
            <input
              type="text"
              placeholder="Текст запису..."
              value={newNoteBody}
              onChange={(e) => setNewNoteBody(e.target.value)}
              disabled={adding}
              required
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
              disabled={adding}
            >
              {adding ? "..." : "Додати"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
