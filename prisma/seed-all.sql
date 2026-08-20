-- ═══════════════════════════════════════════════════════════════════
-- iSCARB Comprehensive Database Seed
-- Seeds data for ALL pages across ALL roles
-- ═══════════════════════════════════════════════════════════════════

-- First, get the existing user IDs for foreign keys
DO $$
DECLARE
  student_user_id TEXT;
  faculty_user_id TEXT;
  admin_user_id TEXT;
  itops_user_id TEXT;
  recruiter_user_id TEXT;
  employer_user_id TEXT;
  developer_user_id TEXT;
  org_id TEXT;
  dept_id TEXT;
  campus_id TEXT;
  course1_id TEXT;
  course2_id TEXT;
  course3_id TEXT;
  student_id TEXT;
  faculty_record_id TEXT;
  assessment1_id TEXT;
  assessment2_id TEXT;
  enrollment1_id TEXT;
  enrollment2_id TEXT;
BEGIN
  -- Get existing user IDs
  SELECT id INTO student_user_id FROM "User" WHERE email = 'student@iscarb.edu' LIMIT 1;
  SELECT id INTO faculty_user_id FROM "User" WHERE email = 'faculty@iscarb.edu' LIMIT 1;
  SELECT id INTO admin_user_id FROM "User" WHERE email = 'admin@iscarb.edu' LIMIT 1;
  SELECT id INTO itops_user_id FROM "User" WHERE email = 'itops@iscarb.edu' LIMIT 1;
  SELECT id INTO recruiter_user_id FROM "User" WHERE email = 'recruiter@iscarb.edu' LIMIT 1;
  SELECT id INTO employer_user_id FROM "User" WHERE email = 'employer@iscarb.edu' LIMIT 1;
  SELECT id INTO developer_user_id FROM "User" WHERE email = 'developer@iscarb.edu' LIMIT 1;

  -- ═══════════════════════════════════════════════════════════════
  -- ORGANIZATION, CAMPUS, DEPARTMENT
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "Organization" (id, name, slug, type, "createdAt", "updatedAt") VALUES
    ('org-iscarb-001', 'iSCARB University', 'iscarb-university', 'university', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO org_id;

  IF org_id IS NULL THEN
    SELECT id INTO org_id FROM "Organization" WHERE name = 'iSCARB University' LIMIT 1;
  END IF;

  INSERT INTO "Campus" (id, name, "organizationId", "createdAt", "updatedAt") VALUES
    ('campus-main-001', 'Main Campus', org_id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO campus_id;

  IF campus_id IS NULL THEN
    SELECT id INTO campus_id FROM "Campus" WHERE name = 'Main Campus' LIMIT 1;
  END IF;

  INSERT INTO "Department" (id, name, "organizationId", "createdAt", "updatedAt") VALUES
    ('dept-cs-001', 'Computer Science', org_id, NOW(), NOW()),
    ('dept-eng-001', 'Engineering', org_id, NOW(), NOW()),
    ('dept-biz-001', 'Business Administration', org_id, NOW(), NOW()),
    ('dept-med-001', 'Medicine', org_id, NOW(), NOW()),
    ('dept-law-001', 'Law', org_id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO dept_id;

  IF dept_id IS NULL THEN
    SELECT id INTO dept_id FROM "Department" WHERE name = 'Computer Science' LIMIT 1;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- COURSES (15 courses across departments)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "Course" (id, name, code, description, credits, "departmentId", "createdAt", "updatedAt") VALUES
    ('course-001', 'Introduction to Computer Science', 'CS101', 'Fundamentals of computing and programming', 3, dept_id, NOW(), NOW()),
    ('course-002', 'Data Structures & Algorithms', 'CS201', 'Advanced data structures and algorithm design', 4, dept_id, NOW(), NOW()),
    ('course-003', 'Database Systems', 'CS301', 'Relational databases, SQL, and design', 3, dept_id, NOW(), NOW()),
    ('course-004', 'Artificial Intelligence', 'CS401', 'Introduction to AI and machine learning', 4, dept_id, NOW(), NOW()),
    ('course-005', 'Software Engineering', 'CS302', 'Software development lifecycle and methodologies', 3, dept_id, NOW(), NOW()),
    ('course-006', 'Web Development', 'CS202', 'Full-stack web development', 3, dept_id, NOW(), NOW()),
    ('course-007', 'Computer Networks', 'CS303', 'Network protocols and architecture', 3, dept_id, NOW(), NOW()),
    ('course-008', 'Operating Systems', 'CS304', 'Process management, memory, and file systems', 4, dept_id, NOW(), NOW()),
    ('course-009', 'Machine Learning', 'CS402', 'Statistical learning and neural networks', 4, dept_id, NOW(), NOW()),
    ('course-010', 'Cybersecurity', 'CS403', 'Information security and cryptography', 3, dept_id, NOW(), NOW()),
    ('course-011', 'Calculus I', 'MATH101', 'Differential calculus', 3, dept_id, NOW(), NOW()),
    ('course-012', 'Linear Algebra', 'MATH201', 'Vectors, matrices, and linear transformations', 3, dept_id, NOW(), NOW()),
    ('course-013', 'Physics I', 'PHYS101', 'Mechanics and thermodynamics', 4, dept_id, NOW(), NOW()),
    ('course-014', 'Business Management', 'BUS101', 'Introduction to business principles', 3, dept_id, NOW(), NOW()),
    ('course-015', 'Technical Writing', 'ENG101', 'Professional communication skills', 2, dept_id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Get course IDs
  SELECT id INTO course1_id FROM "Course" WHERE code = 'CS101' LIMIT 1;
  SELECT id INTO course2_id FROM "Course" WHERE code = 'CS201' LIMIT 1;
  SELECT id INTO course3_id FROM "Course" WHERE code = 'CS301' LIMIT 1;

  -- ═══════════════════════════════════════════════════════════════
  -- STUDENT RECORD
  -- ═══════════════════════════════════════════════════════════════
  
  IF student_user_id IS NOT NULL THEN
    INSERT INTO "Student" (id, "userId", name, email, gpa, semester, "departmentId", "organizationId", "createdAt", "updatedAt") VALUES
      ('student-001', student_user_id, 'Ahmed Mohammed', 'student@iscarb.edu', 3.75, 5, dept_id, org_id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO student_id;

    IF student_id IS NULL THEN
      SELECT id INTO student_id FROM "Student" WHERE email = 'student@iscarb.edu' LIMIT 1;
    END IF;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- FACULTY RECORD
  -- ═══════════════════════════════════════════════════════════════
  
  IF faculty_user_id IS NOT NULL THEN
    INSERT INTO "Faculty" (id, "userId", name, email, department, specialization, "departmentId", "organizationId", "createdAt", "updatedAt") VALUES
      ('faculty-001', faculty_user_id, 'Dr. Sarah Johnson', 'faculty@iscarb.edu', 'Computer Science', 'Artificial Intelligence', dept_id, org_id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO faculty_record_id;

    IF faculty_record_id IS NULL THEN
      SELECT id INTO faculty_record_id FROM "Faculty" WHERE email = 'faculty@iscarb.edu' LIMIT 1;
    END IF;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- ENROLLMENTS (10 enrollments)
  -- ═══════════════════════════════════════════════════════════════
  
  IF student_id IS NOT NULL THEN
    INSERT INTO "Enrollment" (id, "studentId", "courseId", status, grade, "semester", "createdAt", "updatedAt") VALUES
      ('enroll-001', student_id, course1_id, 'completed', 'A', 'Fall 2024', NOW(), NOW()),
      ('enroll-002', student_id, course2_id, 'completed', 'B+', 'Fall 2024', NOW(), NOW()),
      ('enroll-003', student_id, course3_id, 'active', NULL, 'Spring 2025', NOW(), NOW()),
      ('enroll-004', student_id, (SELECT id FROM "Course" WHERE code = 'CS401' LIMIT 1), 'active', NULL, 'Spring 2025', NOW(), NOW()),
      ('enroll-005', student_id, (SELECT id FROM "Course" WHERE code = 'CS302' LIMIT 1), 'active', NULL, 'Spring 2025', NOW(), NOW()),
      ('enroll-006', student_id, (SELECT id FROM "Course" WHERE code = 'MATH101' LIMIT 1), 'completed', 'A-', 'Fall 2024', NOW(), NOW()),
      ('enroll-007', student_id, (SELECT id FROM "Course" WHERE code = 'PHYS101' LIMIT 1), 'completed', 'B', 'Fall 2024', NOW(), NOW()),
      ('enroll-008', student_id, (SELECT id FROM "Course" WHERE code = 'CS202' LIMIT 1), 'active', NULL, 'Spring 2025', NOW(), NOW()),
      ('enroll-009', student_id, (SELECT id FROM "Course" WHERE code = 'ENG101' LIMIT 1), 'completed', 'A', 'Fall 2024', NOW(), NOW()),
      ('enroll-010', student_id, (SELECT id FROM "Course" WHERE code = 'BUS101' LIMIT 1), 'dropped', NULL, 'Fall 2024', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- ASSESSMENTS (10 assessments)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "Assessment" (id, title, description, type, "courseId", "maxScore", "weight", "dueDate", "createdAt", "updatedAt") VALUES
    ('assess-001', 'Midterm Exam - CS101', 'Midterm examination for Introduction to CS', 'exam', course1_id, 100, 30, NOW() + INTERVAL '2 weeks', NOW(), NOW()),
    ('assess-002', 'Assignment 1 - CS201', 'Data structures implementation assignment', 'assignment', course2_id, 50, 15, NOW() + INTERVAL '1 week', NOW(), NOW()),
    ('assess-003', 'Quiz 1 - CS301', 'Database fundamentals quiz', 'quiz', course3_id, 20, 10, NOW() + INTERVAL '3 days', NOW(), NOW()),
    ('assess-004', 'Final Project - CS401', 'AI project implementation', 'project', (SELECT id FROM "Course" WHERE code = 'CS401' LIMIT 1), 200, 40, NOW() + INTERVAL '1 month', NOW(), NOW()),
    ('assess-005', 'Lab Report 1 - CS302', 'Software requirements document', 'assignment', (SELECT id FROM "Course" WHERE code = 'CS302' LIMIT 1), 30, 10, NOW() + INTERVAL '1 week', NOW(), NOW()),
    ('assess-006', 'Midterm Exam - MATH101', 'Calculus midterm', 'exam', (SELECT id FROM "Course" WHERE code = 'MATH101' LIMIT 1), 100, 30, NOW() + INTERVAL '2 weeks', NOW(), NOW()),
    ('assess-007', 'Quiz 2 - CS101', 'Programming basics quiz', 'quiz', course1_id, 20, 10, NOW() + INTERVAL '5 days', NOW(), NOW()),
    ('assess-008', 'Assignment 2 - CS201', 'Algorithm analysis assignment', 'assignment', course2_id, 50, 15, NOW() + INTERVAL '2 weeks', NOW(), NOW()),
    ('assess-009', 'Lab Exam - CS303', 'Network configuration practical', 'exam', (SELECT id FROM "Course" WHERE code = 'CS303' LIMIT 1), 100, 25, NOW() + INTERVAL '3 weeks', NOW(), NOW()),
    ('assess-010', 'Presentation - ENG101', 'Technical presentation', 'presentation', (SELECT id FROM "Course" WHERE code = 'ENG101' LIMIT 1), 50, 20, NOW() + INTERVAL '1 week', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Get assessment IDs
  SELECT id INTO assessment1_id FROM "Assessment" WHERE title = 'Midterm Exam - CS101' LIMIT 1;
  SELECT id INTO assessment2_id FROM "Assessment" WHERE title = 'Assignment 1 - CS201' LIMIT 1;

  -- ═══════════════════════════════════════════════════════════════
  -- ASSESSMENT QUESTIONS (20 questions)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "AssessmentQuestion" (id, "assessmentId", question, type, points, "createdAt", "updatedAt") VALUES
    ('q-001', assessment1_id, 'What is the time complexity of binary search?', 'multiple_choice', 5, NOW(), NOW()),
    ('q-002', assessment1_id, 'Explain the difference between stack and queue.', 'short_answer', 10, NOW(), NOW()),
    ('q-003', assessment1_id, 'Write a function to reverse a linked list.', 'code', 15, NOW(), NOW()),
    ('q-004', assessment1_id, 'What are the principles of OOP?', 'essay', 20, NOW(), NOW()),
    ('q-005', assessment1_id, 'Convert the following binary to decimal: 1010.', 'short_answer', 5, NOW(), NOW()),
    ('q-006', assessment2_id, 'Implement a binary search tree in your preferred language.', 'code', 20, NOW(), NOW()),
    ('q-007', assessment2_id, 'Compare arrays and linked lists with time complexity analysis.', 'essay', 15, NOW(), NOW()),
    ('q-008', assessment2_id, 'Design a hash table with collision handling.', 'code', 15, NOW(), NOW()),
    ('q-009', (SELECT id FROM "Assessment" WHERE title = 'Quiz 1 - CS301' LIMIT 1), 'What is a primary key?', 'multiple_choice', 5, NOW(), NOW()),
    ('q-010', (SELECT id FROM "Assessment" WHERE title = 'Quiz 1 - CS301' LIMIT 1), 'Write a SQL query to find all students with GPA > 3.5.', 'code', 10, NOW(), NOW()),
    ('q-011', (SELECT id FROM "Assessment" WHERE title = 'Quiz 1 - CS301' LIMIT 1), 'Explain 3NF normalization.', 'short_answer', 5, NOW(), NOW()),
    ('q-012', (SELECT id FROM "Assessment" WHERE title = 'Final Project - CS401' LIMIT 1), 'Design an ML pipeline for image classification.', 'essay', 50, NOW(), NOW()),
    ('q-013', (SELECT id FROM "Assessment" WHERE title = 'Final Project - CS401' LIMIT 1), 'Implement a neural network from scratch.', 'code', 100, NOW(), NOW()),
    ('q-014', (SELECT id FROM "Assessment" WHERE title = 'Final Project - CS401' LIMIT 1), 'Write a research methodology section.', 'essay', 50, NOW(), NOW()),
    ('q-015', (SELECT id FROM "Assessment" WHERE title = 'Midterm Exam - MATH101' LIMIT 1), 'Find the derivative of f(x) = 3x^2 + 2x - 1.', 'short_answer', 10, NOW(), NOW()),
    ('q-016', (SELECT id FROM "Assessment" WHERE title = 'Midterm Exam - MATH101' LIMIT 1), 'Solve the integral of sin(x)dx.', 'short_answer', 10, NOW(), NOW()),
    ('q-017', (SELECT id FROM "Assessment" WHERE title = 'Quiz 2 - CS101' LIMIT 1), 'What is a variable?', 'multiple_choice', 5, NOW(), NOW()),
    ('q-018', (SELECT id FROM "Assessment" WHERE title = 'Quiz 2 - CS101' LIMIT 1), 'Write a for loop in Python.', 'code', 10, NOW(), NOW()),
    ('q-019', (SELECT id FROM "Assessment" WHERE title = 'Assignment 2 - CS201' LIMIT 1), 'Implement merge sort and analyze its complexity.', 'code', 25, NOW(), NOW()),
    ('q-020', (SELECT id FROM "Assessment" WHERE title = 'Assignment 2 - CS201' LIMIT 1), 'Explain dynamic programming with examples.', 'essay', 25, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- RESEARCH PROJECTS (5 projects)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "ResearchProject" (id, title, description, status, "leadId", "createdAt", "updatedAt") VALUES
    ('research-001', 'AI-Powered Student Analytics', 'Developing ML models for predicting student performance', 'active', faculty_user_id, NOW(), NOW()),
    ('research-002', 'Natural Language Processing for Arabic', 'NLP techniques for Arabic language processing', 'active', faculty_user_id, NOW(), NOW()),
    ('research-003', 'Blockchain for Academic Credentials', 'Using blockchain for verifiable academic records', 'completed', faculty_user_id, NOW(), NOW()),
    ('research-004', 'IoT Campus Management', 'Smart campus using IoT sensors and analytics', 'planning', faculty_user_id, NOW(), NOW()),
    ('research-005', 'Adaptive Learning Systems', 'Personalized learning paths using AI', 'active', faculty_user_id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- PUBLICATIONS (5 publications)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "Publication" (id, title, authors, journal, year, doi, "createdAt", "updatedAt") VALUES
    ('pub-001', 'Machine Learning in Higher Education: A Survey', 'Sarah Johnson, Ahmed Mohammed', 'Journal of EdTech', 2024, '10.1234/jet.2024.001', NOW(), NOW()),
    ('pub-002', 'Deep Learning for Student Performance Prediction', 'Sarah Johnson', 'AI in Education', 2024, '10.1234/aie.2024.002', NOW(), NOW()),
    ('pub-003', 'Blockchain-Based Credential Verification', 'Sarah Johnson, Mohammad Ali', 'IEEE Access', 2023, '10.1234/ieee.2023.003', NOW(), NOW()),
    ('pub-004', 'Arabic NLP: Challenges and Opportunities', 'Sarah Johnson', 'Computational Linguistics', 2024, '10.1234/cl.2024.004', NOW(), NOW()),
    ('pub-005', 'Smart Campus: An IoT Approach', 'Sarah Johnson, Omar Hassan', 'Smart Cities Journal', 2023, '10.1234/scj.2023.005', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- JOB OPENINGS (10 jobs)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "JobOpening" (id, title, company, description, location, type, salary, status, "createdAt", "updatedAt") VALUES
    ('job-001', 'Software Engineer', 'TechCorp', 'Full-stack development role', 'Riyadh, Saudi Arabia', 'full-time', '15000-25000 SAR', 'active', NOW(), NOW()),
    ('job-002', 'Data Scientist', 'DataInc', 'ML and analytics role', 'Jeddah, Saudi Arabia', 'full-time', '18000-30000 SAR', 'active', NOW(), NOW()),
    ('job-003', 'AI Engineer', 'AILab', 'Research and development', 'Dammam, Saudi Arabia', 'full-time', '20000-35000 SAR', 'active', NOW(), NOW()),
    ('job-004', 'Frontend Developer', 'WebStudio', 'React/Vue development', 'Remote', 'full-time', '12000-20000 SAR', 'active', NOW(), NOW()),
    ('job-005', 'DevOps Engineer', 'CloudOps', 'Infrastructure automation', 'Riyadh, Saudi Arabia', 'full-time', '16000-28000 SAR', 'active', NOW(), NOW()),
    ('job-006', 'Product Manager', 'ProductCo', 'Product strategy and execution', 'Riyadh, Saudi Arabia', 'full-time', '20000-35000 SAR', 'active', NOW(), NOW()),
    ('job-007', 'UX Designer', 'DesignHub', 'User experience design', 'Jeddah, Saudi Arabia', 'full-time', '10000-18000 SAR', 'active', NOW(), NOW()),
    ('job-008', 'Cybersecurity Analyst', 'SecureNet', 'Security operations', 'Riyadh, Saudi Arabia', 'full-time', '14000-24000 SAR', 'active', NOW(), NOW()),
    ('job-009', 'Mobile Developer', 'AppWorks', 'iOS/Android development', 'Remote', 'contract', '8000-15000 SAR', 'active', NOW(), NOW()),
    ('job-010', 'Database Administrator', 'DataCenter', 'Database management', 'Dammam, Saudi Arabia', 'full-time', '12000-22000 SAR', 'active', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- PORTFOLIO (1 portfolio with entries)
  -- ═══════════════════════════════════════════════════════════════
  
  IF student_id IS NOT NULL THEN
    INSERT INTO "Portfolio" (id, "studentId", title, description, "isPublic", "createdAt", "updatedAt") VALUES
      ('portfolio-001', student_id, 'My CS Portfolio', 'Showcasing my computer science projects and skills', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO "PortfolioEntry" (id, "portfolioId", title, description, type, url, "createdAt", "updatedAt") VALUES
      ('port-entry-001', 'portfolio-001', 'AI Chatbot Project', 'Built an AI-powered chatbot using NLP', 'project', 'https://github.com/ahmed/chatbot', NOW(), NOW()),
      ('port-entry-002', 'portfolio-001', 'Web Application', 'Full-stack e-commerce platform', 'project', 'https://github.com/ahmed/ecommerce', NOW(), NOW()),
      ('port-entry-003', 'portfolio-001', 'Data Analysis Report', 'COVID-19 data analysis with Python', 'document', 'https://docs.google.com/report', NOW(), NOW()),
      ('port-entry-004', 'portfolio-001', 'Mobile App', 'Fitness tracking mobile application', 'project', 'https://github.com/ahmed/fitness', NOW(), NOW()),
      ('port-entry-005', 'portfolio-001', 'Research Paper', 'Published paper on ML in education', 'publication', 'https://doi.org/10.1234/jet.2024.001', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- COMMUNITY POSTS (10 posts)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "CommunityPost" (id, title, content, author, category, "createdAt", "updatedAt") VALUES
    ('post-001', 'Welcome to iSCARB!', 'Welcome to the iSCARB community. This is a place for students, faculty, and staff to connect.', 'System', 'announcement', NOW(), NOW()),
    ('post-002', 'Study Group for CS201', 'Looking for study partners for Data Structures exam. We meet every Tuesday at 4pm.', 'Ahmed Mohammed', 'study-group', NOW(), NOW()),
    ('post-003', 'Hackathon Announcement', 'Annual hackathon happening next month! Register now.', 'Dr. Sarah Johnson', 'event', NOW(), NOW()),
    ('post-004', 'Career Fair 2025', 'Career fair with 50+ companies. Don''t miss it!', 'Career Services', 'event', NOW(), NOW()),
    ('post-005', 'AI Workshop', 'Free workshop on building AI models. Limited seats!', 'AI Lab', 'workshop', NOW(), NOW()),
    ('post-006', 'Scholarship Opportunity', 'Full scholarship for graduate studies. Apply before deadline.', 'Financial Aid', 'opportunity', NOW(), NOW()),
    ('post-007', 'Library Hours Extended', 'Library now open until midnight during exam period.', 'Library', 'announcement', NOW(), NOW()),
    ('post-008', 'New Coding Club', 'Join the new coding club! We practice LeetCode every Friday.', 'Omar Hassan', 'club', NOW(), NOW()),
    ('post-009', 'Internship Available', 'Summer internship at TechCorp. Apply now!', 'Recruiting', 'opportunity', NOW(), NOW()),
    ('post-010', 'Student Government Elections', 'Vote for your student government representatives!', 'Student Affairs', 'announcement', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- ANNOUNCEMENTS (10 announcements)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "Announcement" (id, title, content, author, priority, "createdAt", "updatedAt") VALUES
    ('announce-001', 'Registration Open for Spring 2025', 'Course registration for Spring 2025 semester is now open.', 'Registrar', 'high', NOW(), NOW()),
    ('announce-002', 'Midterm Schedule Posted', 'Midterm exam schedule has been posted. Check your courses.', 'Academic Affairs', 'high', NOW(), NOW()),
    ('announce-003', 'Campus Maintenance', 'Scheduled maintenance on Saturday. Some services may be unavailable.', 'Facilities', 'medium', NOW(), NOW()),
    ('announce-004', 'New Computer Lab Opening', 'New state-of-the-art computer lab opening next week.', 'IT Department', 'low', NOW(), NOW()),
    ('announce-005', 'Guest Lecture Series', 'Weekly guest lectures from industry professionals.', 'Dean''s Office', 'low', NOW(), NOW()),
    ('announce-006', 'Health Center Hours', 'Health center now open on Saturdays.', 'Health Services', 'medium', NOW(), NOW()),
    ('announce-007', 'Parking Lot Closure', 'Parking Lot B closed for resurfacing this week.', 'Facilities', 'medium', NOW(), NOW()),
    ('announce-008', 'Scholarship Deadline Reminder', 'Application deadline for merit scholarships is next Friday.', 'Financial Aid', 'high', NOW(), NOW()),
    ('announce-009', 'Career Workshop', 'Resume writing workshop this Thursday at 2pm.', 'Career Services', 'low', NOW(), NOW()),
    ('announce-010', 'Final Exam Schedule', 'Final exam schedule available on the student portal.', 'Academic Affairs', 'high', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- NOTIFICATIONS (10 notifications)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "Notification" (id, title, message, type, "userId", read, "createdAt", "updatedAt") VALUES
    ('notif-001', 'Welcome to iSCARB', 'Your account has been created successfully.', 'info', student_user_id, false, NOW(), NOW()),
    ('notif-002', 'Assignment Due', 'CS201 Assignment 1 is due in 3 days.', 'warning', student_user_id, false, NOW(), NOW()),
    ('notif-003', 'Grade Posted', 'Your CS101 midterm grade has been posted.', 'success', student_user_id, true, NOW(), NOW()),
    ('notif-004', 'New Message', 'You have a new message from Dr. Johnson.', 'info', student_user_id, false, NOW(), NOW()),
    ('notif-005', 'Event Reminder', 'Hackathon registration closes tomorrow.', 'info', student_user_id, false, NOW(), NOW()),
    ('notif-006', 'Course Update', 'CS301 lecture notes have been uploaded.', 'info', student_user_id, true, NOW(), NOW()),
    ('notif-007', 'Payment Due', 'Tuition payment for Spring 2025 is due.', 'warning', student_user_id, false, NOW(), NOW()),
    ('notif-008', 'Achievement Unlocked', 'You earned the "Fast Learner" badge!', 'success', student_user_id, false, NOW(), NOW()),
    ('notif-009', 'System Maintenance', 'Scheduled maintenance this weekend.', 'info', student_user_id, true, NOW(), NOW()),
    ('notif-010', 'New Opportunity', 'A new job matching your skills has been posted.', 'info', student_user_id, false, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- HABITS (5 habits)
  -- ═══════════════════════════════════════════════════════════════
  
  IF student_id IS NOT NULL THEN
    INSERT INTO "HabitTracker" (id, "studentId", name, description, frequency, target, "createdAt", "updatedAt") VALUES
      ('habit-001', student_id, 'Study 2 Hours Daily', 'Spend at least 2 hours studying each day', 'daily', 2, NOW(), NOW()),
      ('habit-002', student_id, 'Exercise 30 Minutes', 'Physical activity for 30 minutes', 'daily', 30, NOW(), NOW()),
      ('habit-003', student_id, 'Read 20 Pages', 'Read academic or professional material', 'daily', 20, NOW(), NOW()),
      ('habit-004', student_id, 'Practice Coding', 'Solve at least 1 coding problem', 'daily', 1, NOW(), NOW()),
      ('habit-005', student_id, 'Review Notes', 'Review lecture notes from the day', 'daily', 1, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- GOALS (5 goals)
  -- ═══════════════════════════════════════════════════════════════
  
  IF student_id IS NOT NULL THEN
    INSERT INTO "GoalTracking" (id, "studentId", title, description, category, progress, status, "targetDate", "createdAt", "updatedAt") VALUES
      ('goal-001', student_id, 'Achieve 3.8 GPA', 'Maintain a GPA of 3.8 or higher this semester', 'academic', 65, 'in_progress', NOW() + INTERVAL '4 months', NOW(), NOW()),
      ('goal-002', student_id, 'Complete 3 Projects', 'Finish 3 portfolio projects this semester', 'academic', 33, 'in_progress', NOW() + INTERVAL '3 months', NOW(), NOW()),
      ('goal-003', student_id, 'Learn Machine Learning', 'Complete ML course and build a project', 'learning', 40, 'in_progress', NOW() + INTERVAL '6 months', NOW(), NOW()),
      ('goal-004', student_id, 'Get Internship', 'Secure a summer internship position', 'career', 20, 'in_progress', NOW() + INTERVAL '3 months', NOW(), NOW()),
      ('goal-005', student_id, 'Build Professional Network', 'Connect with 50 professionals on LinkedIn', 'personal', 60, 'in_progress', NOW() + INTERVAL '2 months', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- SKILL PROGRESS (10 skills)
  -- ═══════════════════════════════════════════════════════════════
  
  IF student_id IS NOT NULL THEN
    INSERT INTO "SkillProgress" (id, "studentId", skill, level, "maxLevel", "createdAt", "updatedAt") VALUES
      ('skill-001', student_id, 'Python', 85, 100, NOW(), NOW()),
      ('skill-002', student_id, 'JavaScript', 75, 100, NOW(), NOW()),
      ('skill-003', student_id, 'SQL', 70, 100, NOW(), NOW()),
      ('skill-004', student_id, 'Machine Learning', 60, 100, NOW(), NOW()),
      ('skill-005', student_id, 'Data Structures', 80, 100, NOW(), NOW()),
      ('skill-006', student_id, 'React', 65, 100, NOW(), NOW()),
      ('skill-007', student_id, 'Git', 90, 100, NOW(), NOW()),
      ('skill-008', student_id, 'Communication', 75, 100, NOW(), NOW()),
      ('skill-009', student_id, 'Problem Solving', 85, 100, NOW(), NOW()),
      ('skill-010', student_id, 'Teamwork', 80, 100, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- BADGES (10 badges)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "Badge" (id, name, description, icon, "createdAt", "updatedAt") VALUES
    ('badge-001', 'Fast Learner', 'Complete 5 courses in one semester', 'fast-learner', NOW(), NOW()),
    ('badge-002', 'Code Master', 'Solve 100 coding challenges', 'code-master', NOW(), NOW()),
    ('badge-003', 'Team Player', 'Collaborate on 5 group projects', 'team-player', NOW(), NOW()),
    ('badge-004', 'Research Star', 'Publish a research paper', 'research-star', NOW(), NOW()),
    ('badge-005', 'Perfect Score', 'Get 100% on any assessment', 'perfect-score', NOW(), NOW()),
    ('badge-006', 'Streak Master', 'Maintain a 30-day study streak', 'streak-master', NOW(), NOW()),
    ('badge-007', 'Community Helper', 'Answer 50 community questions', 'community-helper', NOW(), NOW()),
    ('badge-008', 'Innovation Award', 'Win a hackathon or competition', 'innovation', NOW(), NOW()),
    ('badge-009', 'Mentor', 'Help 10 junior students', 'mentor', NOW(), NOW()),
    ('badge-010', 'GPA Champion', 'Achieve a GPA above 3.9', 'gpa-champion', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- AI MODELS (5 AI models)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "AiModel" (id, name, description, provider, version, status, "createdAt", "updatedAt") VALUES
    ('ai-model-001', 'GPT-4', 'Large language model for AI assistant', 'OpenAI', '4.0', 'active', NOW(), NOW()),
    ('ai-model-002', 'Claude-3', 'Conversational AI for tutoring', 'Anthropic', '3.0', 'active', NOW(), NOW()),
    ('ai-model-003', 'Gemini Pro', 'Multimodal AI for content generation', 'Google', '1.0', 'active', NOW(), NOW()),
    ('ai-model-004', 'Llama-3', 'Open-source LLM for research', 'Meta', '3.0', 'active', NOW(), NOW()),
    ('ai-model-005', 'Mistral-7B', 'Efficient LLM for local deployment', 'Mistral', '7B', 'active', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- API KEYS (5 API keys)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "ApiKey" (id, name, key, "userId", status, "createdAt", "updatedAt") VALUES
    ('apikey-001', 'Development Key', 'dev_key_' || md5(random()::text), developer_user_id, 'active', NOW(), NOW()),
    ('apikey-002', 'Testing Key', 'test_key_' || md5(random()::text), developer_user_id, 'active', NOW(), NOW()),
    ('apikey-003', 'Production Key', 'prod_key_' || md5(random()::text), itops_user_id, 'active', NOW(), NOW()),
    ('apikey-004', 'Analytics Key', 'analytics_key_' || md5(random()::text), admin_user_id, 'active', NOW(), NOW()),
    ('apikey-005', 'Legacy Key', 'legacy_key_' || md5(random()::text), admin_user_id, 'revoked', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- AUDIT LOGS (10 audit entries)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "AuditLog" (id, action, resource, "userId", details, "createdAt") VALUES
    ('audit-001', 'login', 'auth', student_user_id, '{"ip": "192.168.1.100", "browser": "Chrome"}', NOW()),
    ('audit-002', 'view', 'course', student_user_id, '{"courseId": "course-001"}', NOW()),
    ('audit-003', 'submit', 'assessment', student_user_id, '{"assessmentId": "assess-002"}', NOW()),
    ('audit-004', 'create', 'portfolio', student_user_id, '{"portfolioId": "portfolio-001"}', NOW()),
    ('audit-005', 'update', 'profile', student_user_id, '{"field": "bio"}', NOW()),
    ('audit-006', 'login', 'auth', faculty_user_id, '{"ip": "192.168.1.101", "browser": "Firefox"}', NOW()),
    ('audit-007', 'create', 'assessment', faculty_user_id, '{"assessmentId": "assess-001"}', NOW()),
    ('audit-008', 'login', 'auth', admin_user_id, '{"ip": "192.168.1.102", "browser": "Safari"}', NOW()),
    ('audit-009', 'update', 'settings', admin_user_id, '{"setting": "registration"}', NOW()),
    ('audit-010', 'export', 'report', admin_user_id, '{"reportType": "analytics"}', NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- WELLBEING (5 wellbeing entries)
  -- ═══════════════════════════════════════════════════════════════
  
  IF student_id IS NOT NULL THEN
    INSERT INTO "Wellbeing" (id, "studentId", mood, stress, energy, sleep, notes, "createdAt") VALUES
      ('well-001', student_id, 4, 3, 4, 7, 'Feeling good after completing assignment', NOW() - INTERVAL '6 days'),
      ('well-002', student_id, 3, 4, 3, 6, 'Stressed about upcoming exams', NOW() - INTERVAL '5 days'),
      ('well-003', student_id, 5, 2, 5, 8, 'Great day! Finished project ahead of deadline', NOW() - INTERVAL '4 days'),
      ('well-004', student_id, 4, 3, 4, 7, 'Normal day, productive study session', NOW() - INTERVAL '3 days'),
      ('well-005', student_id, 3, 4, 3, 5, 'Tired from late night studying', NOW() - INTERVAL '2 days')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- COMPETENCY DEFINITIONS (10 competencies)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "CompetencyDefinition" (id, name, description, category, level, "createdAt", "updatedAt") VALUES
    ('comp-001', 'Programming', 'Ability to write and debug code', 'technical', 'advanced', NOW(), NOW()),
    ('comp-002', 'Data Analysis', 'Ability to analyze and interpret data', 'technical', 'intermediate', NOW(), NOW()),
    ('comp-003', 'System Design', 'Ability to design software systems', 'technical', 'intermediate', NOW(), NOW()),
    ('comp-004', 'Communication', 'Ability to communicate effectively', 'soft', 'advanced', NOW(), NOW()),
    ('comp-005', 'Teamwork', 'Ability to work in teams', 'soft', 'advanced', NOW(), NOW()),
    ('comp-006', 'Problem Solving', 'Ability to solve complex problems', 'soft', 'advanced', NOW(), NOW()),
    ('comp-007', 'Leadership', 'Ability to lead and motivate others', 'soft', 'intermediate', NOW(), NOW()),
    ('comp-008', 'Time Management', 'Ability to manage time effectively', 'soft', 'intermediate', NOW(), NOW()),
    ('comp-009', 'Critical Thinking', 'Ability to analyze and evaluate information', 'soft', 'advanced', NOW(), NOW()),
    ('comp-010', 'Creativity', 'Ability to think innovatively', 'soft', 'intermediate', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- INTEGRATIONS (5 integrations)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "Integration" (id, name, type, status, config, "createdAt", "updatedAt") VALUES
    ('int-001', 'Google Calendar', 'calendar', 'active', '{"apiKey": "xxx"}', NOW(), NOW()),
    ('int-002', 'Slack', 'messaging', 'active', '{"webhook": "xxx"}', NOW(), NOW()),
    ('int-003', 'GitHub', 'version_control', 'active', '{"token": "xxx"}', NOW(), NOW()),
    ('int-004', 'Zoom', 'video', 'inactive', '{"apiKey": "xxx"}', NOW(), NOW()),
    ('int-005', 'Stripe', 'payment', 'active', '{"secretKey": "xxx"}', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- MESSAGES (10 messages)
  -- ═══════════════════════════════════════════════════════════════
  
  INSERT INTO "Message" (id, subject, content, "senderId", "receiverId", read, "createdAt", "updatedAt") VALUES
    ('msg-001', 'Welcome', 'Welcome to iSCARB! Let us know if you need help.', admin_user_id, student_user_id, true, NOW(), NOW()),
    ('msg-002', 'Assignment Help', 'I need help with the data structures assignment.', student_user_id, faculty_user_id, false, NOW(), NOW()),
    ('msg-003', 'Office Hours', 'My office hours are Tuesday and Thursday 2-4pm.', faculty_user_id, student_user_id, true, NOW(), NOW()),
    ('msg-004', 'Job Opportunity', 'A new position matches your profile.', recruiter_user_id, student_user_id, false, NOW(), NOW()),
    ('msg-005', 'Interview Schedule', 'Your interview is scheduled for next Monday.', recruiter_user_id, student_user_id, false, NOW(), NOW()),
    ('msg-006', 'Grade Inquiry', 'When will midterm grades be posted?', student_user_id, faculty_user_id, false, NOW(), NOW()),
    ('msg-007', 'Project Feedback', 'Great work on the AI project!', faculty_user_id, student_user_id, false, NOW(), NOW()),
    ('msg-008', 'System Update', 'Scheduled maintenance this weekend.', itops_user_id, student_user_id, true, NOW(), NOW()),
    ('msg-009', 'Portfolio Review', 'I reviewed your portfolio. Nice work!', faculty_user_id, student_user_id, false, NOW(), NOW()),
    ('msg-010', 'Internship Offer', 'Congratulations! You received an offer.', employer_user_id, student_user_id, false, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'All seed data inserted successfully!';
END;
$$;
