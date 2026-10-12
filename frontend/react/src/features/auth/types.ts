// Quem está logado, como o servidor informa em /api/v1/auth/me. Papéis servem só para esconder
// botões: quem decide o que cada pessoa pode fazer é sempre o servidor.
export type AuthUser = {
  name: string | null;
  email: string | null;
  roles: string[];
};
