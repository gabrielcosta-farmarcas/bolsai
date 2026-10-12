import {
  ApiKeySection,
  AppearanceSection,
  ModelSection,
  PromptSection,
  useSettings,
} from '@/features/settings';

export function SettingsPage() {
  const settings = useSettings();

  return (
    <>
      <h1>Configurações</h1>
      <p className="text-text-muted mt-1">
        A aparência do Bonsai e como a IA trabalha para você: a chave, o modelo e as instruções da
        análise.
      </p>

      <div className="mt-6 max-w-4xl">
        <AppearanceSection />
      </div>

      {settings.isLoading ? (
        <p role="status" className="text-text-muted mt-6">
          Carregando…
        </p>
      ) : null}
      {settings.error ? (
        <p role="alert" className="text-danger mt-6">
          {settings.error.message}
        </p>
      ) : null}
      {settings.data ? (
        <div className="mt-6 grid max-w-4xl gap-6">
          <ApiKeySection apiKey={settings.data.apiKey} />
          <ModelSection model={settings.data.model} />
          <PromptSection prompt={settings.data.prompt} />
        </div>
      ) : null}
    </>
  );
}
