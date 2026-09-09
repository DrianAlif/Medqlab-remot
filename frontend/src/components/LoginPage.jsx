import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, Loader2, KeyRound, AlertCircle, Sun, Moon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState(() => localStorage.getItem('medqlab_remembered_user') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Username tidak boleh kosong');
      return;
    }
    if (!password) {
      setErrorMessage('Password tidak boleh kosong');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login gagal. Periksa username dan password.');
      }

      if (rememberMe) {
        localStorage.setItem('medqlab_remembered_user', username.trim());
      } else {
        localStorage.removeItem('medqlab_remembered_user');
      }

      localStorage.setItem('medqlab_user', JSON.stringify(data.data));
      toast.success('Selamat datang, ' + data.data.name + '!');
      onLoginSuccess(data.data);
    } catch (err) {
      setErrorMessage(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 bg-card/70 backdrop-blur"
          onClick={toggleTheme}
          title={isDark ? 'Mode Terang' : 'Mode Gelap'}
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </Button>
      </div>

      <div className="w-full max-w-md z-10 space-y-4">
        <Card className="shadow-xl border-border/80 bg-card/95 backdrop-blur">
          <CardHeader className="text-center pb-2 pt-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/20 shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              MEDQLAB Remote Portal
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground pt-1">
              Sistem Manajemen Remote Client & Akses Server Laboratorium
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {errorMessage && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Username</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    autoFocus
                    placeholder="Masukkan username Anda"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 text-xs h-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Kata Sandi (Password)</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 text-xs h-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    title={showPassword ? 'Sembunyikan' : 'Perlihatkan'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border text-sky-600 focus:ring-sky-500 h-3.5 w-3.5"
                  />
                  <span>Ingat username saya</span>
                </label>
                <span className="text-[11px] text-muted-foreground">Otentikasi Lokal</span>
              </div>

              <Button
                type="submit"
                className="w-full h-9 text-xs font-medium gap-2 mt-2 bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memverifikasi Akses...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Masuk ke Portal</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>

      

          <CardFooter className="pt-0 justify-center border-t border-border/40 py-3">
            <p className="text-[11px] text-muted-foreground text-center">
              Akses khusus staf RS & Laboratorium MEDQLAB terdaftar.
            </p>
          </CardFooter>
        </Card>

        <div className="text-center text-[11px] text-muted-foreground">
          MEDQLAB Portal v2.0 &bull; Local Testing Environment &bull; Port 3030
        </div>
      </div>
    </div>
  );
}