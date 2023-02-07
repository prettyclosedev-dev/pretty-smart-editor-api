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

    t.nullable.field('jsonToImageBase64', {
      type: 'String',
      args: {
        designJson: "Json",
        attrs: "Json"
      },
      resolve: async (parent, {designJson, attrs}, ctx) => {
        try {
          const {jsonToImageBase64} = require("../../polotno/preview")
          const data = await jsonToImageBase64(designJson, attrs)
          return data;
        } catch (e) {
          throw e;
        }
      },
    })

    t.nullable.field('designToImageBase64', {
      type: 'String',
      args: {
        designId: "Int",
        attrs: "Json"
      },
      resolve: async (parent, {designId, attrs}, ctx) => {
        try {
          const designJson = await ctx.prisma.design.findUnique({where: {id: designId}, include: {pages: true}})
          if (!designJson) {
            throw new Error("No design found for the id provided.")
          }

          const {jsonToImageBase64} = require("../../polotno/preview")
          const data = await jsonToImageBase64(designJson, attrs)
          return data;
        } catch (e) {
          throw e;
        }
      },
    })

    t.nullable.field('designPreview', {
      type: 'String',
      args: {
        designJson: nullable("Json"),
        designId: nullable("Int"),
        mimeType: "String", // png, jpg, pdf, svg?
        dataType: "String", // base64, dataURL
        args: nullable("Json"),
      },
      resolve: async (parent, {designJson, designId, mimeType, dataType, args}, ctx) => {
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
            const {jsonToImageBase64, jsonToDataURL, jsonToPDFBase64, jsonToPDFDataURL} = require("../../polotno/preview")
            let data;
            if (mimeType === "pdf") {
              if (dataType === "base64") {
                data = await jsonToPDFBase64(designJson, args)
              } else {
                data = await jsonToPDFDataURL(designJson, args)
              }
            } else {
              if (dataType === "base64") {
                data = await jsonToImageBase64(designJson, args)
              } else {
                data = await jsonToDataURL(designJson, args)
              }
            }
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
