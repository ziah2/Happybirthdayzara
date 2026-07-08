import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Alert, Button, Card, EmptyState, Field, Modal, Select, Skeleton, Stars, Textarea } from '../components/ui';
import { LEVELS, NOTE_CATEGORIES, SEMESTERS, type NoteCategory } from '../lib/faculties';
import { fileTypeIcon } from '../lib/utils';
import type { Course, Note } from '../lib/database.types';

interface NoteView extends Note {
  avgRating: number;
  uploaderName: string;
}

export function Notes() {
  const { faculties, departments, profile, isVerified, user } = useAuth();
  const [facultyId, setFacultyId] = useState(profile?.faculty_id ?? '');
  const [departmentId, setDepartmentId] = useState(profile?.department_id ?? '');
  const [level, setLevel] = useState(profile?.level ? String(profile.level) : '');
  const [semester, setSemester] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [category, setCategory] = useState<NoteCategory>('lecture_note');
  const [notes, setNotes] = useState<NoteView[] | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [reportFor, setReportFor] = useState<Note | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const deptOpts = useMemo(() => departments.filter((d) => d.faculty_id === facultyId), [departments, facultyId]);

  // Load courses for the current dept/level/semester.
  useEffect(() => {
    if (!isSupabaseConfigured || !departmentId || !level) {
      setCourses([]);
      return;
    }
    (async () => {
      let q = supabase.from('courses').select('*').eq('department_id', departmentId).eq('level', Number(level));
      if (semester) q = q.eq('semester', semester);
      const { data } = await q.order('course_code');
      setCourses((data as Course[] | null) ?? []);
    })();
  }, [departmentId, level, semester]);

  // Load notes for the selected course + category.
  useEffect(() => {
    if (!isSupabaseConfigured || !courseId) {
      setNotes(courseId ? [] : null);
      return;
    }
    setNotes(null);
    (async () => {
      const { data } = await supabase
        .from('notes')
        .select('*, users(full_name), note_ratings(rating)')
        .eq('course_id', courseId)
        .eq('category', category)
        .order('created_at', { ascending: false });
      const rows = (data as (Note & { users: { full_name: string } | null; note_ratings: { rating: number }[] })[] | null) ?? [];
      setNotes(
        rows.map((r) => ({
          ...r,
          uploaderName: r.users?.full_name ?? 'Unknown',
          avgRating: r.note_ratings.length ? r.note_ratings.reduce((a, b) => a + b.rating, 0) / r.note_ratings.length : 0,
        })),
      );
    })();
  }, [courseId, category]);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    supabase
      .from('bookmarks')
      .select('note_id')
      .eq('user_id', user.id)
      .then(({ data }) => setBookmarks(new Set((data ?? []).map((b: { note_id: string }) => b.note_id))));
  }, [user]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function download(n: Note) {
    if (!isVerified) return flash('Verify your email to download.');
    await supabase.from('notes').update({ downloads: n.downloads + 1 }).eq('id', n.id);
    if (user) await supabase.from('downloads').insert({ user_id: user.id, note_id: n.id });
    window.open(n.file_url, '_blank');
  }

  async function rate(n: Note, rating: number) {
    if (!isVerified || !user) return flash('Verify your email to rate.');
    await supabase.from('note_ratings').upsert({ note_id: n.id, user_id: user.id, rating }, { onConflict: 'note_id,user_id' });
    flash('Thanks for rating!');
  }

  async function toggleBookmark(n: Note) {
    if (!isVerified || !user) return flash('Verify your email to bookmark.');
    if (bookmarks.has(n.id)) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('note_id', n.id);
      setBookmarks((s) => {
        const next = new Set(s);
        next.delete(n.id);
        return next;
      });
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, note_id: n.id });
      setBookmarks((s) => new Set(s).add(n.id));
    }
  }

  async function submitReport() {
    if (!reportFor || !user) return;
    await supabase.from('note_reports').insert({ note_id: reportFor.id, user_id: user.id, reason: reportReason });
    setReportFor(null);
    setReportReason('');
    flash('Report submitted. Thank you.');
  }

  return (
    <div className="page stack">
      <h2 style={{ fontSize: 22 }}>Study Materials</h2>
      {toast && <Alert tone="info">{toast}</Alert>}

      <Card style={{ padding: 16 }}>
        <div className="grid-2">
          <Field label="Faculty">
            <Select value={facultyId} onChange={(e) => { setFacultyId(e.target.value); setDepartmentId(''); setCourseId(''); }}>
              <option value="">Select</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Department">
            <Select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setCourseId(''); }} disabled={!facultyId}>
              <option value="">Select</option>
              {deptOpts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Level">
            <Select value={level} onChange={(e) => { setLevel(e.target.value); setCourseId(''); }}>
              <option value="">Select</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l} Level</option>
              ))}
            </Select>
          </Field>
          <Field label="Semester">
            <Select value={semester} onChange={(e) => { setSemester(e.target.value); setCourseId(''); }}>
              <option value="">All</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Course Code">
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={!departmentId || !level}>
            <option value="">{courses.length ? 'Select course' : 'No courses for this filter'}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.course_code} — {c.course_title}</option>
            ))}
          </Select>
        </Field>
      </Card>

      <div className="tabs">
        {NOTE_CATEGORIES.map((c) => (
          <button key={c.key} className={`tab${category === c.key ? ' active' : ''}`} onClick={() => setCategory(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      {!courseId ? (
        <EmptyState emoji="🎯" text="Pick a course code to browse its materials." />
      ) : notes === null ? (
        <Skeleton height={90} />
      ) : notes.length === 0 ? (
        <EmptyState emoji="📭" text="No materials uploaded yet for this course." />
      ) : (
        <div className="stack">
          {notes.map((n) => (
            <Card key={n.id} style={{ padding: 14 }}>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div className="icon-badge sm">{fileTypeIcon(n.file_type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{n.title}</div>
                  <div className="tiny muted">by {n.uploaderName} · {n.downloads} downloads</div>
                  <div className="row" style={{ marginTop: 6 }}>
                    <Stars value={n.avgRating} onRate={(r) => rate(n, r)} />
                  </div>
                </div>
              </div>
              <div className="row wrap" style={{ marginTop: 12, gap: 8 }}>
                <Button size="sm" onClick={() => download(n)}>⬇ Download</Button>
                <Button size="sm" variant="ghost" onClick={() => toggleBookmark(n)}>
                  {bookmarks.has(n.id) ? '★ Saved' : '☆ Save'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReportFor(n)}>⚑ Report</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!reportFor} onClose={() => setReportFor(null)} title="Report material">
        <Field label="What's wrong with this file?">
          <Textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Incorrect, outdated, wrong course…" />
        </Field>
        <Button block variant="danger" disabled={!reportReason.trim()} onClick={submitReport}>
          Submit report
        </Button>
      </Modal>
    </div>
  );
}
