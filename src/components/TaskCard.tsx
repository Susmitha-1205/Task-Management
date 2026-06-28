import { Calendar, Trash2, Edit2, CheckCircle2, Circle, ArrowRight, Clock, Repeat } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "../types";
import { motion } from "motion/react";

interface TaskCardProps {
  key?: string;
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const getPriorityStyles = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return "bg-red-950/30 text-red-400 border-red-900/20";
      case "medium":
        return "bg-amber-950/35 text-amber-400 border-amber-900/20";
      case "low":
        return "bg-neutral-900 text-neutral-400 border-neutral-800/60";
    }
  };

  const isOverdue = (dateStr: string, status: TaskStatus) => {
    if (!dateStr || status === "done") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex flex-col rounded-sm border border-white/8 bg-[#121212] p-5 transition-all hover:border-neutral-500 ${
        task.status === "done" ? "opacity-60" : ""
      }`}
    >
      {/* Header with Title & Action */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {/* Quick status switch button */}
          <button
            onClick={() => onStatusChange(task.id, task.status === "done" ? "todo" : "done")}
            className="mt-0.5 flex-shrink-0 text-white/30 hover:text-white transition-colors cursor-pointer"
            title={task.status === "done" ? "Mark incomplete" : "Mark as completed"}
          >
            {task.status === "done" ? (
              <CheckCircle2 className="h-4.5 w-4.5 text-white fill-white/10" />
            ) : (
              <Circle className="h-4.5 w-4.5" />
            )}
          </button>
          
          <div>
            <h3 className={`font-sans font-semibold text-white tracking-tight text-sm group-hover:text-neutral-200 transition-colors ${
              task.status === "done" ? "line-through text-white/40" : ""
            }`}>
              {task.title}
            </h3>
            {task.description && (
              <p className={`mt-2 text-xs leading-relaxed text-white/50 line-clamp-3 font-sans ${
                task.status === "done" ? "line-through text-white/30" : ""
              }`}>
                {task.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Meta info & Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Priority Badge */}
          <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold ${getPriorityStyles(task.priority)}`}>
            {task.priority}
          </span>

          {/* Due Date Badge */}
          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                isOverdue(task.dueDate, task.status)
                  ? "bg-rose-950/30 text-rose-400 border-rose-900/30"
                  : "bg-neutral-900 text-white/40 border-neutral-800"
              }`}
            >
              <Calendar className="h-3 w-3" />
              <span>{task.dueDate}</span>
              {isOverdue(task.dueDate, task.status) && (
                <span className="flex items-center text-[9px] font-bold text-rose-500 ml-0.5 tracking-wide">
                  (! overdue)
                </span>
              )}
            </span>
          )}

          {/* Recurrence Badge */}
          {task.frequency && task.frequency !== "none" && (
            <span className="inline-flex items-center gap-1 rounded-sm border bg-[#1A1A24] text-indigo-400 border-indigo-950 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider">
              <Repeat className="h-2.5 w-2.5" />
              <span>{task.frequency}</span>
            </span>
          )}
        </div>

        {/* Action button bar */}
        <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {/* Change to next state button (if not completed) */}
          {task.status === "todo" && (
            <button
              onClick={() => onStatusChange(task.id, "in_progress")}
              className="flex h-7 w-7 items-center justify-center rounded-sm border border-white/8 bg-[#121212] text-white/60 hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer"
              title="Start working"
            >
              <Clock className="h-3.5 w-3.5" />
            </button>
          )}

          {task.status === "in_progress" && (
            <button
              onClick={() => onStatusChange(task.id, "done")}
              className="flex h-7 w-7 items-center justify-center rounded-sm border border-white/8 bg-[#121212] text-white/60 hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer"
              title="Complete task"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Edit Button */}
          <button
            onClick={() => onEdit(task)}
            className="flex h-7 w-7 items-center justify-center rounded-sm border border-white/8 bg-[#121212] text-white/60 hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer"
            title="Edit task"
          >
            <Edit2 className="h-3 w-3" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(task.id)}
            className="flex h-7 w-7 items-center justify-center rounded-sm border border-white/8 bg-[#121212] text-white/40 hover:bg-red-950 hover:text-red-400 hover:border-red-900/30 transition-all cursor-pointer"
            title="Delete task"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
