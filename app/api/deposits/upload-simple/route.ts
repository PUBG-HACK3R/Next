import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // For now, just return a mock success response
    // In production, you'd save to a proper file storage service
    const fileName = `temp/${Date.now()}.${file.name.split('.').pop()}`
    const mockUrl = `https://via.placeholder.com/400x300.png?text=Uploaded+${file.name}`

    return NextResponse.json({ 
      success: true, 
      fileName,
      publicUrl: mockUrl,
      message: 'File uploaded successfully (mock)' 
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
