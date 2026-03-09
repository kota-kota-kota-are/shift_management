interface InputProps {
  label?: string;
  error?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  required?: boolean;
  className?: string;
}

export function Input({
  label,
  error,
  type = "text",
  placeholder,
  value,
  onChange,
  name,
  required = false,
  className = "",
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium text-text-primary"
        >
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`
          w-full px-3 py-2.5
          bg-bg-tertiary text-text-primary
          rounded-lg border-none outline-none
          placeholder:text-text-tertiary
          transition-all duration-fast
          focus:ring-2 focus:ring-system-blue/40
          ${error ? "ring-2 ring-system-red/40" : ""}
          ${className}
        `}
      />
      {error && (
        <p className="text-sm text-system-red">{error}</p>
      )}
    </div>
  );
}
