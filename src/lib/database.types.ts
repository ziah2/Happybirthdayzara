// Types mirroring the Supabase schema in supabase/schema.sql.

export type Role = 'student' | 'contributor' | 'admin';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type NoteCategoryDb = 'lecture_note' | 'past_question' | 'assignment' | 'powerpoint';

export interface Faculty {
  id: string;
  name: string;
  abbreviation: string;
  created_at: string;
}

export interface Department {
  id: string;
  faculty_id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  matric_number: string | null;
  faculty_id: string | null;
  department_id: string | null;
  level: number | null;
  role: Role;
  email_verified: boolean;
  position: string | null;
  banned: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  department_id: string;
  level: number;
  semester: string;
  course_code: string;
  course_title: string;
  created_at: string;
}

export interface Note {
  id: string;
  course_id: string;
  uploaded_by: string;
  title: string;
  file_url: string;
  file_type: string;
  category: NoteCategoryDb;
  downloads: number;
  created_at: string;
}

export interface NewsPost {
  id: string;
  author_id: string;
  title: string;
  body: string;
  category: string;
  likes: number;
  created_at: string;
  updated_at: string;
}

export interface NewsComment {
  id: string;
  news_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  reply_to_id: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface ContributorRequest {
  id: string;
  user_id: string;
  full_name: string;
  matric_number: string;
  faculty_id: string;
  department_id: string;
  level: number;
  reason: string;
  upload_types: string;
  id_card_url: string | null;
  portfolio_url: string | null;
  status: RequestStatus;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface Bookmark {
  id: string;
  user_id: string;
  note_id: string;
  created_at: string;
}

export interface Download {
  id: string;
  user_id: string;
  note_id: string;
  downloaded_at: string;
}
