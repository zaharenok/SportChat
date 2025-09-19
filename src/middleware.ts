// Временно отключаем middleware до настройки Google OAuth
import { NextResponse } from 'next/server'

export function middleware() {
  // Пропускаем все запросы пока не настроен Google OAuth
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Применяем middleware только к защищенным страницам  
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}