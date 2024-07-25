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
    t.model.pages()
    t.model.fonts()
    t.model.unit()
    t.model.dpi()
    t.model.publishedDate()
    t.model.editedDate()
    t.model.categories({ ordering: true, filtering: true, pagination: true })
    t.model.creator()
    t.model.public()
    t.model.tags()
    t.model.availableForBrands({ ordering: true, filtering: true, pagination: true })
    t.model.favoredBy({ ordering: true, filtering: true, pagination: true })
  },
})

export const Category = objectType({
  name: 'Category',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.creator()
    t.model.public()
    t.model.designs({ ordering: true, filtering: true, pagination: true })
    t.model.tags()
    t.model.availableForBrands({ ordering: true, filtering: true, pagination: true })
    t.model.availableOnPages()
  },
})
