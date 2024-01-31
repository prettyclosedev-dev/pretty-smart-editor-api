import { objectType } from 'nexus'

export const Page = objectType({
  name: 'Page',
  definition(t) {
    t.model.id()
    t.model.polotnoId()
    t.model.children()
    t.model.width()
    t.model.height()
    t.model.background()
    t.model.bleed()
    t.model.duration()
  },
})