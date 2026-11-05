// Small form building blocks shared by the step screens.

export function TextArea({ id, name, label, defaultValue = "", rows = 3, placeholder, required }: { id: string; name: string; label: string; defaultValue?: string; rows?: number; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <textarea id={id} name={name} rows={rows} defaultValue={defaultValue} placeholder={placeholder} required={required} className="field" />
    </div>
  );
}

export function TextInput({ id, name, label, defaultValue = "", placeholder, required, hint }: { id: string; name: string; label: string; defaultValue?: string; placeholder?: string; required?: boolean; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} name={name} defaultValue={defaultValue} placeholder={placeholder} required={required} className="field" />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Select({ id, name, label, options, defaultValue }: { id: string; name: string; label: string; options: { value: string; label: string }[]; defaultValue?: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <select id={id} name={name} defaultValue={defaultValue} className="field">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function CheckboxList({ idPrefix, name, legend, items, checked = [], empty }: { idPrefix: string; name: string; legend: string; items: { id: string; label: string }[]; checked?: string[]; empty: string }) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      {items.length === 0 ? (
        <p className="text-xs text-muted">{empty}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((it) => (
            <label key={it.id} htmlFor={`${idPrefix}-${it.id}`} className="flex items-start gap-2 text-sm">
              <input id={`${idPrefix}-${it.id}`} type="checkbox" name={name} value={it.id} defaultChecked={checked.includes(it.id)} className="mt-1 accent-[var(--accent)]" />
              <span>{it.label}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

/** Shows a value the user entered, or a clear "Unknown" marker. Never a guess. */
export function ValueOrUnknown({ value }: { value: string }) {
  return value.trim() ? (
    <span className="tabular-nums">{value}</span>
  ) : (
    <span className="inline-block rounded border border-dashed border-muted px-1.5 font-mono text-[0.7rem] text-muted">Unknown</span>
  );
}

export function AddPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-md border border-dashed border-line p-4 open:border-solid open:bg-bg">
      <summary className="cursor-pointer list-none text-sm font-semibold text-accent marker:hidden">
        <span className="group-open:hidden">+ {title}</span>
        <span className="hidden group-open:inline">{title}</span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
