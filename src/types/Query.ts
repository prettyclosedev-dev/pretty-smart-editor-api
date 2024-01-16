import {
  idArg,
  intArg,
  queryType,
  arg,
  stringArg,
  nonNull,
  inputObjectType,
  nullable,
  list,
} from 'nexus'

import {
  getCustomTokenForUserByEmail,
  isAuthenticated,
  searchProcessesAsync,
} from '../utils'
import { updateDesignWithBrand } from '../design.utils'

import * as fs from 'fs'
import * as path from 'path'

import { createInstance } from 'polotno-node';

import OpenAI from 'openai';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    t.nullable.field('brandedDesign', {
      type: 'Json',
      args: {
        where: 'DesignWhereUniqueInput',
        email: nonNull('String'),
        brandWhere: nullable('BrandWhereUniqueInput'),
      },
      resolve: async (parent, args, ctx) => {
        try {
          const design = await ctx.prisma.design.findUnique({
            where: args.where,
            include: {
              pages: true,
            },
          })
          const user = await ctx.prisma.user.findUnique({
            where: {
              email: args.email,
            },
            include: {
              brands: {
                include: {
                  colors: true,
                  fonts: true,
                },
              },
            },
          })
          if (!user) {
            throw new Error('No user found for the email provided.')
          }
          const brand = args.brandWhere ? user.brands?.find(b => b.id === args.brandWhere.id) || user.brands?.[0] : user.brands?.[0]
          if (!brand) {
            throw new Error('No brand found for the user provided.')
          }
          const updatedDesign = await updateDesignWithBrand(design, brand);
          return updatedDesign;
        } catch (e) {
          throw e
        }
      },
    })
    t.crud.designs({ filtering: true, ordering: true, pagination: true })
    t.nullable.field('brandedDesigns', {
      type: list('Json'),
      args: {
        where: 'DesignWhereInput',
        take: nullable('Int'),
        skip: nullable('Int'),
        orderBy: 'DesignOrderByWithRelationInput',
        cursor: 'DesignWhereUniqueInput',
        email: nonNull('String'),
        brandWhere: nullable('BrandWhereUniqueInput'),
      },
      resolve: async (parent, args, ctx) => {
        try {
          const designs = await ctx.prisma.design.findMany({
            where: args.where,
            take: args.take,
            orderBy: args.orderBy,
            skip: args.skip,
            cursor: args.cursor,
            include: {
              pages: true,
            },
          })
          const user = await ctx.prisma.user.findUnique({
            where: {
              email: args.email,
            },
            include: {
              brands: {
                include: {
                  colors: true,
                  fonts: true,
                },
              },
            },
          })
          if (!user) {
            throw new Error('No user found for the email provided.')
          }
          const brand = args.brandWhere ? user.brands?.find(b => b.id === args.brandWhere.id) || user.brands?.[0] : user.brands?.[0]
          if (!brand) {
            throw new Error('No brand found for the user provided.')
          }
          const updatedDesigns = await Promise.all(
            designs.map(async design => await updateDesignWithBrand(design, brand))
          );
          return updatedDesigns;
        } catch (e) {
          throw e
        }
      },
    })
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

    t.crud.template()
    t.crud.templates({ filtering: true, ordering: true, pagination: true })
    t.nullable.field('templatesCount', {
      type: 'Int',
      args: {
        where: 'TemplateWhereInput',
      },
      resolve: (parent, args, ctx) => {
        return ctx.prisma.template.count({
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

    t.crud.brand()
    t.crud.brands({ filtering: true, ordering: true, pagination: true })
    t.nullable.field('brandsCount', {
      type: 'Int',
      args: {
        where: 'BrandWhereInput',
      },
      resolve: (parent, args, ctx) => {
        return ctx.prisma.brand.count({
          where: args.where,
        })
      },
    })

    t.nullable.field('jsonToImageBase64', {
      type: 'String',
      args: {
        designJson: 'Json',
        attrs: 'Json',
      },
      resolve: async (parent, { designJson, attrs }, ctx) => {
        try {
          const instance = await createInstance({
            key: process.env.POLOTNO_KEY,
          });
          const data = await instance.jsonToImageBase64(designJson, attrs)
          return data
        } catch (e) {
          throw e
        }
      },
    })

    t.nullable.field('designToImageBase64', {
      type: 'String',
      args: {
        designId: 'Int',
        attrs: 'Json',
      },
      resolve: async (parent, { designId, attrs }, ctx) => {
        try {
          const designJson = await ctx.prisma.design.findUnique({
            where: { id: designId },
            include: { pages: true },
          })
          if (!designJson) {
            throw new Error('No design found for the id provided.')
          }

          const instance = await createInstance({
            key: process.env.POLOTNO_KEY,
          });
          const data = await instance.jsonToImageBase64(designJson, attrs)
          return data
        } catch (e) {
          throw e
        }
      },
    })

    t.nullable.field('designPreview', {
      type: 'String',
      args: {
        designJson: nullable('Json'),
        designId: nullable('Int'),
        mimeType: 'String', // png, jpg, pdf, svg?
        dataType: 'String', // base64, dataURL
        args: nullable('Json'),
      },
      resolve: async (
        parent,
        { designJson, designId, mimeType, dataType, args },
        ctx,
      ) => {
        if (designJson || !!designId) {
          if (!designJson && !!designId) {
            const design = await ctx.prisma.design.findUnique({
              where: { id: designId },
              include: { pages: true },
            })
            if (design) {
              designJson = design
            } else {
              throw new Error('No design found for the id provided.')
            }
          }

          if (!designJson) {
            throw new Error('No designJson provided.')
          }

          try {
            const instance = await createInstance({
              key: process.env.POLOTNO_KEY,
            });
            let data
            if (mimeType === 'pdf') {
              if (dataType === 'base64') {
                data = await instance.jsonToPDFBase64(designJson, args)
              } else {
                data = await instance.jsonToPDFDataURL(designJson, args)
              }
            } else {
              if (dataType === 'base64') {
                data = await instance.jsonToImageBase64(designJson, args)
              } else {
                data = await instance.jsonToDataURL(designJson, args)
              }
            }
            return data
          } catch (e) {
            throw e
          }
        } else {
          throw new Error('No designJson or designId provided.')
        }
      },
    })

    t.nullable.field('chatGPT', {
      type: 'Json',
      args: {
        messages: 'Json',
        model: nullable('String'),
        temperature: nullable('Float'),
        top_p: nullable('Float'),
        frequency_penalty: nullable('Float'),
        presence_penalty: nullable('Float'),
        max_tokens: nullable('Int'),
      },
      resolve: async (
        parent,
        {
          messages,
          model,
          temperature,
          top_p,
          frequency_penalty,
          presence_penalty,
          max_tokens,
        },
        ctx,
      ) => {
        try {
          const filePath = path.join(
            __dirname,
            '../../src/assets/system-role.txt',
          )
          const systemRoleContent = await fs.promises.readFile(filePath, 'utf8')

          const modifiedMessages = [
            {
              role: 'system',
              content: systemRoleContent,
            },
            ...messages,
          ]

          const completion = await openai.createChatCompletion({
            model: model || 'gpt-4',
            messages: modifiedMessages,
            temperature: temperature || 0.7,
            top_p: top_p || 1,
            frequency_penalty: frequency_penalty || 0,
            presence_penalty: presence_penalty || 0,
            max_tokens: max_tokens || 2048,
          })
          return completion.data.choices[0].message
        } catch (e) {
          throw e
        }
      },
    })

    t.nullable.field('unsplash', {
      type: 'Json',
      args: {
        query: 'String',
        color: nullable('String'),
        orientation: nullable('String'),
      },
      resolve: async (parent, { query, color, orientation }, ctx) => {
        const apiKey = 'REMOVED_UNSPLASH_KEY'
        let apiUrl = `https://api.unsplash.com/search/photos?query=${query}&page=1&per_page=1&client_id=${apiKey}`

        if (color) {
          apiUrl += `&color=${color}`
        }

        if (orientation) {
          apiUrl += `&orientation=${orientation}`
        }

        try {
          const response = await fetch(apiUrl)
          const data = await response.json()
          return data
        } catch (e) {
          throw e
        }
      },
    })
  },
})
