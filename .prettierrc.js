export default {
  singleQuote: true,
  trailingComma: 'all',
  endOfLine: 'lf',
  tabWidth: 2,
  arrowParens: 'avoid',
  quoteProps: 'preserve',
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
  ],
  importOrder: ['<THIRD_PARTY_MODULES>', '^~/(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
