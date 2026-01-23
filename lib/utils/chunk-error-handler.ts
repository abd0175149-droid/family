/**
 * معالجة ChunkLoadError في Next.js
 * يحاول إعادة تحميل الصفحة عند حدوث ChunkLoadError
 */

export function handleChunkError(error: any) {
  if (
    error?.name === 'ChunkLoadError' ||
    error?.message?.includes('Loading chunk') ||
    error?.message?.includes('Failed to fetch dynamically imported module')
  ) {
    console.warn('ChunkLoadError detected, reloading page...')
    
    // إعادة تحميل الصفحة بعد تأخير قصير
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
    return true
  }
  
  return false
}

// إضافة event listener للتعامل مع ChunkLoadError
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.error?.name === 'ChunkLoadError' || 
        event.message?.includes('Loading chunk')) {
      handleChunkError(event.error)
    }
  })

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'ChunkLoadError' || 
        event.reason?.message?.includes('Loading chunk')) {
      handleChunkError(event.reason)
    }
  })
}
