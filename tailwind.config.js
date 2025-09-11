// tailwind.config.js
module.exports = {
  // Apenas arquivos essenciais para gerar o CSS
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx,vue}"
  ],

  // JIT é padrão no Tailwind >=3.x
  theme: {
    extend: {
      // Cores principais do projeto (adicione só as que usa)
      colors: {
        primary: '#1E40AF', // azul principal
        secondary: '#F59E0B', // laranja/acento
      },
      // Espaçamentos customizados só se usar
      spacing: {
        72: '18rem',
        84: '21rem',
        96: '24rem',
      },
      // Fontes principais
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
    },
  },

  // Plugins só se realmente precisar
  plugins: [],

  // Desativando utilitários que não vai usar
  corePlugins: {
    float: false,
    container: false,
    gradientColorStops: false,
    divideOpacity: false,
    ringWidth: false,
    ringColor: false,
    ringOffsetWidth: false,
    ringOffsetColor: false,
    placeholderColor: false,
  },
};
