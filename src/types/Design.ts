import { objectType } from 'nexus'

export const Design = objectType({
  name: 'Design',
  definition(t) {
    t.model.id()
    t.model.polotnoId()
    t.model.name()
    t.model.preview()
    t.model.width()
    t.model.height()
    t.model.pages({ ordering: true, filtering: true, pagination: true })
    t.model.fonts()
    t.model.unit()
    t.model.publishedDate()
    t.model.editedDate()
    t.model.category()
    t.model.user()
  },
})

export const Category = objectType({
  name: 'Category',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.designs({ ordering: true, filtering: true, pagination: true })
  },
})
