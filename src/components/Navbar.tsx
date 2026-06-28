import { LogOut, CheckSquare, Sparkles, User as UserIcon } from "lucide-react";
import { auth, googleProvider, signInWithPopup, signOut, User } from "../lib/firebase";

interface NavbarProps {
  user: User | null;
  loading: boolean;
}

export default function Navbar({ user, loading }: NavbarProps) {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/8 bg-[#121212]/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
              NOMAD
            </h1>
            <p className="hidden text-[9px] uppercase tracking-[0.2em] text-white/40 font-mono sm:block">
              Elite Task System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-white">{user.displayName || "User"}</p>
                <p className="text-[10px] text-white/40 font-mono tracking-wider">{user.email}</p>
              </div>
              
              <div className="relative group">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="h-9 w-9 rounded-full object-cover border border-white/15 ring-2 ring-transparent group-hover:ring-white/20 transition-all"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white">
                    <UserIcon className="h-4.5 w-4.5" />
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 border border-white/10 bg-transparent px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white/70 transition-all hover:bg-white hover:text-black hover:border-white rounded-sm cursor-pointer"
                id="btn-logout"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-black hover:bg-neutral-200 transition-all rounded-sm cursor-pointer"
              id="btn-login-google"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
