import { Prisma, PrismaPromise } from '@prisma/client'
import { list, mutationType, nonNull, nullable, stringArg } from 'nexus'
import { importUser, searchProcessesAsync, startImportProcessAsync } from '../utils/general'

export const Mutation = mutationType({
  definition(t) {
    // Create
    t.crud.createOneTemplate()
    t.crud.createOneClient()
    t.crud.createOneDesign()
    t.crud.createOnePage()
    t.crud.createOneCategory()
    t.crud.createOneUser()
    t.crud.createOneBrand()

    // Many
    t.field('createManyClient', {
      type: 'Boolean',
      args: {
        data: nonNull(list('ClientCreateInput')),
      },
      resolve: async (_parent, { data }, ctx) => {
        try {
          const success = await ctx.prisma.client.createMany({
            data,
          })
          return !!success
        } catch (e) {
          return e
        }
      },
    })
    t.field('createManyTemplate', {
      type: 'Boolean',
      args: {
        data: nonNull(list('TemplateCreateInput')),
      },
      resolve: async (_parent, { data }, ctx) => {
        try {
          const success = await ctx.prisma.template.createMany({
            data,
          })
          return !!success
        } catch (e) {
          return e
        }
      },
    })
    t.field('createManyDesign', {
      type: 'Boolean',
      args: {
        data: nonNull(list('DesignCreateInput')),
      },
      resolve: async (_parent, { data }, ctx) => {
        try {
          const success = await ctx.prisma.design.createMany({
            data,
          })
          return !!success
        } catch (e) {
          return e
        }
      },
    })
    t.field('createManyPage', {
      type: 'Boolean',
      args: {
        data: nonNull(list('PageCreateInput')),
      },
      resolve: async (_parent, { data }, ctx) => {
        try {
          const success = await ctx.prisma.page.createMany({
            data,
          })
          return !!success
        } catch (e) {
          return e
        }
      },
    })
    t.field('createManyCategory', {
      type: 'Boolean',
      args: {
        data: nonNull(list('CategoryCreateInput')),
      },
      resolve: async (_parent, { data }, ctx) => {
        try {
          const success = await ctx.prisma.category.createMany({
            data,
          })
          return !!success
        } catch (e) {
          return e
        }
      },
    })
    t.field('createManyUser', {
      type: 'Boolean',
      args: {
        data: nonNull(list('UserCreateInput')),
      },
      resolve: async (_parent, { data }, ctx) => {
        try {
          const success = await ctx.prisma.user.createMany({
            data,
          })
          return !!success
        } catch (e) {
          return e
        }
      },
    })
    t.field('createManyBrand', {
      type: 'Boolean',
      args: {
        data: nonNull(list('BrandCreateInput')),
      },
      resolve: async (_parent, { data }, ctx) => {
        try {
          const success = await ctx.prisma.brand.createMany({
            data,
          })
          return !!success
        } catch (e) {
          return e
        }
      },
    })
    
    // Update
    t.crud.updateOneClient()
    t.crud.updateOneTemplate()
    t.crud.updateOneDesign()
    t.crud.updateOnePage()
    t.crud.updateOneCategory()
    t.crud.updateOneUser()
    t.crud.updateOneBrand()

    // Many
    t.crud.updateManyClient()
    t.crud.updateManyTemplate()
    t.crud.updateManyDesign()
    t.crud.updateManyPage()
    t.crud.updateManyCategory()
    t.crud.updateManyUser()
    t.crud.updateManyBrand()

    // Delete
    t.crud.deleteOneTemplate()
    t.crud.deleteOneClient()
    t.crud.deleteOneDesign()
    t.crud.deleteOnePage()
    t.crud.deleteOneCategory()
    t.crud.deleteOneUser()
    t.crud.deleteOneBrand()

    // Many
    t.crud.deleteManyTemplate()
    t.crud.deleteManyClient()
    t.crud.deleteManyDesign()
    t.crud.deleteManyPage()
    t.crud.deleteManyCategory()
    t.crud.deleteManyUser()
    t.crud.deleteManyBrand()

    // Upsert
    t.crud.upsertOneTemplate()
    t.crud.upsertOneClient()
    t.crud.upsertOneDesign()
    t.crud.upsertOnePage()
    t.crud.upsertOneCategory()
    t.crud.upsertOneUser()
    t.crud.upsertOneBrand()
  },
})
