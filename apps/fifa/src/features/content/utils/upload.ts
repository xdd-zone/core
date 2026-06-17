export async function ignoreAntdUploadRequest<TIgnoreValue>(
  file: File,
  upload: (file: File) => Promise<void>,
  ignoreValue: TIgnoreValue,
) {
  await upload(file)

  return ignoreValue
}
