// ScriptGenerator.jsx
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { 
    Loader2, Sparkles, X, Clock, Layers, Film, ArrowUp, ChevronDown, ChevronUp, Settings2, 
    Palette, Ban, Search, FileText, Copy, Check, LogOut, Home, Music, Mic, Image // 🔑 เพิ่ม Icons สำหรับ Navigation
} from "lucide-react"; 
import { useState, useEffect, useRef } from 'react';

// 🔑 แก้ไข PATH การ Import ให้ถูกต้องตามโครงสร้างไฟล์ (src/ScriptGenerator.jsx -> src/components/...)
import MusicGenerator from './components/MusicGenerator'; 
import VoiceoverGenerator from './components/VoiceoverGenerator';
import ThumbnailGenerator from './components/ThumbnailGenerator';

// --- Helper Function: Delay เพื่อลดโหลด Server ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 💡 API Key ถูกโหลดจาก App.jsx ผ่าน .env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 

// --- Component Helpers ---
const AccentButton = ({ children, onClick, disabled, className = '', icon: Icon, type = 'button' }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-md active:scale-[0.98] whitespace-nowrap ${
            disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-300/50'
        } ${className}`}
    >
        {Icon && <Icon size={16} />}
        {children}
    </button>
);


const FormInput = ({ label, value, onChange, placeholder, type = 'text', step, min, max, icon: Icon, className = '' }) => (
    <div className={`flex flex-col space-y-2 ${className}`}>
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            {Icon && <Icon size={16} className="text-orange-500" />}
            {label}
        </label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            step={step}
            min={min}
            max={max}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder-gray-400 bg-white"
        />
    </div>
);

const DropdownSelect = ({ label, value, onChange, items, placeholder, icon: Icon, showDropdown, setShowDropdown, dropdownRef, className = '' }) => {
    const [searchTerm, setSearchTerm] = useState(value);
    
    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    const filteredItems = items.filter(item => 
        item.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 🔑 Hook สำหรับจัดการ Click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef, setShowDropdown]);


    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                {Icon && <Icon size={16} className="text-orange-500" />}
                {label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => { 
                        onChange(e); 
                        setSearchTerm(e.target.value);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={placeholder}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder-gray-400 bg-white cursor-pointer"
                />
                <ChevronDown size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
            {showDropdown && (
                <div className="absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-white border-b border-gray-200">
                         <input
                            type="text"
                            placeholder="ค้นหาสไตล์..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-sm"
                        />
                    </div>
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => { 
                                    onChange({ target: { value: item } }); 
                                    setShowDropdown(false); 
                                }}
                                className="px-3 py-2 text-gray-800 hover:bg-orange-50 cursor-pointer text-sm"
                            >
                                {item}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">ไม่พบสไตล์</div>
                    )}
                </div>
            )}
        </div>
    );
};

const _CopyButton = ({ content, className = '' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e) => {
        e.stopPropagation(); 
        navigator.clipboard.writeText(content); 
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={`p-1.5 rounded-full text-white transition-colors duration-200 flex items-center justify-center flex-shrink-0 active:scale-[0.9] ${
                copied ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-600 hover:bg-orange-700'
            } ${className}`}
            title={copied ? "คัดลอกแล้ว!" : "คัดลอกข้อความ"}
        >
            {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
    );
};


const ScriptDisplay = ({ script, index, isOpen, toggleOpen, handleDownload }) => {
    const scriptRef = useRef(null); 
    const [shotLang, setShotLang] = useState('th');
    const [thumbLang, setThumbLang] = useState('th');

    // 💡 การคำนวณระยะเวลาคลิปจาก Shot Prompts
    const calculateDuration = (shotPrompts) => {
        if (!shotPrompts || shotPrompts.length === 0) return 'N/A';
        // ใช้ shot สุดท้าย เพื่อหาเวลาจบของคลิป
        const lastShot = shotPrompts[shotPrompts.length - 1].th;
        const match = lastShot.match(/\[(\d+)-(\d+)s\]/);
        if (match) {
            return `${match[2]}s`;
        }
        // หากไม่มีการระบุเวลาชัดเจน ให้ใช้ค่าประมาณ (เดิมคือ 3s/shot + 3s hook)
        return `${(shotPrompts.length * 4) + 3}s`;
    }

    const currentClipDuration = calculateDuration(script.shot_prompts);

    const color = (index % 3 === 0) ? 'bg-blue-600' : (index % 3 === 1) ? 'bg-teal-600' : 'bg-red-600';

    const safeHashtags = script.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');

    useEffect(() => {
        if (isOpen && scriptRef.current) {
            setTimeout(() => {
                scriptRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 100); 
        }
    }, [isOpen]);

    return (
        <div 
            ref={scriptRef} 
            className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl scroll-mt-24"
        >
            <div
                className={`p-4 md:p-5 flex justify-between items-center cursor-pointer transition-colors ${isOpen ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                onClick={toggleOpen}
            >
                <div className="flex items-start gap-4 flex-grow min-w-0 pr-4"> 
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-bold text-sm flex-shrink-0 ${color}`}>
                        {index + 1}
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug break-words"> 
                        {script.title || "Untitled Script"}
                    </h3>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="flex items-center gap-1 text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        <Clock size={16} className="text-orange-500"/>
                        {currentClipDuration}
                    </span>
                    <div className="text-gray-500">
                        {isOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="p-4 md:p-6 border-t border-gray-200 bg-white">
                    <div className="flex justify-end mb-6">
                        <AccentButton 
                            onClick={(e) => { e.stopPropagation(); handleDownload(script, index); }} 
                            className="!py-2 !px-3"
                            icon={FileText}
                        >
                            ดาวน์โหลดสคริปต์ (.txt)
                        </AccentButton>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                            <h4 className="flex items-center gap-2 text-base font-bold text-gray-700">
                                <Layers size={18} className="text-orange-600"/> สรุปคอนเซปต์ (Concept)
                            </h4>
                            {script.description && <_CopyButton content={script.description} className="!p-2" />}
                        </div>
                        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50 shadow-inner text-gray-800 text-sm leading-relaxed">
                            <p className="whitespace-pre-wrap">{script.description}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                            <h4 className="flex items-center gap-2 text-base font-bold text-gray-700">
                                <Sparkles size={18} className="text-orange-600"/> บทพูด (Voice Over)
                            </h4>
                            {script.voice_over_script && <_CopyButton content={script.voice_over_script} className="!p-2" />}
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 whitespace-pre-wrap text-gray-900 text-sm shadow-inner font-mono">
                            <p className='leading-relaxed'>{script.voice_over_script}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                            <h4 className="flex items-center gap-2 text-base font-bold text-gray-700">
                                <Film size={18} className="text-orange-600"/> Shot List & Prompt
                            </h4>
                            <div className="flex rounded-full overflow-hidden bg-gray-200 text-xs font-semibold flex-shrink-0">
                                <button
                                    onClick={() => setShotLang('th')}
                                    className={`px-3 py-1 transition-all ${shotLang === 'th' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-300'}`}
                                >
                                    TH
                                </button>
                                <button
                                    onClick={() => setShotLang('en')}
                                    className={`px-3 py-1 transition-all ${shotLang === 'en' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-300'}`}
                                >
                                    EN
                                </button>
                            </div>
                        </div>
                        <ul className="space-y-3">
                            {script.shot_prompts.map((shot, i) => {
                                const content = shotLang === 'th' ? shot.th : shot.en;
                                const secondaryContent = shotLang === 'th' ? shot.en : shot.th;
                                const secondaryLabel = shotLang === 'th' ? 'Prompt EN:' : 'คำอธิบาย TH:';
                                
                                return (
                                    <li key={i} className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm hover:border-orange-300 transition-colors flex flex-col justify-between items-start gap-2">
                                        <div className="flex justify-between items-center w-full">
                                            <p className="font-semibold text-sm text-gray-800 leading-relaxed max-w-[90%]">
                                                <span className="text-orange-600 font-extrabold mr-2">SHOT {i + 1}</span>
                                                {content}
                                            </p>
                                            <_CopyButton content={content} />
                                        </div>
                                        <p className="text-xs text-gray-500 w-full pt-1 border-t border-gray-100">
                                            <span className="font-mono italic">{secondaryLabel}</span> {secondaryContent}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                                <h4 className="flex items-center gap-2 text-base font-bold text-gray-700">
                                    <Palette size={18} className="text-orange-600"/> Thumbnail Prompt
                                </h4>
                                <div className="flex gap-2 items-center flex-shrink-0">
                                    <div className="flex rounded-full overflow-hidden bg-gray-200 text-xs font-semibold">
                                        <button
                                            onClick={() => setThumbLang('th')}
                                            className={`px-3 py-1 transition-all ${thumbLang === 'th' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-300'}`}
                                        >
                                            TH
                                        </button>
                                        <button
                                            onClick={() => setThumbLang('en')}
                                            className={`px-3 py-1 transition-all ${thumbLang === 'en' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-300'}`}
                                        >
                                            EN
                                        </button>
                                    </div>
                                    {script.thumbnail_prompt && <_CopyButton content={thumbLang === 'th' ? script.thumbnail_prompt.th : script.thumbnail_prompt.en} className="!p-2" />}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm">
                                <p className="font-semibold text-gray-800 leading-relaxed">
                                    {thumbLang === 'th' ? script.thumbnail_prompt.th : script.thumbnail_prompt.en}
                                </p>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                                <h4 className="flex items-center gap-2 text-base font-bold text-gray-700">
                                    <Search size={18} className="text-orange-600"/> Hashtags
                                </h4>
                                {script.hashtags.length > 0 && <_CopyButton content={safeHashtags} className="!p-2" />}
                            </div>
                            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 min-h-[50px]">
                                {script.hashtags.map((tag, i) => (
                                    <span key={i} className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-medium">
                                        #{tag.replace(/^#/, '')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Schema Definition (ไม่เปลี่ยนแปลง) ---
const scriptListSchema = {
// ... (โค้ด Schema Definition เดิม) ...
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            title: { type: SchemaType.STRING, description: "ชื่อคลิปภาษาไทย" },
            thumbnail_prompt: { 
                type: SchemaType.OBJECT,
                properties: {
                    en: { type: SchemaType.STRING, description: "Prompt ภาษาอังกฤษ" },
                    th: { type: SchemaType.STRING, description: "คำอธิบายภาพภาษาไทย" }
                },
                required: ["en", "th"]
            },
            shot_prompts: { 
                type: SchemaType.ARRAY, 
                items: { 
                    type: SchemaType.OBJECT,
                    properties: {
                        en: { type: SchemaType.STRING, description: "Prompt ภาษาอังกฤษ" },
                        th: { type: SchemaType.STRING, description: "คำอธิบายภาพและมุมกล้อง (ต้องระบุเวลา เช่น [0-3s])" }
                    },
                    required: ["en", "th"]
                }, 
                description: "รายการภาพ Shot Prompts" 
            },
            voice_over_script: { type: SchemaType.STRING, description: "บทพูดภาษาไทย (สั้น กระชับ เนื้อๆ)" },
            description: { type: SchemaType.STRING, description: "คำอธิบายคลิป" },
            hashtags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["title", "thumbnail_prompt", "shot_prompts", "voice_over_script", "description", "hashtags"]
    }
};


// --- Main Application Component ---
// รับ prop defaultModule จาก App.jsx
const ScriptGenerator = ({ user, onLogout, userCredit, consumeCredit, defaultModule }) => {
    
    // เพิ่ม state activeModule เพื่อสลับหน้า (home / script)
    const [activeModule, setActiveModule] = useState(defaultModule || "home");

    // 🚩 FIX: เพิ่ม State Logic ทั้งหมดที่หายไป 
    const [topic, setTopic] = useState('');
    const [style, setStyle] = useState(''); 
    const [duration, setDuration] = useState("15");
    const [shotCount, setShotCount] = useState(5); 
    const [isFormExpanded, setIsFormExpanded] = useState(true);
    const [showStyleDropdown, setShowDropdown] = useState(false);
    const [scriptList, setScriptList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false); 
    const [error, setError] = useState(null);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [progress, setProgress] = useState(0); 

    const styleDropdownRef = useRef(null);
    const abortControllerRef = useRef(null);
    const intervalRef = useRef(null);

    const selectedModel = "gemini-2.0-flash"; 
    const CREDIT_COST = 10; 
    
    const popularStyles = [
        "😂 ตลก / กวนโอ๊ย", "🥊 ผัวเมียตีกัน / ปัญหาชีวิตคู่", "📈 หุ้น / การลงทุน / Crypto",
        "✈️ ท่องเที่ยว / Vlog", "👻 เล่าเรื่องผี / สยองขวัญ", "🔥 ขายของดุดัน (Hard Sale)",
        "🎓 สาระความรู้ / How-to", "✨ แรงบันดาลใจ / สู้ชีวิต", "🍲 รีวิวอาหาร / พากิน",
        "🗣️ สรุปข่าว / ดราม่าโซเชียล", "🔮 สายมู / ดูดวง / ฮวงจุ้ย", "💰 ปลดหนี้ / ออมเงิน",
        "💪 ลดความอ้วน / สุขภาพ", "💄 แต่งหน้า / แฟชั่น / ความสวย", "💔 อกหัก / เศร้า / เหงา",
        "🏠 แต่งบ้าน / รีวิวของใช้", "🚗 รีวิวรถ / ยานยนต์", "📱 ไอที / แกดเจ็ต / ทริคมือถือ",
        "🐶 สัตว์เลี้ยง / ทาสแมว", "🎮 เกมเมอร์ / สตรีมเกม", "🎬 สปอยล์หนัง / เล่าซีรีส์",
        "🕵️ คดีปริศนา / จับโกหก", "⛺ แคมป์ปิ้ง / เดินป่า", "🎱 เสี่ยงโชค / เลขเด็ด",
        "🌱 เกษตร / ปลูกผัก", "🌏 ประวัติศาสตร์ / รอบโลก", "🧘 จิตวิทยา / พัฒนาตนเอง",
        "🎤 ASMR / ผ่อนคลาย", "📚 เล่านิทาน / ตำนาน", "📢 ทางการ / ข่าวประชาสัมพันธ์"
    ];
    
    // ฟังก์ชันหลัก: การสร้างสคริปต์
    const handleGenerateScript = async () => {
        // ... (โค้ด handleGenerateScript เดิม) ...
        
        if (!apiKey || apiKey.length < 10) { 
            setError('⚠️ API Key ไม่ถูกโหลด! กรุณาตรวจสอบว่าคุณใส่ค่าในไฟล์ .env.local ภายใต้ชื่อ VITE_GEMINI_API_KEY และได้ Restart Server แล้ว'); 
            return; 
        }
        if (!topic.trim()) { setError('กรุณาป้อนหัวข้อก่อนครับ'); return; }
        
        const currentDuration = Number(duration);
        const currentShotCount = Number(shotCount);
        const CLIP_COUNT = 5; 
        
        if (userCredit !== null && userCredit < CREDIT_COST) {
            setError(`⚠️ เครดิตไม่พอ! คุณมี ${userCredit} เครดิต แต่ต้องใช้ ${CREDIT_COST} เครดิต`); 
            return;
        }
        
        const success = await consumeCredit(CREDIT_COST); 

        if (!success) {
            setError("❌ ไม่สามารถหักเครดิตได้ กรุณาลองใหม่อีกครั้ง");
            return;
        }

        const resetState = (fullReset = false) => {
            setError(null);
            setIsLoading(false);
            setIsFinished(false);
            setProgress(0);
            setExpandedIndex(null);
            
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (abortControllerRef.current) abortControllerRef.current.abort();

            if (fullReset) {
                setTopic('');
                setStyle('');
                setScriptList([]);
                setDuration("15");
                setShotCount(5); 
                setIsFormExpanded(true);
            }
        };

        resetState(false); 
        setScriptList([]);
        setIsLoading(true);
        setIsFormExpanded(false); 

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        
        setProgress(1); 
        intervalRef.current = setInterval(() => {
            setProgress(prev => {
                const nextStep = prev + (100 / (CLIP_COUNT * 4)); 
                return Math.min(nextStep, 99);
            });
        }, 1500); 


        const systemInstruction = `
            คุณคือทีม Content Factory AI ที่ประกอบด้วย **นักจิตวิทยา (Psychologist)**, **นักการตลาด (Marketer)**, และ **Scriptwriter มืออาชีพ**

            **กระบวนการทำงาน (Workflow Priority):**
            1. **นักการตลาด (Marketer):** กำหนดหัวข้อหลักและสไตล์ที่ผู้ใช้ป้อนมา และสร้าง **5 แนวคิด/มุมมอง (Angle)** ที่แตกต่างกันโดยสิ้นเชิงและไม่ซ้ำกัน โดยเน้นที่ Keyword, Trend, และ Searchability เพื่อให้มั่นใจว่าแต่ละคลิปมีโอกาสเป็นไวรัลสูงสุด
            2. **นักจิตวิทยา (Psychologist):** ตรวจสอบแต่ละ Angle ที่นักการตลาดกำหนด และออกแบบ **The Hook (3 วินาทีแรก)** และกำหนด **Emotional Resonance** (เช่น ตลก, อยากรู้, โกรธ) ที่ชัดเจนที่สุดเพื่อดึงดูดผู้ชมให้ดูจนจบ
            3. **Scriptwriter (ผู้กำกับ/Technical Executor):** ทำหน้าที่เป็นผู้ดำเนินการขั้นสุดท้าย โดยรับกลยุทธ์และ Hook มา **เขียนบทพูด (Voice Over)** และที่สำคัญคือต้อง **กำกับภาพ (Shot Prompts)** โดยระบุเวลา (TH) และสร้าง Prompt ภาษาอังกฤษ (EN) เพื่อให้พร้อมสำหรับการผลิตด้วย AI / Editor ทันที

            **ภารกิจหลัก:** สร้างสคริปต์วิดีโอสั้นจำนวน 5 คลิป โดยใช้หลักการดังนี้:

            **จากมุมมองของนักจิตวิทยา (Psychologist):**
            1. **The Hook (3 วินาทีแรก):** บทพูดและช็อตแรกต้องมีพลังดึงดูดสูงสุด
            2. **Emotional Resonance:** เนื้อหาต้องกระตุ้นอารมณ์ใดอารมณ์หนึ่งที่รุนแรง

            **จากมุมมองของนักการตลาด (Marketer):**
            1. **Trend & SEO:** ชื่อคลิปและคำอธิบายต้องใช้ Keyword ที่เกี่ยวข้อง
            2. **Hashtags:** ต้องเลือกแฮชแท็กที่ตรงกับสไตล์
            3. **Clear Value:** นำเสนอ "คุณค่า" ให้ชัดเจน
            4. **Variety Focus:** สร้างสคริปต์ 5 คลิป โดยแต่ละสคริปต์จะต้องมีแนวคิดและโทนที่แตกต่างกันอย่างชัดเจน

            **โครงสร้างทางเทคนิค:**
            1. **ความยาว:** สคริปต์ทั้งหมดต้องมีความยาวไม่เกิน ${currentDuration} วินาที
            2. **Shot Prompts:** ต้องสร้าง Shot Prompts ไม่เกิน ${currentShotCount} ช็อต โดยแต่ละช็อตต้องมีคำอธิบายภาพและมุมกล้องที่ชัดเจน (ภาษาไทย) และต้องระบุเวลาเริ่มต้นและสิ้นสุดของช็อตนั้นๆ (เช่น [0-3s])
            3. **Prompt ภาษาอังกฤษ:** สำหรับ Shot Prompt และ Thumbnail Prompt ทุกช็อตต้องมี Prompt ภาษาอังกฤษ (en)
            4. **สไตล์:** ใช้สไตล์หลักคือ "${style || 'ทั่วไป'}"
            5. **รูปแบบผลลัพธ์:** ต้องตอบกลับเป็น JSON Array ตาม Schema ที่กำหนดให้เท่านั้น
        `;
        
        const payload = {
            contents: [
                { role: "user", parts: [{ text: `สร้างสคริปต์วิดีโอสั้นจำนวน ${CLIP_COUNT} คลิป ในหัวข้อ: "${topic}" โดยใช้สไตล์ "${style || 'ทั่วไป'}" โครงสร้างทั้ง ${CLIP_COUNT} คลิปนี้ต้องมี **แนวคิด (Concept) และมุมมอง (Angle)** ที่แตกต่างกันอย่างชัดเจน` }] } 
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: scriptListSchema,
            },
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            }
        };


        try {
            
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
            const maxRetries = 3;
            let responseData = null;

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                if (signal.aborted) throw new Error("Aborted");

                if (attempt > 0) {
                    await delay(Math.pow(2, attempt) * 1000); 
                }

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        signal: signal,
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    
                    if (result.candidates && result.candidates.length > 0) {
                        const jsonText = result.candidates[0].content?.parts[0]?.text;
                        if (jsonText) {
                            let cleanedJsonText = jsonText.trim();
                            if (cleanedJsonText.startsWith("```json")) {
                                cleanedJsonText = cleanedJsonText.substring(7, cleanedJsonText.lastIndexOf("```")).trim();
                            }
                            responseData = JSON.parse(cleanedJsonText);
                            break; 
                        }
                    }
                    throw new Error("No valid JSON response from model.");
                } catch (e) {
                    if (e.name === 'AbortError' || e.message.includes("Aborted")) throw e;
                    if (attempt === maxRetries - 1) throw e;
                }
            }
            
            if (signal.aborted) throw new Error("Aborted");
            
            if (responseData && Array.isArray(responseData)) {
                setScriptList(responseData);
                // 🔑 เมื่อสร้างสคริปต์เสร็จ ให้สลับไปหน้า 'script'
                setActiveModule('script'); 
            } else {
                throw new Error("Invalid response format received.");
            }
            
            setProgress(100);
            setIsFinished(true);
            setIsLoading(false);
            clearInterval(intervalRef.current);
            if (responseData.length > 0) setExpandedIndex(0); 

        } catch (error) {
            if (error.message.includes("Aborted")) {
                setError("การสร้างถูกยกเลิก");
            } else {
                console.error("API Generation Error:", error);
                
                // คืนเครดิตเมื่อ API ผิดพลาด
                console.warn("API Failed, attempting to refund credit...");
                await consumeCredit(-CREDIT_COST); 
                
                if (error.message.includes("400")) {
                    setError(`เกิดข้อผิดพลาดในการเชื่อมต่อ (HTTP 400 Bad Request): ตรวจสอบ API Key!`);
                } else {
                    setError(`เกิดข้อผิดพลาดในการสร้างสคริปต์: ${error.message || 'Unknown Error'}`);
                }
            }
            setIsLoading(false);
            setProgress(0);
            setIsFormExpanded(true);
            clearInterval(intervalRef.current);
        }
    };

    // ... (โค้ด handleClearTopic, handleDownload, handleStopGeneration เดิม) ...
    const handleClearTopic = () => {
        setTopic('');
        setIsFormExpanded(true);
        setIsFinished(false);
        setScriptList([]);
        setError(null);
        setActiveModule('script'); // กลับมาที่หน้า Form สคริปต์
    };

    const handleDownload = (scriptData, index) => {
        const safeHashtags = scriptData.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
        const content = `TITLE: ${scriptData.title}
----------------------------------------
CONCEPT: ${scriptData.description}
HASHTAGS: ${safeHashtags}

VOICE OVER:
${scriptData.voice_over_script}

----------------------------------------
SHOTS:
${scriptData.shot_prompts.map((shot, i) => `[SHOT ${i+1}] TH: ${shot.th}\n(EN: ${shot.en})`).join('\n\n')}`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const element = document.createElement("a");
        element.href = URL.createObjectURL(blob);
        element.download = `script-${index + 1}-${scriptData.title}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsLoading(false);
        setProgress(0);
        setIsFormExpanded(true);
        setIsFinished(false);
        setError("การสร้างสคริปต์ถูกยกเลิกแล้ว");
        clearInterval(intervalRef.current);
    };


    // 🔑 ฟังก์ชันสำหรับ Render Module ตาม State
    const renderModuleContent = () => {
        
        // --- 1. Script Generation Form & Results (Module 1) ---
        if (activeModule === 'script') {
            return (
                <>
                    <div className="bg-white p-5 md:p-8 rounded-xl shadow-lg border border-gray-200 mb-6">
                        {/* Header Section */}
                        <div 
                            className="flex justify-between items-center cursor-pointer mb-5"
                            onClick={() => setIsFormExpanded(prev => !prev)}
                        >
                            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                            <Settings2 size={24} className="text-orange-600"/> 
                            โมดูล 1: สร้างสคริปต์วิดีโอสั้น
                            </h2>
                            {isFormExpanded ? <ChevronUp size={24} className="text-gray-500"/> : <ChevronDown size={24} className="text-gray-500"/>}
                        </div>

                        {/* Form Fields (Expandable) */}
                        {isFormExpanded && (
                            <div className="space-y-6 animate-fade-in pt-3">
                            <FormInput
                                label="หัวข้อที่ต้องการสร้าง (ยิ่งละเอียด ยิ่งดี)"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="เช่น: วิธีทำเงินจาก AI โดยไม่ต้องเขียนโค้ด"
                                icon={Sparkles}
                            />

                            <DropdownSelect
                                label="เลือกสไตล์/หมวดหมู่ของคลิป"
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                                placeholder="เช่น: 📈 หุ้น / การลงทุน / Crypto"
                                items={popularStyles} // ใช้ popularStyles ทั้งหมดใน props
                                icon={Palette}
                                showDropdown={showStyleDropdown}
                                setShowDropdown={setShowDropdown}
                                dropdownRef={styleDropdownRef}
                            />

                            <div className="grid grid-cols-1 gap-4"> 
                                <FormInput
                                label="จำนวน Shot ต่อคลิป (สูงสุด 5)"
                                type="number"
                                value={shotCount}
                                onChange={(e) => setShotCount(Math.min(5, Math.max(1, Number(e.target.value))))}
                                min="1"
                                max="5"
                                icon={Film}
                                />
                            </div>
                            </div>
                        )}
                        
                        {/* Action Button */}
                        <div className={`flex mt-6 ${isLoading ? 'justify-between' : 'justify-end'}`}>
                            {isLoading && (
                            <AccentButton 
                                onClick={handleStopGeneration} 
                                className="!bg-red-500 hover:!bg-red-600 shadow-red-300/50"
                                icon={Ban}
                            >
                                หยุดการสร้าง
                            </AccentButton>
                            )}
                            
                            {!isLoading && (
                            <AccentButton 
                                onClick={handleGenerateScript} 
                                disabled={!topic.trim() || isLoading || (userCredit !== null && userCredit < CREDIT_COST)} 
                                icon={Sparkles}
                            >
                                สร้างสคริปต์ 5 คลิป (ใช้ {CREDIT_COST} เครดิต)
                            </AccentButton>
                            )}
                        </div>
                    </div>

                    {/* Script Results */}
                    {scriptList.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-extrabold text-gray-900 mt-8 mb-4">
                            ผลลัพธ์: สคริปต์ที่สร้างแล้ว ({scriptList.length} คลิป)
                            </h2>
                            {scriptList.map((script, index) => (
                            <ScriptDisplay
                                key={index}
                                script={script}
                                index={index}
                                isOpen={expandedIndex === index}
                                toggleOpen={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                handleDownload={handleDownload}
                            />
                            ))}
                        </div>
                    )}
                </>
            );
        }

        // --- 2. Dashboard ---
        if (activeModule === 'home') {
            return (
                <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg mb-6 border-t-4 border-orange-500">
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Dashboard</h2>
                    <p className="text-gray-600 mb-4">ยินดีต้อนรับ! คุณมี <span className="font-bold text-orange-600">{userCredit ?? '--'}</span> เครดิต</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <AccentButton onClick={() => setActiveModule("script")} icon={Sparkles} className="h-16 flex-col !bg-orange-600 shadow-orange-300/50">
                            <span className="text-lg">1. สร้างสคริปต์</span>
                        </AccentButton>
                        <AccentButton onClick={() => setActiveModule("music")} icon={Music} className="h-16 flex-col !bg-blue-600 shadow-blue-300/50">
                            <span className="text-lg">2. เพลงฟรี</span>
                        </AccentButton>
                        <AccentButton onClick={() => setActiveModule("voiceover")} icon={Mic} className="h-16 flex-col !bg-fuchsia-600 shadow-fuchsia-300/50">
                            <span className="text-lg">3. Voiceover</span>
                        </AccentButton>
                        <AccentButton onClick={() => setActiveModule("thumbnail")} icon={Image} className="h-16 flex-col !bg-emerald-600 shadow-emerald-300/50">
                            <span className="text-lg">4. Thumbnail</span>
                        </AccentButton>
                    </div>
                </div>
            );
        }

        // --- 3. Module 2: MusicGenerator ---
        if (activeModule === 'music') {
            return <MusicGenerator userCredit={userCredit} consumeCredit={consumeCredit} />;
        }
        
        // --- 4. Module 3: VoiceoverGenerator ---
        if (activeModule === 'voiceover') {
            return <VoiceoverGenerator userCredit={userCredit} consumeCredit={consumeCredit} />;
        }
        
        // --- 5. Module 4: ThumbnailGenerator ---
        if (activeModule === 'thumbnail') {
            return <ThumbnailGenerator userCredit={userCredit} consumeCredit={consumeCredit} />;
        }

        return <div className="p-6 text-center text-gray-500">เลือกโมดูลที่ต้องการใช้งาน</div>;
    };
    
    // --- Main App Render ---
    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
        {/* Header (Sticky) */}
        <header className="sticky top-0 z-20 bg-white shadow-md">
            <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                {isFinished && activeModule === 'script' && ( // 🔑 แสดงปุ่ม Clear เมื่ออยู่หน้า script และเสร็จแล้วเท่านั้น
                <button onClick={handleClearTopic} className="text-orange-600 hover:text-orange-700 transition-colors">
                    <ArrowUp size={24} className="rotate-[-90deg]"/>
                </button>
                )}
                <h1 className="text-xl font-black text-gray-900 tracking-tight">
                CONTENT <span className="text-orange-600">FACTORY</span>
                </h1>
            </div>
            
            <div className="flex items-center space-x-3">
                <span className="text-lg font-black text-orange-600">
                    {userCredit !== null ? userCredit.toLocaleString() : '--'} CR
                </span>
                <span className="text-gray-500 text-sm hidden sm:inline">
                    {user?.email || 'Guest'} 
                </span>
                <AccentButton onClick={onLogout} className="!bg-gray-500 hover:!bg-gray-600 !px-3 !py-1.5 !text-sm" icon={LogOut}>
                    ออกจากระบบ
                </AccentButton>
            </div>
            </div>

            {/* NEW: Navigation Buttons */}
            <div className="border-t bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 py-1 flex items-center gap-3 overflow-x-auto whitespace-nowrap">
                    <AccentButton 
                        onClick={() => setActiveModule("home")} 
                        className={`!text-sm ${activeModule === "home" ? "!bg-orange-700" : "!bg-gray-300 !text-gray-700 hover:!bg-gray-400"}`}
                        icon={Home}
                    >
                        Dashboard
                    </AccentButton>

                    <AccentButton 
                        onClick={() => setActiveModule("script")} 
                        className={`!text-sm ${activeModule === "script" ? "!bg-orange-700" : "!bg-gray-300 !text-gray-700 hover:!bg-gray-400"}`}
                        icon={Sparkles}
                    >
                        สร้างสคริปต์
                    </AccentButton>
                    
                    <AccentButton 
                        onClick={() => setActiveModule("music")} 
                        className={`!text-sm ${activeModule === "music" ? "!bg-blue-600" : "!bg-gray-300 !text-gray-700 hover:!bg-gray-400"}`}
                        icon={Music}
                    >
                        เพลงฟรี
                    </AccentButton>
                    
                    <AccentButton 
                        onClick={() => setActiveModule("voiceover")} 
                        className={`!text-sm ${activeModule === "voiceover" ? "!bg-fuchsia-600" : "!bg-gray-300 !text-gray-700 hover:!bg-gray-400"}`}
                        icon={Mic}
                    >
                        Voiceover
                    </AccentButton>
                    
                    <AccentButton 
                        onClick={() => setActiveModule("thumbnail")} 
                        className={`!text-sm ${activeModule === "thumbnail" ? "!bg-emerald-600" : "!bg-gray-300 !text-gray-700 hover:!bg-gray-400"}`}
                        icon={Image}
                    >
                        Thumbnail
                    </AccentButton>
                </div>
            </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 md:p-6 pb-20">
            
            {/* Error Box */}
            {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-xl mb-6 shadow-md">
                <div className="flex items-center">
                <X size={20} className="mr-3"/>
                <p className="font-semibold text-sm">{error}</p>
                </div>
            </div>
            )}

            {/* Loading/Progress Indicator (ย้ายมาไว้ข้างนอก renderModuleContent) */}
            {isLoading && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center max-w-sm w-full border-t-4 border-orange-500">
                <Loader2 size={36} className="text-orange-500 animate-spin mb-4" />
                <p className="text-lg font-bold text-gray-800 mb-2">กำลังสร้างสคริปต์ 5 คลิป...</p>
                <p className="text-sm text-gray-500 mb-4">โปรดรอสักครู่ ห้ามปิดหน้าจอ</p>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                    className="h-full bg-orange-500 transition-all duration-1000 ease-in-out" 
                    style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="text-xs font-medium text-gray-600 mt-2">{Math.round(progress)}%</p>
                <AccentButton 
                    onClick={handleStopGeneration} 
                    className="!bg-red-500 hover:!bg-red-600 shadow-red-300/50 mt-4 !text-sm"
                    icon={Ban}
                >
                    หยุดการสร้าง
                </AccentButton>
                </div>
            </div>
            )}
            
            {/* 🔑 ส่วนแสดงผล Module หลัก */}
            {renderModuleContent()}

        </main>
        </div>
    );
};

export default ScriptGenerator;