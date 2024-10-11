"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import pptxgen from "pptxgenjs";

const steps = [
    "PDF uploaded successfully",
    "Extracting text",
    "Cleaning text",
    "Passing it to the LLM",
    "Waiting for response from the LLM",
    "Response received",
    "Generating PPT",
];

type ParsedSlide = {
    title: string;
    content: string[];
};

export default function SlideThing() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [summary, setSummary] = useState("");

    const makePpt = () => {
        let pptx = new pptxgen();

        const slides = summary.split(/Slide \d+:\s*/).filter(Boolean);
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
            setSummary("No file selected");
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
            setSummary(result.summary);
            toast("Ready to download");
            console.log(result.summary);
        } catch (error) {
            console.error("Error uploading file:", error);
            setSummary("Error uploading file");
        }
    };

    const handleFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        if (!ev.target.files) {
            toast.error("Files be needed");
            return;
        }

        if (ev.target.files.length > 0) {
            setSelectedFile(ev.target.files[0]);
            toast.success("PDF uploaded successfully!");
            setCurrentStep(0);
        }
    };

    const handleGenerate = () => {
        if (!selectedFile) {
            toast.error("Please upload a PDF first!");
            return;
        }

        setIsGenerating(true);
        let step = 1;
        const interval = setInterval(() => {
            if (step < steps.length) {
                setCurrentStep(step);
                step++;
            } else {
                clearInterval(interval);
                setIsGenerating(false);
                toast.success("Slides generated successfully!");
            }
        }, 2000);
    };

    const UppieUppie = async () => {
        if (!selectedFile) {
            toast.error("Please upload a file first");
            return;
        }

        handleGenerate();

        await handleFileUpload();
    };

    return (
        <div className="min-h-screen bg-[#2D2A3D] flex justify-center items-center relative overflow-hidden">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {" "}
                {/* Custom container */}
                <Card className="text-center z-10 p-8 bg-[#2D2A3D] bg-opacity-70 backdrop-blur-sm border border-white/20">
                    <CardContent>
                        <h1 className="text-6xl font-bold mb-2 bg-gradient-to-r from-[#B69EFF] to-[#FF9EF8] bg-clip-text text-transparent">
                            AutoSlides
                        </h1>
                        <h2 className="text-3xl text-[#B69EFF] mb-4">
                            Your Ideas into Slide with AI
                        </h2>
                        <p className="text-xl mb-8 text-gray-300">
                            Harness the Power of AI to Discover Hidden Potential
                        </p>
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <Input
                                    type="file"
                                    id="pdf-upload"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="pdf-upload"
                                    className="flex items-center px-4 py-2 bg-white/10 rounded-full cursor-pointer hover:bg-white/20 transition-colors"
                                >
                                    <Paperclip className="mr-2 text-[#B69EFF]" />
                                    <span className="text-gray-400">
                                        {selectedFile
                                            ? selectedFile.name
                                            : "Upload Documents"}
                                    </span>
                                </label>
                            </div>
                            <Input
                                type="number"
                                placeholder="Number of slides"
                                min={1}
                                max={100}
                                className="ml-4 w-40 bg-white/10 border-none text-white"
                            />
                        </div>
                        <div className="flex gap-4 justify-center">
                            <Button
                                // onClick={handleGenerate}
                                onClick={UppieUppie}
                                disabled={isGenerating}
                                className="bg-gradient-to-r from-[#B69EFF] to-[#FF9EF8] text-white font-bold py-2 px-6 rounded-full hover:opacity-90 transition-opacity"
                            >
                                {isGenerating ? (
                                    <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin"></div>
                                ) : (
                                    "Generate"
                                )}
                            </Button>

                            <Button
                                // onClick={handleGenerate}
                                onClick={(_ev) => makePpt()}
                                className="bg-gradient-to-r from-[#B69EFF] to-[#FF9EF8] text-white font-bold py-2 px-6 rounded-full hover:opacity-90 transition-opacity"
                            >
                                Download
                            </Button>
                        </div>
                        <div className="mt-6 text-left bg-white/10 rounded-lg p-4 max-w-md mx-auto">
                            {steps.map((step, index) => (
                                <div
                                    key={index}
                                    className={`mb-2 transition-opacity ${
                                        index < currentStep
                                            ? "text-[#B69EFF] opacity-80"
                                            : index === currentStep
                                              ? "text-[#FF9EF8] font-bold"
                                              : "opacity-50"
                                    }`}
                                >
                                    {step}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    className={`absolute w-3 h-3 rounded-full bg-[#FF9900] animate-float`}
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.5}s`,
                    }}
                ></div>
            ))}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-[#B69EFF]/20 to-[#FF9EF8]/20 filter blur-3xl animate-rotate"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-[#B69EFF]/20 to-[#FF9EF8]/20 filter blur-3xl animate-rotate"></div>
        </div>
    );
}
