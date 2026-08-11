import { ChevronDown } from "lucide-react";

export function SelectField({ label, options, required = false, value, onChange, className = "" }: any) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] bg-white appearance-none transition-all"
        >
          {options.map((o: string) => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}
