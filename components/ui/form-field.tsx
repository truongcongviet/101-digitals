type FormFieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
};

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
