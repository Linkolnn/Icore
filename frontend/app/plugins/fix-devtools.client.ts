export default defineNuxtPlugin(() => {
  // Fix для Vue DevTools в development режиме
  if (process.env.NODE_ENV === 'development') {
    // Предотвращаем ошибку с __vrv_devtools
    if (typeof window !== 'undefined') {
      const originalError = console.error
      console.error = (...args) => {
        if (args[0]?.toString?.().includes('__vrv_devtools')) {
          return
        }
        originalError.apply(console, args)
      }
    }
  }
})
