import { Prisma, PrismaPromise } from '@prisma/client'
import {
  arg,
  intArg,
  list,
  mutationType,
  nonNull,
  nullable,
  stringArg,
} from 'nexus'
import {
  importUser,
  searchProcessesAsync,
  startImportProcessAsync,
} from '../utils/general'
import { Upload } from './Upload'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'

export const Mutation = mutationType({
  definition(t) {
    // Create
    t.crud.createOneClient()
    t.crud.createOneDesign()
    // t.crud.createOnePage()
    t.crud.createOneCategory()
    t.crud.createOneUser()
    t.crud.createOneBrand()
    t.crud.createOneForm()

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
    // t.field('createManyPage', {
    //   type: 'Boolean',
    //   args: {
    //     data: nonNull(list('PageCreateInput')),
    //   },
    //   resolve: async (_parent, { data }, ctx) => {
    //     try {
    //       const success = await ctx.prisma.page.createMany({
    //         data,
    //       })
    //       return !!success
    //     } catch (e) {
    //       return e
    //     }
    //   },
    // })
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
    t.field('createManyForm', {
      type: 'Boolean',
      args: {
        data: nonNull(list('FormCreateInput')),
      },
      resolve: async (_parent, { data }, ctx) => {
        try {
          const success = await ctx.prisma.form.createMany({
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
    t.crud.updateOneDesign()
    // t.crud.updateOnePage()
    t.crud.updateOneCategory()
    t.crud.updateOneUser()
    t.crud.updateOneBrand()
    t.crud.updateOneForm()

    // Many
    t.crud.updateManyClient()
    t.crud.updateManyDesign()
    // t.crud.updateManyPage()
    t.crud.updateManyCategory()
    t.crud.updateManyUser()
    t.crud.updateManyBrand()
    t.crud.updateManyForm()

    // Delete
    t.crud.deleteOneClient()
    t.crud.deleteOneDesign()
    // t.crud.deleteOnePage()
    t.crud.deleteOneCategory()
    t.crud.deleteOneUser()
    t.crud.deleteOneBrand()
    t.crud.deleteOneForm()

    // Many
    t.crud.deleteManyClient()
    t.crud.deleteManyDesign()
    // t.crud.deleteManyPage()
    t.crud.deleteManyCategory()
    t.crud.deleteManyUser()
    t.crud.deleteManyBrand()
    t.crud.deleteManyForm()

    // Upsert
    t.crud.upsertOneClient()
    t.crud.upsertOneDesign()
    // t.crud.upsertOnePage()
    t.crud.upsertOneCategory()
    t.crud.upsertOneUser()
    t.crud.upsertOneBrand()
    t.crud.upsertOneForm()

    t.field('setCategoryPriority', {
      type: 'Boolean',
      args: {
        categoryId: nonNull(intArg()),
        newPriority: nonNull(intArg()),
      },
      resolve: async (_parent, { categoryId, newPriority }, ctx) => {
        return await ctx.prisma.$transaction(async (prisma) => {
          let currentPriority = newPriority;
    
          while (true) {
            // Check if there is a conflict at the current priority
            const conflictingCategory = await prisma.category.findUnique({
              where: { priority: currentPriority },
            });
    
            if (!conflictingCategory) {
              // No conflict, exit the loop
              break;
            }
    
            // Increment the conflicting category's priority
            await prisma.category.update({
              where: { id: conflictingCategory.id },
              data: { priority: currentPriority + 1 },
            });
    
            // Move to the next priority to resolve further conflicts
            currentPriority++;
          }
    
          // Update the target category to the desired priority
          await prisma.category.update({
            where: { id: categoryId },
            data: { priority: newPriority },
          });
    
          return true;
        });
      },
    });    

    t.field('uploadCategoryIcon', {
      type: 'String',
      args: {
        file: nonNull(arg({ type: 'Upload' })),
        categoryId: nonNull(intArg()),
      },
      resolve: async (_parent, { file, categoryId }, ctx) => {
        const { createReadStream, filename, mimetype, encoding } = await file
        const stream = createReadStream()

        // Fetch category by ID to get the name
        const category = await ctx.prisma.category.findUnique({
          where: { id: categoryId },
        })

        if (!category) {
          throw new Error(`Category with ID ${categoryId} not found.`)
        }

        const categoryName = category.name
        const iconDir = path.join(
          __dirname,
          '../../uploads/icons/categories',
          categoryName,
        )
        const uniqueFilename = `${uuidv4()}-${filename}`
        const filePath = path.join(iconDir, uniqueFilename)

        if (!fs.existsSync(iconDir)) {
          fs.mkdirSync(iconDir, { recursive: true })
        }

        await new Promise((resolve, reject) => {
          const writeStream = fs.createWriteStream(filePath)
          stream.on('error', (error) => {
            if (writeStream) {
              writeStream.destroy(error)
            }
            reject(error)
          })

          stream
            .pipe(writeStream)
            .on('error', (error) => reject(error))
            .on('finish', () => resolve(filePath))
        })

        const baseUrl = 'https://clyps.io'

        const url = baseUrl + `/uploads/icons/categories/${categoryName}/${uniqueFilename}`
        await ctx.prisma.category.update({
          where: { id: categoryId },
          data: { icon: url },
        })

        return url
      },
    })
  },
})
