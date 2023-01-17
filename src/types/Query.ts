import {
  idArg,
  intArg,
  queryType,
  arg,
  stringArg,
  nonNull,
  inputObjectType,
  nullable,
} from 'nexus'
import {
  getCustomTokenForUserByEmail,
  isAuthenticated,
  searchProcessesAsync,
} from '../utils'
require('dotenv').config()

export const Query = queryType({
  definition(t) {
    t.crud.client()
    t.crud.clients({ filtering: true, ordering: true, pagination: true })
    t.nullable.field('clientsCount', {
      type: 'Int',
      args: {
        where: 'ClientWhereInput',
      },
      resolve: (parent, args, ctx) => {
        return ctx.prisma.client.count({
          where: args.where,
        })
      },
    })

    t.crud.page()
    t.crud.pages({ filtering: true, ordering: true, pagination: true })
    t.nullable.field('pagesCount', {
      type: 'Int',
      args: {
        where: 'PageWhereInput',
      },
      resolve: (parent, args, ctx) => {
        return ctx.prisma.page.count({
          where: args.where,
        })
      },
    })

    t.crud.design()
    t.crud.designs({ filtering: true, ordering: true, pagination: true })
    t.nullable.field('designsCount', {
      type: 'Int',
      args: {
        where: 'DesignWhereInput',
      },
      resolve: (parent, args, ctx) => {
        return ctx.prisma.design.count({
          where: args.where,
        })
      },
    })

    t.crud.category()
    t.crud.categories({ filtering: true, ordering: true, pagination: true })
    t.nullable.field('categoriesCount', {
      type: 'Int',
      args: {
        where: 'CategoryWhereInput',
      },
      resolve: (parent, args, ctx) => {
        return ctx.prisma.category.count({
          where: args.where,
        })
      },
    })

    t.crud.user()
    t.crud.users({ filtering: true, ordering: true, pagination: true })
    t.nullable.field('usersCount', {
      type: 'Int',
      args: {
        where: 'UserWhereInput',
      },
      resolve: (parent, args, ctx) => {
        return ctx.prisma.user.count({
          where: args.where,
        })
      },
    })

    t.nullable.field('overridePreview', {
      type: 'String',
      args: {
        designJson: nullable("Json"),
        designId: nullable("Int")
      },
      resolve: async (parent, {designJson, designId}, ctx) => {
        if (designJson || !!designId) {
          if (!designJson && !!designId) {
            const design = await ctx.prisma.design.findUnique({where: {id: designId}, include: {pages: true}})
            if (design) {
              designJson = design
            } else {
              throw new Error("No design found for the id provided.")
            }
          }

          if (!designJson) {
            throw new Error("No designJson provided.")
          }

          try {
            const {run} = require("../../polotno/preview")
            const data = await run(designJson)
            return data;
          } catch (e) {
            throw e;
          }
        } else {
          throw new Error("No designJson or designId provided.")
        }
      },
    })
  },
})
