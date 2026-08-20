-- ═══════════════════════════════════════════════════════════════════
-- iSCARB COMPREHENSIVE SEED DATA
-- Seeds all major tables with relationally consistent data
-- ═══════════════════════════════════════════════════════════════════

-- Get existing IDs
DO $$
DECLARE
  org_id TEXT;
  user_student TEXT;
  user_faculty TEXT;
  user_admin TEXT;
  user_sysadmin TEXT;
  user_itops TEXT;
  user_recruiter TEXT;
  user_employer TEXT;
  user_developer TEXT;
  student_rec_id TEXT;
  faculty_rec_id TEXT;
  dept_id TEXT;
BEGIN
  -- Get existing user IDs
  SELECT id INTO user_student FROM "User" WHERE email = 'student@iscarb.edu' LIMIT 1;
  SELECT id INTO user_faculty FROM "User" WHERE email = 'faculty@iscarb.edu' LIMIT 1;
  SELECT id INTO user_admin FROM "User" WHERE email = 'admin@iscarb.edu' LIMIT 1;
  SELECT id INTO user_sysadmin FROM "User" WHERE email = 'sysadmin@iscarb.edu' LIMIT 1;
  SELECT id INTO user_itops FROM "User" WHERE email = 'itops@iscarb.edu' LIMIT 1;
  SELECT id INTO user_recruiter FROM "User" WHERE email = 'recruiter@iscarb.edu' LIMIT 1;
  SELECT id INTO user_employer FROM "User" WHERE email = 'employer@iscarb.edu' LIMIT 1;
  SELECT id INTO user_developer FROM "User" WHERE email = 'developer@iscarb.edu' LIMIT 1;
  SELECT id INTO org_id FROM "Organization" LIMIT 1;

  -- ═══════════════════════════════════════════════════════════════
  -- DEPARTMENTS
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO "Department" (id, name, "organizationId", "createdAt", "updatedAt") VALUES
    ('dept-cs', 'Computer Science', org_id, NOW(), NOW()),
    ('dept-eng', 'Engineering', org_id, NOW(), NOW()),
    ('dept-biz', 'Business', org_id, NOW(), NOW()),
    ('dept-med', 'Medicine', org_id, NOW(), NOW()),
    ('dept-law', 'Law', org_id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO dept_id;

  IF dept_id IS NULL THEN
    SELECT id INTO dept_id FROM "Department" WHERE name = 'Computer Science' LIMIT 1;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- FACULTY RECORDS
  -- ═══════════════════════════════════════════════════════════════
  IF user_faculty IS NOT NULL THEN
    INSERT INTO "Faculty" (id, name, email, department, rank, "userId", "createdAt") VALUES
      ('fac-001', 'Dr. Sarah Johnson', 'faculty@iscarb.edu', 'Computer Science', 'Professor', user_faculty, NOW()),
      ('fac-002', 'Dr. Ahmad Hassan', 'ahmad@iscarb.edu', 'Engineering', 'Associate Professor', user_faculty, NOW()),
      ('fac-003', 'Dr. Fatima Al-Rashid', 'fatima@iscarb.edu', 'Business', 'Assistant Professor', user_faculty, NOW()),
      ('fac-004', 'Dr. Omar Khan', 'omar@iscarb.edu', 'Medicine', 'Professor', user_faculty, NOW()),
      ('fac-005', 'Dr. Layla Mansour', 'layla@iscarb.edu', 'Law', 'Associate Professor', user_faculty, NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- STUDENT RECORDS
  -- ═══════════════════════════════════════════════════════════════
  IF user_student IS NOT NULL THEN
    INSERT INTO "Student" (id, name, email, gpa, semester, "createdAt") VALUES
      ('stu-001', 'Ahmed Mohammed', 'student@iscarb.edu', 3.75, 5, NOW()),
      ('stu-002', 'Sara Al-Otaibi', 'sara@iscarb.edu', 3.90, 3, NOW()),
      ('stu-003', 'Khalid Nasser', 'khalid@iscarb.edu', 3.20, 7, NOW()),
      ('stu-004', 'Noura Salem', 'noura@iscarb.edu', 3.55, 4, NOW()),
      ('stu-005', 'Yusuf Ali', 'yusuf@iscarb.edu', 3.80, 6, NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- ASSESSMENTS
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO "Assessment" (id, "universityId", title, description, status, "randomizeQuestions", "randomizeAnswers", "passPercentage", "createdBy", "createdAt") VALUES
    ('assess-001', org_id, 'Midterm Exam - CS101', 'Midterm for Introduction to CS', 'published', false, false, 60, user_faculty, NOW()),
    ('assess-002', org_id, 'Assignment 1 - Data Structures', 'Data structures implementation', 'published', false, false, 70, user_faculty, NOW()),
    ('assess-003', org_id, 'Quiz 1 - Database Systems', 'Database fundamentals quiz', 'published', true, true, 50, user_faculty, NOW()),
    ('assess-004', org_id, 'Final Project - AI', 'AI project implementation', 'draft', false, false, 60, user_faculty, NOW()),
    ('assess-005', org_id, 'Lab Report - Networks', 'Network configuration practical', 'published', false, false, 60, user_faculty, NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- RESEARCH PROJECTS
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO "ResearchProject" (id, title, description, status, "createdAt") VALUES
    ('research-001', 'AI-Powered Student Analytics', 'ML models for predicting student performance', 'active', NOW()),
    ('research-002', 'NLP for Arabic Text', 'Arabic language processing techniques', 'active', NOW()),
    ('research-003', 'Blockchain Credentials', 'Verifiable academic records using blockchain', 'completed', NOW()),
    ('research-004', 'IoT Campus Management', 'Smart campus using IoT sensors', 'planning', NOW()),
    ('research-005', 'Adaptive Learning', 'Personalized learning paths using AI', 'active', NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- PUBLICATIONS
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO "Publication" (id, title, authors, journal, year, "createdAt") VALUES
    ('pub-001', 'ML in Higher Education: Survey', 'Sarah Johnson, Ahmed Mohammed', 'Journal of EdTech', 2024, NOW()),
    ('pub-002', 'Deep Learning for Student Performance', 'Sarah Johnson', 'AI in Education', 2024, NOW()),
    ('pub-003', 'Blockchain Credential Verification', 'Sarah Johnson, Mohammad Ali', 'IEEE Access', 2023, NOW()),
    ('pub-004', 'Arabic NLP Challenges', 'Sarah Johnson', 'Computational Linguistics', 2024, NOW()),
    ('pub-005', 'Smart Campus IoT Approach', 'Sarah Johnson, Omar Hassan', 'Smart Cities Journal', 2023, NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- JOB OPENINGS
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO "JobOpening" (id, "employerId", employer, title, description, "requiredCompetencies", "salaryMin", "salaryMax", location, status, "focusAreasJson", "createdAt", "updatedAt") VALUES
    ('job-001', 'emp-001', 'TechCorp', 'Software Engineer', 'Full-stack development', '["JavaScript","React","Node.js"]', 15000, 25000, 'Riyadh', 'active', '[]', NOW(), NOW()),
    ('job-002', 'emp-002', 'DataInc', 'Data Scientist', 'ML and analytics', '["Python","ML","SQL"]', 18000, 30000, 'Jeddah', 'active', '[]', NOW(), NOW()),
    ('job-003', 'emp-003', 'AILab', 'AI Engineer', 'Research and development', '["Python","TensorFlow","PyTorch"]', 20000, 35000, 'Dammam', 'active', '[]', NOW(), NOW()),
    ('job-004', 'emp-004', 'WebStudio', 'Frontend Developer', 'React/Vue development', '["React","Vue","TypeScript"]', 12000, 20000, 'Remote', 'active', '[]', NOW(), NOW()),
    ('job-005', 'emp-005', 'CloudOps', 'DevOps Engineer', 'Infrastructure automation', '["Docker","Kubernetes","AWS"]', 16000, 28000, 'Riyadh', 'active', '[]', NOW(), NOW()),
    ('job-006', 'emp-006', 'ProductCo', 'Product Manager', 'Product strategy', '["Agile","Analytics","Leadership"]', 20000, 35000, 'Riyadh', 'active', '[]', NOW(), NOW()),
    ('job-007', 'emp-007', 'DesignHub', 'UX Designer', 'User experience design', '["Figma","UI/UX","Prototyping"]', 10000, 18000, 'Jeddah', 'active', '[]', NOW(), NOW()),
    ('job-008', 'emp-008', 'SecureNet', 'Cybersecurity Analyst', 'Security operations', '["Security","Networking","SIEM"]', 14000, 24000, 'Riyadh', 'active', '[]', NOW(), NOW()),
    ('job-009', 'emp-009', 'AppWorks', 'Mobile Developer', 'iOS/Android development', '["React Native","Swift","Kotlin"]', 8000, 15000, 'Remote', 'active', '[]', NOW(), NOW()),
    ('job-010', 'emp-010', 'DataCenter', 'Database Administrator', 'Database management', '["SQL","PostgreSQL","MongoDB"]', 12000, 22000, 'Dammam', 'active', '[]', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- COMMUNITY POSTS
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO "CommunityPost" (id, title, content, author, category, "createdAt", "updatedAt") VALUES
    ('post-001', 'Welcome to iSCARB!', 'Welcome to the community platform.', 'System', 'announcement', NOW(), NOW()),
    ('post-002', 'Study Group CS201', 'Looking for study partners for Data Structures.', 'Ahmed Mohammed', 'study-group', NOW(), NOW()),
    ('post-003', 'Hackathon Announcement', 'Annual hackathon next month!', 'Dr. Sarah Johnson', 'event', NOW(), NOW()),
    ('post-004', 'Career Fair 2025', 'Career fair with 50+ companies.', 'Career Services', 'event', NOW(), NOW()),
    ('post-005', 'AI Workshop', 'Free workshop on building AI models.', 'AI Lab', 'workshop', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- ANNOUNCEMENTS
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO "Announcement" (id, title, content, author, priority, "createdAt", "updatedAt") VALUES
    ('ann-001', 'Registration Open', 'Spring 2025 registration is now open.', 'Registrar', 'high', NOW(), NOW()),
    ('ann-002', 'Midterm Schedule', 'Midterm exam schedule posted.', 'Academic Affairs', 'high', NOW(), NOW()),
    ('ann-003', 'Campus Maintenance', 'Scheduled maintenance this Saturday.', 'Facilities', 'medium', NOW(), NOW()),
    ('ann-004', 'New Computer Lab', 'New lab opening next week.', 'IT Department', 'low', NOW(), NOW()),
    ('ann-005', 'Guest Lecture', 'Weekly guest lectures from industry.', 'Dean Office', 'low', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- AI MODELS
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO "AiModel" (id, name, description, provider, version, status, "createdAt", "updatedAt") VALUES
    ('ai-001', 'GPT-4', 'Large language model', 'OpenAI', '4.0', 'active', NOW(), NOW()),
    ('ai-002', 'Claude-3', 'Conversational AI', 'Anthropic', '3.0', 'active', NOW(), NOW()),
    ('ai-003', 'Gemini Pro', 'Multimodal AI', 'Google', '1.0', 'active', NOW(), NOW()),
    ('ai-004', 'Llama-3', 'Open-source LLM', 'Meta', '3.0', 'active', NOW(), NOW()),
    ('ai-005', 'Mistral-7B', 'Efficient LLM', 'Mistral', '7B', 'active', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- INTEGRATIONS
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO "Integration" (id, name, type, status, "createdAt", "updatedAt") VALUES
    ('int-001', 'Google Calendar', 'calendar', 'active', NOW(), NOW()),
    ('int-002', 'Slack', 'messaging', 'active', NOW(), NOW()),
    ('int-003', 'GitHub', 'version_control', 'active', NOW(), NOW()),
    ('int-004', 'Zoom', 'video', 'inactive', NOW(), NOW()),
    ('int-005', 'Stripe', 'payment', 'active', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- SKILL PROGRESS
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO "SkillProgress" (id, skill, level, "maxLevel", "createdAt", "updatedAt") VALUES
    ('skill-001', 'Python', 85, 100, NOW(), NOW()),
    ('skill-002', 'JavaScript', 75, 100, NOW(), NOW()),
    ('skill-003', 'SQL', 70, 100, NOW(), NOW()),
    ('skill-004', 'Machine Learning', 60, 100, NOW(), NOW()),
    ('skill-005', 'Data Structures', 80, 100, NOW(), NOW()),
    ('skill-006', 'React', 65, 100, NOW(), NOW()),
    ('skill-007', 'Git', 90, 100, NOW(), NOW()),
    ('skill-008', 'Communication', 75, 100, NOW(), NOW()),
    ('skill-009', 'Problem Solving', 85, 100, NOW(), NOW()),
    ('skill-010', 'Teamwork', 80, 100, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- BADGES
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO "Badge" (id, name, description, icon, "createdAt", "updatedAt") VALUES
    ('badge-001', 'Fast Learner', 'Complete 5 courses in one semester', 'fast-learner', NOW(), NOW()),
    ('badge-002', 'Code Master', 'Solve 100 coding challenges', 'code-master', NOW(), NOW()),
    ('badge-003', 'Team Player', 'Collaborate on 5 group projects', 'team-player', NOW(), NOW()),
    ('badge-004', 'Research Star', 'Publish a research paper', 'research-star', NOW(), NOW()),
    ('badge-005', 'Perfect Score', 'Get 100% on any assessment', 'perfect-score', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- GOALS
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO "GoalTracking" (id, title, description, category, progress, status, "createdAt", "updatedAt") VALUES
    ('goal-001', 'Achieve 3.8 GPA', 'Maintain high GPA this semester', 'academic', 65, 'in_progress', NOW(), NOW()),
    ('goal-002', 'Complete 3 Projects', 'Finish portfolio projects', 'academic', 33, 'in_progress', NOW(), NOW()),
    ('goal-003', 'Learn Machine Learning', 'Complete ML course', 'learning', 40, 'in_progress', NOW(), NOW()),
    ('goal-004', 'Get Internship', 'Secure summer internship', 'career', 20, 'in_progress', NOW(), NOW()),
    ('goal-005', 'Build Network', 'Connect with 50 professionals', 'personal', 60, 'in_progress', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Seed data inserted successfully!';
END;
$$;
