'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  XMarkIcon,
  EyeIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface SkinDetails {
  id: string;
  name: string;
  image: string;
  rarity: string;
  wear: string;
  float: number;
  price: number;
  category: string;
  collection: string;
  description?: string;
  pattern?: string;
  stickers?: Array<{
    name: string;
    position: string;
    wear: number;
  }>;
  inspectDetails?: {
    seed: number;
    paintIndex: number;
    paintSeed: number;
  };
}

interface InteractiveSkinViewerProps {
  isOpen: boolean;
  onClose: () => void;
  skin: SkinDetails | null;
}

const rarityColors = {
  'Consumer Grade': '#9CA3AF',
  'Industrial Grade': '#3B82F6',
  'Mil-Spec': '#6366F1',
  'Restricted': '#8B5CF6',
  'Classified': '#EC4899',
  'Covert': '#EF4444',
  'Contraband': '#F97316'
};

const wearConditions = {
  'Factory New': { range: [0.00, 0.07], color: '#10B981' },
  'Minimal Wear': { range: [0.07, 0.15], color: '#3B82F6' },
  'Field-Tested': { range: [0.15, 0.38], color: '#F59E0B' },
  'Well-Worn': { range: [0.38, 0.45], color: '#EF4444' },
  'Battle-Scarred': { range: [0.45, 1.00], color: '#6B7280' }
};

export default function InteractiveSkinViewer({ isOpen, onClose, skin }: InteractiveSkinViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showDetails, setShowDetails] = useState(true);
  const [inspectMode, setInspectMode] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  
  const imageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset viewer state when skin changes
  useEffect(() => {
    if (skin) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setInspectMode(false);
      setSelectedHotspot(null);
    }
  }, [skin]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getWearCondition = (floatValue: number) => {
    for (const [condition, data] of Object.entries(wearConditions)) {
      if (floatValue >= data.range[0] && floatValue <= data.range[1]) {
        return { condition, color: data.color };
      }
    }
    return { condition: 'Unknown', color: '#6B7280' };
  };

  // Mock hotspots for inspection
  const inspectionHotspots = [
    { id: 'barrel', x: 60, y: 40, label: 'Barrel Detail', description: 'Intricate pattern work with minimal wear' },
    { id: 'stock', x: 20, y: 60, label: 'Stock Condition', description: 'Well-preserved finish with original texture' },
    { id: 'scope', x: 70, y: 25, label: 'Scope Mount', description: 'Clean mounting with no scratches' },
    { id: 'trigger', x: 35, y: 70, label: 'Trigger Guard', description: 'Slight wear consistent with float value' }
  ];

  if (!isOpen || !skin) return null;

  const wearInfo = getWearCondition(skin.float);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#181A20] rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border border-[#2A2D3A]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <EyeIcon className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">{skin.name}</h2>
                <div className="flex items-center space-x-3 mt-1">
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: `${rarityColors[skin.rarity as keyof typeof rarityColors]}20`,
                      color: rarityColors[skin.rarity as keyof typeof rarityColors]
                    }}
                  >
                    {skin.rarity}
                  </span>
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: `${wearInfo.color}20`, color: wearInfo.color }}
                  >
                    {skin.wear}
                  </span>
                  <span className="text-blue-100">Float: {skin.float.toFixed(4)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Main Viewer */}
          <div className="flex-1 relative bg-gradient-to-br from-[#1F2937] to-[#111827] overflow-hidden">
            {/* Viewer Controls */}
            <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
              <div className="bg-[#181A20] rounded-lg border border-[#2A2D3A] p-2 space-y-2">
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2D3A] rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2D3A] rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <ArrowsPointingInIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2D3A] rounded-lg transition-colors"
                  title="Rotate"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2D3A] rounded-lg transition-colors"
                  title="Reset View"
                >
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-[#181A20] rounded-lg border border-[#2A2D3A] p-2">
                <button
                  onClick={() => setInspectMode(!inspectMode)}
                  className={`p-2 rounded-lg transition-colors ${
                    inspectMode 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-[#2A2D3A]'
                  }`}
                  title="Inspect Mode"
                >
                  <InformationCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Zoom Level Indicator */}
            <div className="absolute top-4 right-4 z-10 bg-[#181A20] rounded-lg border border-[#2A2D3A] px-3 py-2">
              <span className="text-gray-400 text-sm">Zoom: {(zoom * 100).toFixed(0)}%</span>
            </div>

            {/* Main Image Container */}
            <div 
              ref={containerRef}
              className="w-full h-full flex items-center justify-center cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <motion.div
                ref={imageRef}
                className="relative"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                }}
                animate={{
                  scale: zoom,
                  rotate: rotation,
                  x: position.x / zoom,
                  y: position.y / zoom
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <img
                  src={skin.image}
                  alt={skin.name}
                  className="max-w-none w-auto h-auto max-h-[600px] object-contain select-none"
                  draggable={false}
                />

                {/* Inspection Hotspots */}
                <AnimatePresence>
                  {inspectMode && inspectionHotspots.map((hotspot) => (
                    <motion.div
                      key={hotspot.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute w-6 h-6 -translate-x-3 -translate-y-3 cursor-pointer"
                      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                      onClick={() => setSelectedHotspot(hotspot.id)}
                    >
                      <div className="w-full h-full bg-blue-500 rounded-full animate-pulse border-2 border-white shadow-lg">
                        <div className="w-full h-full bg-blue-400 rounded-full animate-ping"></div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Inspection Details Popup */}
            <AnimatePresence>
              {selectedHotspot && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-4 left-4 right-4 bg-[#181A20] rounded-lg border border-[#2A2D3A] p-4"
                >
                  {(() => {
                    const hotspot = inspectionHotspots.find(h => h.id === selectedHotspot);
                    return hotspot ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{hotspot.label}</h4>
                          <button
                            onClick={() => setSelectedHotspot(null)}
                            className="text-gray-400 hover:text-white"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-gray-400 text-sm">{hotspot.description}</p>
                      </div>
                    ) : null;
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Details Panel */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="w-80 bg-[#181A20] border-l border-[#2A2D3A] p-6 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Details</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Price & Basic Info */}
                  <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
                    <div className="text-2xl font-bold text-white mb-2">
                      ${skin.price.toLocaleString()}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Category:</span>
                        <span className="text-white">{skin.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Collection:</span>
                        <span className="text-white">{skin.collection}</span>
                      </div>
                    </div>
                  </div>

                  {/* Wear Information */}
                  <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
                    <h4 className="font-semibold text-white mb-3">Wear Information</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Float Value:</span>
                          <span className="text-white font-mono">{skin.float.toFixed(6)}</span>
                        </div>
                        <div className="w-full bg-[#181A20] rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(skin.float * 100)}%`,
                              backgroundColor: wearInfo.color
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Condition:</span>
                        <span 
                          className="font-medium"
                          style={{ color: wearInfo.color }}
                        >
                          {wearInfo.condition}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Technical Details */}
                  {skin.inspectDetails && (
                    <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
                      <h4 className="font-semibold text-white mb-3">Technical Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Seed:</span>
                          <span className="text-white font-mono">{skin.inspectDetails.seed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Paint Index:</span>
                          <span className="text-white font-mono">{skin.inspectDetails.paintIndex}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Paint Seed:</span>
                          <span className="text-white font-mono">{skin.inspectDetails.paintSeed}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stickers */}
                  {skin.stickers && skin.stickers.length > 0 && (
                    <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
                      <h4 className="font-semibold text-white mb-3">Stickers</h4>
                      <div className="space-y-2">
                        {skin.stickers.map((sticker, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div>
                              <div className="text-white">{sticker.name}</div>
                              <div className="text-gray-400">{sticker.position}</div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <StarIcon
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < sticker.wear * 5 ? 'text-yellow-400' : 'text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {skin.description && (
                    <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
                      <h4 className="font-semibold text-white mb-3">Description</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{skin.description}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Details Button */}
          {!showDetails && (
            <button
              onClick={() => setShowDetails(true)}
              className="absolute top-4 right-4 z-10 bg-[#181A20] rounded-lg border border-[#2A2D3A] p-2 text-gray-400 hover:text-white transition-colors"
            >
              <InformationCircleIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
} 