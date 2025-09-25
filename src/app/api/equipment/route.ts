import { NextRequest, NextResponse } from 'next/server'
import { equipmentDb } from '@/lib/redis-db'

export async function GET(_request: NextRequest) {
  try {
    const equipment = await equipmentDb.getAll()
    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, muscle_groups } = body

    if (!name || !category || !muscle_groups) {
      return NextResponse.json({ 
        error: 'name, category, and muscle_groups are required' 
      }, { status: 400 })
    }

    const equipment = await equipmentDb.create(name, category, muscle_groups)
    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Error creating equipment:', error)
    return NextResponse.json({ error: 'Failed to create equipment' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, weight, volume } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const equipment = await equipmentDb.updateUsage(id, weight, volume)
    
    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Error updating equipment usage:', error)
    return NextResponse.json({ error: 'Failed to update equipment usage' }, { status: 500 })
  }
}