// Simple type declaration for multer
declare module 'multer' {
  import { RequestHandler } from 'express'
  
  export interface File {
    fieldname: string
    originalname: string
    encoding: string
    mimetype: string
    size: number
    destination: string
    filename: string
    path: string
    buffer: Buffer
  }
  
  export interface FileFilterCallback {
    (error: Error): void
    (error: null, acceptFile: boolean): void
  }
  
  export interface StorageEngine {
    _handleFile(req: any, file: any, callback: any): void
    _removeFile(req: any, file: any, callback: any): void
  }
  
  export interface Options {
    dest?: string
    storage?: StorageEngine
    fileFilter?: (req: any, file: File, callback: FileFilterCallback) => void
    limits?: {
      fieldNameSize?: number
      fieldSize?: number
      fields?: number
      fileSize?: number
      files?: number
      parts?: number
      headerPairs?: number
    }
  }
  
  export function diskStorage(options: {
    destination?: (req: any, file: File, callback: (error: any, destination: string) => void) => void
    filename?: (req: any, file: File, callback: (error: any, filename: string) => void) => void
  }): StorageEngine
  
  export default function multer(options?: Options): {
    single(fieldName: string): RequestHandler
    array(fieldName: string, maxCount?: number): RequestHandler
    fields(fields: Array<{ name: string; maxCount?: number }>): RequestHandler
    any(): RequestHandler
  }
  
  export { diskStorage }
}