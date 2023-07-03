/** @type {import('tailwindcss').Config} */ 
module.exports = {
    content: ["./src/**/*.{html,js}", "./dist/window/**/*.{html,js}"],
    theme: {
      extend: {
        fontFamily: {
          "roboto": "'Roboto', sans-serif"
        },

        keyframes: {
          scrollingGradientframes: {
            '0%': { backgroundPosition: '0% 50%' },
            '50%' : { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          }
        },
  
        animation: {
          scrollingGradient: 'scrollingGradientframes 15s ease infinite',
          fastScrollingGradient: 'scrollingGradientframes 5s ease infinite'
        },

        width: {
          "1/7": "14.2%",
          "1/8": "12.5%",
        },

        height: {
          "30r":"30rem",
          "1/7": "14.2%",
          "1/8": "12.5%",
        },

        backgroundSize: {
          gradientSize: '400% 400%',
        },
      },
    },
      plugins: [
        require('tailwind-scrollbar')({ nocompatible: true }),
      ],
  }
  
  // Commmand to start tailwind: npx tailwindcss -i ./src/index.css -o ./dist/output.css --watch --minify