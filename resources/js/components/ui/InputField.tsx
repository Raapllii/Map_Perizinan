export function InputField({ label, type = "text", placeholder, required = false, value, onChange, className = "", error, disabled }: any) {
  return (
    <div className={className}>
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${disabled ? 'text-muted-foreground' : 'text-foreground'}`}>
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3.5 py-2.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-input-background transition-colors placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-danger focus:ring-danger/20' : 'border-input hover:border-input/80'}`}
      />
      {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
    </div>
  );
}
