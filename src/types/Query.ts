import {
  idArg,
  intArg,
  queryType,
  arg,
  stringArg,
  nonNull,
  inputObjectType,
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
  },
})
