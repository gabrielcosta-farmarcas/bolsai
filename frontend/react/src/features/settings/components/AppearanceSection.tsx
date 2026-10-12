import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { SettingsSection } from './SettingsSection';

export function AppearanceSection() {
  return (
    <SettingsSection
      title="Aparência"
      description="Claro ou escuro. Sem escolha, o Bonsai segue o tema do seu computador. A escolha fica guardada neste navegador."
    >
      <ThemeToggle />
    </SettingsSection>
  );
}
