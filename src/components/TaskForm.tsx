import React, { useState, useEffect } from "react";
import { X, Calendar, AlertTriangle, CheckSquare, Plus, Edit } from "lucide-react";
import { Task, TaskStatus, TaskPriority, TaskFrequency } from "../types";

interface TaskFormProps {
  task?: Task | null; // If present, we are in Edit mode
  onSave: (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    frequency: TaskFrequency;
  }) => Promise<void>;
  onClose: () => void;
}

export default function TaskForm({ task, onSave, onClose }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [frequency, setFrequency] = useState<TaskFrequency>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate || "");
      setFrequency(task.frequency || "none");
    } else {
      setTitle("");
      setDescription("");
      setStatus("todo");
      setPriority("medium");
      setFrequency("none");
      
      // Default due date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split("T")[0]);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        dueDate,
        frequency,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/85 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-sm border border-white/8 bg-[#121212] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 bg-[#0A0A0A]/40 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 bg-white/5 text-white">
              {task ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </div>
            <h2 className="font-display text-lg font-bold text-white">
              {task ? "Modify Entry" : "New Task"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-sm bg-red-950/20 p-3.5 text-sm text-red-400 border border-red-900/20">
              <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="task-title" className="block text-[10px] font-semibold uppercase tracking-widest text-white/40 font-sans mb-1.5">
                Task Title
              </label>
              <input
                type="text"
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                placeholder="Write a clear name..."
                className="w-full rounded-sm border border-white/8 bg-[#0D0D0D] px-4 py-2.5 text-sm text-white placeholder-white/20 shadow-sm focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="task-description" className="block text-[10px] font-semibold uppercase tracking-widest text-white/40 font-sans mb-1.5">
                Description
              </label>
              <textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Establish detailed notes or trajectory..."
                className="w-full rounded-sm border border-white/8 bg-[#0D0D0D] px-4 py-2.5 text-sm text-white placeholder-white/20 shadow-sm focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="task-status" className="block text-[10px] font-semibold uppercase tracking-widest text-white/40 font-sans mb-1.5">
                  Status
                </label>
                <select
                  id="task-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full rounded-sm border border-white/8 bg-[#0D0D0D] px-3 py-2.5 text-sm text-white shadow-sm focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all [&_option]:bg-[#121212]"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Completed</option>
                </select>
              </div>

              <div>
                <label htmlFor="task-priority" className="block text-[10px] font-semibold uppercase tracking-widest text-white/40 font-sans mb-1.5">
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-sm border border-white/8 bg-[#0D0D0D] px-3 py-2.5 text-sm text-white shadow-sm focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all [&_option]:bg-[#121212]"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>

            {/* Due Date & Frequency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="task-due-date" className="block text-[10px] font-semibold uppercase tracking-widest text-white/40 font-sans mb-1.5">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                  <input
                    type="date"
                    id="task-due-date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-sm border border-white/8 bg-[#0D0D0D] pl-10 pr-4 py-2.5 text-sm text-white shadow-sm focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="task-frequency" className="block text-[10px] font-semibold uppercase tracking-widest text-white/40 font-sans mb-1.5">
                  Frequency (Recurrence)
                </label>
                <select
                  id="task-frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as TaskFrequency)}
                  className="w-full rounded-sm border border-white/8 bg-[#0D0D0D] px-3 py-2.5 text-sm text-white shadow-sm focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all [&_option]:bg-[#121212]"
                >
                  <option value="none">One-time Task</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/8 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-white/8 bg-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/70 hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-sm bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black hover:bg-neutral-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>{task ? "Save Entry" : "Add Entry"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
