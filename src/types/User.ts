import { objectType } from 'nexus'

export const User = objectType({
  name: 'User',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.email()
    t.model.avatar()
    t.model.role()
    t.model.designs({ ordering: true, filtering: true, pagination: true })
    t.model.templates({ ordering: true, filtering: true, pagination: true })
    t.model.brands({ ordering: true, filtering: true, pagination: true })
  },
})