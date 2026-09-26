'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface RequestItem {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: 'open' | 'planned' | 'done';
  created_at: string;
}

// لوحة الألوان للثيمات المتعددة
const themes = {
  pink: {
    name: 'الوردي 🌸',
    bg: '#fff1f2',
    textHeader: '#831843',
    textSub: '#9f1239',
    cardBg: '#ffffff',
    cardBorder: '#ffe4e6',
    inputBg: '#fff1f2',
    inputBorder: '#fecdd3',
    btnBg: '#e11d48',
    btnHover: '#be123c',
    voteBg: '#fff1f2',
    voteBorder: '#fecdd3',
    voteText: '#be123c'
  },
  purple: {
    name: 'البنفسجي 💜',
    bg: '#f3e8ff',
    textHeader: '#581c87',
    textSub: '#7e22ce',
    cardBg: '#ffffff',
    cardBorder: '#f3e8ff',
    inputBg: '#faf5ff',
    inputBorder: '#e9d5ff',
    btnBg: '#9333ea',
    btnHover: '#7e22ce',
    voteBg: '#faf5ff',
    voteBorder: '#e9d5ff',
    voteText: '#7e22ce'
  },
  blue: {
    name: 'الأزرق 💙',
    bg: '#f0f9ff',
    textHeader: '#0c4a6e',
    textSub: '#0369a1',
    cardBg: '#ffffff',
    cardBorder: '#e0f2fe',
    inputBg: '#f0f9ff',
    inputBorder: '#bae6fd',
    btnBg: '#0284c7',
    btnHover: '#0369a1',
    voteBg: '#f0f9ff',
    voteBorder: '#bae6fd',
    voteText: '#0369a1'
  },
  dark: {
    name: 'الداكن 🌙',
    bg: '#0f172a',
    textHeader: '#f8fafc',
    textSub: '#94a3b8',
    cardBg: '#1e293b',
    cardBorder: '#334155',
    inputBg: '#0f172a',
    inputBorder: '#334155',
    btnBg: '#38bdf8',
    btnHover: '#0284c7',
    voteBg: '#0f172a',
    voteBorder: '#334155',
    voteText: '#38bdf8'
  }
};

type ThemeKey = keyof typeof themes;

export default function Home() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('pink');

  const theme = themes[currentTheme];

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('votes', { ascending: false });

    if (!error && data) {
      setRequests(data as RequestItem[]);
    }
  };

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('requests').insert([
      { title, description, votes: 0, status: 'open' }
    ]);

    if (!error) {
      setTitle('');
      setDescription('');
      fetchRequests();
    }
    setLoading(false);
  };

  const handleUpvote = async (id: string, currentVotes: number) => {
    const { error } = await supabase
      .from('requests')
      .update({ votes: currentVotes + 1 })
      .eq('id', id);

    if (!error) {
      fetchRequests();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '40px 16px',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        
        {/* Theme Selector Top Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: theme.textSub }}>اختر الثيم:</span>
          {(Object.keys(themes) as ThemeKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setCurrentTheme(key)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: currentTheme === key ? theme.btnBg : theme.cardBorder,
                backgroundColor: currentTheme === key ? theme.btnBg : theme.cardBg,
                color: currentTheme === key ? '#ffffff' : theme.textSub,
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {themes[key].name}
            </button>
          ))}
        </div>

        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: theme.textHeader,
            marginBottom: '8px'
          }}>
            Feature Requests Board
          </h1>
          <p style={{ color: theme.textSub, fontSize: '15px' }}>
            شاركنا أفكارك واقتراحاتك وصوّت للميزات المفضلة لديك!
          </p>
        </header>

        {/* Form Card */}
        <section style={{
          backgroundColor: theme.cardBg,
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          border: `1px solid ${theme.cardBorder}`,
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: theme.textHeader, marginBottom: '16px' }}>
            ✨ اقترح ميزة جديدة
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: theme.textSub, marginBottom: '6px' }}>
                عنوان الميزة *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: إضافة خيار إشعارات للبريد الإلكتروني"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.inputBorder}`,
                  outline: 'none',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: theme.inputBg,
                  color: theme.textHeader
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: theme.textSub, marginBottom: '6px' }}>
                الوصف (اختياري)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اشرح الفكرة والتفاصيل المرجوة..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.inputBorder}`,
                  outline: 'none',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: theme.inputBg,
                  color: theme.textHeader,
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: theme.btnBg,
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'جاري الإرسال...' : 'إرسال الاقتراح 🚀'}
            </button>
          </form>
        </section>

        {/* List Section */}
        <section>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.textHeader, marginBottom: '16px' }}>
            💌 الاقتراحات الحالية
          </h2>

          {requests.length === 0 ? (
            <div style={{
              backgroundColor: theme.cardBg,
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              color: theme.textSub,
              border: `2px dashed ${theme.cardBorder}`
            }}>
              لا يوجد اقتراحات حتى الآن. كن أول من يضيف فكرة!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requests.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    border: `1px solid ${theme.cardBorder}`
                  }}
                >
                  <button
                    onClick={() => handleUpvote(item.id, item.votes)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.voteBg,
                      border: `1px solid ${theme.voteBorder}`,
                      borderRadius: '12px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      minWidth: '56px',
                      color: theme.voteText
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>▲</span>
                    <span style={{ fontSize: '16px', fontWeight: '800' }}>{item.votes}</span>
                  </button>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: theme.textHeader }}>
                        {item.title}
                      </h3>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        backgroundColor: theme.voteBg,
                        color: theme.voteText,
                        border: `1px solid ${theme.voteBorder}`,
                        textTransform: 'capitalize'
                      }}>
                        {item.status}
                      </span>
                    </div>
                    {item.description && (
                      <p style={{ margin: 0, fontSize: '14px', color: theme.textSub, lineHeight: '1.5' }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}