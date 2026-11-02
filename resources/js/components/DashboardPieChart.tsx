import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPieChart({ distributionData }: { distributionData: any[] }) {
  const hasData = distributionData && distributionData.length > 0 && distributionData.some(d => Number(d.value) > 0);

  if (!hasData) {
    return (
      <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground text-xs">
        <p>Belum ada data distribusi kategori</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
          dataKey="value" paddingAngle={3} stroke="var(--card)">
          {distributionData.map((d: any, i: number) => <Cell key={i} fill={d.color || `var(--chart-${(i % 5) + 1})`} />)}
        </Pie>
        <Tooltip formatter={(v: any) => [v.toLocaleString("id"), "Usaha"]}
          contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "12px", backgroundColor: "var(--card)" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
