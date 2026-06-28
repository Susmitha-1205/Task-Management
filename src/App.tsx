import { useState, useEffect, useMemo } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { 
  onAuthStateChanged, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  User 
} from "./lib/firebase";
import { db } from "./lib/firebase";
import { Task, TaskStatus, TaskPriority, TaskFrequency, TaskFilter } from "./types";
import Navbar from "./components/Navbar";
import DashboardStats from "./components/DashboardStats";
import BoardView from "./components/BoardView";
import ListView from "./components/ListView";
import TaskForm from "./components/TaskForm";
import { 
  Search, 
  Plus, 
  LayoutGrid, 
  List, 
  X, 
  ChevronDown, 
  Sparkles,
  CheckCircle,
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  
  // UI views
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [defaultFormStatus, setDefaultFormStatus] = useState<TaskStatus>("todo");
  
  // Advanced filters state
  const [filters, setFilters] = useState<TaskFilter>({
    search: "",
    status: "all",
    priority: "all",
    sortBy: "createdAt"
  });

  // Track Firebase auth status on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen for task changes real-time when user is authenticated
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    setTasksLoading(true);
    // Real-time listener for tasks owned by this user
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedTasks: Task[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedTasks.push({
            id: docSnap.id,
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            dueDate: data.dueDate,
            frequency: data.frequency || "none",
            userId: data.userId,
            userEmail: data.userEmail,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        });
        setTasks(loadedTasks);
        setTasksLoading(false);
      },
      (error) => {
        console.error("Firestore loading error:", error);
        setTasksLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Auth helper
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  // CRUD operation handlers
  const handleRecurrenceIfNeeded = async (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    frequency: TaskFrequency;
  }) => {
    if (taskData.status === "done" && taskData.frequency && taskData.frequency !== "none") {
      // Calculate next due date
      const currentDueDate = taskData.dueDate ? new Date(taskData.dueDate + "T12:00:00") : new Date();
      const baseDate = isNaN(currentDueDate.getTime()) ? new Date() : currentDueDate;
      
      const nextDate = new Date(baseDate);
      if (taskData.frequency === "daily") {
        nextDate.setDate(baseDate.getDate() + 1);
      } else if (taskData.frequency === "weekly") {
        nextDate.setDate(baseDate.getDate() + 7);
      } else if (taskData.frequency === "monthly") {
        nextDate.setMonth(baseDate.getMonth() + 1);
      }
      
      const year = nextDate.getFullYear();
      const month = String(nextDate.getMonth() + 1).padStart(2, "0");
      const day = String(nextDate.getDate()).padStart(2, "0");
      const nextDueDateStr = `${year}-${month}-${day}`;
      
      // Create new subsequent task
      const nextTaskId = doc(collection(db, "tasks")).id;
      const nextTaskRef = doc(db, "tasks", nextTaskId);
      await setDoc(nextTaskRef, {
        title: taskData.title,
        description: taskData.description,
        status: "todo" as TaskStatus,
        priority: taskData.priority,
        dueDate: nextDueDateStr,
        frequency: taskData.frequency,
        userId: user!.uid,
        userEmail: user!.email || "",
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  };

  const handleSaveTask = async (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    frequency: TaskFrequency;
  }) => {
    if (!user) return;

    if (editingTask) {
      // Update existing task
      const taskRef = doc(db, "tasks", editingTask.id);
      await updateDoc(taskRef, {
        ...taskData,
        updatedAt: Date.now()
      });

      // Trigger recurrence if transitioning to completed
      if (taskData.status === "done" && editingTask.status !== "done") {
        await handleRecurrenceIfNeeded(taskData);
      }
    } else {
      // Create new task with deterministic unique string ID
      const taskId = doc(collection(db, "tasks")).id;
      const taskRef = doc(db, "tasks", taskId);
      await setDoc(taskRef, {
        ...taskData,
        userId: user.uid,
        userEmail: user.email || "",
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Trigger recurrence if created as completed
      if (taskData.status === "done") {
        await handleRecurrenceIfNeeded(taskData);
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "tasks", id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    if (!user) return;
    try {
      const targetTask = tasks.find((t) => t.id === id);
      if (!targetTask) return;

      await updateDoc(doc(db, "tasks", id), {
        status: newStatus,
        updatedAt: Date.now()
      });

      // Trigger recurrence if transitioning to completed
      if (newStatus === "done" && targetTask.status !== "done") {
        await handleRecurrenceIfNeeded({
          title: targetTask.title,
          description: targetTask.description,
          status: "done",
          priority: targetTask.priority,
          dueDate: targetTask.dueDate,
          frequency: targetTask.frequency
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const openCreateForm = (status: TaskStatus = "todo") => {
    setEditingTask(null);
    setDefaultFormStatus(status);
    setIsFormOpen(true);
  };

  const openEditForm = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  // Filter & Sort local computation
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const matchesSearch =
          task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          task.description.toLowerCase().includes(filters.search.toLowerCase());
        const matchesStatus = filters.status === "all" || task.status === filters.status;
        const matchesPriority = filters.priority === "all" || task.priority === filters.priority;
        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        if (filters.sortBy === "dueDate") {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (filters.sortBy === "priority") {
          const priorityWeights = { high: 3, medium: 2, low: 1 };
          return priorityWeights[b.priority] - priorityWeights[a.priority];
        }
        // default by createdAt (newest first)
        return b.createdAt - a.createdAt;
      });
  }, [tasks, filters]);

  // Reset Filters helper
  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      priority: "all",
      sortBy: "createdAt"
    });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40">Initializing System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] selection:bg-neutral-800 selection:text-white">
      <Navbar user={user} loading={authLoading} />

      {user ? (
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          
          {/* Welcome section */}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-4xl font-bold tracking-tight text-white italic">
                In Focus
              </h2>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">
                Welcome, {user.displayName || "Operator"} — Real-time Connection Live
              </p>
            </div>
            
            <button
              onClick={() => openCreateForm("todo")}
              className="flex items-center justify-center gap-2 bg-white px-5 py-3 text-xs font-bold uppercase tracking-widest text-black rounded-sm hover:bg-neutral-200 transition-all cursor-pointer shadow-lg shadow-white/5"
              id="btn-create-task-main"
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </button>
          </div>

          {/* Stats Bar */}
          <section className="mb-8" aria-label="Dashboard Statistics">
            <DashboardStats tasks={tasks} />
          </section>

          {/* Filters & Control Toolbar */}
          <section className="mb-6 rounded-sm border border-white/8 bg-[#121212] p-4" aria-label="Filters and Controls">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              
              {/* Left Side: Search & Filter indicators */}
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search task title or description..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full rounded-sm border border-white/8 bg-[#0D0D0D] pl-9 pr-4 py-2 text-sm text-white placeholder-white/20 shadow-sm focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                  />
                  {filters.search && (
                    <button
                      onClick={() => setFilters({ ...filters, search: "" })}
                      className="absolute right-3 top-3.5 text-white/40 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Selects */}
                <div className="flex flex-wrap gap-2">
                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                      className="appearance-none rounded-sm border border-white/8 bg-[#0D0D0D] text-white/80 pl-3.5 pr-8 py-2 text-xs font-semibold uppercase tracking-wider focus:border-white focus:outline-none focus:ring-1 focus:ring-white [&_option]:bg-[#121212]"
                    >
                      <option value="all">All Statuses</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Completed</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-3.5 w-3.5 text-white/30" />
                  </div>

                  {/* Priority Filter */}
                  <div className="relative">
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value as any })}
                      className="appearance-none rounded-sm border border-white/8 bg-[#0D0D0D] text-white/80 pl-3.5 pr-8 py-2 text-xs font-semibold uppercase tracking-wider focus:border-white focus:outline-none focus:ring-1 focus:ring-white [&_option]:bg-[#121212]"
                    >
                      <option value="all">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-3.5 w-3.5 text-white/30" />
                  </div>

                  {/* Sort Selection */}
                  <div className="relative">
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                      className="appearance-none rounded-sm border border-white/8 bg-[#0D0D0D] text-white/80 pl-3.5 pr-8 py-2 text-xs font-semibold uppercase tracking-wider focus:border-white focus:outline-none focus:ring-1 focus:ring-white [&_option]:bg-[#121212]"
                    >
                      <option value="createdAt">Newest First</option>
                      <option value="dueDate">Due Date</option>
                      <option value="priority">Priority Rank</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-3.5 w-3.5 text-white/30" />
                  </div>
                </div>
              </div>

              {/* Right Side: View Mode Toggle & Reset Filters */}
              <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3 lg:border-none lg:pt-0">
                {(filters.search || filters.status !== "all" || filters.priority !== "all" || filters.sortBy !== "createdAt") && (
                  <button
                    onClick={clearFilters}
                    className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}

                <div className="flex items-center rounded-sm border border-white/8 bg-white/5 p-1">
                  <button
                    onClick={() => setViewMode("board")}
                    className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      viewMode === "board"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-white/40 hover:text-white"
                    }`}
                    title="Board View"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Board</span>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      viewMode === "list"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-white/40 hover:text-white"
                    }`}
                    title="Grid View"
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>Grid</span>
                  </button>
                </div>
              </div>

            </div>
          </section>

          {/* Core Content Area */}
          <section className="mt-4" aria-label="Tasks List/Board">
            {tasksLoading && tasks.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-sm border border-white/8 bg-[#121212] shadow-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <p className="text-xs font-mono uppercase tracking-widest text-white/30">Syncing with Cloud...</p>
                </div>
              </div>
            ) : viewMode === "board" ? (
              <BoardView
                tasks={filteredTasks}
                onEdit={openEditForm}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onAddTask={openCreateForm}
              />
            ) : (
              <ListView
                tasks={filteredTasks}
                onEdit={openEditForm}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            )}
          </section>
        </main>
      ) : (
        /* Dynamic Landing / Auth Panel - High Sophistication */
        <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            
            {/* Visual Intro Column */}
            <div className="flex flex-col justify-center">
              <div className="inline-flex max-w-fit items-center gap-1.5 rounded-sm bg-white/5 border border-white/8 px-3 py-1.5 text-[10px] uppercase font-mono tracking-widest text-white/70">
                <Sparkles className="h-3.5 w-3.5 text-white/80" />
                <span>Live Real-time Collaboration</span>
              </div>
              
              <h2 className="mt-8 font-display text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl italic">
                NOMAD
              </h2>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-mono mt-2 block">
                Elite Task Management Workspace
              </span>
              
              <p className="mt-8 text-sm leading-relaxed text-white/60 font-sans max-w-lg">
                Establish the visual fiscal trajectory and coordinate actions seamlessly. Designed for operators seeking deep structural organization, high-contrast aesthetics, and state synchronization.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-white/5 text-white">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-widest text-white/70 font-mono">Secure Access</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-white/5 text-white">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-widest text-white/70 font-mono">Instant Sync</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-white/5 text-white">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-widest text-white/70 font-mono">Refined Theme</span>
                </div>
              </div>
            </div>

            {/* Login Box Card Column */}
            <div className="flex justify-center">
              <div className="w-full max-w-md overflow-hidden rounded-sm border border-white/8 bg-[#121212] p-8 shadow-2xl">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-sm border border-white/10 bg-white/5 text-white">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold tracking-tight text-white">
                    Join Workspace
                  </h3>
                  <p className="mt-2 text-xs text-white/40 uppercase tracking-widest font-mono">
                    Authenticate to save your custom board
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  <button
                    onClick={handleGoogleSignIn}
                    className="flex w-full items-center justify-center gap-3 rounded-sm border border-transparent bg-white px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-black shadow-sm transition-all hover:bg-neutral-200 cursor-pointer"
                    id="btn-login-card-google"
                  >
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                      <path
                        fill="#000000"
                        d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.123C18.254.983 15.483 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.795-.085-1.4-.195-1.925H12.24z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative flex py-3 items-center">
                    <div className="flex-grow border-t border-white/8"></div>
                    <span className="flex-shrink mx-4 text-[9px] font-mono uppercase tracking-widest text-white/30">secure credentials</span>
                    <div className="flex-grow border-t border-white/8"></div>
                  </div>

                  <div className="rounded-sm bg-[#0A0A0A] border border-white/8 p-4 text-xs text-white/50 leading-relaxed font-sans">
                    <span className="font-semibold block mb-1 text-white uppercase tracking-wider text-[10px]">💡 DEMO ARCHITECTURE INFO</span>
                    Using Firebase Authentication isolates your tasks instantly into a personal sandbox on our secure backend database.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      )}

      {/* Slide-over / Modal Form */}
      {isFormOpen && (
        <TaskForm
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
