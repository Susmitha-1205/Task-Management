import { useMemo } from "react";
import { CheckCircle2, Circle, Clock, PieChart, Repeat } from "lucide-react";
import { Task } from "../types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface DashboardStatsProps {
  tasks: Task[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-sm border border-white/8 bg-[#121212] p-2.5 shadow-md">
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
          {payload[0].payload.date}
        </p>
        <p className="mt-1 text-xs font-semibold text-white">
          {payload[0].value} {payload[0].value === 1 ? "task" : "tasks"} completed
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardStats({ tasks }: DashboardStatsProps) {
  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  // Helper to format local date safely without UTC shift
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const chartData = useMemo(() => {
    const days = [];
    const today = new Date();
    
    // Generate the last 7 days (including today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dateKey = getLocalDateString(d);
      
      days.push({
        date: dateLabel,
        key: dateKey,
        count: 0,
      });
    }

    // Populate completed counts based on task updatedAt or createdAt
    tasks.forEach((task) => {
      if (task.status === "done") {
        const compTimestamp = task.updatedAt || task.createdAt;
        if (compTimestamp) {
          const compDate = new Date(compTimestamp);
          const compKey = getLocalDateString(compDate);
          const matchedDay = days.find((day) => day.key === compKey);
          if (matchedDay) {
            matchedDay.count += 1;
          }
        }
      }
    });

    return days;
  }, [tasks]);

  const stats = [
    {
      label: "Total Tasks",
      value: total,
      icon: PieChart,
      color: "text-white/80 bg-white/5 border-white/8",
    },
    {
      label: "To Do",
      value: todo,
      icon: Circle,
      color: "text-white/80 bg-white/5 border-white/8",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: Clock,
      color: "text-white/80 bg-white/5 border-white/8",
    },
    {
      label: "Completed",
      value: `${done}/${total}`,
      icon: CheckCircle2,
      color: "text-white bg-white/10 border-white/15",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col rounded-sm border border-white/8 bg-[#121212] p-5 transition-all hover:border-neutral-600"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold font-sans">
                {stat.label}
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-sm border ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <span className="mt-4 text-2xl font-bold text-white font-display">
              {stat.value}
            </span>
            {stat.label === "Completed" && total > 0 && (
              <div className="mt-4">
                <div className="w-full rounded-none bg-neutral-800 h-1 overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-500 ease-out"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[9px] font-mono text-white/30 uppercase tracking-widest text-right">
                  {completionRate}% completed
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Activity Chart Section */}
      <div className="rounded-sm border border-white/8 bg-[#121212] p-5 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xs uppercase tracking-widest font-bold text-white font-sans">
              Velocity
            </h3>
            <p className="mt-1 text-[10px] font-mono text-white/40 uppercase tracking-wider">
              Completed tasks over past 7 days
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-white font-display">
              {tasks.filter((t) => t.status === "done").length}
            </span>
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
              Total Done
            </p>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255, 255, 255, 0.3)" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                fontFamily="var(--font-mono)"
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.3)" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                fontFamily="var(--font-mono)"
                allowDecimals={false}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
              />
              <Bar 
                dataKey="count" 
                fill="#ffffff" 
                radius={[2, 2, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
