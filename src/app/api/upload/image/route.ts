import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 });
        }

        // Upload to FreeImage.host
        const uploadFormData = new FormData();
        uploadFormData.append('source', file);
        uploadFormData.append('key', process.env.FREEIMAGE_API_KEY || '');
        uploadFormData.append('format', 'json');

        const response = await fetch('https://freeimage.host/api/1/upload', {
            method: 'POST',
            body: uploadFormData,
        });

        const data = await response.json();

        if (data.status_code !== 200) {
            return NextResponse.json(
                { error: data.error?.message || 'Upload failed' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            url: data.image.url,
            deleteUrl: data.image.delete_url,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
