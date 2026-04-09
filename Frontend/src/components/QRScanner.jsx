import { useEffect, useRef, useState } from "react";
import { X, Camera, Keyboard } from "@phosphor-icons/react";

export default function QRScanner({ onScan, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [error, setError] = useState(null);
    const [manualCode, setManualCode] = useState("");
    const [showManual, setShowManual] = useState(false);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                // Start scanning
                requestAnimationFrame(scanFrame);
            }
        } catch (err) {
            console.error("Camera error:", err);
            setError("Camera access denied. Use manual code entry instead.");
            setShowManual(true);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
        }
    };

    const scanFrame = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            requestAnimationFrame(scanFrame);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        try {
            // Try using BarcodeDetector API (available in modern mobile browsers)
            if ("BarcodeDetector" in window) {
                const detector = new BarcodeDetector({ formats: ["qr_code"] });
                detector
                    .detect(canvas)
                    .then((barcodes) => {
                        if (barcodes.length > 0) {
                            handleQRData(barcodes[0].rawValue);
                            return;
                        }
                        requestAnimationFrame(scanFrame);
                    })
                    .catch(() => {
                        requestAnimationFrame(scanFrame);
                    });
            } else {
                // Fallback: show manual entry
                setError(
                    "QR scanning not supported on this browser. Enter the code manually."
                );
                setShowManual(true);
            }
        } catch {
            requestAnimationFrame(scanFrame);
        }
    };

    const handleQRData = (rawData) => {
        stopCamera();
        try {
            const data = JSON.parse(rawData);
            if (data.sessionCode) {
                onScan(data.sessionCode);
            } else {
                setError("Invalid QR code");
            }
        } catch {
            // Maybe the raw data IS the session code
            onScan(rawData.trim());
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualCode.trim()) {
            stopCamera();
            onScan(manualCode.trim().toUpperCase());
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#060b18]/95 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
                <h3 className="text-[#e2e8f0] font-semibold">Scan QR Code</h3>
                <button
                    onClick={() => {
                        stopCamera();
                        onClose();
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0f1629] text-[#e2e8f0] hover:bg-[#1a2744] transition-colors duration-200 cursor-pointer"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Camera View */}
            {!showManual && (
                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                    />
                    {/* Scan overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-[#64748b]/30 rounded-2xl relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#14b8a6] rounded-tl-xl" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#14b8a6] rounded-tr-xl" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#14b8a6] rounded-bl-xl" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#14b8a6] rounded-br-xl" />
                            {/* Scanning line animation */}
                            <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#14b8a6] to-transparent animate-bounce" />
                        </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}

            {/* Error / Manual Entry */}
            <div className="p-4 space-y-3">
                {error && (
                    <p className="text-yellow-400 text-sm text-center">{error}</p>
                )}

                {!showManual && (
                    <button
                        onClick={() => setShowManual(true)}
                        className="w-full flex items-center justify-center gap-2 bg-[#0f1629] border border-[#1a2744] text-[#e2e8f0] py-3 rounded-xl text-sm font-medium hover:bg-[#1a2744] transition-colors duration-200 cursor-pointer"
                    >
                        <Keyboard size={18} />
                        Enter code manually
                    </button>
                )}

                {showManual && (
                    <form
                        onSubmit={handleManualSubmit}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="Enter session code"
                            className="flex-1 bg-[#0f1629] border border-[#1a2744] rounded-xl px-4 py-3 text-[#e2e8f0] text-sm uppercase tracking-wider placeholder:text-[#64748b]/50 focus:outline-none focus:border-[#14b8a6] transition-colors duration-200"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors duration-200 cursor-pointer"
                        >
                            Go
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
