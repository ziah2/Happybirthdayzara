import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured, STORAGE_BUCKETS, supabase } from '../lib/supabase';
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Select, Textarea } from '../components/ui';
import { LEVELS, NEWS_CATEGORIES, NOTE_CATEGORIES, SEMESTERS, UPLOAD_ACCEPT, type NoteCategory } from '../lib/faculties';
import type { Course, NewsPost, Note } from '../lib/database.types';

export function ContributorDashboard() {
  const { user, faculties, departments } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [myNotes, setMyNotes] = useState<Note[]>([]);
  const [myNews, setMyNews] = useState<NewsPost[]>([]);
  const [tab, setTab] = useState<'upload' | 'news' | 'manage'>('upload');
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  // Upload form state
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [level, setLevel] = useState('');
  const [semester, setSemester] = useState<(typeof SEMESTERS)[number]>(SEMESTERS[0]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NoteCategory>('lecture_note');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // News form
  const [newsTitle, setNewsTitle] = useState('');
  const [newsBody, setNewsBody] = useState('');
  const [newsCat, setNewsCat] = useState<string>(NEWS_CATEGORIES[0]);
  const [posting, setPosting] = useState(false);

  const deptOpts = useMemo(() => departments.filter((d) => d.faculty_id === facultyId), [departments, facultyId]);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured || !user) return;
    const [{ data: n }, { data: nw }] = await Promise.all([
      supabase.from('notes').select('*').eq('uploaded_by', user.id).order('created_at', { ascending: false }),
      supabase.from('news').select('*').eq('author_id', user.id).order('created_at', { ascending: false }),
    ]);
    setMyNotes((n as Note[] | null) ?? []);
    setMyNews((nw as NewsPost[] | null) ?? []);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!isSupabaseConfigured || !departmentId || !level) return setCourses([]);
    supabase
      .from('courses')
      .select('*')
      .eq('department_id', departmentId)
      .eq('level', Number(level))
      .eq('semester', semester)
      .order('course_code')
      .then(({ data }) => setCourses((data as Course[] | null) ?? []));
  }, [departmentId, level, semester]);

  function flash(tone: 'success' | 'error', text: string) {
    setMsg({ tone, text });
    setTimeout(() => setMsg(null), 3000);
  }

  async function uploadNote(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !courseId || !title.trim() || !file) return flash('error', 'Select a course, title and file.');
    setUploading(true);
    setProgress(20);
    try {
      const path = `${courseId}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from(STORAGE_BUCKETS.notes).upload(path, file);
      setProgress(70);
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from(STORAGE_BUCKETS.notes).getPublicUrl(path);
      const ext = file.name.split('.').pop() ?? 'file';
      const { error } = await supabase.from('notes').insert({
        course_id: courseId,
        uploaded_by: user.id,
        title: title.trim(),
        file_url: pub.publicUrl,
        file_type: ext,
        category,
      });
      if (error) throw error;
      setProgress(100);
      flash('success', 'Material uploaded.');
      setTitle('');
      setFile(null);
      reload();
    } catch (err) {
      flash('error', err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 600);
    }
  }

  async function publishNews(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newsTitle.trim() || !newsBody.trim()) return flash('error', 'Title and body required.');
    setPosting(true);
    const { error } = await supabase.from('news').insert({
      author_id: user.id,
      title: newsTitle.trim(),
      body: newsBody.trim(),
      category: newsCat,
    });
    setPosting(false);
    if (error) return flash('error', error.message);
    flash('success', 'News published.');
    setNewsTitle('');
    setNewsBody('');
    reload();
  }

  async function deleteNote(id: string) {
    await supabase.from('notes').delete().eq('id', id);
    reload();
  }
  async function deleteNews(id: string) {
    await supabase.from('news').delete().eq('id', id);
    reload();
  }

  const totalDownloads = myNotes.reduce((a, n) => a + n.downloads, 0);
  const totalLikes = myNews.reduce((a, n) => a + n.likes, 0);

  return (
    <div className="page stack">
      <h2 style={{ fontSize: 22 }}>Contributor Dashboard</h2>
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      <div className="grid-2">
        <Card className="stat-tile"><div className="num">{myNotes.length}</div><div className="lbl">Uploads</div></Card>
        <Card className="stat-tile"><div className="num">{totalDownloads}</div><div className="lbl">Downloads</div></Card>
        <Card className="stat-tile"><div className="num">{totalLikes}</div><div className="lbl">Likes</div></Card>
        <Card className="stat-tile"><div className="num">{myNews.length}</div><div className="lbl">News posts</div></Card>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'upload' ? ' active' : ''}`} onClick={() => setTab('upload')}>Upload</button>
        <button className={`tab${tab === 'news' ? ' active' : ''}`} onClick={() => setTab('news')}>News</button>
        <button className={`tab${tab === 'manage' ? ' active' : ''}`} onClick={() => setTab('manage')}>Manage</button>
      </div>

      {tab === 'upload' && (
        <Card style={{ padding: 18 }}>
          <form onSubmit={uploadNote}>
            <div className="grid-2">
              <Field label="Faculty">
                <Select value={facultyId} onChange={(e) => { setFacultyId(e.target.value); setDepartmentId(''); }}>
                  <option value="">Select</option>
                  {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </Select>
              </Field>
              <Field label="Department">
                <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={!facultyId}>
                  <option value="">Select</option>
                  {deptOpts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </Field>
              <Field label="Level">
                <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="">Select</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{l} Level</option>)}
                </Select>
              </Field>
              <Field label="Semester">
                <Select value={semester} onChange={(e) => setSemester(e.target.value as typeof SEMESTERS[number])}>
                  {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Course">
              <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={!courses.length}>
                <option value="">{courses.length ? 'Select course' : 'No courses for this filter'}</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.course_code} — {c.course_title}</option>)}
              </Select>
            </Field>
            <Field label="Material type">
              <Select value={category} onChange={(e) => setCategory(e.target.value as NoteCategory)}>
                {NOTE_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Week 1 Lecture Notes" />
            </Field>
            <Field label="File">
              <div className="upload-well" onClick={() => fileRef.current?.click()}>
                {file ? `📎 ${file.name}` : '📤 PDF, DOCX, PPT, Images or ZIP'}
              </div>
              <input ref={fileRef} type="file" accept={UPLOAD_ACCEPT} hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Field>
            {progress > 0 && (
              <div className="progress-pill" style={{ marginBottom: 12 }}>
                <span style={{ width: `${progress}%` }} />
              </div>
            )}
            <Button type="submit" block loading={uploading}>Upload material</Button>
          </form>
        </Card>
      )}

      {tab === 'news' && (
        <Card style={{ padding: 18 }}>
          <form onSubmit={publishNews}>
            <Field label="Category">
              <Select value={newsCat} onChange={(e) => setNewsCat(e.target.value)}>
                {NEWS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Headline">
              <Input value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} />
            </Field>
            <Field label="Body">
              <Textarea value={newsBody} onChange={(e) => setNewsBody(e.target.value)} style={{ minHeight: 140 }} />
            </Field>
            <Button type="submit" block loading={posting}>Publish news</Button>
          </form>
        </Card>
      )}

      {tab === 'manage' && (
        <div className="stack">
          <div className="section-label">My Uploads</div>
          {myNotes.length === 0 ? (
            <EmptyState emoji="🗂️" text="No uploads yet." />
          ) : (
            myNotes.map((n) => (
              <Card key={n.id} style={{ padding: 14 }}>
                <div className="between">
                  <div>
                    <div style={{ fontWeight: 700 }}>{n.title}</div>
                    <div className="tiny muted">{n.downloads} downloads</div>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => deleteNote(n.id)}>Delete</Button>
                </div>
              </Card>
            ))
          )}
          <div className="section-label">My News</div>
          {myNews.length === 0 ? (
            <EmptyState emoji="📰" text="No news posts yet." />
          ) : (
            myNews.map((n) => (
              <Card key={n.id} style={{ padding: 14 }}>
                <div className="between">
                  <div className="row">
                    <Badge>{n.category}</Badge>
                    <span style={{ fontWeight: 700 }}>{n.title}</span>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => deleteNews(n.id)}>Delete</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
