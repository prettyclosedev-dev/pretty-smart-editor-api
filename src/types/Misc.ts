import { objectType, enumType, extendInputType } from 'nexus'

//   export interface ExportOptions {
//     pixelRatio?: number;
//     ignoreBackground?: boolean;
//     pageId?: string;
//     includeBleed?: boolean;
//     mimeType?: 'image/png' | 'image/jpeg';
//     quality?: number;
// }
//save as Image fileName

export const MimeType = enumType({
  name: 'MimeType',
  members: {
    PNG: 1,
    JPG: 2,
    PDF: 3,
  },
})

export const DataType = enumType({
  name: 'DataType',
  members: {
    Base64: 1,
    DataUrl: 2,
  },
})

export const ExportOptions = objectType({
  name: 'ExportOptions',
  definition(t) {
    t.field('pixelRatio', {
      type: 'Int',
    })
    t.field('ignoreBackground', {
      type: 'Boolean',
    })
    t.field('pageId', {
      type: 'String',
    })
    t.field('includeBleed', {
      type: 'Boolean',
    })
    t.field('quality', {
      type: 'Float',
    })
    t.field('fileName', {
      type: 'String', // save as image;
    })
    t.model('mimeType', {
      type: 'MimeType', // 'image/png' | 'image/jpeg'; //application/pdf
    })
    t.model('dataType', {
      type: 'DataType', // 'base64' | 'dataUrl'
    })
  },
})

// export interface PDFExportOptions extends ExportOptions {
//     dpi?: number;
//     parallel?: number;
//     pageIds?: Array<string>;
//     unit?: 'pt' | 'mm' | 'cm' | 'in';
//     pixelUnitRatio?: number;
//fileName
// }

export const PDFExportOptions = extendInputType({
  type: 'ExportOptions',
  name: 'PDFExportOptions',
  definition(t) {
    t.field('dpi', {
      type: 'Int',
    })
    t.field('parallel', {
      type: 'Int',
    })
    t.list.string('pageIds')
    t.field('unit', {
      type: 'String',
    })
    t.field('pixelUnitRatio', {
      type: 'Int',
    })
  },
})
