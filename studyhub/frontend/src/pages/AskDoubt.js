import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import httpClient from '../api/httpClient';
import './AskDoubt.css';

function AskDoubt() {
  const [doubts, setDoubts] = useState([]);
  const [newDoubt, setNewDoubt] = useState({ question: '', description: '', tags: [] });
  const [selectedTags, setSelectedTags] = useState([]);
  const [answers, setAnswers] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
  const [loadingStates, setLoadingStates] = useState({ fetch: false, submit: false, answers: {}, resolves: {} });

  const tags = ['python', 'javascript', 'math', 'web-development', 'algorithms', 'database', 'react', 'nodejs', 'java', 'cloud', 'html', 'css', 'data-science'];

  const fetchDoubts = useCallback(async (retry = false) => {
    setLoadingStates(prev => ({ ...prev, fetch: true }));
    setErrors(prev => ({ ...prev, fetch: '' }));
    try {
      const response = await httpClient.get('/doubts');
      if (response.data.success) {
        setDoubts(response.data.doubts || []);
      }
    } catch (error) {
      let message = 'Failed to load doubts. ';
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        message += 'Check your internet connection.';
      } else if (error.response?.status === 500) {
        message += 'Server error. Please try again later.';
      } else if (error.response?.status === 503) {
        message += 'Service unavailable. Please try again later.';
      } else {
        message += 'Please try again.';
      }
      setErrors(prev => ({ ...prev, fetch: message }));
      if (!retry) {
        // Auto retry once after 2 seconds
        setTimeout(() => fetchDoubts(true), 2000);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, fetch: false }));
    }
  }, []);

  useEffect(() => {
    fetchDoubts();
    // Load draft from localStorage
    const draft = localStorage.getItem('askDoubtDraft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setNewDoubt(parsed);
        setSelectedTags(parsed.tags || []);
      } catch (e) {
        // ignore
      }
    }
  }, [fetchDoubts]);

  const saveDraft = (doubt) => {
    localStorage.setItem('askDoubtDraft', JSON.stringify(doubt));
  };

  const clearDraft = () => {
    localStorage.removeItem('askDoubtDraft');
  };

  const handleSubmitDoubt = async (e) => {
    e.preventDefault();
    if (!newDoubt.question.trim()) {
      setErrors(prev => ({ ...prev, submit: 'Question is required.' }));
      return;
    }
    if (newDoubt.description.length > 500) {
      setErrors(prev => ({ ...prev, submit: 'Description must be 500 characters or less.' }));
      return;
    }

    setLoadingStates(prev => ({ ...prev, submit: true }));
    setErrors(prev => ({ ...prev, submit: '' }));

    // Optimistic update
    const tempDoubt = {
      _id: `temp-${Date.now()}`,
      question: newDoubt.question,
      description: newDoubt.description,
      tags: selectedTags,
      author: 'Anonymous',
      createdAt: new Date().toISOString(),
      answers: [],
      isResolved: false
    };
    setDoubts(prev => [tempDoubt, ...prev]);
    const originalNewDoubt = { ...newDoubt };
    const originalSelectedTags = [...selectedTags];
    setNewDoubt({ question: '', description: '', tags: [] });
    setSelectedTags([]);
    clearDraft();

    try {
      const response = await httpClient.post('/doubts', { question: originalNewDoubt.question, description: originalNewDoubt.description, tags: originalSelectedTags });
      if (response.data.success) {
        await fetchDoubts();
      } else {
        // Revert optimistic update
        setDoubts(prev => prev.filter(d => d._id !== tempDoubt._id));
        setNewDoubt(originalNewDoubt);
        setSelectedTags(originalSelectedTags);
        saveDraft(originalNewDoubt);
        setErrors(prev => ({ ...prev, submit: response.data.message || 'Failed to post doubt' }));
      }
    } catch (error) {
      // Revert optimistic update
      setDoubts(prev => prev.filter(d => d._id !== tempDoubt._id));
      setNewDoubt(originalNewDoubt);
      setSelectedTags(originalSelectedTags);
      saveDraft(originalNewDoubt);
      let message = 'Error posting doubt. ';
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        message += 'Check your internet connection.';
      } else if (error.response?.status === 429) {
        message += 'Too many requests. Please wait and try again.';
      } else if (error.response?.status === 400) {
        message += 'Invalid input. Please check your question.';
      } else {
        message += 'Please try again.';
      }
      setErrors(prev => ({ ...prev, submit: message }));
    } finally {
      setLoadingStates(prev => ({ ...prev, submit: false }));
    }
  };

  const handleSubmitAnswer = async (doubtId) => {
    const answerText = answers[doubtId];
    if (!answerText?.trim()) {
      setErrors(prev => ({ ...prev, [`answer-${doubtId}`]: 'Answer is required.' }));
      return;
    }
    if (answerText.length > 1000) {
      setErrors(prev => ({ ...prev, [`answer-${doubtId}`]: 'Answer must be 1000 characters or less.' }));
      return;
    }

    setLoadingStates(prev => ({ ...prev, answers: { ...prev.answers, [doubtId]: true } }));
    setErrors(prev => ({ ...prev, [`answer-${doubtId}`]: '' }));

    // Optimistic update
    const tempAnswer = {
      _id: `temp-${Date.now()}`,
      text: answerText,
      author: 'Anonymous',
      createdAt: new Date().toISOString()
    };
    setDoubts(prev => prev.map(d => d._id === doubtId ? { ...d, answers: [...d.answers, tempAnswer] } : d));
    const originalAnswers = { ...answers };
    setAnswers({ ...answers, [doubtId]: '' });

    try {
      const response = await httpClient.post(`/doubts/${doubtId}/answers`, { text: answerText });
      if (response.data.success) {
        await fetchDoubts();
      } else {
        // Revert
        setDoubts(prev => prev.map(d => d._id === doubtId ? { ...d, answers: d.answers.filter(a => a._id !== tempAnswer._id) } : d));
        setAnswers(originalAnswers);
        setErrors(prev => ({ ...prev, [`answer-${doubtId}`]: response.data.message || 'Failed to post answer' }));
      }
    } catch (error) {
      // Revert
      setDoubts(prev => prev.map(d => d._id === doubtId ? { ...d, answers: d.answers.filter(a => a._id !== tempAnswer._id) } : d));
      setAnswers(originalAnswers);
      let message = 'Error posting answer. ';
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        message += 'Check your internet connection.';
      } else if (error.response?.status === 429) {
        message += 'Too many requests. Please wait and try again.';
      } else if (error.response?.status === 400) {
        message += 'Invalid input. Please check your answer.';
      } else {
        message += 'Please try again.';
      }
      setErrors(prev => ({ ...prev, [`answer-${doubtId}`]: message }));
    } finally {
      setLoadingStates(prev => ({ ...prev, answers: { ...prev.answers, [doubtId]: false } }));
    }
  };

  const handleResolveDoubt = async (doubtId) => {
    if (!window.confirm('Mark this doubt as resolved?')) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, resolves: { ...prev.resolves, [doubtId]: true } }));
    setErrors(prev => ({ ...prev, [`resolve-${doubtId}`]: '' }));

    // Optimistic update
    setDoubts(prev => prev.map(d => d._id === doubtId ? { ...d, isResolved: true } : d));

    try {
      const response = await httpClient.put(`/doubts/${doubtId}/resolve`, { isResolved: true });
      if (response.data.success) {
        await fetchDoubts();
      } else {
        // Revert
        setDoubts(prev => prev.map(d => d._id === doubtId ? { ...d, isResolved: false } : d));
        setErrors(prev => ({ ...prev, [`resolve-${doubtId}`]: response.data.message || 'Failed to resolve doubt' }));
      }
    } catch (error) {
      // Revert
      setDoubts(prev => prev.map(d => d._id === doubtId ? { ...d, isResolved: false } : d));
      let message = 'Error resolving doubt. ';
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        message += 'Check your internet connection.';
      } else {
        message += 'Please try again.';
      }
      setErrors(prev => ({ ...prev, [`resolve-${doubtId}`]: message }));
    } finally {
      setLoadingStates(prev => ({ ...prev, resolves: { ...prev.resolves, [doubtId]: false } }));
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const filteredDoubts = doubts.filter(doubt => {
    if (activeFilter === 'resolved' && !doubt.isResolved) return false;
    if (activeFilter === 'unresolved' && doubt.isResolved) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        doubt.question.toLowerCase().includes(term) ||
        doubt.description.toLowerCase().includes(term) ||
        doubt.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    return true;
  });

  const getDoubtStats = () => {
    const total = doubts.length;
    const resolved = doubts.filter(d => d.isResolved).length;
    const unresolved = total - resolved;
    
    return { total, resolved, unresolved };
  };

  const stats = getDoubtStats();

  const handleNewDoubtChange = (field, value) => {
    const updated = { ...newDoubt, [field]: value };
    setNewDoubt(updated);
    saveDraft(updated);
    // Real-time validation
    if (field === 'question' && !value.trim()) {
      setErrors(prev => ({ ...prev, submit: 'Question is required.' }));
    } else if (field === 'description' && value.length > 500) {
      setErrors(prev => ({ ...prev, submit: 'Description must be 500 characters or less.' }));
    } else {
      setErrors(prev => ({ ...prev, submit: '' }));
    }
  };

  const handleAnswerChange = (doubtId, value) => {
    setAnswers({ ...answers, [doubtId]: value });
    // Real-time validation
    if (value.length > 1000) {
      setErrors(prev => ({ ...prev, [`answer-${doubtId}`]: 'Answer must be 1000 characters or less.' }));
    } else {
      setErrors(prev => ({ ...prev, [`answer-${doubtId}`]: '' }));
    }
  };

  return (
    <div className="ask-doubt-page">
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
          <Link to="/" className="btn btn-outline">Back to Home</Link>
        </div>
      </header>

      <div className="doubt-container">
        <div className="doubt-header">
          <h1>Community Help Forum</h1>
          <p>Ask questions, share knowledge, and help each other learn</p>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">❓</div>
            <div className="stat-info">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Questions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-number">{stats.resolved}</div>
              <div className="stat-label">Resolved</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <div className="stat-number">{stats.unresolved}</div>
              <div className="stat-label">Unresolved</div>
            </div>
          </div>
        </div>

        <div className="doubt-content">
          {/* Ask Doubt Form */}
          <div className="ask-doubt-section">
            <div className="section-header">
              <h2>Ask a Question</h2>
              <div className="section-tip">
                💡 Be specific and include relevant details for better answers
              </div>
            </div>
            
            <form onSubmit={handleSubmitDoubt} className="doubt-form">
              {errors.submit && <div className="error-message">{errors.submit}</div>}
              <div className="form-group">
                <label htmlFor="question">Your Question *</label>
                <input
                  type="text"
                  id="question"
                  value={newDoubt.question}
                  onChange={(e) => handleNewDoubtChange('question', e.target.value)}
                  placeholder="What do you need help with?"
                  required
                  disabled={loadingStates.submit}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Additional Details</label>
                <textarea
                  id="description"
                  value={newDoubt.description}
                  onChange={(e) => handleNewDoubtChange('description', e.target.value)}
                  placeholder="Provide more context about your question. Include code snippets, error messages, or specific concepts you're struggling with."
                  rows="4"
                  disabled={loadingStates.submit}
                />
                <div className="char-count">
                  {newDoubt.description.length}/500 characters
                </div>
              </div>

              <div className="form-group">
                <label>Add Tags</label>
                <div className="tags-container">
                  {tags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
                      onClick={() => toggleTag(tag)}
                      disabled={loadingStates.submit}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="selected-tags">
                  {selectedTags.map(tag => (
                    <span key={tag} className="selected-tag">
                      #{tag}
                      <button 
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="remove-tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-accent submit-btn"
                disabled={loadingStates.submit || !newDoubt.question.trim()}
              >
                {loadingStates.submit ? (
                  <>
                    <span className="spinner"></span>
                    Posting Question...
                  </>
                ) : (
                  'Post Your Question'
                )}
              </button>
            </form>
          </div>

          {/* Doubts List */}
          <div className="doubts-section">
            <div className="section-header">
              <h2>Community Questions</h2>
              <div className="filters">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <span className="search-icon">🔍</span>
                </div>
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('all')}
                  >
                    All ({stats.total})
                  </button>
                  <button 
                    className={`filter-btn ${activeFilter === 'unresolved' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('unresolved')}
                  >
                    Unresolved ({stats.unresolved})
                  </button>
                  <button 
                    className={`filter-btn ${activeFilter === 'resolved' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('resolved')}
                  >
                    Resolved ({stats.resolved})
                  </button>
                </div>
              </div>
            </div>
            
            {loadingStates.fetch ? (
              <div className="loading-doubts">
                <div className="loading-spinner"></div>
                <p>Loading questions...</p>
              </div>
            ) : errors.fetch ? (
              <div className="error-doubts">
                <div className="error-icon">⚠️</div>
                <h3>Error loading questions</h3>
                <p>{errors.fetch}</p>
                <button className="btn btn-primary" onClick={() => fetchDoubts()}>Retry</button>
              </div>
            ) : filteredDoubts.length === 0 ? (
              <div className="empty-doubts">
                <div className="empty-icon">❓</div>
                <h3>No questions found</h3>
                <p>
                  {searchTerm || activeFilter !== 'all' 
                    ? 'Try changing your search or filter criteria'
                    : 'Be the first to ask a question!'
                  }
                </p>
              </div>
            ) : (
              <div className="doubts-grid">
                {filteredDoubts.map(doubt => (
                  <div key={doubt._id} className="doubt-card">
                    <div className="doubt-header-info">
                      <div className="author-info">
                        <span className="author-avatar">{doubt.author?.avatar || '👤'}</span>
                        <div className="author-details">
                          <div className="author-name">{doubt.author?.name || 'Unknown User'}</div>
                          <div className="doubt-date">{formatDate(doubt.createdAt)}</div>
                        </div>
                      </div>
                      <div className="doubt-status">
                        {doubt.isResolved ? (
                          <span className="status resolved">
                            <span className="status-icon">✅</span>
                            Resolved
                          </span>
                        ) : (
                          <span className="status pending">
                            <span className="status-icon">⏳</span>
                            Needs Answer
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="doubt-content">
                      <h3 className="doubt-title">{doubt.question}</h3>
                      {doubt.description && (
                        <p className="doubt-description">{doubt.description}</p>
                      )}
                      
                      <div className="doubt-tags">
                        {doubt.tags.map(tag => (
                          <span key={tag} className="doubt-tag">#{tag}</span>
                        ))}
                      </div>
                    </div>

                    {/* Answers Section */}
                    <div className="answers-section">
                      <div className="answers-header">
                        <h4>
                          {doubt.answers.length === 0 ? 'No answers yet' : 
                           `${doubt.answers.length} answer${doubt.answers.length === 1 ? '' : 's'}`}
                        </h4>
                        {!doubt.isResolved && (
                          <button 
                            className="btn btn-small resolve-btn"
                            onClick={() => handleResolveDoubt(doubt._id)}
                            disabled={loadingStates.resolves[doubt._id]}
                          >
                            {loadingStates.resolves[doubt._id] ? 'Resolving...' : 'Mark as Resolved'}
                          </button>
                        )}
                      </div>
                      {errors[`resolve-${doubt._id}`] && <div className="error-message">{errors[`resolve-${doubt._id}`]}</div>}
                      
                      {doubt.answers.map((answer) => (
                        <div key={answer._id} className="answer-card">
                          <div className="answer-header">
                            <div className="answer-author">
                              <span className="author-avatar">{answer.author?.avatar || '👤'}</span>
                              <span className="author-name">{answer.author?.name || 'Unknown User'}</span>
                            </div>
                            <div className="answer-date">
                              {formatDate(answer.createdAt)}
                            </div>
                          </div>
                          <div className="answer-text">{answer.text}</div>
                        </div>
                      ))}

                      <div className="answer-form">
                        {errors[`answer-${doubt._id}`] && <div className="error-message">{errors[`answer-${doubt._id}`]}</div>}
                        <textarea
                          placeholder="Write your answer..."
                          value={answers[doubt._id] || ''}
                          onChange={(e) => handleAnswerChange(doubt._id, e.target.value)}
                          rows="3"
                          disabled={loadingStates.answers[doubt._id]}
                        />
                        <div className="answer-actions">
                          <div className="char-count">
                            {answers[doubt._id]?.length || 0}/1000 characters
                          </div>
                            <button 
                              className="btn btn-primary"
                              onClick={() => handleSubmitAnswer(doubt._id)}
                              disabled={loadingStates.answers[doubt._id] || !answers[doubt._id]?.trim()}
                            >
                              {loadingStates.answers[doubt._id] ? 'Posting...' : 'Post Answer'}
                            </button>
                          </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AskDoubt;