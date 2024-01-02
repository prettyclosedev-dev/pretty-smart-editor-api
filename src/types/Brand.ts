import { objectType } from 'nexus'

export const Brand = objectType({
  name: 'Brand',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.email()
    t.model.phone()
    t.model.colors({ ordering: true, filtering: true, pagination: true })
    t.model.fonts({ ordering: true, filtering: true, pagination: true })
    t.model.logo()
    t.model.wordmark()
    t.model.icon()
    t.model.tagline()
    t.model.industry()
  },
})

export const Color = objectType({
  name: 'Color',
  definition(t) {
    t.model.id()
    t.model.value()
    t.model.primary()
    t.model.rank()
    t.model.brand()
  },
})

export const Font = objectType({
  name: 'Font',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.value()
    t.model.url()
    t.model.italic()
    t.model.bold()
    t.model.google()
    t.model.brand()
  },
})
