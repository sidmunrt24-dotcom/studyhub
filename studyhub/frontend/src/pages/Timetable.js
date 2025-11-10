import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import httpClient from '../api/httpClient';
import './Timetable.css';

function Timetable() {
  const [schedule, setSchedule] = useState([]);
  const [editingSlot, setEditingSlot] = useState(null);
  const [newSlot, setNewSlot] = useState({ day: 'Monday', time: '', subject: '', topic: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState('Monday');
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const days = useMemo(() => 
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  , []);

  const timeSlots = useMemo(() => [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
  ], []);

  const autoSaveTimeoutRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  const showNotification = useCallback((message, type = 'info') => {
    // Notifications disabled for college project
  }, []);

  const saveToLocalStorage = useCallback(() => {
    localStorage.setItem('studyhub_timetable_backup', JSON.stringify({ schedule, timestamp: Date.now() }));
  }, [schedule]);

  const performAutoSave = useCallback(async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    try {
      setSaving(true);
      await httpClient.post('/timetable', { schedule });
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      saveToLocalStorage();
      localStorage.removeItem('studyhub_timetable_backup');
    } catch (error) {
      console.error('Auto-save error:', error);
      showNotification('Failed to save timetable', 'error');
      saveToLocalStorage();
    } finally {
      setSaving(false);
    }
  }, [schedule, saveToLocalStorage, showNotification]);

  const manualSave = useCallback(async () => {
    if (!Array.isArray(schedule) || schedule.length === 0) {
      return;
    }
    try {
      setSaving(true);
      await httpClient.post('/timetable', { schedule });
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      showNotification('Timetable Saved', 'success');
      saveToLocalStorage();
      localStorage.removeItem('studyhub_timetable_backup');
    } catch (error) {
      console.error('Save error:', error);
      showNotification('Failed to save timetable', 'error');
      saveToLocalStorage();
    } finally {
      setSaving(false);
    }
  }, [schedule, saveToLocalStorage, showNotification]);

  const debounceAutoSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 3000);
  }, [performAutoSave]);

  const initializeData = useCallback(async () => {
    // Always start with an empty schedule
    const initialSchedule = days.map(day => ({
      day,
      slots: []
    }));
    setSchedule(initialSchedule);

    setLoading(true);
    try {
      // Try loading from localStorage first
      const saved = localStorage.getItem('studyhub_timetable_backup');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schedule && Array.isArray(parsed.schedule)) {
          setSchedule(parsed.schedule);
          setHasUnsavedChanges(true);
          showNotification('Unsaved changes loaded from local storage', 'info');
          return;
        }
      }

      // If no localStorage data, try server
      const response = await httpClient.get('/timetable');
      if (response.data.success && response.data.timetable?.schedule) {
        // Normalize schedule to ensure all 7 days exist with slots array
        const serverSchedule = Array.isArray(response.data.timetable.schedule) 
          ? response.data.timetable.schedule 
          : [];
        const normalizedSchedule = days.map(day => {
          const existing = serverSchedule.find(s => s.day === day);
          return existing && Array.isArray(existing.slots) 
            ? existing 
            : { day, slots: [] };
        });
        setSchedule(normalizedSchedule);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error initializing timetable:', error);
      showNotification('Failed to load timetable. Using empty schedule.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification, days]);

  // Initialize data
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Handle auto-save
  useEffect(() => {
    if (hasUnsavedChanges) {
      debounceAutoSave();
    }
  }, [hasUnsavedChanges, debounceAutoSave]);

  const addSlot = () => {
    if (!newSlot.time || !newSlot.subject) {
      showNotification('Please fill in both time and subject', 'warning');
      return;
    }

    if (!Array.isArray(schedule)) {
      const initialSchedule = days.map(day => ({ day, slots: [] }));
      setSchedule(initialSchedule);
      return;
    }

    const updatedSchedule = schedule.map(daySchedule => {
      if (daySchedule.day === newSlot.day) {
        const slotExists = daySchedule.slots.some(slot => slot.time === newSlot.time);
        if (slotExists) {
          showNotification('A slot already exists at this time. Please choose a different time.', 'warning');
          return daySchedule;
        }
        
        return {
          ...daySchedule,
          slots: [...daySchedule.slots, { ...newSlot, isCompleted: false }].sort((a, b) => 
            timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time)
          ) // timeSlots is now memoized, so this is efficient
        };
      }
      return daySchedule;
    });

    setSchedule(updatedSchedule);
    setHasUnsavedChanges(true);
    saveToLocalStorage();
    setNewSlot({ day: 'Monday', time: '', subject: '', topic: '' });
  };

  const updateSlot = (day, slotIndex, updates) => {
    if (!Array.isArray(schedule)) {
      const initialSchedule = days.map(day => ({ day, slots: [] }));
      setSchedule(initialSchedule);
      return;
    }

    const updatedSchedule = schedule.map(daySchedule => {
      if (daySchedule.day === day) {
        const updatedSlots = [...daySchedule.slots];
        updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], ...updates };
        return { ...daySchedule, slots: updatedSlots };
      }
      return daySchedule;
    });
    setSchedule(updatedSchedule);
    setHasUnsavedChanges(true);
    saveToLocalStorage();
  };

  const deleteSlot = (day, slotIndex) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    const updatedSchedule = schedule.map(daySchedule => {
      if (daySchedule.day === day) {
        const updatedSlots = daySchedule.slots.filter((_, index) => index !== slotIndex);
        return { ...daySchedule, slots: updatedSlots };
      }
      return daySchedule;
    });
    setSchedule(updatedSchedule);
    setHasUnsavedChanges(true);
    saveToLocalStorage();
  };

  const toggleCompletion = (day, slotIndex) => {
    const updatedSchedule = schedule.map(daySchedule => {
      if (daySchedule.day === day) {
        const updatedSlots = [...daySchedule.slots];
        updatedSlots[slotIndex] = { 
          ...updatedSlots[slotIndex], 
          isCompleted: !updatedSlots[slotIndex].isCompleted 
        };
        return { ...daySchedule, slots: updatedSlots };
      }
      return daySchedule;
    });
    setSchedule(updatedSchedule);
    setHasUnsavedChanges(true);
    saveToLocalStorage();
  };

  const getDayCompletion = useCallback((daySlots) => {
    if (daySlots.length === 0) return 0;
    const completed = daySlots.filter(slot => slot.isCompleted).length;
    return Math.round((completed / daySlots.length) * 100);
  }, []);

  const getWeeklyStats = useCallback(() => {
    const stats = days.map(day => {
      const daySchedule = (schedule || []).find(d => d.day === day) || { slots: [] };
      return {
        day,
        completion: getDayCompletion(daySchedule.slots),
        totalSlots: daySchedule.slots.length,
        completedSlots: daySchedule.slots.filter(slot => slot.isCompleted).length
      };
    });

    const totalWeeklySlots = stats.reduce((sum, stat) => sum + stat.totalSlots, 0);
    const totalCompleted = stats.reduce((sum, stat) => sum + stat.completedSlots, 0);
    const weeklyCompletion = totalWeeklySlots > 0 ? Math.round((totalCompleted / totalWeeklySlots) * 100) : 0;

    return { stats, weeklyCompletion, totalWeeklySlots, totalCompleted };
  }, [days, schedule, getDayCompletion]);

  const weeklyStats = getWeeklyStats();

  if (loading) {
    return (
      <div className="timetable-page">
        <header className="topbar">
          <div className="brand">
            <span className="logo">📚</span>
            <Link to="/" className="title">StudyHub</Link>
          </div>
          <div className="actions">
            <Link to="/" className="btn btn-outline">Back to Home</Link>
          </div>
        </header>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading timetable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-page">
      <header className="topbar">
        <div className="brand">
          <span className="logo">📚</span>
          <Link to="/" className="title">StudyHub</Link>
        </div>
        <nav className="nav">
          <Link to="/notes" className="nav-link">Notes</Link>
          <Link to="/courses" className="nav-link">Courses</Link>
          <Link to="/timetable" className="nav-link active">Timetable</Link>
          <a href="https://drive.google.com/drive/folders/1IWg3sxnK0abUSWn3UUJckaoSMRSS19UD" 
             target="_blank" 
             rel="noopener noreferrer" 
             className="nav-link">
            PYQs
          </a>
          <Link to="/ask-doubt" className="nav-link">AskDoubt</Link>
        </nav>
        <div className="actions">
          <Link to="/" className="btn btn-outline">Back to Home</Link>
        </div>
      </header>

      <div className="timetable-container">
        <div className="timetable-header">
          <h1>Study Timetable</h1>
          <p>Plan your study schedule and track your progress</p>
          {lastSaved && (
            <div className="last-saved">Last saved: {lastSaved.toLocaleString()}</div>
          )}
          {hasUnsavedChanges && (
            <div className="unsaved-changes">You have unsaved changes</div>
          )}
        </div>

        {/* Weekly Overview */}
        <div className="weekly-overview">
          <div className="overview-header">
            <h2>Weekly Overview</h2>
            <div className="weekly-stats">
              <div className="stat-card">
                <div className="stat-value">{weeklyStats.weeklyCompletion}%</div>
                <div className="stat-label">Weekly Completion</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{weeklyStats.totalCompleted}/{weeklyStats.totalWeeklySlots}</div>
                <div className="stat-label">Sessions Completed</div>
              </div>
            </div>
          </div>
          
          <div className="days-navigation">
            {days.map(day => {
              const dayStats = weeklyStats.stats.find(stat => stat.day === day);
              return (
                <button
                  key={day}
                  className={`day-tab ${activeDay === day ? 'active' : ''}`}
                  onClick={() => setActiveDay(day)}
                >
                  <span className="day-name">{day.substring(0, 3)}</span>
                  <div className="completion-badge">
                    {dayStats.completion}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="timetable-content">
          {/* Add New Slot Form */}
          <div className="add-slot-form">
            <h3>Add New Study Session</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Day</label>
                <select 
                  value={newSlot.day} 
                  onChange={(e) => setNewSlot({...newSlot, day: e.target.value})}
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Time</label>
                <select 
                  value={newSlot.time} 
                  onChange={(e) => setNewSlot({...newSlot, time: e.target.value})}
                >
                  <option value="">Select Time</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  placeholder="e.g., Mathematics"
                  value={newSlot.subject}
                  onChange={(e) => setNewSlot({...newSlot, subject: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Topic</label>
                <input
                  type="text"
                  placeholder="e.g., Algebra"
                  value={newSlot.topic}
                  onChange={(e) => setNewSlot({...newSlot, topic: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <button className="btn btn-primary" onClick={addSlot}>
                  Add Session
                </button>
              </div>
            </div>
          </div>

          {/* Day Schedule */}
          <div className="day-schedule">
            <div className="day-header">
              <h3>{activeDay} Schedule</h3>
              <div className="day-progress">
                <div className="progress-text">
                  {getDayCompletion((schedule || []).find(d => d.day === activeDay)?.slots || [])}% Complete
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${getDayCompletion((schedule || []).find(d => d.day === activeDay)?.slots || [])}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="schedule-slots">
              {timeSlots.map(time => {
                const activeDaySchedule = (schedule || []).find(d => d.day === activeDay);
                const slot = activeDaySchedule?.slots.find(s => s.time === time);
                
                return (
                  <div key={time} className="schedule-slot">
                    <div className="time-label">{time}</div>
                    
                    {slot ? (
                      <div className={`slot-card ${slot.isCompleted ? 'completed' : ''} ${
                        editingSlot && editingSlot.day === activeDay && editingSlot.time === time ? 'editing' : ''
                      }`}>
                        {editingSlot && editingSlot.day === activeDay && editingSlot.time === time ? (
                          <div className="slot-edit">
                            <input
                              type="text"
                              value={slot.subject}
                              onChange={(e) => updateSlot(activeDay, activeDaySchedule.slots.indexOf(slot), { subject: e.target.value })}
                              placeholder="Subject"
                            />
                            <input
                              type="text"
                              value={slot.topic}
                              onChange={(e) => updateSlot(activeDay, activeDaySchedule.slots.indexOf(slot), { topic: e.target.value })}
                              placeholder="Topic"
                            />
                            <button 
                              className="btn btn-small"
                              onClick={() => setEditingSlot(null)}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="slot-info">
                              <div className="slot-subject">{slot.subject}</div>
                              {slot.topic && <div className="slot-topic">{slot.topic}</div>}
                            </div>
                            <div className="slot-actions">
                              <button 
                                className={`complete-btn ${slot.isCompleted ? 'completed' : ''}`}
                                onClick={() => toggleCompletion(activeDay, activeDaySchedule.slots.indexOf(slot))}
                                title={slot.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                              >
                                {slot.isCompleted ? '✅' : '⚪'}
                              </button>
                              <button 
                                className="edit-btn"
                                onClick={() => setEditingSlot({ day: activeDay, time: slot.time })}
                                title="Edit session"
                              >
                                ✏️
                              </button>
                              <button 
                                className="delete-btn"
                                onClick={() => deleteSlot(activeDay, activeDaySchedule.slots.indexOf(slot))}
                                title="Delete session"
                              >
                                🗑️
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="slot-empty">
                        <span>No session scheduled</span>
                        <button 
                          className="btn btn-outline btn-small"
                          onClick={() => {
                            setNewSlot({
                              day: activeDay,
                              time: time,
                              subject: '',
                              topic: ''
                            });
                          }}
                        >
                          Add Session
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="timetable-actions">
          <button 
            className="btn btn-accent save-btn"
            onClick={manualSave}
            disabled={saving || !hasUnsavedChanges}
          >
            {saving ? 'Saving...' : 'Save Timetable'}
          </button>
        </div>

        {/* Weekly Progress */}
        <div className="weekly-progress">
          <h3>Daily Progress</h3>
          <div className="progress-grid">
            {weeklyStats.stats.map(stat => (
              <div key={stat.day} className="progress-item">
                <div className="progress-day">{stat.day}</div>
                <div className="progress-details">
                  <div className="progress-bar-horizontal">
                    <div 
                      className="progress-fill"
                      style={{ width: `${stat.completion}%` }}
                    ></div>
                  </div>
                  <div className="progress-numbers">
                    <span className="completion">{stat.completion}%</span>
                    <span className="sessions">({stat.completedSlots}/{stat.totalSlots})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Timetable;