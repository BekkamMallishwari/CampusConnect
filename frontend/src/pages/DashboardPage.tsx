import { Activity, Bell, BookOpen, Compass, MessageCircle, ShieldCheck } from 'lucide-react';

const cards = [
  { title: 'Announcements', value: '12 new', icon: Bell },
  { title: 'Complaints', value: '3 pending', icon: ShieldCheck },
  { title: 'Events', value: '5 upcoming', icon: Activity },
  { title: 'Marketplace', value: '18 active', icon: BookOpen },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-950/20 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Student dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Welcome back, Aarav.</h1>
            <p className="mt-3 max-w-2xl text-slate-300">A unified view of your campus life, from live updates to support requests and community engagement.</p>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
            Last sync: 2 mins ago
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">{card.title}</h2>
                  <div className="rounded-2xl bg-cyan-500/10 p-2 text-cyan-300">
                    <Icon size={18} />
                  </div>
                </div>
                <p className="mt-6 text-2xl font-semibold text-white">{card.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex items-center gap-3">
              <Compass className="text-cyan-300" />
              <h2 className="text-xl font-semibold text-white">Campus services</h2>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">Lost & Found</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">Club recruitment</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">Bus tracking</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">Faculty directory</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex items-center gap-3">
              <MessageCircle className="text-cyan-300" />
              <h2 className="text-xl font-semibold text-white">Community chat</h2>
            </div>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">Riya: New hostel event tonight</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">Aman: Lost wallet near library</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">Prof. Nair: Placement prep session</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
