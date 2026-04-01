import { useState, useMemo, useEffect } from 'react';
import { SparklesIcon, ExclamationTriangleIcon, ArrowPathIcon, PhotoIcon } from '@heroicons/react/24/outline';
import type { SpecData } from '../types';
import specJson from '../data/putter_cover_parametric_v3.json';

interface Props {
  data: SpecData;
  updateData: (data: Partial<SpecData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2({ data, updateData, onNext, onBack }: Props) {
  const [proposals, setProposals] = useState<Partial<SpecData>[] | null>(null);
  const [currentProposalIndex, setCurrentProposalIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const angleOptions = [
    { id: 'front', label: '正面', prompt: 'front view' },
    { id: 'back', label: '背面', prompt: 'back view' },
    { id: 'side', label: '側面', prompt: 'side view' },
    { id: 'neck', label: 'ネック部', prompt: 'neck close-up view' }
  ];
  const [selectedAngles, setSelectedAngles] = useState<string[]>(['front']);
  const [generatingStatus, setGeneratingStatus] = useState<Record<string, 'idle' | 'loading' | 'done' | 'error'>>({});

  const shapeMap: Record<string, string> = {
    pin: 'ピン型',
    mallet: 'マレット型',
    neo_mallet: 'ネオマレット型'
  };
  const posMap: Record<string, string> = {
    luxury: '★★★高級',
    standard: '★★☆スタンダード',
    casual: '★☆☆カジュアル'
  };

  const getLabel = (paramMap: any, value: string) => {
    if (!value) return '-';
    const opt = paramMap.options?.find((o: any) => o.value === value);
    if (opt) return opt.label;
    if (paramMap.options_by_fabric_type) {
      for (const group of Object.values(paramMap.options_by_fabric_type)) {
        const item = (group as any[]).find((o: any) => o.value === value);
        if (item) return item.label;
      }
    }
    return value;
  };

  const generateProposals = () => {
    let shapeKey = data.headShape;
    if (shapeKey === 'neo_mallet') shapeKey = 'neo';
    const key = `${data.position}_${shapeKey}`;
    const baseAutoFill = (specJson.auto_fill as any)[key];
    
    if (!baseAutoFill) {
      alert('推奨データが見つかりませんでした。');
      return;
    }

    const p1: Partial<SpecData> = {
      bodyFabric: baseAutoFill.body_fabric || '',
      texture: baseAutoFill.texture || '',
      lining: baseAutoFill.lining || '',
      piping: baseAutoFill.piping || '',
      closure: baseAutoFill.closure || '',
      embroidery: baseAutoFill.embroidery || '',
      hardwareFinish: baseAutoFill.hardware_finish || '',
      bodyColor: baseAutoFill.body_color || '',
    };

    const alternativeColors = ['black', 'navy', 'white', 'black_navy', 'red', 'green'];
    let p2Color = alternativeColors.find(c => c !== p1.bodyColor) || 'black';
    const p2 = { ...p1, bodyColor: p2Color };

    const p3 = { ...p1, bodyFabric: p1.bodyFabric === 'pu_smooth' ? 'pu_shibo' : 'pu_smooth', texture: '' };

    const p4 = { ...p1, embroidery: 'tatami_3d', hardwareFinish: p1.hardwareFinish === 'silver_matte' ? 'gold' : 'silver_matte' };

    const shiftMap: Record<string, string> = { luxury: 'standard', standard: 'luxury', casual: 'standard' };
    const shiftedPos = shiftMap[data.position] || 'standard';
    const p5Base = (specJson.auto_fill as any)[`${shiftedPos}_${shapeKey}`];
    const p5 = p5Base ? {
      bodyFabric: p5Base.body_fabric || '',
      texture: p5Base.texture || '',
      lining: p5Base.lining || '',
      piping: p5Base.piping || '',
      closure: p5Base.closure || '',
      embroidery: p5Base.embroidery || '',
      hardwareFinish: p5Base.hardware_finish || '',
      bodyColor: p5Base.body_color || '',
    } : { ...p1, closure: 'magnet' };

    setProposals([p1, p2, p3, p4, p5]);
    setCurrentProposalIndex(0);
  };

  const applyProposal = () => {
    if (!proposals) return;
    const proposal = proposals[currentProposalIndex];
    
    const getColorCode = (colorValue: string) => {
      const map: Record<string, string> = {
        black: '#1A1A1A', white: '#F5F5F5', gray: '#888780', light_gray: '#C4C2BA',
        navy: '#1B2A4A', black_navy: '#0D1520', sax_blue: '#7BAFD4', burgundy: '#7B2035',
        pink: '#F4A0B0', green: '#2D6A4F', red: '#CC2200',
      };
      return map[colorValue] || '#000000';
    };

    const colorNameJp = getLabel(specJson.parameters.body_color, proposal.bodyColor || '');
    const cCode = getColorCode(proposal.bodyColor || '');

    const newFabricParts = [
      { id: "A", label: "A", usage: "本体生地・縁巻き", material: getLabel(specJson.parameters.body_fabric, proposal.bodyFabric || ''), partNumber: "", quantity: "", colorName: colorNameJp, colorSwatch: cCode, threadNumber: "" },
      { id: "B", label: "B", usage: "本体生地・切替", material: "", partNumber: "", quantity: "", colorName: colorNameJp, colorSwatch: cCode, threadNumber: "" },
      { id: "C", label: "C", usage: "裏地", material: getLabel(specJson.parameters.lining, proposal.lining || ''), partNumber: "", quantity: "", colorName: "ホワイト", colorSwatch: "#ffffff", threadNumber: "" },
      { id: "D", label: "D", usage: "留め具", material: getLabel(specJson.parameters.closure, proposal.closure || ''), partNumber: "", quantity: "1組", colorName: getLabel(specJson.parameters.hardware_finish, proposal.hardwareFinish || ''), colorSwatch: "#cccccc", threadNumber: "" },
    ];
    
    if (proposal.piping && proposal.piping !== 'なし' && proposal.piping !== 'none') {
      newFabricParts.push({ id: "E", label: "E", usage: "パイピング", material: getLabel(specJson.parameters.piping, proposal.piping || ''), partNumber: "", quantity: "", colorName: colorNameJp, colorSwatch: cCode, threadNumber: "" });
    }
    
    const fLabel = newFabricParts.length === 4 ? "E" : "F";
    newFabricParts.push({ id: "F", label: fLabel, usage: "刺繍・装飾", material: getLabel(specJson.parameters.embroidery, proposal.embroidery || ''), partNumber: "", quantity: "", colorName: "", colorSwatch: "#cccccc", threadNumber: "" });

    updateData({ ...proposal, colorCode: cCode, fabricParts: newFabricParts });
  };

  const getProposalWarnings = (proposal: Partial<SpecData>) => {
    const warnings = [];
    const fabric = specJson.parameters.body_fabric.options.find(
      (opt) => opt.value === proposal.bodyFabric
    );
    const fabricType = fabric?.type || 'pu';

    if (fabricType === 'knit' && (proposal.piping === 'pu_10' || proposal.piping === 'pu_15')) {
      warnings.push('NG');
    }
    if (proposal.bodyColor === 'white' && (proposal.hardwareFinish === 'gold' || proposal.hardwareFinish === 'black_nickel')) {
      warnings.push('NG');
    }
    return warnings;
  };

  const regenerateProposals = () => {
    let shapeKey = data.headShape;
    if (shapeKey === 'neo_mallet') shapeKey = 'neo';
    const key = `${data.position}_${shapeKey}`;
    const baseAutoFill = (specJson.auto_fill as any)[key] || {};
    
    const newProposals: Partial<SpecData>[] = [];
    const fabrics = specJson.parameters.body_fabric.options;
    const colors = specJson.parameters.body_color.options;
    const embroideries = specJson.parameters.embroidery.options;
    
    const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)].value;
    
    let attempts = 0;
    while (newProposals.length < 5 && attempts < 200) {
      attempts++;
      const rFabric = getRandom(fabrics);
      const fabricType = fabrics.find((f: any) => f.value === rFabric)?.type || 'pu';
      
      if (data.position === 'luxury' && fabricType === 'knit') continue;
      
      const rColor = getRandom(colors);
      const rEmbroidery = getRandom(embroideries);
      
      const p: Partial<SpecData> = {
        bodyFabric: rFabric,
        bodyColor: rColor,
        embroidery: rEmbroidery,
        texture: baseAutoFill.texture || '',
        lining: baseAutoFill.lining || '',
        piping: baseAutoFill.piping || '',
        closure: baseAutoFill.closure || '',
        hardwareFinish: baseAutoFill.hardware_finish || '',
      };
      
      if (getProposalWarnings(p).length > 0) continue;
      
      if (newProposals.some(existing => 
        existing.bodyFabric === p.bodyFabric && 
        existing.bodyColor === p.bodyColor && 
        existing.embroidery === p.embroidery)) {
        continue;
      }
      
      newProposals.push(p);
    }
    
    if (newProposals.length > 0) {
      setProposals(newProposals);
      setCurrentProposalIndex(0);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 500);
    } else {
      alert("新しいパターンを生成できませんでした。");
    }
  };

  // Derived properties for current form state
  const fabricType = useMemo(() => {
    const fabric = specJson.parameters.body_fabric.options.find(
      (opt) => opt.value === data.bodyFabric
    );
    return fabric?.type || 'pu';
  }, [data.bodyFabric]);

  const textureOptions = useMemo(() => {
    return (specJson.parameters.texture.options_by_fabric_type as any)[fabricType] || [];
  }, [fabricType]);

  useEffect(() => {
    if (data.texture && !textureOptions.find((o: any) => o.value === data.texture)) {
      updateData({ texture: '' });
    }
  }, [fabricType, textureOptions, data.texture, updateData]);

  const colorHexMap: Record<string, string> = {
    black: '#1A1A1A', white: '#F5F5F5', gray: '#888780', light_gray: '#C4C2BA',
    navy: '#1B2A4A', black_navy: '#0D1520', sax_blue: '#7BAFD4', burgundy: '#7B2035',
    pink: '#F4A0B0', green: '#2D6A4F', red: '#CC2200',
  };

  const ngWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (fabricType === 'knit' && (data.piping === 'pu_10' || data.piping === 'pu_15')) {
      warnings.push('縫製ストレスが発生します。ポリエステルテープ8mmを推奨');
    }
    if (data.bodyColor === 'white' && (data.hardwareFinish === 'gold' || data.hardwareFinish === 'black_nickel')) {
      warnings.push('ホワイト系本体×ゴールドまたは黒ニッケルはコントラスト過剰になる場合があります');
    }
    return warnings;
  }, [fabricType, data]);

  const handleGenerateImage = async () => {
    if (selectedAngles.length === 0) {
      alert('生成するアングルを選択してください。');
      return;
    }
    
    setIsGenerating(true);
    
    // Initialize or keep existing map
    const currentImages = { ...(data.generatedImages || {}) };
    const newStatus: Record<string, 'idle' | 'loading' | 'done' | 'error'> = {};
    selectedAngles.forEach(id => newStatus[id] = 'idle');
    setGeneratingStatus(newStatus);
    
    try {
      const pColor = getLabel(specJson.parameters.body_color, data.bodyColor || '') || 'neutral';
      const pFabric = getLabel(specJson.parameters.body_fabric, data.bodyFabric || '') || 'standard';
      const pPiping = getLabel(specJson.parameters.piping, data.piping || '') || 'standard';
      const pHardware = getLabel(specJson.parameters.hardware_finish, data.hardwareFinish || '') || 'standard';
      
      const basePrompt = `A highly detailed professional product photograph of a golf putter cover. Shape: ${data.headShape || 'standard'}, Color: ${pColor}, Fabric material: ${pFabric}, Piping: ${pPiping}, Hardware Finish: ${pHardware}. Studio lighting, clean white background, high quality, 8k resolution.`;

      for (const angleId of selectedAngles) {
        const option = angleOptions.find(o => o.id === angleId);
        if (!option) continue;
        
        setGeneratingStatus(prev => ({ ...prev, [angleId]: 'loading' }));
        
        try {
          const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt: `${basePrompt}, ${option.prompt}`,
              quality: data.imageQuality || 'medium'
            }),
          });

          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const resData = await response.json();
          const imageUrl = resData.imageUrl || resData.url || resData.image || resData;
          
          if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
            currentImages[angleId] = imageUrl;
            // Update step-by-step
            updateData({ generatedImages: { ...currentImages } });
            setGeneratingStatus(prev => ({ ...prev, [angleId]: 'done' }));
          } else {
            throw new Error('Invalid image URL');
          }
        } catch (e) {
          console.error(`Error generating ${angleId}:`, e);
          setGeneratingStatus(prev => ({ ...prev, [angleId]: 'error' }));
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAngleToggle = (id: string) => {
    setSelectedAngles(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 animate-fade-in fade-in pb-12">
      {/* AI Proposal Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-indigo-600" />
              AI組み合わせ提案
            </h3>
            <p className="text-sm text-indigo-700 mt-1">
              {shapeMap[data.headShape]} × {posMap[data.position]} の推奨パターンを提案します
            </p>
          </div>
          <button
            onClick={generateProposals}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded shadow transition-colors shrink-0"
          >
            提案を見る
          </button>
        </div>

        {proposals && proposals.length > 0 && (
          <div className="mt-6">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {proposals.map((p, idx) => {
                const isSelected = currentProposalIndex === idx;
                const hasWarning = getProposalWarnings(p).length > 0;
                return (
                  <div 
                    key={idx} 
                    onClick={() => setCurrentProposalIndex(idx)}
                    className={`min-w-[260px] max-w-[280px] snap-center cursor-pointer border-2 rounded-lg p-4 relative transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md transform scale-100' : 'border-gray-200 bg-white hover:border-indigo-300 transform scale-95 opacity-80 hover:opacity-100'}`}
                  >
                    <h4 className={`font-bold mb-3 ${isSelected ? 'text-indigo-800' : 'text-gray-600'}`}>
                      提案 {idx + 1} {isSelected && <span className="ml-2 text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full">選択中</span>}
                    </h4>
                    {hasWarning && (
                      <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">⚠ NG</span>
                    )}
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-500 inline-block w-12">本体:</span> <span className="font-medium text-gray-800">{getLabel(specJson.parameters.body_fabric, p.bodyFabric || '')}</span></div>
                      <div><span className="text-gray-500 inline-block w-12">裏地:</span> <span className="font-medium text-gray-800">{getLabel(specJson.parameters.lining, p.lining || '')}</span></div>
                      <div><span className="text-gray-500 inline-block w-12">開閉:</span> <span className="font-medium text-gray-800">{getLabel(specJson.parameters.closure, p.closure || '')}</span></div>
                      <div><span className="text-gray-500 inline-block w-12">刺繍:</span> <span className="font-medium text-gray-800">{getLabel(specJson.parameters.embroidery, p.embroidery || '')}</span></div>
                      <div><span className="text-gray-500 inline-block w-12">金具:</span> <span className="font-medium text-gray-800">{getLabel(specJson.parameters.hardware_finish, p.hardwareFinish || '')}</span></div>
                      <div><span className="text-gray-500 inline-block w-12">カラー:</span> <span className="font-medium text-gray-800">{getLabel(specJson.parameters.body_color, p.bodyColor || '')}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-4 mt-2 border-t border-indigo-200 pt-4 relative">
              {showToast && (
                <div className="absolute top-[-40px] left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg z-10 transition-opacity duration-200">
                  再生成しました
                </div>
              )}
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCurrentProposalIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentProposalIndex === 0}
                    className="text-indigo-600 font-bold disabled:text-gray-400 hover:text-indigo-800 transition-colors"
                  >
                    ← 前の提案
                  </button>
                  <span className="text-xs text-indigo-800 font-bold bg-indigo-100 px-3 py-1 rounded-full">
                    {currentProposalIndex + 1} / {proposals.length}
                  </span>
                  <button 
                    onClick={() => setCurrentProposalIndex(prev => Math.min(proposals.length - 1, prev + 1))}
                    disabled={currentProposalIndex === proposals.length - 1}
                    className="text-indigo-600 font-bold disabled:text-gray-400 hover:text-indigo-800 transition-colors"
                  >
                    次の提案 →
                  </button>
                </div>
                <button 
                  onClick={applyProposal}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full shadow transition-transform transform hover:scale-105"
                >
                  この提案を適用する
                </button>
              </div>
              
              <div className="flex justify-start">
                <button
                  onClick={regenerateProposals}
                  className="flex items-center justify-center font-bold outline-none uppercase tracking-wide cursor-pointer transition-colors border border-[#2E75B6] text-[#2E75B6] bg-white rounded-[6px] px-[16px] py-[8px] hover:bg-[#EDF4FB]"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" /> 別のパターンを再生成する
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NG Warnings for current form state */}
      {ngWarnings.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">仕様の見直しを推奨します</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {ngWarnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        
        {/* 生地・素材 */}
        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 border-b pb-2">■ 生地・素材</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">本体生地</label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 p-2 border"
              value={data.bodyFabric}
              onChange={(e) => updateData({ bodyFabric: e.target.value })}
            >
              <option value="">選択してください</option>
              {specJson.parameters.body_fabric.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">テクスチャー</label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 p-2 border"
              value={data.texture}
              onChange={(e) => updateData({ texture: e.target.value })}
            >
              <option value="">選択してください</option>
              {textureOptions.map((o: any) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">裏地</label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 p-2 border"
              value={data.lining}
              onChange={(e) => updateData({ lining: e.target.value })}
            >
              <option value="">選択してください</option>
              {specJson.parameters.lining.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パイピング</label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 p-2 border"
              value={data.piping}
              onChange={(e) => updateData({ piping: e.target.value })}
            >
              <option value="">選択してください</option>
              {specJson.parameters.piping.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 開閉・留め具 */}
        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 border-b pb-2">■ 開閉・留め具</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">開閉・留め具方式</label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 p-2 border"
              value={data.closure}
              onChange={(e) => updateData({ closure: e.target.value })}
            >
              <option value="">選択してください</option>
              {specJson.parameters.closure.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 刺繍・装飾 */}
        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 border-b pb-2">■ 刺繍・装飾</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">主刺繍技法</label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 p-2 border"
              value={data.embroidery}
              onChange={(e) => updateData({ embroidery: e.target.value })}
            >
              <option value="">選択してください</option>
              {specJson.parameters.embroidery.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* カラー指示 */}
        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 border-b pb-2">■ カラー指示</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">本体カラー</label>
            <div className="relative">
              <select
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 p-2 border pl-10"
                value={data.bodyColor}
                onChange={(e) => updateData({ bodyColor: e.target.value })}
              >
                <option value="">選択してください</option>
                {specJson.parameters.body_color.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {data.bodyColor && colorHexMap[data.bodyColor] && (
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                  style={{ backgroundColor: colorHexMap[data.bodyColor] }}
                ></span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カラーコード</label>
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 p-2 border"
              value={data.colorCode}
              onChange={(e) => updateData({ colorCode: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500">部位A</label>
              <input type="text" className="w-full border p-1 text-sm rounded" 
                value={data.fabricParts?.find(p => p.id === "A" || p.label === "A")?.colorName || ""} 
                onChange={(e) => {
                  const parts = [...(data.fabricParts || [])];
                  const idx = parts.findIndex(p => p.id === "A" || p.label === "A");
                  if (idx >= 0) parts[idx] = { ...parts[idx], colorName: e.target.value };
                  else parts.push({ id: "A", label: "A", usage: "", material: "", partNumber: "", quantity: "", colorName: e.target.value, colorSwatch: "#ccc", threadNumber: "" });
                  updateData({ fabricParts: parts });
                }} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">部位B</label>
              <input type="text" className="w-full border p-1 text-sm rounded" 
                value={data.fabricParts?.find(p => p.id === "B" || p.label === "B")?.colorName || ""} 
                onChange={(e) => {
                  const parts = [...(data.fabricParts || [])];
                  const idx = parts.findIndex(p => p.id === "B" || p.label === "B");
                  if (idx >= 0) parts[idx] = { ...parts[idx], colorName: e.target.value };
                  else parts.push({ id: "B", label: "B", usage: "", material: "", partNumber: "", quantity: "", colorName: e.target.value, colorSwatch: "#ccc", threadNumber: "" });
                  updateData({ fabricParts: parts });
                }} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">部位C</label>
              <input type="text" className="w-full border p-1 text-sm rounded" 
                value={data.fabricParts?.find(p => p.id === "C" || p.label === "C")?.colorName || ""} 
                onChange={(e) => {
                  const parts = [...(data.fabricParts || [])];
                  const idx = parts.findIndex(p => p.id === "C" || p.label === "C");
                  if (idx >= 0) parts[idx] = { ...parts[idx], colorName: e.target.value };
                  else parts.push({ id: "C", label: "C", usage: "", material: "", partNumber: "", quantity: "", colorName: e.target.value, colorSwatch: "#ccc", threadNumber: "" });
                  updateData({ fabricParts: parts });
                }} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">部位D</label>
              <input type="text" className="w-full border p-1 text-sm rounded" 
                value={data.fabricParts?.find(p => p.id === "D" || p.label === "D")?.colorName || ""} 
                onChange={(e) => {
                  const parts = [...(data.fabricParts || [])];
                  const idx = parts.findIndex(p => p.id === "D" || p.label === "D");
                  if (idx >= 0) parts[idx] = { ...parts[idx], colorName: e.target.value };
                  else parts.push({ id: "D", label: "D", usage: "", material: "", partNumber: "", quantity: "", colorName: e.target.value, colorSwatch: "#ccc", threadNumber: "" });
                  updateData({ fabricParts: parts });
                }} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">金具仕上げ</label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 p-2 border"
              value={data.hardwareFinish}
              onChange={(e) => updateData({ hardwareFinish: e.target.value })}
            >
              <option value="">選択してください</option>
              {specJson.parameters.hardware_finish.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* AI Image Generation Section */}
      <div className="bg-white border-2 border-dashed border-indigo-200 p-6 rounded-xl flex flex-col gap-6 mt-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <PhotoIcon className="w-5 h-5 text-indigo-500" />
              デザイン画像一括生成
            </h3>
            <p className="text-sm text-gray-600">
              選択したアングルの完成イメージ画像を順番に自動生成します。
            </p>
          </div>
          <button
            onClick={handleGenerateImage}
            disabled={isGenerating || selectedAngles.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded shadow transition-colors flex items-center justify-center gap-2 min-w-[200px]"
          >
            {isGenerating ? (
              <><ArrowPathIcon className="w-4 h-4 animate-spin" /> 生成中...</>
            ) : (
              <><SparklesIcon className="w-4 h-4" /> 選択したアングルを全て生成</>
            )}
          </button>
        </div>
        {/* アングル選択・画質選択エリア */}
        <div className="bg-indigo-50 p-4 rounded-lg space-y-6">
          <div>
            <h4 className="text-sm font-bold text-indigo-900 mb-3">生成するアングルを選択:</h4>
            <div className="flex flex-wrap gap-4">
              {angleOptions.map(opt => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border border-indigo-100 shadow-sm hover:border-indigo-300 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedAngles.includes(opt.id)}
                    onChange={() => handleAngleToggle(opt.id)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-indigo-100 pt-4">
            <h4 className="text-sm font-bold text-indigo-900 mb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <span>画像品質を選択:</span>
              <span className="text-xs font-normal text-indigo-800 bg-indigo-100 px-3 py-1.5 rounded-full font-mono">
                {selectedAngles.length}アングル生成コスト目安：
                <strong className="text-indigo-900 ml-1">
                  {selectedAngles.length > 0 
                    ? `約$${(selectedAngles.length * (data.imageQuality === 'high' ? 0.17 : data.imageQuality === 'low' ? 0.01 : 0.04)).toFixed(2)}（約${Math.round(selectedAngles.length * (data.imageQuality === 'high' ? 0.17 : data.imageQuality === 'low' ? 0.01 : 0.04) * 150)}円）` 
                    : '$0.00'
                  }
                </strong>
              </span>
            </h4>
            <div className="flex flex-col lg:flex-row gap-4">
              <label className="flex-1 flex items-start gap-3 cursor-pointer bg-white px-4 py-3 rounded border border-indigo-100 shadow-sm hover:border-indigo-300 transition-colors">
                <input 
                  type="radio" 
                  name="quality"
                  checked={data.imageQuality === 'low'}
                  onChange={() => updateData({ imageQuality: 'low' })}
                  className="w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-800">低画質 (low)</span>
                  <span className="text-xs text-gray-500 mt-0.5">確認用・約$0.01/枚</span>
                </div>
              </label>
              <label className="flex-1 flex items-start gap-3 cursor-pointer bg-white px-4 py-3 rounded border border-indigo-100 shadow-sm hover:border-indigo-300 transition-colors relative overflow-hidden">
                {(!data.imageQuality || data.imageQuality === 'medium') && (
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">推奨</div>
                )}
                <input 
                  type="radio" 
                  name="quality"
                  checked={!data.imageQuality || data.imageQuality === 'medium'}
                  onChange={() => updateData({ imageQuality: 'medium' })}
                  className="w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-800">中画質 (medium)</span>
                  <span className="text-xs text-gray-500 mt-0.5">通常用・約$0.04/枚</span>
                </div>
              </label>
              <label className="flex-1 flex items-start gap-3 cursor-pointer bg-white px-4 py-3 rounded border border-indigo-100 shadow-sm hover:border-indigo-300 transition-colors">
                <input 
                  type="radio" 
                  name="quality"
                  checked={data.imageQuality === 'high'}
                  onChange={() => updateData({ imageQuality: 'high' })}
                  className="w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-800">高画質 (high)</span>
                  <span className="text-xs text-gray-500 mt-0.5">最終確認用・約$0.17/枚</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* プレビューエリア (2列グリッド) */}
        {(selectedAngles.length > 0 || (data.generatedImages && Object.keys(data.generatedImages).length > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {angleOptions.filter(opt => selectedAngles.includes(opt.id) || (data.generatedImages && data.generatedImages[opt.id])).map(opt => {
              const status = generatingStatus[opt.id];
              const imageUrl = data.generatedImages?.[opt.id];
              
              return (
                <div key={opt.id} className="w-full h-64 bg-gray-100 rounded border border-gray-200 flex flex-col overflow-hidden relative group">
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    {opt.label}
                  </div>
                  
                  {imageUrl ? (
                    <img src={imageUrl} alt={opt.label} className="w-full h-full object-contain bg-white" />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                      {status === 'loading' ? (
                        <>
                          <ArrowPathIcon className="w-10 h-10 mb-2 animate-spin text-indigo-400" />
                          <span className="text-xs font-medium text-indigo-500">生成中...</span>
                        </>
                      ) : status === 'error' ? (
                        <>
                          <ExclamationTriangleIcon className="w-10 h-10 mb-2 text-red-400" />
                          <span className="text-xs font-medium text-red-500">失敗</span>
                        </>
                      ) : (
                        <>
                          <PhotoIcon className="w-10 h-10 mb-2 opacity-30" />
                          <span className="text-xs font-medium">待機中</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-6 border-t flex justify-between mt-8">
        <button
          onClick={onBack}
          className="bg-white border text-gray-700 hover:bg-gray-50 font-bold py-3 px-8 rounded-lg shadow-sm transition-colors"
        >
          ← 戻る
        </button>
        <button
          onClick={onNext}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow transition-colors"
        >
          STEP3へ進む →
        </button>
      </div>
    </div>
  );
}
