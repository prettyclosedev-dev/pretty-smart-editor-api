import { rule, shield } from 'graphql-shield'
import { isAuthenticated } from '../utils'

const rules = {
  isAuthenticated: rule()(async (parent, args, context) => {
    const authenticated = await isAuthenticated(context, false)
    return Boolean(authenticated)
  }),
}

export const permissions = shield(
  {
    Query: {
      chatGPT: rules.isAuthenticated,
      
      // designs
      client: rules.isAuthenticated,
      clients: rules.isAuthenticated,
      clientsCount: rules.isAuthenticated,

      // designs
      design: rules.isAuthenticated,
      designs: rules.isAuthenticated,
      designsCount: rules.isAuthenticated,

      // templates
      template: rules.isAuthenticated,
      templates: rules.isAuthenticated,
      templatesCount: rules.isAuthenticated,

      // pages
      page: rules.isAuthenticated,
      pages: rules.isAuthenticated,
      pagesCount: rules.isAuthenticated,

      // users
      user: rules.isAuthenticated,
      users: rules.isAuthenticated,
      usersCount: rules.isAuthenticated,

      // brands
      brand: rules.isAuthenticated,
      brands: rules.isAuthenticated,
      brandsCount: rules.isAuthenticated,

      // categories
      category: rules.isAuthenticated,
      categories: rules.isAuthenticated,
      categoriesCount: rules.isAuthenticated,
    },
    Mutation: {
      // Create one
      createOneClient: rules.isAuthenticated,
      createOneDesign: rules.isAuthenticated,
      createOneTemplate: rules.isAuthenticated,
      createOnePage: rules.isAuthenticated,
      createOneCategory: rules.isAuthenticated,
      createOneUser: rules.isAuthenticated,
      createOneBrand: rules.isAuthenticated,
      // Create many
      createManyClient: rules.isAuthenticated,
      createManyTemplate: rules.isAuthenticated,
      createManyUser: rules.isAuthenticated,
      createManyCategory: rules.isAuthenticated,
      createManyDesign: rules.isAuthenticated,
      createManyPage: rules.isAuthenticated,
      createManyBrand: rules.isAuthenticated,
      // Update one
      updateOneClient: rules.isAuthenticated,
      updateOneTemplate: rules.isAuthenticated,
      updateOneDesign: rules.isAuthenticated,
      updateOnePage: rules.isAuthenticated,
      updateOneCategory: rules.isAuthenticated,
      updateOneUser: rules.isAuthenticated,
      updateOneBrand: rules.isAuthenticated,
      // Update many
      updateManyClient: rules.isAuthenticated,
      updateManyTemplate: rules.isAuthenticated,
      updateManyDesign: rules.isAuthenticated,
      updateManyPage: rules.isAuthenticated,
      updateManyCategory: rules.isAuthenticated,
      updateManyUser: rules.isAuthenticated,
      updateManyBrand: rules.isAuthenticated,
      // Upsert one
      upsertOneClient: rules.isAuthenticated,
      upsertOneTemplate: rules.isAuthenticated,
      upsertOneDesign: rules.isAuthenticated,
      upsertOnePage: rules.isAuthenticated,
      upsertOneCategory: rules.isAuthenticated,
      upsertOneUser: rules.isAuthenticated,
      upsertOneBrand: rules.isAuthenticated,
      // Delete one
      deleteOneClient: rules.isAuthenticated,
      deleteOneTemplate: rules.isAuthenticated,
      deleteOneDesign: rules.isAuthenticated,
      deleteOnePage: rules.isAuthenticated,
      deleteOneUser: rules.isAuthenticated,
      deleteOneCategory: rules.isAuthenticated,
      deleteOneBrand: rules.isAuthenticated,
      // Delete many
      deleteManyClient: rules.isAuthenticated,
      deleteManyTemplate: rules.isAuthenticated,
      deleteManyDesign: rules.isAuthenticated,
      deleteManyPage: rules.isAuthenticated,
      deleteManyUser: rules.isAuthenticated,
      deleteManyCategory: rules.isAuthenticated,
      deleteManyBrand: rules.isAuthenticated,
    },
  },
  {
    debug: false,
  },
)
