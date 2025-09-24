import { NextRequest, NextResponse } from 'next/server'
import { chatSettingsDb } from '@/lib/chat-settings-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required' 
      }, { status: 400 })
    }

    const settings = await chatSettingsDb.getOrCreate(userId)
    
    return NextResponse.json({ 
      success: true,
      settings 
    })
    
  } catch (error) {
    console.error('❌ Error getting chat settings:', error)
    return NextResponse.json({ 
      error: 'Failed to get chat settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, show_suggestions, show_next_workout_recommendation } = body
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required' 
      }, { status: 400 })
    }

    // Проверяем, что переданы только валидные поля
    const updates: Partial<{ show_suggestions: boolean; show_next_workout_recommendation: boolean }> = {}
    if (typeof show_suggestions === 'boolean') {
      updates.show_suggestions = show_suggestions
    }
    if (typeof show_next_workout_recommendation === 'boolean') {
      updates.show_next_workout_recommendation = show_next_workout_recommendation
    }

    const settings = await chatSettingsDb.update(userId, updates)
    
    return NextResponse.json({ 
      success: true,
      settings 
    })
    
  } catch (error) {
    console.error('❌ Error updating chat settings:', error)
    return NextResponse.json({ 
      error: 'Failed to update chat settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}