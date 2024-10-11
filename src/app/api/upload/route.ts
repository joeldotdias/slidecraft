import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

export async function POST(req: NextRequest) {
    try {
        const data = await req.formData(); // Parse formData from the request
        const file = data.get("pdf") as File; // Get the uploaded PDF file

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 },
            );
        }

        // Read the file into an ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text from the PDF buffer
        const pdfData = await pdf(buffer);

        // Return the extracted text in the response
        return NextResponse.json({ text: pdfData.text });
    } catch (error) {
        console.error("Error processing PDF file:", error);
        return NextResponse.json(
            { error: "Failed to extract text from the PDF" },
            { status: 500 },
        );
    }
}
