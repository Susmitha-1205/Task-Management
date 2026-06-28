import { Task, TaskStatus } from "../types";
import TaskCard from "./TaskCard";
import { Plus, Circle, Clock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BoardViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onAddTask: (status: TaskStatus) => void;
}

export default function BoardView({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onAddTask,
}: BoardViewProps) {
  const columns: { id: TaskStatus; title: string; icon: any; color: string; bg: string }[] = [
    {
      id: "todo",
      title: "To Do",
      icon: Circle,
      color: "text-white/80 bg-white/5 border border-white/8",
      bg: "bg-[#121212]/35 border-white/8",
    },
    {
      id: "in_progress",
      title: "In Progress",
      icon: Clock,
      color: "text-amber-400 bg-amber-950/20 border border-amber-900/20",
      bg: "bg-[#121212]/35 border-white/8",
    },
    {
      id: "done",
      title: "Completed",
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-950/20 border border-emerald-900/20",
      bg: "bg-[#121212]/35 border-white/8",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.id);

        return (
          <div
            key={column.id}
            className={`flex flex-col rounded-sm border p-4 min-h-[500px] ${column.bg}`}
          >
            {/* Column Header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-sm ${column.color}`}>
                  <column.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-sans text-xs uppercase tracking-widest font-bold text-white">{column.title}</h3>
                <span className="rounded-sm bg-neutral-900 border border-white/8 px-2 py-0.5 text-[10px] font-mono text-white/50">
                  {columnTasks.length}
                </span>
              </div>

              <button
                onClick={() => onAddTask(column.id)}
                className="rounded-sm p-1 border border-white/8 text-white/40 hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer"
                title={`Add task to ${column.title}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Tasks Container */}
            <div className="flex-1 space-y-4">
              <AnimatePresence mode="popLayout">
                {columnTasks.length > 0 ? (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-sm border border-dashed border-white/8 bg-white/2"
                  >
                    <p className="text-xs text-white/30 font-mono uppercase tracking-widest">No Tasks</p>
                    <button
                      onClick={() => onAddTask(column.id)}
                      className="mt-2 text-xs font-semibold text-white/50 hover:text-white hover:underline cursor-pointer"
                    >
                      + Quick Add
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
