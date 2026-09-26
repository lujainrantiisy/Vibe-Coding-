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

export default function Home() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  // إمكانية تغيير لون الخلفية بحرية (الافتراضي هو اللون الوردي)
  const [bgColor, setBgColor] = useState('#fff1f2');

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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'planned':
        return { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' };
      case 'done':
        return { backgroundColor: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7' };
      default:
        return { backgroundColor: '#fce7f3', color: '#9d174d', borderColor: '#fbcfe8' };
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: bgColor,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '40px 16px',
      transition: 'background-color 0.3s ease',
      color: '#4c0519'
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        
        {/* Background Color Picker Control */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <label htmlFor="bgPicker" style={{ fontSize: '14px', fontWeight: '600', color: '#9f1239', cursor: 'pointer' }}>
            Change Background Color:
          </label>
          <input
            id="bgPicker"
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            style={{
              width: '36px',
              height: '36px',
              padding: '0',
              border: '2px solid #fecdd3',
              borderRadius: '50%',
              cursor: 'pointer',
              backgroundColor: 'transparent'
            }}
          />
        </div>

        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#831843',
            marginBottom: '8px'
          }}>
            💡 Feature Requests Board
          </h1>
          <p style={{ color: '#9f1239', fontSize: '15px' }}>
            Share your ideas, suggest new features, and vote for your favorites!
          </p>
        </header>

        {/* Submission Form */}
        <section style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 10px 25px -5px rgba(244, 63, 94, 0.1)',
          border: '1px solid #ffe4e6',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#831843', marginBottom: '16px' }}>
            ✨ Suggest a Feature
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#9f1239', marginBottom: '6px' }}>
                Feature Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Add Dark Mode Toggle"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #fecdd3',
                  outline: 'none',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: '#fff1f2',
                  color: '#4c0519'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#9f1239', marginBottom: '6px' }}>
                Description (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the idea and details..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #fecdd3',
                  outline: 'none',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: '#fff1f2',
                  color: '#4c0519',
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#e11d48',
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Submitting...' : 'Submit Request 🚀'}
            </button>
          </form>
        </section>

        {/* Requests List */}
        <section>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#831843', marginBottom: '16px' }}>
            📌 Current Requests
          </h2>

          {requests.length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              color: '#9f1239',
              border: '2px dashed #fecdd3'
            }}>
              No feature requests yet. Be the first to suggest one!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requests.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    border: '1px solid #ffe4e6',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
                  }}
                >
                  {/* Upvote Button */}
                  <button
                    onClick={() => handleUpvote(item.id, item.votes)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      minWidth: '56px',
                      color: '#be123c'
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>▲</span>
                    <span style={{ fontSize: '16px', fontWeight: '800' }}>{item.votes}</span>
                  </button>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#4c0519' }}>
                        {item.title}
                      </h3>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: '1px solid',
                        textTransform: 'capitalize',
                        ...getStatusStyle(item.status)
                      }}>
                        {item.status}
                      </span>
                    </div>
                    {item.description && (
                      <p style={{ margin: 0, fontSize: '14px', color: '#881337', lineHeight: '1.5' }}>
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