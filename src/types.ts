export type SpecData = {
  // STEP1
  productCode: string;
  seasonCode: string;
  brandName: string;
  staffName: string;
  clientName: string;
  issueDate: string;
  revisionNote: string;
  hasRevision: boolean;
  headShape: string;
  position: string;
  conceptMemo: string;

  // STEP2
  bodyFabric: string;
  texture: string;
  lining: string;
  piping: string;
  closure: string;
  embroidery: string;
  bodyColor: string;
  colorCode: string;
  colorA: string;
  colorB: string;
  colorC: string;
  colorD: string;
  hardwareFinish: string;

  // p.2生地仕様ページ用
  dimensionLength: string;
  dimensionWidth: string;
  dimensionHeight: string;
  dimensionPiping: string;
  dimensionEmbroidery: string;
  sewingNotes: string;
  revisionHistory: Array<{ date: string; content: string }>;
  fabricParts: Array<{
    id: string;
    label: string;
    usage: string;
    material: string;
    partNumber: string;
    quantity: string;
    colorName: string;
    threadNumber: string;
    colorSwatch: string;
  }>;
  productPhotos: Array<{
    name: string;
    dataUrl: string;
  }>;

  // p.3刺繍指示ページ用
  embroideryDetails: Array<{
    id: string;
    technique: string;
    threadType: string;
    threadNumber: string;
    size: string;
    placement: string;
  }>;
  generatedImage?: string;
  generatedImages?: Record<string, string>;
  imageQuality?: 'low' | 'medium' | 'high';

  // Logo fields
  logoText?: string;
  logoType?: 'icon' | 'text';
  generatedLogo?: string;
  logoX?: number;
  logoY?: number;
  logoScale?: number;
};

export const initialSpecData: SpecData = {
  productCode: '',
  seasonCode: '',
  brandName: '',
  staffName: '',
  clientName: '',
  issueDate: new Date().toISOString().split('T')[0],
  revisionNote: '',
  hasRevision: false,
  headShape: '',
  position: '',
  conceptMemo: '',

  bodyFabric: '',
  texture: '',
  lining: '',
  piping: '',
  closure: '',
  embroidery: '',
  bodyColor: '',
  colorCode: '',
  colorA: '',
  colorB: '',
  colorC: '',
  colorD: '',
  hardwareFinish: '',

  dimensionLength: '',
  dimensionWidth: '',
  dimensionHeight: '',
  dimensionPiping: '',
  dimensionEmbroidery: '',
  sewingNotes: '',
  revisionHistory: [],
  fabricParts: [
    { id: '1', label: 'A', usage: '', material: '', partNumber: '', quantity: '', colorName: '', threadNumber: '', colorSwatch: '#000000' },
    { id: '2', label: 'B', usage: '', material: '', partNumber: '', quantity: '', colorName: '', threadNumber: '', colorSwatch: '#000000' },
    { id: '3', label: 'C', usage: '', material: '', partNumber: '', quantity: '', colorName: '', threadNumber: '', colorSwatch: '#000000' },
    { id: '4', label: 'D', usage: '', material: '', partNumber: '', quantity: '', colorName: '', threadNumber: '', colorSwatch: '#000000' },
  ],
  productPhotos: [
    { name: '正面', dataUrl: '' },
    { name: '側面', dataUrl: '' },
    { name: '背面', dataUrl: '' },
  ],
  embroideryDetails: [
    { id: '1', technique: '', threadType: '', threadNumber: '', size: '', placement: '' },
    { id: '2', technique: '', threadType: '', threadNumber: '', size: '', placement: '' },
    { id: '3', technique: '', threadType: '', threadNumber: '', size: '', placement: '' },
  ],
  logoX: 50,
  logoY: 50,
  logoScale: 20,
  logoType: 'icon',
};

