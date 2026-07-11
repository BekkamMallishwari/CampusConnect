import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-950/30 lg:flex-row lg:items-center lg:p-12">
        <div className="max-w-xl flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">CampusConnect</p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
            {isLogin ? 'Welcome back to campus life.' : 'Join your college community.'}
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Sign in to your dashboard or create a new account to access announcements, marketplace, complaints, and more.
          </p>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <div className="mb-6 flex rounded-full border border-slate-800 p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${isLogin ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${!isLogin ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
            >
              Signup
            </button>
          </div>

          <form className="space-y-4">
            {!isLogin && (
              <div>
                <label className="mb-2 block text-sm text-slate-300">Full name</label>
                <input className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400" placeholder="Aarav Singh" />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm text-slate-300">Email</label>
              <input className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400" placeholder="student@college.edu" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Password</label>
              <input type="password" className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
              {isLogin ? 'Login' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Need a quick start? <Link to="/" className="text-cyan-300">Back home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
