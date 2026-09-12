import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function InputField({ label, type = "text", placeholder, required = false, value, onChange, name, className = "", error, disabled }: any) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`min-w-0 ${className}`}>
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${disabled ? 'text-muted-foreground' : 'text-foreground'}`}>
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-3.5 py-2.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-input-background transition-colors placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-danger focus:ring-danger/20' : 'border-input hover:border-input/80'} ${isPassword ? 'pr-10' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
    </div>
  );
}
