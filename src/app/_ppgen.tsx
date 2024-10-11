"use client";

import pptxgen from "pptxgenjs";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ParsedSlide = {
    title: string;
    content: string[];
};

export function PpGen() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setSelectedFile(file);
    };

    const makePpt = () => {
        let pptx = new pptxgen();

        const slides = message.split(/Slide \d+:\s*/).filter(Boolean);
        console.log("Slides after split:", slides);

        const parsed: ParsedSlide[] = slides.map((slideText) => {
            const [titlePart, ...contentParts] = slideText
                .split("Content:")
                .map((part) => part.replace("# Main Title:", "").trim());

            const title = titlePart.trim();

            const content =
                contentParts.length > 0
                    ? contentParts[0]
                          .trim()
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean)
                    : [];
            return { title, content };
        });

        parsed.forEach((thing, _idx) => {
            let slide = pptx.addSlide();

            slide.addText(thing.title, {
                x: 0.5,
                y: 0.5,
                w: "90%",
                h: 1,
                fontSize: 24,
                bold: true,
                color: "363636",
            });

            slide.addText(thing.content.join("\n\n"), {
                x: 0.5,
                y: 2.2,
                w: "90%",
                h: 0.5,
                fontSize: 18,
            });
        });

        pptx.writeFile({ fileName: "blessgooo.pptx" });
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            setMessage("No file selected");
            return;
        }

        const formData = new FormData();
        formData.append("pdf", selectedFile);

        try {
            const response = await fetch("http://localhost:5000/upload", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            setMessage(result.summary);
            toast("Ready to download");
            console.log(result.summary);
        } catch (error) {
            console.error("Error uploading file:", error);
            setMessage("Error uploading file");
        }
    };

    return (
        <div className="">
            <Card>
                <div className="flex flex-col gap-5 p-4">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                    />
                    <Button variant={"destructive"} onClick={handleFileUpload}>
                        Make ppt
                    </Button>
                    <Button variant={"secondary"} onClick={(_ev) => makePpt()}>
                        Download
                    </Button>
                </div>
            </Card>
            {/* <div> */}
            {/*     <input type="file" accept=".pdf" onChange={handleFileChange} /> */}
            {/*     <button onClick={handleFileUpload}>Upload</button> */}
            {/* {message && <p>{message}</p>} */}
            {/* </div> */}
            {/* <div className="min-h-screen"> */}
            {/*     <div>Hello</div> */}
            {/*     <button type="button" onClick={(_ev) => makePpt()}> */}
            {/*         Yuh */}
            {/*     </button> */}
            {/* </div> */}
        </div>
    );
}
