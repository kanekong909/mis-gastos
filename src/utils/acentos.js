// Paletas del color del tema. Los tonos reales están en index.css
// ([data-acento='...']); `hex` solo sirve para el favicon y la barra del navegador.
export const ACENTOS = [
  { id: 'violeta', nombre: 'Violeta', hex: '#6d4aff' },
  { id: 'azul', nombre: 'Azul', hex: '#2f6bff' },
  { id: 'cian', nombre: 'Cian', hex: '#0e9ec2' },
  { id: 'verde', nombre: 'Verde', hex: '#12a15b' },
  { id: 'naranja', nombre: 'Naranja', hex: '#e8741a' },
  { id: 'rojo', nombre: 'Rojo', hex: '#e0394a' },
  { id: 'rosa', nombre: 'Rosa', hex: '#e0449a' },
];

export const ACENTO_INICIAL = 'violeta';

export const iconoSvg = (hex) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${hex}"/><path d="M18 24h28a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4h22" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="42" cy="36" r="3.5" fill="#fff"/></svg>`;
