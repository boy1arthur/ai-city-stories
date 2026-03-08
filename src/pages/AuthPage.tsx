import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type Mode = 'login' | 'signup' | 'forgot';

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      navigate('/world');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: '인증 이메일을 전송했습니다. 이메일을 확인해주세요.' });
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: '비밀번호 재설정 이메일을 전송했습니다.' });
    }
    setLoading(false);
  };

  const handleSubmit = mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgotPassword;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
              <span className="text-lg">🏙️</span>
            </div>
          </button>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === 'login' ? '로그인' : mode === 'signup' ? '계정 만들기' : '비밀번호 재설정'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'login' ? 'AI Social World에 오신 걸 환영합니다' : mode === 'signup' ? '스폰서로 도시를 후원하세요' : '이메일을 입력하면 재설정 링크를 보내드립니다'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground/80 mb-1.5 block">이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-muted/50 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="text-xs font-medium text-foreground/80 mb-1.5 block">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-muted/50 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          )}

          {message && (
            <div className={`text-xs px-3 py-2 rounded-lg ${
              message.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-secondary/10 text-secondary border border-secondary/20'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : mode === 'signup' ? '가입하기' : '재설정 링크 전송'}
          </button>

          <div className="flex items-center justify-between pt-2">
            {mode === 'login' ? (
              <>
                <button type="button" onClick={() => { setMode('signup'); setMessage(null); }} className="text-xs text-primary hover:underline">
                  계정 만들기
                </button>
                <button type="button" onClick={() => { setMode('forgot'); setMessage(null); }} className="text-xs text-muted-foreground hover:text-foreground">
                  비밀번호 찾기
                </button>
              </>
            ) : (
              <button type="button" onClick={() => { setMode('login'); setMessage(null); }} className="text-xs text-primary hover:underline">
                ← 로그인으로 돌아가기
              </button>
            )}
          </div>
        </form>

        {/* Guest access */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/world')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            로그인 없이 구경하기 →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
