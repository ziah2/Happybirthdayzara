// Faculty / Department hierarchy — build spec Section 1.
// Levels are always 100–500 for every department (no exceptions).

export interface FacultySeed {
  abbreviation: string;
  name: string;
  icon: string;
  departments: string[];
}

export const LEVELS = [100, 200, 300, 400, 500] as const;
export type Level = (typeof LEVELS)[number];

export const SEMESTERS = ['First Semester', 'Second Semester'] as const;

export const FACULTIES: FacultySeed[] = [
  {
    abbreviation: 'SAFNR',
    name: 'School of Agriculture, Food and Natural Resources',
    icon: '🌾',
    departments: [
      'Agricultural Economics and Extension',
      'Animal Production and Health',
      'Crop, Soil and Pest Management',
      'Fisheries and Aquaculture Technology',
      'Food Science and Technology',
      'Forestry, Wildlife and Environmental Management',
    ],
  },
  {
    abbreviation: 'SONAHS',
    name: 'School of Nursing and Allied Health Sciences',
    icon: '🩺',
    departments: ['Nursing Science', 'Medical Laboratory Science', 'Public Health Science'],
  },
  {
    abbreviation: 'SEET',
    name: 'School of Engineering and Engineering Technology',
    icon: '⚙️',
    departments: [
      'Civil Engineering',
      'Chemical Engineering',
      'Electrical and Electronics Engineering',
      'Mechanical Engineering',
      'Petroleum and Gas Engineering',
    ],
  },
  {
    abbreviation: 'SES',
    name: 'School of Earth Sciences',
    icon: '🌍',
    departments: ['Marine Science', 'Meteorology', 'Geology', 'Applied Geophysics'],
  },
  {
    abbreviation: 'SOS',
    name: 'School of Sciences',
    icon: '🔬',
    departments: [
      'Biochemistry',
      'Microbiology',
      'Industrial Chemistry',
      'Physics',
      'Mathematics',
      'Statistics',
      'Environmental Management and Toxicology',
    ],
  },
  {
    abbreviation: 'SOC',
    name: 'School of Computing',
    icon: '💻',
    departments: ['Computer Science', 'Software Engineering', 'Cyber Security', 'Information Technology'],
  },
  {
    abbreviation: 'SMS',
    name: 'School of Management Sciences',
    icon: '📊',
    departments: ['Accounting', 'Business Administration', 'Economics'],
  },
];

export const NEWS_CATEGORIES = [
  'Academic',
  'SUG',
  'Faculty',
  'Department',
  'Scholarships',
  'Internships',
  'Events',
  'General',
] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const NOTE_CATEGORIES = [
  { key: 'lecture_note', label: 'Lecture Notes', icon: '📄' },
  { key: 'past_question', label: 'Past Questions', icon: '📝' },
  { key: 'assignment', label: 'Assignments', icon: '📋' },
  { key: 'powerpoint', label: 'PowerPoints', icon: '📊' },
] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number]['key'];

export const UPLOAD_ACCEPT = '.pdf,.docx,.doc,.ppt,.pptx,.png,.jpg,.jpeg,.zip';

// Leadership positions — build spec Section 2. Display/informational only.
export const LEADERSHIP_POSITIONS: { group: string; roles: string[] }[] = [
  { group: 'Class-level', roles: ['Class Representative (Course Rep)', 'Assistant Class Representative'] },
  {
    group: 'Departmental Association Executive',
    roles: [
      'President',
      'Vice President',
      'General Secretary',
      'Assistant General Secretary',
      'Financial Secretary',
      'Treasurer',
      'Public Relations Officer (PRO)',
      'Social Director',
      'Welfare Director',
      'Sports Director',
    ],
  },
  {
    group: 'Faculty/School Association Executive',
    roles: [
      'President',
      'Vice President',
      'Secretary',
      'Treasurer',
      'PRO',
      'Welfare Director',
      'Social Director',
      'Sports Director',
    ],
  },
  { group: "Students' Representative Council (SRC)", roles: ['Member'] },
  {
    group: "Students' Union Government (SUG) Executive",
    roles: [
      'President',
      'Vice President',
      'General Secretary',
      'Assistant General Secretary',
      'Treasurer',
      'Financial Secretary',
      'PRO',
      'Welfare Director',
      'Social Director',
      'Sports Director',
    ],
  },
  { group: 'Other', roles: ['Lecturer'] },
];

export const ROADMAP_FEATURES = [
  { icon: '🤖', title: 'AI Study Assistant' },
  { icon: '🎯', title: 'GPA Calculator' },
  { icon: '🗓️', title: 'Timetable' },
  { icon: '⏳', title: 'Exam Countdown' },
  { icon: '🧪', title: 'CBT Practice Mode' },
  { icon: '✅', title: 'Attendance Tracker' },
  { icon: '🔔', title: 'Assignment Reminders' },
  { icon: '🛒', title: 'Student Marketplace' },
  { icon: '🔎', title: 'Lost & Found Board' },
  { icon: '🏠', title: 'Hostel Listings' },
  { icon: '🤫', title: 'Anonymous Confessions' },
  { icon: '📅', title: 'Event Calendar' },
];
