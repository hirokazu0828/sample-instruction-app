import { useState } from 'react';
import { PrinterIcon, ArrowPathIcon, ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { SpecData } from '../types';
import specJson from '../data/putter_cover_parametric_v3.json';

interface Props {
  data: SpecData;
  updateData: (updates: Partial<SpecData>) => void;
  onReset: () => void;
  onBack: () => void;
}

export default function Step4({ data, updateData, onReset, onBack }: Props) {
  const handlePrint = () => {
    window.print();
  };

  const [localRevisions, setLocalRevisions] = useState(() => {
    if (data.revisionHistory && data.revisionHistory.length > 0) return data.revisionHistory;
    return [{ date: new Date().toISOString().split('T')[0], content: '' }];
  });
  const [localParts, setLocalParts] = useState(data.fabricParts || []);
  const [localEmbroideries, setLocalEmbroideries] = useState(data.embroideryDetails || []);
  
  const [showToast, setShowToast] = useState(false);
  const [showPage3Images, setShowPage3Images] = useState(false);

  const recalculateFabricParts = () => {
    const getColorCode = (colorValue: string) => {
      const map: Record<string, string> = {
        black: '#1A1A1A', white: '#F5F5F5', gray: '#888780', light_gray: '#C4C2BA',
        navy: '#1B2A4A', black_navy: '#0D1520', sax_blue: '#7BAFD4', burgundy: '#7B2035',
        pink: '#F4A0B0', green: '#2D6A4F', red: '#CC2200',
      };
      return map[colorValue] || '#000000';
    };
    const cCode = data.colorCode || getColorCode(data.bodyColor || '');
    const colorNameJp = getLabel(specJson.parameters.body_color, data.bodyColor || '');

    const newFabricParts = [
      { id: "A", label: "A", usage: "本体生地・縁巻き", material: getLabel(specJson.parameters.body_fabric, data.bodyFabric || ''), partNumber: "", quantity: "", colorName: colorNameJp, colorSwatch: cCode, threadNumber: "" },
      { id: "B", label: "B", usage: "本体生地・切替", material: "", partNumber: "", quantity: "", colorName: colorNameJp, colorSwatch: cCode, threadNumber: "" },
      { id: "C", label: "C", usage: "裏地", material: getLabel(specJson.parameters.lining, data.lining || ''), partNumber: "", quantity: "", colorName: "ホワイト", colorSwatch: "#ffffff", threadNumber: "" },
      { id: "D", label: "D", usage: "留め具", material: getLabel(specJson.parameters.closure, data.closure || ''), partNumber: "", quantity: "1組", colorName: getLabel(specJson.parameters.hardware_finish, data.hardwareFinish || ''), colorSwatch: "#cccccc", threadNumber: "" },
    ];
    
    if (data.piping && data.piping !== 'なし' && data.piping !== 'none') {
      newFabricParts.push({ id: "E", label: "E", usage: "パイピング", material: getLabel(specJson.parameters.piping, data.piping || ''), partNumber: "", quantity: "", colorName: colorNameJp, colorSwatch: cCode, threadNumber: "" });
    }
    
    const fLabel = newFabricParts.length === 4 ? "E" : "F";
    newFabricParts.push({ id: "F", label: fLabel, usage: "刺繍・装飾", material: getLabel(specJson.parameters.embroidery, data.embroidery || ''), partNumber: "", quantity: "", colorName: "", colorSwatch: "#cccccc", threadNumber: "" });

    updateParts(newFabricParts);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const updateRevisions = (newRevs: typeof data.revisionHistory) => {
    setLocalRevisions(newRevs);
    updateData({ revisionHistory: newRevs });
  }

  const updateParts = (newParts: typeof data.fabricParts) => {
    setLocalParts(newParts);
    updateData({ fabricParts: newParts });
  }

  const updateEmbroideries = (newEmbs: typeof data.embroideryDetails) => {
    setLocalEmbroideries(newEmbs);
    updateData({ embroideryDetails: newEmbs });
  }

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

  const shapeMap: Record<string, string> = {
    pin: 'ピン型（ブレード型）',
    mallet: 'マレット型',
    neo_mallet: 'ネオマレット（大型マレット）'
  };
  const posMap: Record<string, string> = {
    luxury: '★★★高級',
    standard: '★★☆スタンダード',
    casual: '★☆☆カジュアル'
  };

  const getColLabel = (index: number) => String.fromCharCode(65 + index); // 0 -> A, 1 -> B ...

  // -- Page Header Component --
  const PrintHeader = ({ pageNum, totalPages }: { pageNum: number, totalPages: number }) => (
    <div className="mb-[20px]">
      <table className="w-full border-collapse" style={{ tableLayout: 'auto' }}>
        <tbody>
          <tr className="text-[10px] text-[#666] bg-[#f5f5f5] h-[20px] print-bg-f5">
            <th rowSpan={2} className="w-[120px] bg-[#cc0000] text-white text-[12px] font-bold border-2 border-[#333] p-[8px_12px] align-middle print-bg-red">サンプル指示書</th>
            <th className="w-[160px] font-normal border-2 border-[#333] p-[8px_12px] align-middle">客人名</th>
            <th className="font-normal border-2 border-[#333] p-[8px_12px] align-middle" style={{ width: 'auto' }}>品番 / 製品名</th>
            <th className="w-[100px] font-normal border-2 border-[#333] p-[8px_12px] align-middle">発行日</th>
            <th className="w-[120px] font-normal border-2 border-[#333] p-[8px_12px] align-middle">氏名</th>
          </tr>
          <tr className="text-[13px] font-bold h-[28px]">
            <td className="text-center border-2 border-[#333] p-[8px_12px] align-middle">{data.brandName || ' '}</td>
            <td className="text-center border-2 border-[#333] p-[8px_12px] align-middle">
              {data.productCode || ' '} {data.bodyColor ? `(${getLabel(specJson.parameters.body_color, data.bodyColor)})` : ''}
            </td>
            <td className="text-center border-2 border-[#333] p-[8px_12px] align-middle">{data.issueDate || ' '}</td>
            <td className="text-center border-2 border-[#333] p-[8px_12px] align-middle">{data.staffName || ' '}</td>
          </tr>
        </tbody>
      </table>
      <div className="text-right text-xs mt-1 font-bold text-gray-600">
        p.{pageNum}/{totalPages}
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-fade-in fade-in" id="spec-sheet">
      
      {/* ======================= PAGE 1 ======================= */}
      <div className="border border-gray-800 rounded-sm p-[24px_32px] bg-white print:border-none print:p-0 page-break-after">
        <PrintHeader pageNum={1} totalPages={3} />
        
        <div className="mb-[20px] flex items-center gap-4">
          <span className="bg-[#16a34a] text-white px-4 py-1 font-bold text-lg inline-block print-bg-green">1. パラメーター一覧</span>
        </div>

        <div className="flex gap-8 items-start">
          <div className="flex-1">
            <table className="w-full text-sm text-left border-collapse border border-gray-800">
              <tbody>
                <tr className="border-b border-gray-800">
                  <th className="w-1/4 bg-gray-100 p-2 border-r border-gray-800 print-bg-gray">形状</th>
                  <td className="w-3/4 p-2 font-bold">{shapeMap[data.headShape] || '-'}</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <th className="bg-gray-100 p-2 border-r border-gray-800 print-bg-gray">ポジション</th>
                  <td className="p-2 font-bold">{posMap[data.position] || '-'}</td>
                </tr>
                <tr className="border-b-4 border-gray-800">
                  <th className="bg-gray-100 p-2 border-r border-gray-800 align-top print-bg-gray">コンセプト</th>
                  <td className="p-2 whitespace-pre-wrap flex-grow">{data.conceptMemo || '-'}</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <th className="bg-gray-100 p-2 border-r border-gray-800 print-bg-gray">本体生地</th>
                  <td className="p-2">{getLabel(specJson.parameters.body_fabric, data.bodyFabric)}</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <th className="bg-gray-100 p-2 border-r border-gray-800 print-bg-gray">テクスチャー</th>
                  <td className="p-2">{getLabel(specJson.parameters.texture, data.texture)}</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <th className="bg-gray-100 p-2 border-r border-gray-800 print-bg-gray">裏地</th>
                  <td className="p-2">{getLabel(specJson.parameters.lining, data.lining)}</td>
                </tr>
                <tr className="border-b-4 border-gray-800">
                  <th className="bg-gray-100 p-2 border-r border-gray-800 print-bg-gray">パイピング</th>
                  <td className="p-2">{getLabel(specJson.parameters.piping, data.piping)}</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <th className="bg-gray-100 p-2 border-r border-gray-800 print-bg-gray">開閉方式</th>
                  <td className="p-2">{getLabel(specJson.parameters.closure, data.closure)}</td>
                </tr>
                <tr className="border-b-4 border-gray-800">
                  <th className="bg-gray-100 p-2 border-r border-gray-800 print-bg-gray">主刺繍技法</th>
                  <td className="p-2">{getLabel(specJson.parameters.embroidery, data.embroidery)}</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <th className="bg-gray-100 p-2 border-r border-gray-800 print-bg-gray">本体カラー</th>
                  <td className="p-2">
                    {getLabel(specJson.parameters.body_color, data.bodyColor)} 
                    {data.colorCode && <span className="ml-2 text-gray-500">（コード: {data.colorCode}）</span>}
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <th className="bg-gray-100 p-2 border-r border-gray-800 align-top print-bg-gray">部位別</th>
                  <td className="p-2 text-xs">
                    {data.fabricParts && data.fabricParts.length > 0
                      ? data.fabricParts.map((part) => (
                          <div key={part.id} className="mb-0.5">
                            <span className="font-bold">{part.id}:</span> {part.usage || "-"} ／ {part.material || "-"} ／ {part.colorName || "-"}
                          </div>
                        ))
                      : "-"}
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <th className="bg-gray-100 p-2 border-r border-gray-800 print-bg-gray">金具仕上げ</th>
                  <td className="p-2">{getLabel(specJson.parameters.hardware_finish, data.hardwareFinish)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* P1: 正面と斜め正面の2枚を表示 */}
          <div className="w-[300px] border-2 border-[#16a34a] p-2 bg-[#f0fdf4] print:border-[#333] print:bg-white flex flex-col items-center flex-shrink-0">
            <span className="text-[#16a34a] font-bold text-sm mb-2 print:text-[#333]">■ デザイン完成イメージ (AI)</span>
            <div className="flex flex-col gap-4 w-full h-full">
              {/* 正面 */}
              <div className="flex-1 flex flex-col items-center bg-white p-2 border rounded shadow-sm print:shadow-none print:border-gray-300">
                {data.generatedImages?.front ? (
                  <img src={data.generatedImages.front} alt="正面" className="w-full h-auto object-contain flex-1 min-h-0" />
                ) : (
                  <div className="w-full flex-1 min-h-[240px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center p-2 rounded">画像未生成<br/>(正面)</div>
                )}
                <span className="text-sm font-bold mt-2 text-gray-700">正面 (高画質)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================= PAGE 2 ======================= */}
      <div className="border border-gray-800 rounded-sm p-[24px_32px] bg-white print:border-none print:p-0 page-break-before page-break-after">
        <PrintHeader pageNum={2} totalPages={3} />

        <div className="mb-[20px] flex gap-[8px] items-center">
          <span className="bg-[#16a34a] text-white px-4 py-1 font-bold text-lg inline-block print-bg-green">2. 生地仕様</span>
          <span className="font-bold text-gray-700">布料</span>
        </div>

        {/* 改訂履歴エリア */}
        <div className="mb-[20px]">
          <h4 className="font-bold mb-2">改訂履歴</h4>
          <table className="w-full text-sm border-collapse border border-[#333]">
            <thead>
              <tr>
                <th className="bg-[#e8e8e8] border border-[#333] p-[6px] w-[120px] print-bg-e8 font-bold">日付</th>
                <th className="bg-[#e8e8e8] border border-[#333] p-[6px] print-bg-e8 font-bold text-left px-2">変更内容</th>
              </tr>
            </thead>
            <tbody>
              {localRevisions.map((rev, idx) => (
                <tr key={idx}>
                  <td className="border border-[#333] p-0 text-center relative max-w-[120px]">
                    <input type="date" className="w-full border-none p-[6px] text-center text-sm bg-transparent print:bg-transparent" value={rev.date} onChange={(e) => {
                      const n = [...localRevisions]; n[idx].date = e.target.value; updateRevisions(n);
                    }} />
                  </td>
                  <td className="border border-[#333] p-0 relative">
                    <input type="text" className="w-full border-none p-[6px] text-sm bg-transparent px-2 print:bg-transparent" placeholder="例: 修正①D菅付けテープをなるべく短くする" value={rev.content} onChange={(e) => {
                      const n = [...localRevisions]; n[idx].content = e.target.value; updateRevisions(n);
                    }} />
                    <button onClick={() => updateRevisions(localRevisions.filter((_, i) => i !== idx))} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 print:hidden bg-white rounded-full"><XMarkIcon className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="border border-[#333] p-2 print:hidden bg-[#f9f9f9]">
                  <button onClick={() => updateRevisions([...localRevisions, { date: new Date().toISOString().split('T')[0], content: '' }])} className="text-indigo-600 text-sm font-bold flex items-center justify-center w-full hover:underline">
                    <PlusIcon className="w-4 h-4 mr-1"/> 改訂を追加
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 縫製注意事項エリア */}
        <div className="mb-[20px] border-t border-[#ddd] pt-[16px]">
          <h4 className="font-bold mb-2">縫製注意事項</h4>
          <textarea
            className="w-full border border-gray-400 p-2 min-h-[60px] print:border-gray-400 print:resize-none"
            placeholder="例: 磁石式/磁石位置,磁力注意"
            value={data.sewingNotes}
            onChange={e => updateData({ sewingNotes: e.target.value })}
          />
        </div>

        {/* 寸法入力エリア */}
        <div className="mb-[20px] border-t border-[#ddd] pt-[16px]">
          <h4 className="font-bold mb-2">寸法</h4>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm"><span className="font-bold">全長</span> <input type="number" className="border border-gray-400 p-1 w-20 print:border-gray-400" value={data.dimensionLength} onChange={e => updateData({dimensionLength: e.target.value})} /> mm</label>
            <label className="flex items-center gap-2 text-sm"><span className="font-bold">幅</span> <input type="number" className="border border-gray-400 p-1 w-20 print:border-gray-400" value={data.dimensionWidth} onChange={e => updateData({dimensionWidth: e.target.value})} /> mm</label>
            <label className="flex items-center gap-2 text-sm"><span className="font-bold">高さ</span> <input type="number" className="border border-gray-400 p-1 w-20 print:border-gray-400" value={data.dimensionHeight} onChange={e => updateData({dimensionHeight: e.target.value})} /> mm</label>
            <label className="flex items-center gap-2 text-sm"><span className="font-bold">縁巻き幅</span> <input type="number" className="border border-gray-400 p-1 w-20 print:border-gray-400" value={data.dimensionPiping} onChange={e => updateData({dimensionPiping: e.target.value})} /> mm</label>
            <label className="flex items-center gap-2 text-sm"><span className="font-bold">刺繍位置</span> <input type="number" className="border border-gray-400 p-1 w-20 print:border-gray-400" value={data.dimensionEmbroidery} onChange={e => updateData({dimensionEmbroidery: e.target.value})} /> mm</label>
          </div>
        </div>

        {/* P2: 自動生成された全アングル画像の表示 */}
        <div className="mb-[20px] border-t border-[#ddd] pt-[16px]">
          <h4 className="font-bold mb-2">デザイン画像 (全6アングル展開)</h4>
          {data.generatedImages && data.generatedImages.oblique_front ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['oblique_front', 'oblique_back', 'front_3d', 'oblique_right', 'oblique_left', 'side'].map(key => {
                const url = data.generatedImages![key];
                if (!url) return null;
                const labelMap: Record<string, string> = { 
                  oblique_front: '斜め正面', 
                  oblique_back: '斜め背面', 
                  front_3d: '正面', 
                  oblique_right: '斜め右',
                  oblique_left: '斜め左',
                  side: '側面' 
                };
                return (
                  <div key={key} className="flex flex-col items-center bg-white p-2 border border-gray-300 rounded print:border-[#333]">
                    <img src={url} alt={labelMap[key]} className="w-full h-[160px] object-contain" />
                    <span className="text-xs font-bold mt-2 text-gray-700">{labelMap[key]}</span>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="text-gray-500 text-sm">※デザイン画像は生成されていません</div>
          )}
        </div>

        {/* 部位別仕様表 */}
        <div className="mb-[20px] border-t border-[#ddd] pt-[16px] relative">
          {showToast && (
            <div className="absolute top-[-30px] right-0 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg z-10 transition-opacity duration-200 print:hidden animate-fade-in fade-in">
              再反映しました
            </div>
          )}
          <div className="flex justify-between items-center mb-2 print:hidden">
            <h4 className="font-bold">部位別仕様表</h4>
            <button 
              onClick={recalculateFabricParts}
              className="flex items-center text-sm bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded shadow-sm hover:bg-indigo-100 font-bold transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" /> STEP2の内容を再反映
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th className="w-[90px] min-w-[90px] bg-[#e8e8e8] border border-[#333] p-[6px_8px] print-bg-e8"></th>
                  {localParts.map((part) => (
                    <th key={part.id} className="min-w-[120px] h-[32px] bg-[#c8e6c9] border border-[#333] font-bold text-[13px] text-center relative print-bg-c8">
                      {part.label}
                      <button onClick={() => updateParts(localParts.filter(p => p.id !== part.id))} className="absolute top-1 right-1 text-red-600 print:hidden" title="列を削除"><XMarkIcon className="w-4 h-4"/></button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 使用箇所 / 素材名 */}
                <tr className="h-[80px]">
                  <th className="w-[90px] min-w-[90px] bg-[#e8e8e8] font-bold text-[12px] p-0 text-center border border-[#333] print-bg-e8 align-middle">
                    <div className="flex flex-col h-full justify-center">
                      <div className="flex-1 flex items-center justify-center border-b border-[#aaa]">使用箇所 /</div>
                      <div className="flex-1 flex items-center justify-center">素材名</div>
                    </div>
                  </th>
                  {localParts.map((part, idx) => (
                    <td key={part.id} className="border border-[#333] p-0 min-w-[120px] align-top bg-white">
                      <div className="flex flex-col h-full">
                        <div className="h-[30px] bg-[#f5f5f5] print-bg-f5 border-b border-[#ddd]">
                          <input type="text" className="w-full h-full text-center border-none p-1 bg-transparent text-[11px] font-bold outline-none" value={part.usage} onChange={e => { const n = [...localParts]; n[idx].usage = e.target.value; updateParts(n); }} placeholder="例: 本体生地" />
                        </div>
                        <div className="flex-1 h-[50px]">
                          <textarea className="w-full h-full text-center border-none p-1 bg-transparent text-[11px] resize-none leading-[1.3] outline-none" rows={2} value={part.material} onChange={e => { const n = [...localParts]; n[idx].material = e.target.value; updateParts(n); }} placeholder="例: マットしぼ / PU" />
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
                {/* 本体カラー / カラー指示 */}
                <tr className="h-[80px]">
                  <th className="w-[90px] min-w-[90px] bg-[#e8e8e8] font-bold text-[12px] p-0 text-center border border-[#333] print-bg-e8 align-middle">
                    <div className="flex flex-col h-full justify-center">
                      <div className="flex-1 flex items-center justify-center border-b border-[#aaa]">本体カラー</div>
                      <div className="flex-1 flex items-center justify-center">/ カラー指示</div>
                    </div>
                  </th>
                  {localParts.map((part, idx) => (
                    <td key={part.id} className="border border-[#333] p-0 min-w-[120px] align-top bg-white">
                      <div className="flex flex-col items-center justify-center h-full gap-[2px] py-1">
                        <input type="text" className="w-full text-center border-none p-0 bg-transparent text-[11px] font-bold outline-none h-[20px]" value={part.colorName} onChange={e => { const n = [...localParts]; n[idx].colorName = e.target.value; updateParts(n); }} placeholder="ブラック" />
                        <div className="flex justify-center items-center h-[24px]">
                          <input type="color" className="w-[20px] h-[20px] border border-[#999] p-0 block cursor-pointer" value={part.colorSwatch} onChange={e => { const n = [...localParts]; n[idx].colorSwatch = e.target.value; updateParts(n); }} />
                        </div>
                        <input type="text" className="w-full text-center border-none p-0 bg-transparent text-[11px] text-gray-600 outline-none h-[20px]" value={part.threadNumber} onChange={e => { const n = [...localParts]; n[idx].threadNumber = e.target.value; updateParts(n); }} placeholder="例: #92" />
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {localParts.length < 8 && (
            <button onClick={() => updateParts([...localParts, { id: Date.now().toString(), label: getColLabel(localParts.length), usage: '', material: '', partNumber: '', quantity: '', colorName: '', threadNumber: '', colorSwatch: '#cccccc' }])} className="text-indigo-600 text-sm font-bold flex items-center mt-3 print:hidden"><PlusIcon className="w-4 h-4 mr-1"/> 部位を追加</button>
          )}
        </div>

        {/* ネック刺繍詳細セクション + 6アングル */}
        <div className="mt-6">
          <h4 className="font-bold text-sm mb-3 border-b border-gray-300 pb-1">全アングル展開イメージ</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {['oblique_front','oblique_back','front_3d','oblique_right','oblique_left','side'].map(key => (
              data.generatedImages?.[key] ? (
                <div key={key} className="flex flex-col items-center">
                  <img src={data.generatedImages[key]} alt={key} className="w-full aspect-square object-cover rounded border border-gray-200 shadow-sm" />
                  <span className="text-[10px] mt-1 text-gray-500">{{
                    oblique_front: '斜め正面', oblique_back: '斜め背面',
                    front_3d: '正面(3D)', oblique_right: '斜め右',
                    oblique_left: '斜め左', side: '側面'
                  }[key]}</span>
                </div>
              ) : (
                <div key={key} className="flex flex-col items-center justify-center bg-gray-100 aspect-square rounded border border-gray-200 border-dashed">
                  <span className="text-[10px] text-gray-400">未生成</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* ======================= PAGE 3 ======================= */}
      <div className="border border-gray-800 rounded-sm p-[24px_32px] bg-white print:border-none print:p-0 page-break-before">
        <PrintHeader pageNum={3} totalPages={3} />

        <div className="mb-[20px] flex gap-[8px] items-center justify-between">
          <div className="flex gap-[8px] items-center">
            <span className="bg-[#16a34a] text-white px-4 py-1 font-bold text-lg inline-block print-bg-green">3. 刺繍・プリント・高周波</span>
            <span className="font-bold text-gray-700">刺绣・印刷等</span>
          </div>
          <div className="print:hidden flex gap-2">
            <label className="flex items-center gap-2 cursor-pointer bg-gray-100 px-3 py-1 rounded border border-gray-300 hover:bg-gray-200 transition-colors">
              <input type="checkbox" checked={showPage3Images} onChange={e => setShowPage3Images(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-gray-300" />
              <span className="text-sm font-bold text-gray-700">参考画像を表示する</span>
            </label>
            {data.logos?.length ? (
              <button
                onClick={() => {
                  const allLogos = data.logos || [];
                  const newEmbs = allLogos.map((l, i) => ({
                    id: `auto_${i}_${Date.now()}`,
                    technique: l.processingType || '',
                    threadType: l.logoColor?.toLowerCase().includes('gold') || l.logoColor === '#ffd700' ? 'メタリック糸' : '標準刺繍糸',
                    threadNumber: l.logoColor || '',
                    size: '',
                    placement: l.isTopFixed ? '上部中央' : '前面パネル',
                  }));
                  updateEmbroideries(newEmbs);
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 2000);
                }}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-3 py-1 rounded border border-green-700 transition-colors"
              >
                ロゴ設定から自動入力
              </button>
            ) : null}
          </div>
        </div>

        {/* コンテンツラッパー */}
        <div className={`flex gap-6 items-start ${!showPage3Images ? 'flex-col' : ''}`}>
          <div className="flex-1 w-full">
            {/* 刺繍指示テーブル */}
        <div className="mb-[20px]">
          <table className="w-full text-sm text-center border-collapse border border-[#333]">
            <thead>
              <tr>
                <th className="bg-[#c8e6c9] border border-[#333] p-2 w-[50px] font-bold print-bg-c8 text-[13px]">番号</th>
                <th className="bg-[#c8e6c9] border border-[#333] p-2 w-[180px] font-bold print-bg-c8 text-[13px]">技法</th>
                <th className="bg-[#c8e6c9] border border-[#333] p-2 w-[120px] font-bold print-bg-c8 text-[13px]">糸種</th>
                <th className="bg-[#c8e6c9] border border-[#333] p-2 w-[200px] font-bold print-bg-c8 text-[13px]">糸番号・カラー名</th>
                <th className="bg-[#c8e6c9] border border-[#333] p-2 w-[80px] font-bold print-bg-c8 text-[13px]">サイズmm</th>
                <th className="bg-[#c8e6c9] border border-[#333] p-2 w-[120px] font-bold print-bg-c8 text-[13px]">配置</th>
                <th className="border-none w-8 print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {localEmbroideries.map((emb, idx) => (
                <tr key={emb.id}>
                  <td className="border border-[#333] p-1 font-bold">{idx + 1}</td>
                  <td className="border border-[#333] p-1">
                    <select className="w-full border-none bg-transparent" value={emb.technique} onChange={e => { const n = [...localEmbroideries]; n[idx].technique = e.target.value; updateEmbroideries(n); }}>
                      <option value=""></option>
                      <option value="普通刺繍">普通刺繍</option>
                      <option value="普通刺繍・振り刺繍">普通刺繍・振り刺繍</option>
                      <option value="畳刺繍">畳刺繍</option>
                      <option value="畳立体刺繍">畳立体刺繍</option>
                      <option value="文字型土台畳刺繍">文字型土台畳刺繍</option>
                      <option value="シリコンパッチ">シリコンパッチ</option>
                      <option value="プリント">プリント</option>
                    </select>
                  </td>
                  <td className="border border-[#333] p-1">
                    <select className="w-full border-none bg-transparent" value={emb.threadType} onChange={e => { const n = [...localEmbroideries]; n[idx].threadType = e.target.value; updateEmbroideries(n); }}>
                      <option value=""></option>
                      <option value="銀杏">銀杏</option>
                      <option value="メタリック糸">メタリック糸</option>
                      <option value="標準刺繍糸">標準刺繍糸</option>
                    </select>
                  </td>
                  <td className="border border-[#333] p-1">
                    <input type="text" className="w-full text-center border-none p-1 bg-transparent" value={emb.threadNumber} onChange={e => { const n = [...localEmbroideries]; n[idx].threadNumber = e.target.value; updateEmbroideries(n); }} placeholder="例: #2173(オフホワイト)" />
                  </td>
                  <td className="border border-[#333] p-1">
                    <input type="number" className="w-full text-center border-none p-1 bg-transparent" value={emb.size} onChange={e => { const n = [...localEmbroideries]; n[idx].size = e.target.value; updateEmbroideries(n); }} />
                  </td>
                  <td className="border border-[#333] p-1">
                    <input type="text" className="w-full text-center border-none p-1 bg-transparent" value={emb.placement} onChange={e => { const n = [...localEmbroideries]; n[idx].placement = e.target.value; updateEmbroideries(n); }} placeholder="例: 前面" />
                  </td>
                  <td className="border-none text-left print:hidden">
                    <button onClick={() => updateEmbroideries(localEmbroideries.filter(e => e.id !== emb.id))} className="text-red-500 ml-2" title="行を削除"><XMarkIcon className="w-5 h-5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => updateEmbroideries([...localEmbroideries, { id: Date.now().toString(), technique: '', threadType: '', threadNumber: '', size: '', placement: '' }])} className="text-indigo-600 text-sm font-bold flex items-center mt-3 print:hidden">
            <PlusIcon className="w-4 h-4 mr-1"/> 刺繍を追加
          </button>
        </div>

        {/* 縫製注意事項エリア共通（P3） */}
        <div className="mb-[20px] border-t border-[#ddd] pt-[16px]">
          <h4 className="font-bold mb-2">縫製注意事項（刺繍・プリントなど共通）</h4>
          <textarea
            className="w-full border border-gray-400 p-2 min-h-[80px] print:border-gray-400 print:resize-none"
            value={data.sewingNotes}
            onChange={e => updateData({ sewingNotes: e.target.value })}
          />
        </div>
          </div> {/* End flex-1 */}
          
          {/* P3: トグル式画像エリア (右サイド) */}
          {showPage3Images && data.generatedImages && Object.keys(data.generatedImages).length > 0 && (
            <div className="w-[240px] border-2 border-[#16a34a] p-2 bg-[#f0fdf4] print:border-[#333] print:bg-white flex flex-col items-center flex-shrink-0 print:hidden md:flex">
              <span className="text-[#16a34a] font-bold text-sm mb-2 print:text-[#333]">■ デザイン完成イメージ</span>
              <div className="flex flex-col gap-2 w-full">
                {['front', 'side'].map(key => {
                  const url = data.generatedImages![key];
                  if (!url) return null;
                  const labelMap: Record<string, string> = { front: '正面', side: '側面' };
                  return (
                    <div key={key} className="flex flex-col items-center bg-white p-1 border rounded shadow-sm">
                      <img src={url} alt={labelMap[key]} className="w-full h-auto object-contain" />
                      <span className="text-[10px] font-bold mt-1 text-gray-700">{labelMap[key]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div> {/* End flex gap-6 wrapper */}
      </div>

      {/* Global Buttons */}
      <div className="pt-6 flex justify-between print:hidden">
        <button
          onClick={onBack}
          className="bg-white border text-gray-700 hover:bg-gray-50 font-bold py-3 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" /> 戻る
        </button>
        <div className="flex gap-4">
          <button
            onClick={onReset}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow transition-colors flex items-center gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" /> 最初からやり直す
          </button>
          <button
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow transition-colors flex items-center gap-2"
          >
            <PrinterIcon className="w-5 h-5" /> 印刷・PDF出力
          </button>
        </div>
      </div>
      
      {/* 印刷用CSS */}
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          
          .page-break-before { page-break-before: always; }
          .page-break-after { page-break-after: always; }
          
          .print-bg-green { background-color: #16a34a !important; color: white !important; }
          .print-bg-c8 { background-color: #c8e6c9 !important; }
          .print-bg-e8 { background-color: #e8e8e8 !important; }
          .print-bg-f5 { background-color: #f5f5f5 !important; }
          .print-bg-gray { background-color: #f3f4f6 !important; }
          .print-bg-red { background-color: #cc0000 !important; color: white !important; }
          
          /* Form styling in print mode */
          input[type="text"], input[type="number"], input[type="date"], select, textarea {
            border: 1px solid #ccc !important;
            background: transparent !important;
            color: black !important;
            box-shadow: none !important;
          }
          /* override border where none is needed */
          table input.border-none {
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
