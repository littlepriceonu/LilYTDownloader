module.exports = {
    plugins: [
        require('postcss-import'),
        require('postcss-preset-env'),
        require('postcss-advanced-variables'),
        require('autoprefixer'),
        require('tailwindcss/nesting'),
        require('tailwindcss'),
        require('cssnano'),
    ]
}