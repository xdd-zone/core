export interface MediaStorageSaveResult {
  fileName: string
  publicUrl?: string
  storagePath: string
}

export interface MediaStorageOpenFileOptions {
  originalName: string
  mimeType: string
  size: number
}

export interface MediaStorageDriver {
  save: (file: File) => Promise<MediaStorageSaveResult>
  openFile: (storagePath: string, options: MediaStorageOpenFileOptions) => Promise<Response>
  remove: (storagePath: string) => Promise<void>
}
