import { NextRequest, NextResponse } from 'next/server'
import { muscleGroupsDb } from '@/lib/redis-db'

export async function GET(_request: NextRequest) {
  try {
    const muscleGroups = await muscleGroupsDb.getAll()
    return NextResponse.json(muscleGroups)
  } catch (error) {
    console.error('Error fetching muscle groups:', error)
    return NextResponse.json({ error: 'Failed to fetch muscle groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, english_name, category } = body

    if (!name || !english_name || !category) {
      return NextResponse.json({ 
        error: 'name, english_name, and category are required' 
      }, { status: 400 })
    }

    const muscleGroup = await muscleGroupsDb.create(name, english_name, category)
    return NextResponse.json(muscleGroup)
  } catch (error) {
    console.error('Error creating muscle group:', error)
    return NextResponse.json({ error: 'Failed to create muscle group' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, weight, volume } = body

    if (!id || weight === undefined || volume === undefined) {
      return NextResponse.json({ 
        error: 'id, weight, and volume are required' 
      }, { status: 400 })
    }

    const muscleGroup = await muscleGroupsDb.updateWorkout(id, weight, volume)
    
    if (!muscleGroup) {
      return NextResponse.json({ error: 'Muscle group not found' }, { status: 404 })
    }

    return NextResponse.json(muscleGroup)
  } catch (error) {
    console.error('Error updating muscle group workout:', error)
    return NextResponse.json({ error: 'Failed to update muscle group workout' }, { status: 500 })
  }
}