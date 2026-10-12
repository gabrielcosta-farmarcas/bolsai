// Aplica o tema guardado antes de a tela aparecer (evita piscar). É um arquivo à parte, e não um
// script dentro do index.html, para a política de segurança de produção dispensar 'unsafe-inline'.
try {
  var t = localStorage.getItem('bonsai-theme');
  if (t === 'dark' || t === 'light') document.documentElement.classList.add(t);
} catch {
  // Sem acesso ao armazenamento do navegador (aba privada): segue o tema do sistema.
}
