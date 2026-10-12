import type { ReactNode } from 'react';

type SettingsSectionProps = { title: string; description: string; children: ReactNode };

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="bg-surface border-border rounded-lg border p-6">
      <h2 className="text-h3">{title}</h2>
      <p className="text-text-muted text-body-sm mt-1 max-w-reading">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
