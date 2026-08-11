export function InputField({ label, type = "text", placeholder, required = false, value, onChange, className = "" }: any) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] bg-white transition-all"
      />
    </div>
  );
}
