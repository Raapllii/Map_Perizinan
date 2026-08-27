import { ChevronDown } from "lucide-react";

export function SelectField({ label, options, required = false, value, onChange, name, className = "", error, disabled }: any) {
  return (
    <div className={className}>
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${disabled ? 'text-muted-foreground' : 'text-foreground'}`}>
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-3.5 py-2.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-input-background appearance-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-danger focus:ring-danger/20' : 'border-input hover:border-input/80'}`}
        >
          {options.map((o: any) => {
            const isObject = typeof o === 'object' && o !== null;
            const val = isObject ? o.value : o;
            const lbl = isObject ? o.label : o;
            return <option key={String(val)} value={String(val)}>{lbl}</option>;
          })}
        </select>
        <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${disabled ? 'text-muted-foreground' : 'text-foreground/50'}`} />
      </div>
      {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
    </div>
  );
}
