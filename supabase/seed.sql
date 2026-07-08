-- ============================================================================
-- Seed faculties, departments, chat rooms, and a few sample courses.
-- Run after schema.sql. Safe to re-run (uses upsert-style guards).
-- ============================================================================

-- Faculties -----------------------------------------------------------------
insert into public.faculties (abbreviation, name) values
  ('SAFNR', 'School of Agriculture, Food and Natural Resources'),
  ('SONAHS', 'School of Nursing and Allied Health Sciences'),
  ('SEET', 'School of Engineering and Engineering Technology'),
  ('SES', 'School of Earth Sciences'),
  ('SOS', 'School of Sciences'),
  ('SOC', 'School of Computing'),
  ('SMS', 'School of Management Sciences')
on conflict (abbreviation) do nothing;

-- Departments ---------------------------------------------------------------
insert into public.departments (faculty_id, name)
select f.id, d.name from public.faculties f
join (values
  ('SAFNR', 'Agricultural Economics and Extension'),
  ('SAFNR', 'Animal Production and Health'),
  ('SAFNR', 'Crop, Soil and Pest Management'),
  ('SAFNR', 'Fisheries and Aquaculture Technology'),
  ('SAFNR', 'Food Science and Technology'),
  ('SAFNR', 'Forestry, Wildlife and Environmental Management'),
  ('SONAHS', 'Nursing Science'),
  ('SONAHS', 'Medical Laboratory Science'),
  ('SONAHS', 'Public Health Science'),
  ('SEET', 'Civil Engineering'),
  ('SEET', 'Chemical Engineering'),
  ('SEET', 'Electrical and Electronics Engineering'),
  ('SEET', 'Mechanical Engineering'),
  ('SEET', 'Petroleum and Gas Engineering'),
  ('SES', 'Marine Science'),
  ('SES', 'Meteorology'),
  ('SES', 'Geology'),
  ('SES', 'Applied Geophysics'),
  ('SOS', 'Biochemistry'),
  ('SOS', 'Microbiology'),
  ('SOS', 'Industrial Chemistry'),
  ('SOS', 'Physics'),
  ('SOS', 'Mathematics'),
  ('SOS', 'Statistics'),
  ('SOS', 'Environmental Management and Toxicology'),
  ('SOC', 'Computer Science'),
  ('SOC', 'Software Engineering'),
  ('SOC', 'Cyber Security'),
  ('SOC', 'Information Technology'),
  ('SMS', 'Accounting'),
  ('SMS', 'Business Administration'),
  ('SMS', 'Economics')
) as d(abbr, name) on d.abbr = f.abbreviation
on conflict (faculty_id, name) do nothing;

-- One chat room per department ---------------------------------------------
insert into public.chats (department_id)
select id from public.departments
on conflict (department_id) do nothing;

-- Sample courses for Computer Science (illustrative) -------------------------
insert into public.courses (department_id, level, semester, course_code, course_title)
select d.id, c.level, c.semester, c.course_code, c.course_title
from public.departments d
join (values
  (100, 'First Semester', 'CSC101', 'Introduction to Computer Science'),
  (100, 'Second Semester', 'CSC102', 'Introduction to Programming'),
  (200, 'First Semester', 'CSC201', 'Data Structures'),
  (200, 'Second Semester', 'CSC202', 'Object-Oriented Programming'),
  (300, 'First Semester', 'CSC301', 'Algorithms'),
  (300, 'Second Semester', 'CSC302', 'Operating Systems'),
  (400, 'First Semester', 'CSC401', 'Software Engineering'),
  (400, 'Second Semester', 'CSC402', 'Artificial Intelligence'),
  (500, 'First Semester', 'CSC501', 'Distributed Systems'),
  (500, 'Second Semester', 'CSC502', 'Final Year Project')
) as c(level, semester, course_code, course_title) on true
where d.name = 'Computer Science'
on conflict do nothing;

-- To make yourself an admin after signing up, run:
--   update public.users set role = 'admin' where email = 'you@example.com';
