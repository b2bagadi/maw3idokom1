import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { deleteUrl } = await request.json();

        if (!deleteUrl) {
            return NextResponse.json({ error: 'No delete URL provided' }, { status: 400 });
        }

        // Call the delete URL
        const response = await fetch(deleteUrl, { method: 'GET' });

        // FreeImage.host delete URLs typically just need a GET request
        // and return a redirect or success page
        if (!response.ok) {
            console.warn('Delete request failed:', response.status);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
