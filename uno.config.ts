import { defineConfig, presetAttributify, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetAttributify()],
  shortcuts: {
    'stack-shell':
      'rounded-[2rem] border border-[rgb(var(--ink)/0.10)] bg-[rgb(255_255_255/0.70)] shadow-[0_30px_80px_-38px_rgba(34,22,18,0.42)] backdrop-blur-xl',
    'tone-label':
      'inline-flex items-center gap-2 rounded-full border border-[rgb(var(--ink)/0.10)] bg-[rgb(255_255_255/0.70)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--ink)/0.65)]',
    'ring-link':
      'inline-flex items-center justify-center gap-2 rounded-full border border-[rgb(var(--ink)/0.10)] px-4 py-2 text-sm font-medium text-[rgb(var(--ink))] transition duration-200 hover:-translate-y-0.5 hover:border-[rgb(var(--ink)/0.20)] hover:bg-[rgb(var(--ink))] hover:text-white',
  },
})
