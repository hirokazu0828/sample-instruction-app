import type { SpecData } from '../types';

interface Props {
  data: SpecData;
  updateData: (data: Partial<SpecData>) => void;
  onNext: () => void;
}

export default function Step1({ data, updateData, onNext }: Props) {
  const brands = [
    'PEARLY GATES', 'フォーティーン', 'ツアーステージ', 'TaylorMade',
    'Callaway', 'Titleist', 'Scotty Cameron', 'Odyssey', 'ミズノ', 'ブリヂストン'
  ];

  return (
    <div className="space-y-10 animate-fade-in fade-in">
      {/* 書類管理セクション */}
      <section>
        <h2 className="text-xl font-bold border-b pb-2 mb-6 text-gray-800">■ 書類管理セクション</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">品番コード</label>
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
              placeholder="例: FTN-2503-P088"
              value={data.productCode}
              onChange={(e) => updateData({ productCode: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">シーズンコード</label>
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
              placeholder="例: 2503"
              value={data.seasonCode}
              onChange={(e) => updateData({ seasonCode: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ブランド名 (自由入力可)</label>
            <input
              type="text"
              list="brands"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
              value={data.brandName}
              onChange={(e) => updateData({ brandName: e.target.value })}
            />
            <datalist id="brands">
              {brands.map((b) => <option key={b} value={b} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">担当者名</label>
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
              value={data.staffName}
              onChange={(e) => updateData({ staffName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客人名・取引先</label>
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
              value={data.clientName}
              onChange={(e) => updateData({ clientName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">発行日</label>
            <input
              type="date"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
              value={data.issueDate}
              onChange={(e) => updateData({ issueDate: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">改訂内容 (任意)</label>
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
              value={data.revisionNote}
              onChange={(e) => updateData({ revisionNote: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">仕様変更の有無</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="specChange"
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  checked={data.hasRevision === true}
                  onChange={() => updateData({ hasRevision: true })}
                />
                <span>変更あり</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="specChange"
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  checked={data.hasRevision === false}
                  onChange={() => updateData({ hasRevision: false })}
                />
                <span>変更なし</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* コンセプトセクション */}
      <section>
        <h2 className="text-xl font-bold border-b pb-2 mb-6 text-gray-800">■ コンセプトセクション</h2>

        <div className="space-y-8">
          {/* ヘッド形状 */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">ヘッド形状</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'pin', label: 'ピン型（ブレード型）' },
                { id: 'mallet', label: 'マレット型' },
                { id: 'neo_mallet', label: 'ネオマレット（大型マレット）' },
              ].map((h) => (
                <label
                  key={h.id}
                  className={`border-2 rounded-xl p-4 text-center cursor-pointer transition-all ${
                    data.headShape === h.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="headShape"
                    className="hidden"
                    checked={data.headShape === h.id}
                    onChange={() => updateData({ headShape: h.id })}
                  />
                  <span className="font-semibold block">{h.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ブランドポジション */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">ブランドポジション</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'luxury', label: '★★★ 高級' },
                { id: 'standard', label: '★★☆ スタンダード' },
                { id: 'casual', label: '★☆☆ カジュアル' },
              ].map((p) => (
                <label
                  key={p.id}
                  className={`border-2 rounded-xl p-4 text-center cursor-pointer transition-all ${
                    data.position === p.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="position"
                    className="hidden"
                    checked={data.position === p.id}
                    onChange={() => updateData({ position: p.id })}
                  />
                  <span className="font-semibold block">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">コンセプトメモ (任意)</label>
            <textarea
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border min-h-[100px]"
              placeholder="例: 「秋冬向け高級マレット。PEARLY GATES定番ブラック」"
              value={data.conceptMemo}
              onChange={(e) => updateData({ conceptMemo: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* STEP2へ進むボタン */}
      <div className="pt-6 border-t flex justify-end">
        <button
          onClick={onNext}
          disabled={!data.headShape || !data.position}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          STEP2へ進む →
        </button>
      </div>
    </div>
  );
}
