/** 存储驱动保存后返回的结果 */
export interface StorageSaveResult {
  /** 存储后的文件名（UUID + 扩展名） */
  fileName: string
  /** COS 公开桶时有值，本地存储时为 undefined */
  publicUrl?: string
  /** 存储驱动内部的相对路径（COS 对象 key 或本地相对路径） */
  storagePath: string
}

/** 保存文件时的可选参数 */
export interface StorageSaveOptions {
  /** 保存到存储根目录下的相对目录 */
  directory?: string
}

/** 读取文件时需要的元信息 */
export interface StorageOpenFileOptions {
  originalName: string
  mimeType: string
  size: number
}

/** 存储文件状态 */
export interface StorageFileStat {
  storagePath: string
  size: number
  mimeType?: string
  lastModified?: Date
}

/** 存储驱动统一接口 */
export interface StorageDriver {
  /** 保存文件，返回存储路径和文件名 */
  save: (file: File, options?: StorageSaveOptions) => Promise<StorageSaveResult>
  /** 打开文件，返回 Response。本地返回 200 和文件内容，COS 返回 302 跳转 */
  openFile: (storagePath: string, options: StorageOpenFileOptions) => Promise<Response>
  /** 删除文件 */
  remove: (storagePath: string) => Promise<void>
  /** 读取文件状态 */
  stat: (storagePath: string) => Promise<StorageFileStat>
}
