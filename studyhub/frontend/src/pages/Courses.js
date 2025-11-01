import React from 'react';
import { Link } from 'react-router-dom';
import './Courses.css';

function Courses() {
  const codingCourses = [
    {
      id: 1,
      title: "Web Development",
      description: "Learn full-stack web development with modern technologies including HTML, CSS, JavaScript, React, and Node.js",
      duration: "12 weeks · 60 lessons",
      level: "Beginner",
      image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400",
      link: "https://www.youtube.com/watch?v=nu_pCVPKzTk",
      instructor: "John Doe",
      rating: "4.8",
      students: "15.2k"
    },
    {
      id: 2,
      title: "Python Programming",
      description: "Master Python from basics to advanced concepts including data structures, algorithms, and web development",
      duration: "8 weeks · 40 lessons",
      level: "Beginner",
      image: "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=400",
      link: "https://www.youtube.com/watch?v=nLRL_NcnK-4",
      instructor: "Jane Smith",
      rating: "4.9",
      students: "12.7k"
    },
    {
      id: 3,
      title: "Java Programming",
      description: "Comprehensive Java course for software development, covering OOP, design patterns, and enterprise applications",
      duration: "10 weeks · 50 lessons",
      level: "Intermediate",
      image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=400",
      link: "https://www.youtube.com/watch?v=xTtL8E4LzTQ",
      instructor: "Mike Johnson",
      rating: "4.7",
      students: "8.9k"
    },
    {
      id: 4,
      title: "Cloud Computing",
      description: "Learn cloud platforms and deployment strategies with AWS, Azure, and Google Cloud Platform",
      duration: "14 weeks · 70 lessons",
      level: "Advanced",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400",
      link: "https://www.youtube.com/watch?v=EN4fEbcFZ_E",
      instructor: "Sarah Wilson",
      rating: "4.8",
      students: "6.3k"
    },
    {
      id: 5,
      title: "Artificial Intelligence",
      description: "AI and machine learning fundamentals and applications including neural networks and deep learning",
      duration: "16 weeks · 80 lessons",
      level: "Advanced",
      image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400",
      link: "https://www.youtube.com/watch?v=5NgNicANyqM",
      instructor: "Dr. Alex Chen",
      rating: "4.9",
      students: "11.4k"
    },
    {
      id: 6,
      title: "Power BI",
      description: "Data visualization and business intelligence tools for creating interactive dashboards and reports",
      duration: "6 weeks · 30 lessons",
      level: "Intermediate",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
      link: "https://www.youtube.com/watch?v=FwjaHCVNBWA",
      instructor: "Emily Davis",
      rating: "4.6",
      students: "7.8k"
    }
  ];

  const handleCourseClick = (link) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const getLevelColor = (level) => {
    switch(level) {
      case 'Beginner': return '#22c55e';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="courses-page">
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

      <div className="courses-container">
        <div className="courses-header">
          <h1>Featured Coding Courses</h1>
          <p>Master in-demand skills with our comprehensive coding courses taught by industry experts</p>
        </div>

        <div className="courses-grid">
          {codingCourses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-image">
                <img src={course.image} alt={course.title} />
                <div 
                  className="course-level"
                  style={{ backgroundColor: getLevelColor(course.level) }}
                >
                  {course.level}
                </div>
                <div className="course-overlay">
                  <button 
                    className="btn btn-accent preview-btn"
                    onClick={() => handleCourseClick(course.link)}
                  >
                    Watch Preview
                  </button>
                </div>
              </div>
              
              <div className="course-content">
                <h3>{course.title}</h3>
                <p className="course-description">{course.description}</p>
                
                <div className="course-instructor">
                  <span className="instructor-avatar">👤</span>
                  <span>By {course.instructor}</span>
                </div>
                
                <div className="course-meta">
                  <div className="meta-item">
                    <span className="meta-icon">⏱️</span>
                    <span>{course.duration}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">⭐</span>
                    <span>{course.rating} ({course.students})</span>
                  </div>
                </div>
                
                <button 
                  className="btn btn-primary full-width"
                  onClick={() => handleCourseClick(course.link)}
                >
                  Start Learning
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="courses-features">
          <h2>Why Learn With StudyHub?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h4>Project-Based Learning</h4>
              <p>Build real-world projects and portfolio pieces</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍🏫</div>
              <h4>Expert Instructors</h4>
              <p>Learn from industry professionals with years of experience</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h4>Lifetime Access</h4>
              <p>Access course materials anytime, anywhere</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h4>Certification</h4>
              <p>Earn certificates to showcase your skills</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Courses;