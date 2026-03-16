/** @type {const} */
const themeColors = {
  // LocaBuy Brand Colors – abgeleitet aus dem Logo:
  // Dunkelrot/Braun (Logo-Hintergrund), Grün (Blatt), Orange (Gemüse), Gold (Medaillon)

  // Primärfarbe: sattes Dunkelrot/Braun wie der Logo-Hintergrund
  primary:    { light: '#8B2500', dark: '#C0392B' },

  // Akzentfarbe: warmes Gold wie das Medaillon-Highlight
  gold:       { light: '#C9A84C', dark: '#E2C06A' },

  // Sekundärfarbe: kräftiges Grün wie das Blatt im Logo
  secondary:  { light: '#3A7D44', dark: '#4CAF50' },

  // Tertiärfarbe: warmes Orange wie die Möhren/Paprika im Korb
  accent:     { light: '#D4621A', dark: '#F57C00' },

  // Hintergründe: warmes Cremeweiß / tiefes Dunkelbraun
  background: { light: '#FFFBF5', dark: '#1A1008' },
  surface:    { light: '#FFF3E0', dark: '#2A1A0E' },

  // Texte
  foreground: { light: '#2C1A0E', dark: '#F5E6D3' },
  muted:      { light: '#7A5C44', dark: '#A08060' },

  // Rahmen: warmes Beige / dunkles Braun
  border:     { light: '#E8D5B0', dark: '#4A3020' },

  // Status
  success:    { light: '#3A7D44', dark: '#4CAF50' },
  warning:    { light: '#C9A84C', dark: '#E2C06A' },
  error:      { light: '#C0392B', dark: '#E74C3C' },
};

module.exports = { themeColors };
