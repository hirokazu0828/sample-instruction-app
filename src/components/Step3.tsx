import { useMemo, useState } from 'react';
import { DocumentDuplicateIcon, CheckIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import type { SpecData } from '../types';
import specJson from '../data/putter_cover_parametric_v3.json';

interface Props {
  data: SpecData;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3({ data, onNext, onBack }: Props) {
  const [copied, setCopied] = useState(false);

  const promptText = useMemo(() => {
    // Helper to find english term from json
    const getEn = (paramMap: any, value: string) => {
      if (!value) return '';
      const opt = paramMap.options.find((o: any) => o.value === value);
      return opt ? opt.en : '';
    };

    const shapeEn = (specJson.midjourney.shape_en as any)[data.headShape] || '';
    const fabricEn = getEn(specJson.parameters.body_fabric, data.bodyFabric);
    const colorEn = getEn(specJson.parameters.body_color, data.bodyColor);
    const embroideryEn = getEn(specJson.parameters.embroidery, data.embroidery);

    let positionEn = '';
    if (data.position === 'luxury') positionEn = 'luxury, premium quality, sophisticated craftsmanship';
    else if (data.position === 'standard') positionEn = 'premium, clean design, quality craftsmanship';
    else if (data.position === 'casual') positionEn = 'casual, sporty, colorful, fun';

    const parts = [shapeEn, fabricEn, colorEn, positionEn, embroideryEn].filter(Boolean);
    const prefix = parts.join(', ');
    return `${prefix}, ${specJson.midjourney.suffix}`;
  }, [data]);

  const jpDescription = useMemo(() => {
    // Helper to find JP label
    const getLabel = (paramMap: any, value: string) => {
      if (!value) return '';
      const opt = paramMap.options?.find((o: any) => o.value === value);
      return opt ? opt.label : '';
    };
    const getShapeLabel = (val: string) => {
      if (val === 'pin') return 'ピン型（ブレード型）';
      if (val === 'mallet') return 'マレット型';
      if (val === 'neo_mallet') return 'ネオマレット（大型マレット）';
      return '';
    };
    const getPosLabel = (val: string) => {
      if (val === 'luxury') return '高級ライン';
      if (val === 'standard') return 'スタンダードライン';
      if (val === 'casual') return 'カジュアルライン';
      return '';
    };

    const s = getShapeLabel(data.headShape);
    const f = getLabel(specJson.parameters.body_fabric, data.bodyFabric);
    const c = getLabel(specJson.parameters.body_color, data.bodyColor);
    const p = getPosLabel(data.position);
    const e = getLabel(specJson.parameters.embroidery, data.embroidery);

    const parts = [
      s && `${s}パターカバー`,
      f && `${f}素材`,
      c && `${c}カラー`,
      p && p,
      e && `${e}のイメージ`
    ].filter(Boolean);

    return `${parts.join('、')}で生成します。`;
  }, [data]);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in fade-in">
      <div className="text-center">
        <CpuChipIcon className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AIデザイン画像生成</h2>
        <p className="text-gray-600">STEP2までの仕様データをもとに、Midjourney用の英語プロンプトを自動生成しました。</p>
      </div>

      <div className="bg-white border-2 border-indigo-100 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
          <h3 className="font-bold text-indigo-900">Midjourney プロンプト</h3>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              copied 
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
            }`}
          >
            {copied ? (
              <><CheckIcon className="w-4 h-4" /> コピー完了</>
            ) : (
              <><DocumentDuplicateIcon className="w-4 h-4" /> コピー</>
            )}
          </button>
        </div>
        <div className="p-6 bg-gray-900">
          <code className="text-green-400 font-mono text-sm leading-relaxed block break-all">
            {promptText}
          </code>
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-lg p-5 border border-blue-100">
        <h4 className="font-bold text-blue-900 mb-2">【日本語での内容説明】</h4>
        <p className="text-blue-800">{jpDescription}</p>
      </div>

      <div className="pt-6 border-t flex justify-between">
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
          STEP4へ進む →
        </button>
      </div>
    </div>
  );
}
