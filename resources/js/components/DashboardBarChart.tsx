import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DashboardBarChart({ monthlyData }: { monthlyData: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
        <BarChart data={monthlyData} barGap={4} barCategoryGap="20%" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground, #6b7280)" }} axisLine={false} tickLine={false} dy={10} />
          <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground, #6b7280)" }} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "12px", backgroundColor: "var(--card)" }} 
            cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }} />
          <Bar dataKey="registrasi" name="Registrasi" fill="var(--primary, #0E5A8A)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="terverifikasi" name="Terverifikasi" fill="var(--success, #10B981)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="ditolak" name="Ditolak" fill="var(--danger, #EF4444)" radius={[4, 4, 0, 0]} />
        </BarChart>
    </ResponsiveContainer>
  );
}
