const Filters = {
  site: 'all',
  from: '',
  to: '',
  onchange: null,
  set(partial) {
    if (partial.site !== undefined) this.site = partial.site;
    if (partial.from !== undefined) this.from = partial.from;
    if (partial.to !== undefined) this.to = partial.to;
    if (typeof this.onchange === 'function') this.onchange();
  },
  reset() {
    this.site = 'all';
    this.from = '';
    this.to = '';
    if (typeof this.onchange === 'function') this.onchange();
  }
};
if (typeof window !== 'undefined') window.Filters = Filters;
