import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import httpClient from '../api/httpClient';
import './Notes.css';

function Notes() {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState({ id: null, title: '', content: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [fontSize, setFontSize] = useState('16px');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedOperations, setQueuedOperations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [retrying, setRetrying] = useState(false);
  
  const editorRef = useRef(null);
  const { currentUser } = useAuth();
  const autoSaveTimeoutRef = useRef(null);
  const isSettingInitialContent = useRef(false);
  const pollingIntervalRef = useRef(null);

  // Toast notification system
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const dismissToast = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Connection restored. Processing queued operations...', 'success');
      processQueuedOperations();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('You are offline. Changes will be saved when connection is restored.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process queued operations when online
  const processQueuedOperations = async () => {
    if (queuedOperations.length === 0) return;

    for (const op of queuedOperations) {
      try {
        await op();
      } catch (error) {
        console.error('Failed to process queued operation:', error);
        showToast('Failed to sync some changes. Please try again.', 'error');
      }
    }
    setQueuedOperations([]);
  };

  // Real-time polling for updates
  const pollForUpdates = useCallback(async () => {
    try {
      const response = await httpClient.get('/notes');
      const serverNotes = response.data.notes;
      
      // Compare with current notes and update if different
      const hasChanges = JSON.stringify(serverNotes) !== JSON.stringify(notes);
      if (hasChanges) {
        setNotes(serverNotes);
        showToast('Notes updated from server', 'info');
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, [notes]);

  // Setup polling interval
  useEffect(() => {
    if (isOnline) {
      pollingIntervalRef.current = setInterval(pollForUpdates, 30000); // Poll every 30 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isOnline, pollForUpdates]);

  // Load draft from localStorage
  const loadDraft = (noteId) => {
    const draft = localStorage.getItem(`note_draft_${noteId}`);
    return draft ? JSON.parse(draft) : null;
  };

  // Save draft to localStorage
  const saveDraft = (note) => {
    if (note._id) {
      localStorage.setItem(`note_draft_${note._id}`, JSON.stringify({
        title: note.title,
        content: note.content,
        lastSaved: new Date().toISOString()
      }));
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (isEditing && currentNote._id && currentNote.content) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveDraft(currentNote);
        showToast('Draft saved locally', 'info');
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => clearTimeout(autoSaveTimeoutRef.current);
  }, [currentNote.title, currentNote.content, isEditing]);

  const fetchNotes = useCallback(async (isRetry = false) => {
    if (!isRetry) setLoading(true);
    try {
      const response = await httpClient.get('/notes');
      const data = response.data;
      
      if (data.success) {
        setNotes(data.notes || []);
        if (!isRetry) showToast('Notes loaded successfully', 'success');
      } else {
        throw new Error(data.message || 'Failed to load notes');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      let errorMessage = 'Failed to load notes.';
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection and try again.';
        if (!isOnline) {
          errorMessage += ' You are currently offline.';
        }
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        localStorage.removeItem('studyhub_token');
        window.location.href = '/auth';
        return;
      }
      
      showToast(errorMessage, 'error');
      
      // Set fallback notes only if not retrying
      if (!isRetry) {
        setNotes([
          {
            _id: 'fallback',
            title: 'Unable to load notes',
            content: 'Please check your connection and try again.',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
      }
    } finally {
      if (!isRetry) setLoading(false);
    }
  }, [isOnline]);

  const retryFetchNotes = () => {
    setRetrying(true);
    fetchNotes(true).finally(() => setRetrying(false));
  };

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreateNote = () => {
    const tempId = `local-${Date.now()}`;
    const newNote = {
      id: tempId,
      _id: null,
      title: 'New Note',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
    setCurrentNote(newNote);
    setIsEditing(true);
    isSettingInitialContent.current = true;
  };

  const handleSaveNote = async (isRetry = false) => {
    if (!currentNote.title.trim()) {
      showToast('Note title is required', 'warning');
      return;
    }

    if (!isOnline && !isRetry) {
      showToast('You are offline. Note will be saved when connection is restored.', 'warning');
      setQueuedOperations(prev => [...prev, () => handleSaveNote(true)]);
      return;
    }

    setSaving(true);
    try {
      const content = editorRef.current ? editorRef.current.innerHTML : currentNote.content;
      
      // Check for large content
      if (content.length > 100000) {
        showToast('Note content is too large. Please reduce the content size.', 'warning');
        setSaving(false);
        return;
      }

      const payload = {
        title: currentNote.title,
        content,
        tags: currentNote.tags || []
      };

  let data;
  const isLocal = currentNote._id === null || (typeof currentNote._id === 'string' && currentNote._id.startsWith && currentNote._id.startsWith('local'));
  if (currentNote._id && !isLocal) {
        // Conflict resolution: check if note was modified elsewhere
        const serverNote = notes.find(n => n._id === currentNote._id);
        if (serverNote && new Date(serverNote.updatedAt) > new Date(currentNote.updatedAt || 0)) {
          const confirm = window.confirm('This note was modified elsewhere. Do you want to overwrite it?');
          if (!confirm) {
            setSaving(false);
            return;
          }
        }

        const noteId = currentNote._id || currentNote.id;
        const response = await httpClient.put(`/notes/${noteId}`, payload);
        data = response.data;
        if (data.success) {
          // Update by _id only (server always returns _id)
          setNotes(prev => prev.map(n => (n._id === data.note._id ? data.note : n)));
          setCurrentNote(data.note);
          localStorage.removeItem(`note_draft_${data.note._id}`);
        } else {
          throw new Error(data.message || 'Failed to update note');
        }
      } else {
        const response = await httpClient.post('/notes', payload);
        data = response.data;
        if (data.success) {
          // Replace local temp note if present, normalize by _id
          const tempId = currentNote.id;
          setNotes(prev => {
            // Filter out temp note with matching id
            const withoutTemp = tempId ? prev.filter(n => (n.id || n._id) !== tempId) : prev;
            // Add new note if not already present
            if (withoutTemp.some(n => n._id === data.note._id)) {
              return withoutTemp.map(n => n._id === data.note._id ? data.note : n);
            }
            return [data.note, ...withoutTemp];
          });
          setCurrentNote(data.note);
          if (tempId) localStorage.removeItem(`note_draft_${tempId}`);
          localStorage.removeItem(`note_draft_${data.note._id}`);
        } else {
          throw new Error(data.message || 'Failed to create note');
        }
      }

      showToast('Note saved successfully!', 'success');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
      let errorMessage = 'Error saving note.';
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection and try again.';
        if (!isRetry) setQueuedOperations(prev => [...prev, () => handleSaveNote(true)]);
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Conflict: Note was modified by another session. Please refresh and try again.';
      } else if (error.response?.status === 413) {
        errorMessage = 'Note content is too large. Please reduce the content size.';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId, isRetry = false) => {
    // Check if this is a temp note (local-only, not yet saved to server)
    const noteToDelete = notes.find(n => (n._id === noteId || n.id === noteId));
    const isTempNote = noteId && String(noteId).startsWith('local-');
    
    if (isTempNote) {
      // Remove temp note from state without API call
      const updatedNotes = notes.filter(note => (note._id || note.id) !== noteId);
      setNotes(updatedNotes);
      if ((currentNote._id || currentNote.id) === noteId) {
        setCurrentNote({ id: null, title: '', content: '' });
        setIsEditing(false);
      }
      localStorage.removeItem(`note_draft_${noteId}`);
      showToast('Note deleted successfully!', 'success');
      return;
    }

    if (!isOnline && !isRetry) {
      showToast('You are offline. Deletion will be processed when connection is restored.', 'warning');
      setQueuedOperations(prev => [...prev, () => handleDeleteNote(noteId, true)]);
      return;
    }

    setDeleting(true);
    try {
      const response = await httpClient.delete(`/notes/${noteId}`);
      const data = response.data;
      if (data.success) {
        const updatedNotes = notes.filter(note => note._id !== noteId);
        setNotes(updatedNotes);
        if (currentNote._id === noteId) {
          setCurrentNote({ id: null, title: '', content: '' });
          setIsEditing(false);
        }
        localStorage.removeItem(`note_draft_${noteId}`);
        showToast('Note deleted successfully!', 'success');
      } else {
        throw new Error(data.message || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      let errorMessage = 'Error deleting note.';
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection and try again.';
        if (!isRetry) setQueuedOperations(prev => [...prev, () => handleDeleteNote(noteId, true)]);
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Note not found. It may have been already deleted.';
        // Remove from local state
        setNotes(notes.filter(note => note._id !== noteId));
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleFormatText = (command, value = null) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    try {
      const selection = window.getSelection();
      
      if (command !== 'insertUnorderedList' && command !== 'insertOrderedList') {
        if (selection.toString().length === 0) {
          showToast('Please select some text to format', 'warning');
          return;
        }
      }

      document.execCommand(command, false, value);
      
      const newContent = editorRef.current.innerHTML;
      setCurrentNote(prev => ({ ...prev, content: newContent }));
      
    } catch (error) {
      console.error('Error formatting text:', error);
      showToast('Error applying formatting. Please try again.', 'error');
    }
  };

  const handleInsertList = (type) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    try {
      const selection = window.getSelection();
      if (selection.toString().length === 0) {
        const listHTML = type === 'bullet' 
          ? '<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>'
          : '<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>';
        
        document.execCommand('insertHTML', false, listHTML);
      } else {
        const command = type === 'bullet' ? 'insertUnorderedList' : 'insertOrderedList';
        document.execCommand(command, false, null);
      }
      
      const newContent = editorRef.current.innerHTML;
      setCurrentNote(prev => ({ ...prev, content: newContent }));
      
    } catch (error) {
      console.error('Error inserting list:', error);
      const listHTML = type === 'bullet' 
        ? '<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>'
        : '<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>';
      
      document.execCommand('insertHTML', false, listHTML);
      
      const newContent = editorRef.current.innerHTML;
      setCurrentNote(prev => ({ ...prev, content: newContent }));
    }
  };

  const handleClearFormatting = () => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    try {
      document.execCommand('removeFormat', false, null);
      document.execCommand('unlink', false, null);
      
      const newContent = editorRef.current.innerHTML;
      setCurrentNote(prev => ({ ...prev, content: newContent }));
      
    } catch (error) {
      console.error('Error clearing formatting:', error);
      showToast('Error clearing formatting.', 'error');
    }
  };

  const handleEditorChange = useCallback(() => {
    if (editorRef.current && !isSettingInitialContent.current) {
      const newContent = editorRef.current.innerHTML;
      setCurrentNote(prev => ({ ...prev, content: newContent }));
    }
  }, []);

  useEffect(() => {
    if (isEditing && editorRef.current) {
      isSettingInitialContent.current = false;
      
      // Load draft if available
      const draft = loadDraft(currentNote._id);
      if (draft && (!currentNote.content || currentNote.content === '')) {
        setCurrentNote(prev => ({ ...prev, title: draft.title, content: draft.content }));
        editorRef.current.innerHTML = draft.content;
        showToast('Draft loaded from local storage', 'info');
      } else if (currentNote.content) {
        editorRef.current.innerHTML = currentNote.content;
      } else {
        editorRef.current.innerHTML = '';
      }
      
      editorRef.current.focus();
    }
  }, [isEditing, currentNote._id]);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && isEditing) {
      editor.addEventListener('input', handleEditorChange);
      editor.addEventListener('paste', handleEditorChange);
      editor.addEventListener('cut', handleEditorChange);
      
      return () => {
        editor.removeEventListener('input', handleEditorChange);
        editor.removeEventListener('paste', handleEditorChange);
        editor.removeEventListener('cut', handleEditorChange);
      };
    }
  }, [isEditing, handleEditorChange]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPreviewText = (content) => {
    if (!content) return 'No content...';
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.substring(0, 100) + (plainText.length > 100 ? '...' : '');
  };

  return (
    <div className="notes-page">
      {/* Toast Notifications */}
      <div className="toast-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`toast toast-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => dismissToast(notification.id)} className="toast-close">×</button>
          </div>
        ))}
      </div>

      <header className="topbar">
        <div className="brand">
          <span className="logo">📚</span>
          <Link to="/" className="title">StudyHub</Link>
        </div>
        <nav className="nav">
          <Link to="/notes" className="nav-link">Notes</Link>
          <Link to="/courses" className="nav-link">Courses</Link>
          <Link to="/timetable" className="nav-link">Timetable</Link>
          <a href="https://drive.google.com/drive/folders/1IWg3sxnK0abUSWn3UUJckaoSMRSS19UD" 
             target="_blank" 
             rel="noopener noreferrer" 
             className="nav-link">
            PYQs
          </a>
          <Link to="/ask-doubt" className="nav-link">AskDoubt</Link>
        </nav>
        <div className="actions">
          <div className="user-menu">
            <span className="user-greeting">Hello, {currentUser?.name}</span>
            <Link to="/" className="btn btn-outline">Back to Home</Link>
          </div>
        </div>
      </header>

      <div className="notes-container">
        {/* Sidebar */}
        <div className="notes-sidebar">
          <div className="sidebar-header">
            <h2>My Notes</h2>
            <button className="btn btn-primary" onClick={handleCreateNote} disabled={saving || deleting}>
              + New Note
            </button>
          </div>
          
          {loading ? (
            <div className="loading-notes">
              Loading notes...
              {!isOnline && <div className="offline-indicator">Offline</div>}
            </div>
          ) : (
            <div className="notes-list">
              {notes.map(note => (
                <div 
                  key={note._id || note.id} 
                  className={`note-item ${currentNote._id === note._id ? 'active' : ''}`}
                  onClick={() => {
                    isSettingInitialContent.current = true;
                    setCurrentNote(note);
                    setIsEditing(true);
                  }}
                >
                  <div className="note-header">
                    <div className="note-title">{note.title || "Untitled"}</div>
                    <button 
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this note?')) {
                          handleDeleteNote(note._id);
                        }
                      }}
                      disabled={saving || deleting}
                    >
                      {deleting ? '...' : '🗑️'}
                    </button>
                  </div>
                  <div className="note-preview">
                    {getPreviewText(note.content)}
                  </div>
                  <div className="note-date">
                    {formatDate(note.updatedAt || note.createdAt || new Date())}
                  </div>
                </div>
              ))}
              
              {notes.length === 0 && (
                <div className="empty-notes">
                  <div className="empty-icon">📝</div>
                  <h3>No notes yet</h3>
                  <p>Create your first note to get started</p>
                </div>
              )}
              
              {!isOnline && (
                <div className="offline-banner">
                  You are offline. Some features may not work.
                </div>
              )}
            </div>
          )}
          
          {(loading || retrying) && (
            <button className="btn btn-secondary" onClick={retryFetchNotes} disabled={retrying}>
              {retrying ? 'Retrying...' : 'Retry Loading Notes'}
            </button>
          )}
        </div>

        {/* Editor */}
        <div className="notes-editor">
          {isEditing ? (
            <div className="editor-container">
              <div className="editor-toolbar">
                <div className="toolbar-group">
                  <label>Font Size:</label>
                  <select 
                    value={fontSize} 
                    onChange={(e) => {
                      setFontSize(e.target.value);
                      if (editorRef.current) {
                        editorRef.current.style.fontSize = e.target.value;
                      }
                    }}
                    className="toolbar-select"
                    disabled={saving}
                  >
                    <option value="14px">Small</option>
                    <option value="16px">Large</option>
                    <option value="18px">X-Large</option>
                    <option value="20px">XX-Large</option>
                  </select>
                </div>
                
                <div className="toolbar-group">
                  <button 
                    type="button"
                    className="toolbar-btn"
                    onClick={() => handleFormatText('bold')}
                    disabled={saving}
                    title="Bold (Ctrl+B)"
                  >
                    <strong>B</strong>
                  </button>
                  <button 
                    type="button"
                    className="toolbar-btn"
                    onClick={() => handleFormatText('italic')}
                    disabled={saving}
                    title="Italic (Ctrl+I)"
                  >
                    <em>I</em>
                  </button>
                  <button 
                    type="button"
                    className="toolbar-btn"
                    onClick={() => handleFormatText('underline')}
                    disabled={saving}
                    title="Underline (Ctrl+U)"
                  >
                    <u>U</u>
                  </button>
                </div>

                <div className="toolbar-group">
                  <button 
                    type="button"
                    className="toolbar-btn"
                    onClick={() => handleInsertList('bullet')}
                    disabled={saving}
                    title="Bullet List"
                  >
                    • List
                  </button>
                  <button 
                    type="button"
                    className="toolbar-btn"
                    onClick={() => handleInsertList('number')}
                    disabled={saving}
                    title="Numbered List"
                  >
                    1. List
                  </button>
                </div>

                <div className="toolbar-group">
                  <button 
                    type="button"
                    className="toolbar-btn"
                    onClick={handleClearFormatting}
                    disabled={saving}
                    title="Clear Formatting"
                  >
                    🧹 Clear
                  </button>
                </div>
                
                <div className="toolbar-actions">
                  <button 
                    className="btn btn-outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleSaveNote()}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>
              
              <input
                type="text"
                placeholder="Note Title"
                value={currentNote.title}
                onChange={(e) => setCurrentNote({...currentNote, title: e.target.value})}
                className="note-title-input"
                disabled={saving}
              />
              
              <div className="formatting-help">
                <small>
                  <strong>How to use:</strong> Select text and click formatting buttons. 
                  For lists, click the list buttons to insert sample lists.
                </small>
              </div>
              
              <div
                ref={editorRef}
                className="note-content-editor"
                contentEditable={!saving}
                style={{ fontSize: fontSize }}
                data-placeholder="Start typing your note here..."
                disabled={saving}
              />
            </div>
          ) : (
            <div className="editor-placeholder">
              <div className="placeholder-content">
                <div className="placeholder-icon">📝</div>
                <h3>Select a note or create a new one</h3>
                <p>Start organizing your thoughts and knowledge with our rich text editor</p>
                <div className="placeholder-features">
                  <div className="feature">
                    <span>🔤</span> Rich Text Formatting
                  </div>
                  <div className="feature">
                    <span>📋</span> Lists & Bullet Points
                  </div>
                  <div className="feature">
                    <span>💾</span> Auto Save
                  </div>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={handleCreateNote}
                  disabled={saving}
                >
                  Create Your First Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notes;