import { useState, useMemo, useEffect } from 'react';
import { SparklesIcon, ExclamationTriangleIcon, ArrowPathIcon, PhotoIcon } from '@heroicons/react/24/outline';
import type { SpecData } from '../types';
import specJson from '../data/putter_cover_parametric_v3.json';

const PROCESSING_TYPES: Record<string, string> = {
  普通刺繍: "flat embroidery stitching",
  振り刺繍: "satin stitch embroidery, directional thread",
  畳刺繍: "tatami stitch embroidery, woven texture",
  畳立体刺繍: "3D raised embroidery, padded tatami stitch",
  文字型土台畳刺繍: "raised letter embroidery on base",
  金属プレート: "metal plate badge, engraved",
  シリコンパッチ: "silicone rubber patch",
  プリント: "flat print"
};

const createCanvasTextLogo = (text: string, fontType: string, direction: 'horizontal' | 'vertical'): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('');

    let fontFamily = 'sans-serif';
    if (fontType === 'mincho') fontFamily = 'serif';
    else if (fontType === 'english') fontFamily = 'Arial, Helvetica, sans-serif';

    const fontSize = 100;
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'top';

    const chars = text.split('');
    let width = 0;
    let height = 0;

    if (direction === 'vertical') {
      width = fontSize;
      height = chars.length * fontSize * 1.1;
    } else {
      width = ctx.measureText(text).width;
      height = fontSize * 1.2;
    }

    canvas.width = width + 40;
    canvas.height = height + 40;

    // We must paint the background black so `removeBlackBackground` works smoothly like AI generations
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';

    if (direction === 'vertical') {
      chars.forEach((char, i) => {
        const met = ctx.measureText(char);
        const cw = met.width;
        ctx.fillText(char, 20 + (width - cw)/2, 20 + i * (fontSize * 1.1));
      });
    } else {
      ctx.fillText(text, 20, 20);
    }
    
    resolve(canvas.toDataURL('image/png'));
  });
};

const DraggableLogo = ({ logoSrc, logoScale, logoX, logoY, logoColor, logoOpacity, isTopFixed, onUpdate }: any) => {
  const [localX, setLocalX] = useState(logoX);
  const [localY, setLocalY] = useState(logoY);
  
  useEffect(() => {
    setLocalX(logoX);
    setLocalY(logoY);
  }, [logoX, logoY]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTopFixed) return;
    e.preventDefault();
    const parent = e.currentTarget.parentElement;
    if (!parent) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = localX;
    const initialY = localY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const dPercX = (dx / rect.width) * 100;
      const dPercY = (dy / rect.height) * 100;

      let newX = initialX + dPercX;
      let newY = initialY + dPercY;
      newX = Math.max(0, Math.min(100, newX));
      newY = Math.max(0, Math.min(100, newY));

      setLocalX(newX);
      setLocalY(newY);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      const rect = parent.getBoundingClientRect();
      const dx = upEvent.clientX - startX;
      const dy = upEvent.clientY - startY;
      const dPercX = (dx / rect.width) * 100;
      const dPercY = (dy / rect.height) * 100;

      let newX = initialX + dPercX;
      let newY = initialY + dPercY;
      newX = Math.max(0, Math.min(100, newX));
      newY = Math.max(0, Math.min(100, newY));
      
      onUpdate(newX, newY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`absolute ${isTopFixed ? '' : 'cursor-move'} border-[1.5px] border-dashed ${isTopFixed ? 'border-gray-400 bg-white/10' : 'border-indigo-400 bg-white/20 hover:bg-white/40'} transition-colors shadow-sm`}
      style={{
        left: `${localX}%`,
        top: `${localY}%`,
        width: `${logoScale}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 20
      }}
      onMouseDown={handleMouseDown}
    >
      <div 
         style={{ width: '100%', display: 'flex' }}
      >
        <img src={logoSrc} className="w-full h-auto opacity-0 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none" style={{
            maskImage: `url(${logoSrc})`,
            WebkitMaskImage: `url(${logoSrc})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
            backgroundColor: logoColor || '#ffffff',
            opacity: typeof logoOpacity === 'number' ? logoOpacity / 100 : 1
        }} />
      </div>
      {!isTopFixed && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">ドラッグで移動</div>
      )}
    </div>
  );
};

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
  const [generatingStatus, setGeneratingStatus] = useState<Record<string, 'idle' | 'loading' | 'done' | 'error'>>({});
  const [logoGeneratingStatus, setLogoGeneratingStatus] = useState<Record<string, 'loading' | 'done' | 'error'>>({});
  const [transparentLogos, setTransparentLogos] = useState<Record<string, string>>({});

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

  const sliceImage = async (imgUrl: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const sliceWidth = img.width / 2;
        const sliceHeight = img.height / 3;
        const slices: string[] = [];
        const canvas = document.createElement('canvas');
        canvas.width = sliceWidth;
        canvas.height = sliceHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No context available');
        
        // Zero123++ 2x3 grid: 2 cols, 3 rows.
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 2; col++) {
            ctx.clearRect(0, 0, sliceWidth, sliceHeight);
            ctx.drawImage(img, col * sliceWidth, row * sliceHeight, sliceWidth, sliceHeight, 0, 0, sliceWidth, sliceHeight);
            slices.push(canvas.toDataURL('image/png'));
          }
        }
        resolve(slices);
      };
      img.onerror = () => reject('Image load failed');
      img.src = imgUrl; // Need a proxy or no-cors if not direct
    });
  };

  const MULTIVIEW_KEYS = ['oblique_front', 'oblique_back', 'front_3d', 'oblique_right', 'oblique_left', 'side'];

  const removeBlackBackground = (logoImgUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(logoImgUrl);
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const dataArr = imgData.data;
        for (let i = 0; i < dataArr.length; i += 4) {
          if (dataArr[i] < 30 && dataArr[i + 1] < 30 && dataArr[i + 2] < 30) {
            dataArr[i + 3] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = logoImgUrl;
    });
  };

  useEffect(() => {
    let isCancelled = false;
    const loadTransparentLogos = async () => {
      const newTransparent: Record<string, string> = { ...transparentLogos };
      let changed = false;
      for (const logo of data.logos || []) {
        if (logo.generatedLogo && !newTransparent[logo.id]) {
           newTransparent[logo.id] = await removeBlackBackground(logo.generatedLogo);
           changed = true;
        }
      }
      if (!isCancelled && changed) setTransparentLogos(newTransparent);
    };
    loadTransparentLogos();
    return () => { isCancelled = true; };
  }, [data.logos]);



  // ロゴ情報をプロンプトに追加するための共通ヘルパー
  const buildLogoPromptAdditions = () => {
    if (!data.logos || data.logos.length === 0) return '';
    const colorMap: Record<string, string> = {
      '#ffd700': 'gold', '#c0c0c0': 'silver', '#000000': 'black',
      '#ff0000': 'red', '#0000ff': 'blue', '#008000': 'green',
      '#ffa500': 'orange', '#800080': 'purple',
    };
    const parts = data.logos.map(l => {
      const typeStr = PROCESSING_TYPES[l.processingType] || 'logo';
      const colorName = l.logoColor && l.logoColor !== '#ffffff'
        ? (colorMap[l.logoColor.toLowerCase()] || l.logoColor)
        : '';
      const textPart = l.logoText ? `'${l.logoText}'` : '';
      const dirStr = l.logoType === 'text'
        ? (l.textDirection === 'vertical' ? 'vertical text arrangement, top to bottom' : 'horizontal text')
        : '';
      const placementStr = l.isTopFixed ? 'at top center' : 'centered on front panel';
      return [colorName, typeStr, dirStr, textPart, placementStr].filter(Boolean).join(' ');
    });
    return ` with ${parts.join(' and ')}`;
  };

  const handleGenerateFront = async () => {
    setIsGenerating(true);
    const currentImages = { ...data.generatedImages };
    
    try {
      // 1. Generate Front Image
      const pColor = getLabel(specJson.parameters.body_color, data.bodyColor || '') || 'neutral';
      const pFabric = getLabel(specJson.parameters.body_fabric, data.bodyFabric || '') || 'standard';
      const pPiping = getLabel(specJson.parameters.piping, data.piping || '') || 'standard';
      const pHardware = getLabel(specJson.parameters.hardware_finish, data.hardwareFinish || '') || 'standard';
      
      const logoPromptAdditions = buildLogoPromptAdditions();
      
      const basePrompt = `A highly detailed professional product photograph of a golf putter cover. Shape: ${data.headShape || 'standard'}, Color: ${pColor}, Fabric material: ${pFabric}, Piping: ${pPiping}, Hardware Finish: ${pHardware}.${logoPromptAdditions} Studio lighting, clean white background, high quality, 8k resolution.`;

      setGeneratingStatus({ front: 'loading' });
      
      const resFront = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `${basePrompt}, front view`,
          quality: data.imageQuality || 'medium'
        }),
      });

      if (!resFront.ok) throw new Error('Failed to generate front image');
      const dataFront = await resFront.json();
      
      const b64 = dataFront?.data?.[0]?.b64_json;
      let frontUrl = '';
      if (b64) {
        frontUrl = `data:image/png;base64,${b64}`;
      } else if (dataFront?.data?.[0]?.url) {
        frontUrl = dataFront.data[0].url;
      }
      
      if (!frontUrl) throw new Error('Invalid frontend image format');
      
      currentImages['front'] = frontUrl;
      currentImages['front_base'] = frontUrl;
      updateData({ generatedImages: { ...currentImages } });
      setGeneratingStatus({ front: 'done' });
    } catch (e) {
      console.error(e);
      alert('正面画像生成中にエラーが発生しました。');
      setGeneratingStatus({ front: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };




  const handleGenerateLogo = async (logoId: string) => {
    const targetLogo = (data.logos || []).find(l => l.id === logoId);
    if (!targetLogo || !targetLogo.logoText) return;
    
    setLogoGeneratingStatus(prev => ({ ...prev, [logoId]: 'loading' }));
    try {
      let logoUrl = '';
      if (targetLogo.logoType === 'text') {
        const fontType = targetLogo.textFont || 'gothic';
        const direction = targetLogo.textDirection || 'horizontal';
        logoUrl = await createCanvasTextLogo(targetLogo.logoText, fontType, direction);
      } else {
        const typePrompt = PROCESSING_TYPES[targetLogo.processingType] || "logo";
        const prompt = `minimalist brand logo mark for '${targetLogo.logoText}', white icon symbol on pure black background, simple geometric shape, no letters, no text, street style golf brand icon, clean vector style, ${typePrompt}`;
          
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, quality: 'low' })
        });
        if (!res.ok) throw new Error('Failed to generate logo');
        const dataLogo = await res.json();
        const b64 = dataLogo?.data?.[0]?.b64_json;
        if (b64) {
          logoUrl = `data:image/png;base64,${b64}`;
        } else if (dataLogo?.data?.[0]?.url) {
          logoUrl = dataLogo.data[0].url;
        }
        if (!logoUrl) throw new Error('Invalid logo format');
      }
      
      const updatedLogos = (data.logos || []).map(l => 
        l.id === logoId ? { ...l, generatedLogo: logoUrl } : l
      );
      updateData({ logos: updatedLogos });
      setLogoGeneratingStatus(prev => ({ ...prev, [logoId]: 'done' }));
    } catch (e) {
      console.error(e);
      alert('ロゴ生成中にエラーが発生しました。');
      setLogoGeneratingStatus(prev => ({ ...prev, [logoId]: 'error' }));
    }
  };

  const handleGenerateMultiview = async () => {
    setIsGenerating(true);
    setGeneratingStatus(prev => ({ ...prev, multiview: 'loading' }));
    const currentImages = { ...data.generatedImages };
    
    try {
      // ロゴテキストはZero123++に送信しない（文字峓転バグ回避）。
      // 常にfront_base（ロゴオーバーレイなし）を送信する。
      const sourceImage = data.generatedImages?.['front_base'] || data.generatedImages?.['front'] || null;
      if (!sourceImage) throw new Error('元の画像が存在しません。');

      const pureB64 = sourceImage.replace(/^data:image\/\w+;base64,/, '');

      const resMulti = await fetch('/api/generate-multiview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: pureB64 }),
      });

      if (!resMulti.ok) {
        const errorText = await resMulti.text();
        throw new Error(`Failed to generate multiview: ${errorText}`);
      }
      const dataMulti = await resMulti.json();
      const multiviewUrl = dataMulti.imageUrl;

      const slices = await sliceImage(multiviewUrl);
      
      if (slices.length === 6) {
        MULTIVIEW_KEYS.forEach((key, idx) => {
          currentImages[key] = slices[idx];
        });
        // frontは常にfront_base（ロゴオーバーレイはCSSでプレビューのみ）
        currentImages['front'] = currentImages['front_base'] || sourceImage;

        updateData({ generatedImages: { ...currentImages } });
        setGeneratingStatus(prev => ({ ...prev, multiview: 'done' }));
      } else {
        throw new Error('Slicing failed to produce 6 images');
      }
    } catch (e) {
      console.error(e);
      alert('全アングル生成中にエラーが発生しました。');
      setGeneratingStatus(prev => ({ ...prev, multiview: 'error' }));
    } finally {
      setIsGenerating(false);
    }
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
        
        <div className="flex flex-col gap-2 border-b border-indigo-100 pb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <PhotoIcon className="w-5 h-5 text-indigo-500" />
            デザイン画像生成フロー
          </h3>
          <p className="text-sm text-gray-600">
            ① 正面生成 → ② ロゴ合成 → ③ 全アングル生成
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-amber-100 text-amber-800 border border-amber-300 rounded px-2 py-0.5 font-bold">
              合計コスト目安: 約$0.04（約6円）
            </span>
            <span className="text-gray-500">①正面: $0.04 / 全アングル: 無料（Replicate）</span>
          </div>
        </div>

        {/* 1. 正面画像生成 */}
        <div className="bg-indigo-50 p-4 rounded-lg space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-bold text-indigo-900 mb-1">1. 正面ベース画像生成</h4>
              <p className="text-xs text-indigo-700">現在のパラメーターから正面のベース画像を生成します。</p>
            </div>
            <button
              onClick={handleGenerateFront}
              disabled={isGenerating || generatingStatus['front'] === 'loading'}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded shadow transition-colors flex items-center justify-center gap-2"
            >
              {(isGenerating && generatingStatus['front'] === 'loading') ? (
                <><ArrowPathIcon className="w-4 h-4 animate-spin" /> 生成中...</>
              ) : (
                <><SparklesIcon className="w-4 h-4" /> 正面画像を生成</>
              )}
            </button>
          </div>
          
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
                <span className="text-xs text-gray-500 mt-0.5">約$0.01/枚</span>
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
                <span className="text-xs text-gray-500 mt-0.5">約$0.04/枚</span>
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
                <span className="text-xs text-gray-500 mt-0.5">約$0.17/枚</span>
              </div>
            </label>
          </div>
        </div>


        {/* 2. ロゴ生成 */}
        {(data.generatedImages && data.generatedImages['front_base']) && (
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-4 animate-fade-in fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 mb-1">② 正面ロゴ合成（オプション）</h4>
                <p className="text-xs text-gray-600">入力したテキストからロゴを生成し、正面画像に合成します。Zero123++には送信されません（文字反転防止）。</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-6">
              {(data.logos || []).map((logo, idx) => (
                <div key={logo.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm relative">
                   <button 
                     onClick={() => {
                       const updated = (data.logos || []).filter(l => l.id !== logo.id);
                       updateData({ logos: updated });
                     }}
                     className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                   >✕</button>
                   <h5 className="font-bold text-sm text-gray-700 mb-3">ロゴ/刺繍 {idx + 1}</h5>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                     <div className="space-y-3">
                       {/* 加工タイプ */}
                       <div>
                         <label className="block text-xs font-medium text-gray-700 mb-1">加工タイプ</label>
                         <select 
                           className="w-full border-gray-300 rounded focus:ring-indigo-500 p-2 border text-sm"
                           value={logo.processingType}
                           onChange={(e) => {
                             const updated = (data.logos || []).map(l => l.id === logo.id ? { ...l, processingType: e.target.value } : l);
                             updateData({ logos: updated });
                           }}
                         >
                           {Object.keys(PROCESSING_TYPES).map(type => (
                             <option key={type} value={type}>{type}</option>
                           ))}
                         </select>
                       </div>

                       {/* ロゴテキスト / キーワード */}
                       <div>
                         <label className="block text-xs font-medium text-gray-700 mb-1">ロゴテキスト / キーワード</label>
                         <div className="flex gap-2">
                           <input
                             type="text"
                             className="flex-1 border-gray-300 rounded-sm focus:ring-indigo-500 p-1.5 border text-sm"
                             placeholder="Golf Street Lab"
                             value={logo.logoText || ''}
                             onChange={(e) => {
                               const updated = (data.logos || []).map(l => l.id === logo.id ? { ...l, logoText: e.target.value } : l);
                               updateData({ logos: updated });
                             }}
                           />
                           <button
                             onClick={() => handleGenerateLogo(logo.id)}
                             disabled={logoGeneratingStatus[logo.id] === 'loading' || !logo.logoText}
                             className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-medium px-3 rounded shadow transition-colors text-xs whitespace-nowrap"
                           >
                             {logoGeneratingStatus[logo.id] === 'loading' ? '生成中...' : logo.generatedLogo ? '再生成' : '生成'}
                           </button>
                         </div>
                       </div>

                       {/* アイコン / テキスト モード */}
                       <div>
                         <label className="block text-xs font-medium text-gray-700 mb-1">モード</label>
                         <div className="flex gap-4">
                           <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                             <input type="radio" name={`logoType-${logo.id}`} checked={logo.logoType !== 'text'} onChange={() => {
                               const updated = (data.logos || []).map(l => l.id === logo.id ? { ...l, logoType: 'icon' as const } : l);
                               updateData({ logos: updated });
                             }} className="text-indigo-600 border-gray-300" />
                             アイコン生成(AI)
                           </label>
                           <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                             <input type="radio" name={`logoType-${logo.id}`} checked={logo.logoType === 'text'} onChange={() => {
                               const updated = (data.logos || []).map(l => l.id === logo.id ? { ...l, logoType: 'text' as const } : l);
                               updateData({ logos: updated });
                             }} className="text-indigo-600 border-gray-300" />
                             テキスト直接描画
                           </label>
                         </div>
                       </div>

                       {/* テキストモード専用オプション */}
                       {logo.logoType === 'text' && (
                         <div className="pl-3 border-l-2 border-indigo-200 space-y-2">
                           <div>
                             <label className="block text-xs font-medium text-gray-700 mb-1">書き方向</label>
                             <div className="flex gap-4">
                               <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                                 <input type="radio" name={`dir-${logo.id}`} checked={logo.textDirection !== 'vertical'} onChange={() => {
                                   const updated = (data.logos || []).map(l => l.id === logo.id ? { ...l, textDirection: 'horizontal' as const } : l);
                                   updateData({ logos: updated });
                                 }} className="text-indigo-600 border-gray-300" />
                                 横書き
                               </label>
                               <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                                 <input type="radio" name={`dir-${logo.id}`} checked={logo.textDirection === 'vertical'} onChange={() => {
                                   const updated = (data.logos || []).map(l => l.id === logo.id ? { ...l, textDirection: 'vertical' as const } : l);
                                   updateData({ logos: updated });
                                 }} className="text-indigo-600 border-gray-300" />
                                 縦書き
                               </label>
                             </div>
                           </div>
                           <div>
                             <label className="block text-xs font-medium text-gray-700 mb-1">フォント</label>
                             <select
                               className="w-full border-gray-300 rounded focus:ring-indigo-500 p-1.5 border text-sm"
                               value={logo.textFont || 'gothic'}
                               onChange={(e) => {
                                 const updated = (data.logos || []).map(l => l.id === logo.id ? { ...l, textFont: e.target.value as any } : l);
                                 updateData({ logos: updated });
                               }}
                             >
                               <option value="gothic">ゴシック体 (sans-serif)</option>
                               <option value="mincho">明朝体 (serif)</option>
                               <option value="english">英字 (Arial/Helvetica)</option>
                             </select>
                           </div>
                         </div>
                       )}

                       {/* 上部固定 */}
                       <div className="pt-1">
                         <label className="flex items-center gap-2 cursor-pointer">
                           <input 
                             type="checkbox" 
                             checked={!!logo.isTopFixed}
                             onChange={(e) => {
                               const fixed = e.target.checked;
                               const updated = (data.logos || []).map(l => l.id === logo.id ? { 
                                 ...l, 
                                 isTopFixed: fixed,
                                 ...(fixed ? { logoX: 50, logoY: 15, logoScale: 18 } : {})
                               } : l);
                               updateData({ logos: updated });
                             }}
                             className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                           />
                           <span className="text-xs font-medium text-gray-700">
                             上部中央に固定
                             {logo.isTopFixed && <span className="ml-1 text-indigo-500 font-bold">(中央上部 / サイズ18%)</span>}
                           </span>
                         </label>
                       </div>
                     </div>
                     
                     {logo.generatedLogo && (
                       <div className="space-y-3 border-t lg:border-t-0 lg:border-l border-gray-100 pt-3 lg:pt-0 lg:pl-4">
                         <div className="flex gap-4 items-start">
                           <div className="w-16 h-16 bg-black rounded shadow-inner flex items-center justify-center shrink-0 border border-gray-300">
                             <img src={logo.generatedLogo} alt="Generated" className="max-w-full max-h-full" />
                           </div>
                           <div className="flex-1 space-y-2">
                             <div>
                               <label className="block text-xs font-medium text-gray-700 mb-1">サイズ ({logo.logoScale}%)</label>
                               <input type="range" min="5" max="80" value={logo.logoScale} onChange={(e) => {
                                 const updated = (data.logos || []).map(l => l.id === logo.id ? { ...l, logoScale: parseInt(e.target.value) } : l);
                                 updateData({ logos: updated });
                               }} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                             </div>
                             <div className="flex gap-3">
                               <div className="flex-1">
                                 <label className="block text-xs font-medium text-gray-700 mb-1 flex justify-between tracking-tighter">色 <span>{logo.logoColor}</span></label>
                                 <input type="color" value={logo.logoColor} onChange={(e) => {
                                   const updated = (data.logos || []).map(l => l.id === logo.id ? { ...l, logoColor: e.target.value } : l);
                                   updateData({ logos: updated });
                                 }} className="w-full h-6 rounded cursor-pointer border border-gray-200" />
                               </div>
                               <div className="flex-1">
                                 <label className="block text-xs font-medium text-gray-700 mb-1">透明度 ({logo.logoOpacity}%)</label>
                                 <input type="range" min="10" max="100" value={logo.logoOpacity} onChange={(e) => {
                                   const updated = (data.logos || []).map(l => l.id === logo.id ? { ...l, logoOpacity: parseInt(e.target.value) } : l);
                                   updateData({ logos: updated });
                                 }} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2" />
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                </div>
              ))}
              
              {(!data.logos || data.logos.length < 5) && (
                 <button
                   onClick={() => {
                     const newLogo: any = {
                       id: Date.now().toString(),
                       processingType: Object.keys(PROCESSING_TYPES)[0], // 普通刺繍
                       logoText: '',
                       logoType: 'icon',
                       logoX: 50,
                       logoY: 50,
                       logoScale: 20,
                       logoColor: '#ffffff',
                       logoOpacity: 100
                     };
                     updateData({ logos: [...(data.logos || []), newLogo] });
                   }}
                   className="w-full py-2 border-2 text-sm border-dashed border-gray-300 text-gray-500 rounded hover:bg-white hover:text-indigo-600 hover:border-indigo-300 transition-colors font-bold"
                 >
                   ＋ ロゴ・刺繍を追加
                 </button>
              )}
            </div>
          </div>
        )}

        {/* 3. 全アングル生成 */}
        {(data.generatedImages && data.generatedImages['front_base']) && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg space-y-4 animate-fade-in fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-bold text-indigo-900 mb-1">3. 全アングル生成</h4>
                <p className="text-xs text-indigo-700">合成済みの正面画像から残りのアングルを立体生成します。</p>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleGenerateMultiview()}
                  disabled={isGenerating || generatingStatus['multiview'] === 'loading'}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded shadow transition-colors flex items-center justify-center gap-2"
                >
                  {(isGenerating && generatingStatus['multiview'] === 'loading') ? (
                    <><ArrowPathIcon className="w-4 h-4 animate-spin" /> 生成中...</>
                  ) : (
                    <><SparklesIcon className="w-4 h-4" /> 全アングルを生成</>
                  )}
                </button>
                <p className="text-xs text-indigo-500 text-center">※ロゴは正面プレビューのみ表示（文字反転防止）</p>
              </div>
            </div>
          </div>
        )}

        {/* プレビューエリア (2列グリッド) */}
        {(isGenerating || (data.generatedImages && data.generatedImages['front_base'])) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {[
              { id: 'front', label: '① 正面 (ロゴプレビュー)' },
              { id: 'oblique_front', label: '斜め正面' },
              { id: 'oblique_back', label: '斜め背面' },
              { id: 'front_3d', label: '正面 (3D抽出)' },
              { id: 'oblique_right', label: '斜め右' },
              { id: 'oblique_left', label: '斜め左' },
              { id: 'side', label: '側面' }
            ].map(opt => {
              const status = generatingStatus[opt.id === 'front' ? 'front' : 'multiview'];
              const isFrontPreview = opt.id === 'front';
              let imageUrl = isFrontPreview ? data.generatedImages?.['front_base'] : data.generatedImages?.[opt.id];
              
              return (
                <div key={opt.id} className="w-full aspect-square bg-gray-100 rounded border border-gray-200 flex flex-col overflow-hidden relative group">
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded z-10 flex items-center gap-1">
                    {opt.label}
                  </div>
                  
                  {imageUrl ? (
                    <div className="relative w-full h-full">
                      <img src={imageUrl} alt={opt.label} className="w-full h-full object-cover bg-white pointer-events-none" />
                      {isFrontPreview && (data.logos || []).map(logo => {
                        const tSrc = transparentLogos[logo.id];
                        if (!tSrc) return null;
                        return (
                          <DraggableLogo
                            key={logo.id}
                            logoSrc={tSrc}
                            logoScale={logo.logoScale ?? 20}
                            logoX={logo.logoX ?? 50}
                            logoY={logo.logoY ?? 50}
                            logoColor={logo.logoColor}
                            logoOpacity={logo.logoOpacity}
                            isTopFixed={!!logo.isTopFixed}
                            onUpdate={(x: number, y: number) => {
                               const updated = (data.logos || []).map(l => l.id === logo.id ? { ...l, logoX: x, logoY: y } : l);
                               updateData({ logos: updated });
                            }}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                      {status === 'loading' ? (
                        <>
                          <ArrowPathIcon className="w-8 h-8 mb-2 animate-spin text-indigo-400" />
                          <span className="text-xs font-medium text-indigo-500">生成中...</span>
                        </>
                      ) : status === 'error' ? (
                        <>
                          <ExclamationTriangleIcon className="w-8 h-8 mb-2 text-red-400" />
                          <span className="text-xs font-medium text-red-500">失敗</span>
                        </>
                      ) : (
                        <>
                          <PhotoIcon className="w-8 h-8 mb-2 opacity-30" />
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
