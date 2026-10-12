export type SettingSource = 'leader' | 'installation' | 'none';

export type ModelOption = { id: string; label: string; description: string };

export type Settings = {
  apiKey: {
    configured: boolean;
    source: SettingSource;
    // Só os 4 últimos caracteres: o servidor nunca devolve a chave inteira.
    last4: string | null;
    updatedAt: string | null;
  };
  model: { value: string | null; source: SettingSource; options: ModelOption[] };
  prompt: { text: string; isCustom: boolean; minChars: number; maxChars: number };
};
