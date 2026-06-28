import { Task, TaskStatus } from "../types";
import TaskCard from "./TaskCard";
import { AnimatePresence } from "motion/react";

interface ListViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
}

export default function ListView({ tasks, onEdit, onDelete, onStatusChange }: ListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-sm border border-dashed border-white/8 bg-[#121212]">
        <p className="text-sm font-semibold text-white font-sans">No tasks found matching your current filters.</p>
        <p className="mt-1 text-xs text-white/40 font-mono uppercase tracking-wider">Try creating a new task or clearing your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
