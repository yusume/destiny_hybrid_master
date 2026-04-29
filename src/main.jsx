
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Chart, registerables } from 'chart.js';
import { 
  Compass, Sparkles, RefreshCcw, Menu, X, Loader2,
  TrendingUp, Star, ZapOff, Printer, Moon, Sun, 
  User, Shield, Heart, Briefcase, Activity, Map, 
  Award, Gem, AlertTriangle, ChevronDown, ChevronUp, Download, CheckCircle2, Quote
} from 'lucide-react';

Chart.register(...registerables);

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const SECTIONS_METADATA = [
  { id: "sec-orig", title: "☯ 운명의 뼈대 (명반)", icon: <Compass size={18}/>, sub: ["나의 본질 (명궁)", "주요 재능과 무기", "운명의 흐름", "전체 총평"] },
  { id: "sec-inner", title: "◉ 성격 및 내면", icon: <User size={18}/>, sub: ["기본 성격", "감정 패턴", "대인관계 스타일", "무의식적 약점"] },
  { id: "sec-wealth", title: "◆ 재물 분석", icon: <Gem size={18}/>, sub: ["평생의 자산 흐름", "투자 성향", "부동산 및 문서 운", "재물 총평"] },
  { id: "sec-career", title: "▲ 직업 및 성공", icon: <Briefcase size={18}/>, sub: ["가장 잘 맞는 직업", "승진과 이직", "나를 돕는 귀인", "성공 전략"] },
  { id: "sec-love", title: "♡ 연애 및 결혼", icon: <Heart size={18}/>, sub: ["나의 연애 패턴", "잘 맞는 배우자 상", "상황별 맞춤 조언", "연애 총평"] },
  { id: "sec-social", title: "◎ 대인관계", icon: <Award size={18}/>, sub: ["부모님과의 관계", "형제자매", "친구 및 동료", "대인관계 총평"] },
  { id: "sec-health", title: "✦ 건강 및 에너지", icon: <Activity size={18}/>, sub: ["타고난 체질", "주의해야 할 질환", "맞춤 건강 관리법", "에너지 리듬"] },
  { id: "sec-move", title: "◁ 이동 및 거주", icon: <Map size={18}/>, sub: ["이동 및 이사 운", "해외와의 인연", "거주지 변화", "이동 총평"] },
  { id: "sec-daewun", title: "◐ 향후 10년 대운", icon: <TrendingUp size={18}/>, sub: ["현재 나의 10년", "다가올 다음 10년", "인생의 중요 변화점", "대운 총평"] },
  { id: "sec-2026", title: "🌙 2026년 운세 (월별 분석)", icon: <Moon size={18}/>, sub: ["연간 총평", "월별 흐름 그래프", "1~6월 세부 운세", "7~12월 세부 운세"] },
  { id: "sec-final", title: "❋ 종합 조언", icon: <Shield size={18}/>, sub: ["인생 마스터 전략", "피해야 할 함정", "행운을 부르는 방향", "마지막 메시지"] }
];

const HANJA_TO_KOR = {
  "甲":"갑", "乙":"을", "丙":"병", "丁":"정", "戊":"무", "己":"기", "庚":"경", "辛":"신", "壬":"임", "癸":"계",
  "子":"자", "丑":"축", "寅":"인", "卯":"묘", "辰":"진", "巳":"사", "午":"오", "未":"미", "申":"신", "酉":"유", "戌":"술", "亥":"해"
};

const ZHI_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ZHI_KOR = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const GAN_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const GAN_KOR = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];

const GAN_ELEMENTS = { "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土", "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水" };
const ZHI_ELEMENTS = { "子": "水", "丑": "土", "寅": "木", "卯": "木", "辰": "土", "巳": "火", "午": "火", "未": "土", "申": "金", "酉": "金", "戌": "土", "亥": "水" };

// 🚀 [추가] 자미두수 사화(四化: 록,권,과,기) 매핑 (태어난 해의 천간 기준)
const SI_HUA_MAP = {
  "甲": { "록": "염정", "권": "파군", "과": "무곡", "기": "태양" },
  "乙": { "록": "천기", "권": "천량", "과": "자미", "기": "태음" },
  "丙": { "록": "천동", "권": "천기", "과": "문창", "기": "염정" },
  "丁": { "록": "태음", "권": "천동", "과": "천기", "기": "거문" },
  "戊": { "록": "탐랑", "권": "태음", "과": "우필", "기": "천기" },
  "己": { "록": "무곡", "권": "탐랑", "과": "천량", "기": "문곡" },
  "庚": { "록": "태양", "권": "무곡", "과": "태음", "기": "천동" },
  "辛": { "록": "거문", "권": "태양", "과": "문곡", "기": "문창" },
  "壬": { "록": "천량", "권": "자미", "과": "좌보", "기": "무곡" },
  "癸": { "록": "파군", "권": "거문", "과": "태음", "기": "탐랑" }
};

const ELEMENT_STYLES = {
  "木": "bg-green-900/60 text-green-300 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.25)]",
  "火": "bg-red-900/60 text-red-300 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]",       
  "土": "bg-yellow-900/60 text-yellow-300 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.25)]", 
  "金": "bg-slate-700/60 text-slate-100 border-gray-400 shadow-[0_0_15px_rgba(255,255,255,0.25)]",     
  "水": "bg-blue-900/60 text-blue-300 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.25)]"     
};

const TRADITIONAL_TIMES = [
  { label: "자시(子時): 23:30 - 01:29", value: 0 }, { label: "축시(丑時): 01:30 - 03:29", value: 1 },
  { label: "인시(寅時): 03:30 - 05:29", value: 2 }, { label: "묘시(卯時): 05:30 - 07:29", value: 3 },
  { label: "진시(辰時): 07:30 - 09:29", value: 4 }, { label: "사시(巳時): 09:30 - 11:29", value: 5 },
  { label: "오시(午時): 11:30 - 13:29", value: 6 }, { label: "미시(未時): 13:30 - 15:29", value: 7 },
  { label: "신시(申時): 15:30 - 17:29", value: 8 }, { label: "유시(酉時): 17:30 - 19:29", value: 9 },
  { label: "술시(戌時): 19:30 - 21:29", value: 10 }, { label: "해시(亥時): 21:30 - 23:29", value: 11 }
];

const getZodiacSign = (month, day) => {
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "물병자리";
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "물고기자리";
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "양자리";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "황소자리";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return "쌍둥이자리";
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return "게자리";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "사자자리";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "처녀자리";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return "천칭자리";
  if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return "전갈자리";
  return "사수자리";
};

const StarField = () => {
  const stars = useMemo(() => Array.from({ length: 80 }).map((_, i) => ({
    id: i, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
    size: `${Math.random() * 2 + 1}px`, delay: `${Math.random() * 5}s`, duration: `${Math.random() * 3 + 2}s`
  })), []);
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#060d2e]">
      {stars.map(star => (
        <div key={star.id} className="absolute bg-white rounded-full animate-pulse opacity-30" style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: star.delay, animationDuration: star.duration }} />
      ))}
    </div>
  );
};

const MonthlyChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && data?.monthly && data.monthly.length > 0) {
      if (chartInstance.current) chartInstance.current.destroy();
      chartInstance.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: data.monthly.map(m => `${m.month}월`),
          datasets: [{
            label: '운세 흐름',
            data: data.monthly.map(m => m.score),
            borderColor: '#e8b830',
            backgroundColor: 'rgba(232, 184, 48, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#c8951a',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6070a0', stepSize: 20 } },
            x: { grid: { display: false }, ticks: { color: '#8a9cc2', font: { family: 'serif' } } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); }
  }, [data]);

  return <canvas ref={chartRef}></canvas>;
};

// 🚀 평생 운세 흐름 그래프 컴포넌트 추가
const LifeGraphChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && data && data.length === 6) {
      if (chartInstance.current) chartInstance.current.destroy();
      chartInstance.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: ['20대', '30대', '40대', '50대', '60대', '70대'],
          datasets: [{
            label: '운명의 에너지',
            data: data,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#60a5fa',
            pointBorderColor: '#fff',
            pointRadius: 4,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } },
            x: { grid: { display: false }, ticks: { color: '#8a9cc2' } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); }
  }, [data]);

  return <canvas ref={chartRef}></canvas>;
};


export default function App() {
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [sectionsData, setSectionsData] = useState({}); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sec-orig');
  const [expandedNav, setExpandedNav] = useState('sec-orig');
  const [isPdfLoading, setIsPdfLoading] = useState(false); 
  
  const [userName, setUserName] = useState('');
  const [gender, setGender] = useState('여성');
  const [calendarType, setCalendarType] = useState('양력');
  const [birthDate, setBirthDate] = useState('2000-09-03');
  const [birthTime, setBirthTime] = useState(9); 
  const [occupation, setOccupation] = useState('');
  const [relationship, setRelationship] = useState('비혼/싱글');
  const [analysisMode, setAnalysisMode] = useState('balanced');

  const chartInstances = useRef({});

  useEffect(() => {
    if (!window.Lunar) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/lunar-javascript/lunar.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
    return () => Object.values(chartInstances.current).forEach(c => { if (c) c.destroy(); });
  }, []);

  const jumpTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveTab(id);
      setExpandedNav(id);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsPdfLoading(true);
    try {
      if (!window.jspdf) {
         const script1 = document.createElement('script');
         script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
         document.head.appendChild(script1);
         await new Promise(r => script1.onload = r);
      }
      if (!window.html2canvas) {
         const script2 = document.createElement('script');
         script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
         document.head.appendChild(script2);
         await new Promise(r => script2.onload = r);
      }

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const elements = document.querySelectorAll('.export-section');
      if (elements.length === 0) throw new Error("캡처할 영역이 없습니다.");

      const mainEl = document.getElementById('main-scroll-area');
      const origOverflow = mainEl.style.overflow;
      const origHeight = mainEl.style.height;

      window.scrollTo(0, 0);
      mainEl.scrollTo(0, 0);
      mainEl.style.overflow = 'visible';
      mainEl.style.height = 'max-content';

      await new Promise(r => setTimeout(r, 1000)); 

      let currentY = 10;

      for (let i = 0; i < elements.length; i++) {
         const el = elements[i];
         const canvas = await window.html2canvas(el, {
            scale: window.innerWidth < 768 ? 1.5 : 2, 
            useCORS: true,
            backgroundColor: '#060d2e',
            scrollY: -window.scrollY 
         });

         const imgWidth = pdfWidth - 20; 
         const imgHeight = (canvas.height * imgWidth) / canvas.width;
         
         let srcY = 0;
         let remainingHeight = canvas.height;

         while (remainingHeight > 0) {
            if (currentY + 15 >= pdfHeight) {
                pdf.addPage();
                currentY = 10;
            }

            const availablePdfHeight = pdfHeight - currentY - 10;
            const sliceHeightPx = Math.min(remainingHeight, (availablePdfHeight * canvas.width) / imgWidth);
            const slicePdfHeight = (sliceHeightPx * imgWidth) / canvas.width;

            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = sliceHeightPx;
            const ctx = sliceCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, srcY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

            const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(sliceData, 'JPEG', 10, currentY, imgWidth, slicePdfHeight);

            currentY += slicePdfHeight + 5; 
            srcY += sliceHeightPx;
            remainingHeight -= sliceHeightPx;
         }
      }

      pdf.save(`${userName}_운명리포트.pdf`);

      mainEl.style.overflow = origOverflow;
      mainEl.style.height = origHeight;

    } catch (err) {
      console.error('PDF 다운로드 실패:', err);
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setIsPdfLoading(false);
    }
  };

  const fetchChunkWithRetry = async (prompt, schema, retries = 5) => {
    let delay = 1000;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", responseSchema: schema }
          })
        });
        if (!response.ok) throw new Error("API 통신 실패");
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        return JSON.parse(rawText);
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2; 
      }
    }
  };

  const runNativeCoreEngine = async () => {
    let attempts = 0;
    while (!window.Solar && attempts < 30) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }
    if (!window.Solar) throw new Error("엔진 로드 실패. 인터넷 연결을 확인해주세요.");

    const [year, month, day] = birthDate.split('-').map(Number);
    const isSolar = calendarType === '양력';
    const timeIdx = birthTime; 
    const hourArray = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
    const hour = hourArray[timeIdx];

    let solar = isSolar ? window.Solar.fromYmdHms(year, month, day, hour, 30, 0) : window.Lunar.fromYmdHms(year, month, day, hour, 30, 0).getSolar();
    let lunar = solar.getLunar();
    
    // === 1. 사주 & 대운 계산 ===
    let baZi = lunar.getEightChar();
    const sajuData = [
       { label: "년주(태어난 해)", ganzi: baZi.getYear() },
       { label: "월주(태어난 달)", ganzi: baZi.getMonth() },
       { label: "일주(태어난 날)", ganzi: baZi.getDay() },
       { label: "시주(태어난 시)", ganzi: baZi.getTime() }
    ].map(item => {
      const gan = item.ganzi.charAt(0);
      const zhi = item.ganzi.charAt(1);
      return { 
        col: item.label, gan, zhi, 
        ganKor: HANJA_TO_KOR[gan] || gan, zhiKor: HANJA_TO_KOR[zhi] || zhi,
        ganEl: GAN_ELEMENTS[gan] || "木", zhiEl: ZHI_ELEMENTS[zhi] || "水" 
      };
    });

    // 🚀 사주 대운 8기둥 계산
    let daewunData = [];
    try {
        let dy = baZi.getDaYun(gender === '남성' ? 1 : 0).getDaYun();
        for(let i=1; i<=8; i++) {
            if(dy[i]) {
                const gz = dy[i].getGanZhi();
                daewunData.push({
                    age: dy[i].getStartAge(),
                    gan: gz.charAt(0), ganKor: HANJA_TO_KOR[gz.charAt(0)],
                    zhi: gz.charAt(1), zhiKor: HANJA_TO_KOR[gz.charAt(1)]
                });
            }
        }
    } catch(e) { console.warn("대운 계산 실패", e); }

    // === 2. 자미두수 계산 ===
    const lunarMonth = lunar.getMonth();
    const lunarDay = lunar.getDay();

    let zwChart = Array(12).fill(null).map((_, i) => ({ 
        branch: ZHI_HANJA[i], branchKor: ZHI_KOR[i], 
        name: '', gan: '', ganKor: '', stars: [], minors: [], daHan: "", isMing: false 
    }));

    const mingIdx = (2 + (lunarMonth - 1) - timeIdx + 12) % 12;
    const palaceNamesOrder = ["명궁(본질)", "형제궁", "부처궁(연애)", "자녀궁", "재백궁(재물)", "질액궁(건강)", "천이궁(사회)", "노복궁", "관록궁(직업)", "전택궁(부동산)", "복덕궁(행복)", "부모궁"];
    for (let i = 0; i < 12; i++) {
        const pIdx = (mingIdx - i + 12) % 12;
        zwChart[pIdx].name = palaceNamesOrder[i];
        if (i === 0) zwChart[pIdx].isMing = true;
    }

    const yearGanHanja = baZi.getYear().charAt(0); // 태어난 해의 천간 (사화를 위해 필요)
    const yearGanIdx = GAN_HANJA.indexOf(yearGanHanja);
    const yinGanStartIdx = [2, 4, 6, 8, 0][yearGanIdx % 5];
    for (let i = 0; i < 12; i++) {
        const branchIdx = (2 + i) % 12;
        const curGanIdx = (yinGanStartIdx + i) % 10;
        zwChart[branchIdx].gan = GAN_HANJA[curGanIdx];
        zwChart[branchIdx].ganKor = GAN_KOR[curGanIdx];
    }

    const mingGanIdx = GAN_HANJA.indexOf(zwChart[mingIdx].gan);
    const zhiNum = Math.floor(mingIdx / 2) % 3;
    const ganNum = Math.floor(mingGanIdx / 2) + 1;
    let n = zhiNum + ganNum;
    if (n > 5) n -= 5;
    const bureauMap = {1: 4, 2: 2, 3: 6, 4: 5, 5: 3};
    const bureauNum = bureauMap[n];
    const bureauNames = {2: '수2국', 3: '목3국', 4: '금4국', 5: '토5국', 6: '화6국'};
    const bureauName = bureauNames[bureauNum];

    let remainder = lunarDay % bureauNum;
    let x = remainder === 0 ? 0 : bureauNum - remainder;
    let quotient = Math.floor((lunarDay + x) / bureauNum);
    let ziweiIdx;
    if (x % 2 === 1) ziweiIdx = (2 + quotient - 1 - x + 12) % 12;
    else ziweiIdx = (2 + quotient - 1 + x) % 12;
    let tianfuIdx = (4 - ziweiIdx + 12) % 12;

    const addMajor = (idx, star) => zwChart[(idx % 12 + 12) % 12].stars.push({ name: star });
    addMajor(ziweiIdx, "자미(황제)"); addMajor(ziweiIdx - 1, "천기(지혜)"); addMajor(ziweiIdx - 3, "태양(명예)"); addMajor(ziweiIdx - 4, "무곡(재물)"); addMajor(ziweiIdx - 5, "천동(평화)"); addMajor(ziweiIdx - 8, "염정(매력)");
    addMajor(tianfuIdx, "천부(금고)"); addMajor(tianfuIdx + 1, "태음(부동산)"); addMajor(tianfuIdx + 2, "탐랑(욕망)"); addMajor(tianfuIdx + 3, "거문(말재주)"); addMajor(tianfuIdx + 4, "천상(도장)"); addMajor(tianfuIdx + 5, "천량(보호)"); addMajor(tianfuIdx + 6, "칠살(권력)"); addMajor(tianfuIdx + 10, "파군(개척)");

    const addMinor = (idx, star) => zwChart[(idx % 12 + 12) % 12].minors.push(star);
    addMinor(4 + lunarMonth - 1, "좌보"); addMinor(10 - lunarMonth + 1, "우필");
    addMinor(10 - timeIdx, "문창"); addMinor(4 + timeIdx, "문곡");
    addMinor(11 - timeIdx, "지공"); addMinor(11 + timeIdx, "지겁");
    const luCunMap = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
    const luCunIdx = luCunMap[yearGanIdx];
    addMinor(luCunIdx, "록존(저축)"); addMinor(luCunIdx + 1, "경양(돌파)"); addMinor(luCunIdx - 1, "타라(인내)");

    // 🚀 사화(四化) 로직 적용 (별의 이름에 사화 정보 매핑)
    const currentSiHua = SI_HUA_MAP[yearGanHanja];
    for (let i = 0; i < 12; i++) {
        zwChart[i].stars = zwChart[i].stars.map(sObj => {
            const baseName = sObj.name.split('(')[0];
            let sh = null;
            if (currentSiHua["록"] === baseName) sh = "록";
            if (currentSiHua["권"] === baseName) sh = "권";
            if (currentSiHua["과"] === baseName) sh = "과";
            if (currentSiHua["기"] === baseName) sh = "기";
            return { ...sObj, siHua: sh };
        });
    }

    const isYangYear = [0, 2, 4, 6, 8].includes(yearGanIdx);
    const isMale = gender === '남성';
    const isForward = isYangYear === isMale;

    for (let i = 0; i < 12; i++) {
        let steps = isForward ? (i - mingIdx + 12) % 12 : (mingIdx - i + 12) % 12;
        let startAge = bureauNum + steps * 10;
        let endAge = startAge + 9;
        zwChart[i].daHan = `${startAge}~${endAge}세`;
    }

    // === 3. 서양 점성술 ===
    const sunSign = getZodiacSign(solar.getMonth(), solar.getDay());
    const signs = ["양자리", "황소자리", "쌍둥이자리", "게자리", "사자자리", "처녀자리", "천칭자리", "전갈자리", "사수자리", "염소자리", "물병자리", "물고기자리"];
    const sunSignIdx = signs.indexOf(sunSign);
    const offset = Math.floor((hour - 6) / 2);
    const ascSign = signs[(sunSignIdx + offset + 12) % 12] || "계산중";

    return {
      saju: sajuData, 
      sajuRawStr: sajuData.map(s => s.ganKor + s.zhiKor).join(' '),
      daewuns: daewunData,
      zwChart, 
      mingGongKor: ZHI_KOR[mingIdx], 
      bureau: bureauName,
      western: { sun: sunSign, asc: ascSign },
      birthDateStr: `${year}년 ${month}월 ${day}일 ${TRADITIONAL_TIMES[timeIdx].label.split(':')[0]}`
    };
  };

  const handleStartAnalysis = async (e) => {
    if (e) e.preventDefault();
    if (!userName.trim()) { setErrorMsg("성함을 입력해주세요."); return; }
    if (!occupation.trim()) { setErrorMsg("현재 직업을 입력해주세요."); return; }
    
    setErrorMsg('');
    setAnalyzing(true);
    setDashboardData(null);
    setSectionsData({});

    try {
      const fateData = await runNativeCoreEngine();
      const chartSummaryStr = fateData.zwChart.map(p => `${p.name.split('(')[0]}: 주성[${p.stars.map(s=>s.name).join(',')}] 보조성[${p.minors.join(',')}]`).join(' | ');

      let toneInstruction = "";
      if (analysisMode === 'cold') {
          toneInstruction = "당신은 냉철하고 객관적인 팩트폭행 운명 분석가입니다. 기분을 맞추려 하지 말고 약점과 최악의 리스크를 여과 없이 직설적으로 뼈 때리게 조언하세요.";
      } else if (analysisMode === 'warm') {
          toneInstruction = "당신은 친절하고 지혜로운 다정한 멘토입니다. 용기와 희망을 얻을 수 있도록 장점을 극대화하고 따뜻한 비유로 위로를 제공하세요.";
      } else {
          toneInstruction = "당신은 현실적이고 균형 잡힌 마스터 멘토입니다. 팩트에 기반해 냉정하게 주의할 점(팩트폭행)을 짚어주되, 동시에 어떻게 극복할 수 있는지 긍정적인 해결책과 장점도 함께 설명하여 현실적이고 유용한 조언을 제공하세요.";
      }

      // 🚀 평생 운세 흐름도 데이터 추가 요청 (lifeGraph)
      const dashPrompt = `
      지시사항: ${toneInstruction}
      사용자: ${userName}(${gender}), 연애 상태: ${relationship}, 현재 직업: ${occupation}
      사주: ${fateData.sajuRawStr}, 명궁: ${fateData.mingGongKor}궁(${fateData.bureau}), 서양점성술: ${fateData.western.sun}
      자미두수 데이터: ${chartSummaryStr}
      
      이 사람의 운명 총평을 '명리학을 전혀 모르는 초보자'도 이해하기 쉽게 비유를 써서 3문장으로 요약하고, 핵심 키워드 3개, 그리고 5가지 항목(성격,재물,커리어,연애,건강)의 점수(1~100)와 20대~70대까지의 10년 단위 인생 굴곡(평생 운세) 점수 6개를 반환하세요.`;

      const dashSchema = {
        type: "OBJECT",
        properties: {
          summary: { type: "STRING" },
          keywords: { type: "ARRAY", items: { type: "STRING" } },
          scores: { type: "ARRAY", items: { type: "INTEGER" } },
          lifeGraph: { type: "ARRAY", items: { type: "INTEGER" }, description: "20대, 30대, 40대, 50대, 60대, 70대의 종합 운세 점수 6개 (1~100)" }
        }
      };

      const dashParsed = await fetchChunkWithRetry(dashPrompt, dashSchema);
      fateData.chartSummaryStr = chartSummaryStr; 
      
      setDashboardData({ ...fateData, dashboard: dashParsed });
      setAnalyzing(false); 

      generateDetailedSections(fateData, toneInstruction);
      
    } catch (err) { 
      console.error(err); 
      setErrorMsg(err.message || "데이터 처리 중 오류가 발생했습니다.");
      setAnalyzing(false);
    }
  };

  const generateDetailedSections = async (fateData, toneInstruction) => {
    const baseContext = `사용자: ${userName}(${gender}), 생일: ${fateData.birthDateStr}
    현재 직업 상태: ${occupation}, 연애 상태: ${relationship}
    사주: ${fateData.sajuRawStr}, 자미 명궁: ${fateData.mingGongKor}궁(${fateData.bureau})
    자미 12궁 전체 데이터: ${fateData.chartSummaryStr}
    서양 점성술: ${fateData.western.sun} (ASC: ${fateData.western.asc})`;

    for (const section of SECTIONS_METADATA) {
      setSectionsData(prev => ({ ...prev, [section.id]: { loading: true } }));

      let prompt, schema;
      let specialInstruction = "";
      if (section.id === 'sec-career' || section.id === 'sec-final') {
         specialInstruction += `\n**특별 지시사항:** 사용자의 현재 직업은 '${occupation}' 입니다. 사주/명반과 이 직업이 맞는지 팩트 체크하고, 맞춤형 조언을 제공하세요.`;
      }
      if (section.id === 'sec-love') {
         specialInstruction += `\n**특별 지시사항:** 사용자의 현재 연애 상태는 '${relationship}' 입니다. 이 상태에 맞춰서 필요한 연애/결혼 조언을 제공하세요.`;
      }

      const goodDesc = analysisMode === 'cold' ? '그나마 다행인 점 또는 유일한 돌파구' : (analysisMode === 'warm' ? '긍정적인 조언이나 행운 포인트' : '현실적인 타개책 및 긍정 에너지');
      const badDesc = analysisMode === 'cold' ? '가장 뼈아픈 팩트폭행 조언 및 최악의 리스크' : (analysisMode === 'warm' ? '조심해야 할 점이나 주의 포인트' : '반드시 직시해야 할 팩트폭행 및 주의점');

      if (section.id === 'sec-2026') {
         prompt = `${toneInstruction}
         ${baseContext}
         이번 섹션은 [2026년 월별 운세] 입니다.
         초보자도 이해할 수 있도록 쉬운 말과 비유로 작성해주세요.
         **반드시 1월부터 12월까지 총 12개의 월별 데이터를 빠짐없이 생성해주세요.**`;

         schema = {
            type: "OBJECT",
            properties: {
               yearlySummary: { type: "STRING", description: "2026년 한 해의 전체 흐름 요약" },
               monthly: {
                  type: "ARRAY",
                  items: {
                     type: "OBJECT",
                     properties: {
                        month: { type: "INTEGER" },
                        score: { type: "INTEGER", description: "운세 점수 (0~100)" },
                        keyword: { type: "STRING", description: "해당 월의 핵심 키워드" },
                        content: { type: "STRING", description: "월별 상세 풀이" }
                     }
                  }
               }
            }
         };
      } else {
         prompt = `${toneInstruction}
         ${baseContext}
         이번 섹션은 [${section.title}] 입니다. 소목차: ${section.sub.join(", ")}
         ${specialInstruction}
         
         **지시사항:**
         1. 각 소목차별로 반드시 분석해주세요.
         2. 전문 용어나 한자를 최소화하고 일반인도 직관적으로 이해할 수 있게 설명하세요.
         3. 줄글을 피하고 제공된 스키마에 맞춰 [1~2줄 비유 요약], [핵심 키워드 3개], [상세 설명 리스트(최소 3문장)] 로 나누어서 반환하세요.`;

         schema = {
            type: "OBJECT",
            properties: {
              subs: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING", description: "소목차 이름" },
                    easySummary: { type: "STRING", description: "초보자 맞춤형 직관적인 1~2줄 비유 요약" },
                    keywords: { type: "ARRAY", items: { type: "STRING" }, description: "핵심 키워드 3개" },
                    details: { type: "ARRAY", items: { type: "STRING" }, description: "상세한 운세 풀이를 3~4개의 문장(배열 요소)으로 분리하여 작성" },
                    good: { type: "STRING", description: goodDesc },
                    bad: { type: "STRING", description: badDesc }
                  }
                }
              }
            }
         };
      }

      try {
        const parsed = await fetchChunkWithRetry(prompt, schema);
        setSectionsData(prev => ({ ...prev, [section.id]: { loading: false, data: parsed } }));
      } catch (err) {
        setSectionsData(prev => ({ ...prev, [section.id]: { loading: false, error: true } }));
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  };

  const getModeLabel = () => {
    if (analysisMode === 'warm') return '✨ 따뜻한 위로 모드';
    if (analysisMode === 'cold') return '🔥 냉철한 팩트폭행 모드';
    return '⚖️ 현실적 조언 모드 (팩폭+해법)';
  };

  useEffect(() => {
    if (dashboardData?.dashboard?.scores) {
      const ctx = document.getElementById('radarChart')?.getContext('2d');
      if (ctx) {
        if (chartInstances.current['radar']) chartInstances.current['radar'].destroy();
        chartInstances.current['radar'] = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['성격', '재물', '커리어', '연애', '건강'],
            datasets: [{ 
                data: dashboardData.dashboard.scores, 
                backgroundColor: 'rgba(200, 149, 26, 0.25)', 
                borderColor: '#c8951a', 
                borderWidth: 2,
                pointBackgroundColor: '#e8b830'
            }]
          },
          options: { 
            responsive: true, maintainAspectRatio: false, 
            scales: { r: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.08)' }, angleLines: { color: 'rgba(255,255,255,0.08)' }, pointLabels: { color: '#b8c4e0', font: { size: 13, weight: 'bold' } }, ticks: { display: false } } },
            plugins: { legend: { display: false } }
          }
        });
      }
    }
  }, [dashboardData]);

  if (!dashboardData && !analyzing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#060d2e] font-serif relative overflow-hidden">
        <StarField />
        <div className="max-w-md w-full bg-[#0f1744]/90 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-[#c8951a]/30 text-center relative z-10">
          <div className="space-y-6">
            <div className="text-6xl mx-auto mb-4 text-[#c8951a] flex justify-center"><Compass size={60} strokeWidth={1.5} /></div>
            <h1 className="text-3xl font-bold text-[#e8b830] leading-tight serif">프리미엄 운명 분석기</h1>
            <p className="text-[#b8c4e0] text-sm leading-relaxed">
              원하는 분석 모드와 현재 직업을 입력해<br/>
              가장 완벽한 맞춤형 인생 리포트를 받아보세요.
            </p>
          </div>
          
          {errorMsg && (
              <div className="mt-6 bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-start gap-3 text-left">
                  <AlertTriangle className="shrink-0 text-red-400" size={20} />
                  <p className="text-sm font-sans">{errorMsg}</p>
              </div>
          )}

          <form className="space-y-4 text-left mt-8" onSubmit={handleStartAnalysis}>
            <input type="text" value={userName} onChange={(e)=>setUserName(e.target.value)} placeholder="성함" className="w-full bg-[#060d2e] border border-[#c8951a]/30 px-5 py-4 rounded-xl text-white outline-none focus:border-[#c8951a] transition-all font-bold" />
            
            <div className="grid grid-cols-2 gap-3">
              <select value={gender} onChange={(e)=>setGender(e.target.value)} className="w-full bg-[#060d2e] border border-[#c8951a]/30 px-5 py-4 rounded-xl text-white outline-none cursor-pointer"><option value="여성">여성</option><option value="남성">남성</option></select>
              <select value={calendarType} onChange={(e)=>setCalendarType(e.target.value)} className="w-full bg-[#060d2e] border border-[#c8951a]/30 px-5 py-4 rounded-xl text-white outline-none cursor-pointer"><option value="양력">양력</option><option value="음력">음력</option></select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={birthDate} onChange={(e)=>setBirthDate(e.target.value)} className="w-full bg-[#060d2e] border border-[#c8951a]/30 px-5 py-4 rounded-xl text-white outline-none font-bold cursor-pointer" />
              <select value={birthTime} onChange={(e)=>setBirthTime(parseInt(e.target.value))} className="w-full bg-[#060d2e] border border-[#c8951a]/30 px-5 py-4 rounded-xl text-white outline-none cursor-pointer text-[12px] font-bold">
                  {TRADITIONAL_TIMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="pt-2">
               <input type="text" value={occupation} onChange={(e)=>setOccupation(e.target.value)} placeholder="현재 직업 (예: IT 개발자, 프리랜서, 카페 사장)" className="w-full bg-[#060d2e] border border-[#c8951a]/30 px-5 py-4 rounded-xl text-white outline-none focus:border-[#c8951a] transition-all font-bold text-sm" />
            </div>

            <div className="grid grid-cols-1 gap-3 pb-2 border-b border-[#c8951a]/20">
                <select value={relationship} onChange={(e)=>setRelationship(e.target.value)} className="w-full bg-[#060d2e] border border-[#c8951a]/30 px-5 py-4 rounded-xl text-white outline-none cursor-pointer font-bold text-sm">
                   <option value="비혼(싱글)">연애 상태: 비혼/싱글 (새로운 인연 위주)</option>
                   <option value="연애중">연애 상태: 연애중 (현재 연인 관계 위주)</option>
                   <option value="기혼">연애 상태: 기혼 (배우자/가정 위주)</option>
                </select>

                <select value={analysisMode} onChange={(e)=>setAnalysisMode(e.target.value)} className="w-full bg-gradient-to-r from-[#0f1744] to-[#060d2e] border border-[#c8951a]/50 px-5 py-4 rounded-xl text-[#e8b830] outline-none cursor-pointer font-black text-sm">
                   <option value="balanced">⚖️ 분석 모드: 현실적 조언 (팩폭+해결책)</option>
                   <option value="warm">✨ 분석 모드: 따뜻한 위로 (희망적 멘토)</option>
                   <option value="cold">🔥 분석 모드: 뼈때리는 팩트폭행 (객관적)</option>
                </select>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-[#c8951a] to-[#e8b830] hover:brightness-110 text-[#060d2e] font-black py-5 rounded-xl shadow-[0_0_20px_rgba(200,149,26,0.3)] transition-all active:scale-95 text-lg mt-4">나의 운명 데이터 스캔</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#060d2e] text-[#b8c4e0] font-serif relative">
      <StarField />
      
      <style>{`
        @media print {
          body, html { background: white !important; color: black !important; }
          #main-scroll-area { 
             overflow: visible !important; 
             height: auto !important; 
             margin-left: 0 !important; 
             padding: 0 !important; 
             width: 100% !important;
             position: absolute;
             top: 0;
             left: 0;
          }
          aside, .no-print, button { display: none !important; }
          section { page-break-inside: avoid; border: none !important; margin-bottom: 2rem !important; }
          .bg-\\[\\#0f1744\\]\\/80, .bg-\\[\\#0f1744\\] { background: #f9f9f9 !important; border: 1px solid #ddd !important; }
          .text-\\[\\#e8b830\\], .text-\\[\\#c8951a\\] { color: #8a6d12 !important; }
          .text-\\[\\#b8c4e0\\] { color: #333 !important; }
          .bg-\\[\\#060d2e\\] { background: #fff !important; }
          canvas { filter: grayscale(100%); }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 모바일 헤더 */}
      <div className="lg:hidden bg-[#0f1744]/95 no-print p-4 border-b border-[#c8951a]/20 flex items-center justify-between sticky top-0 z-40 backdrop-blur">
        <h3 className="font-bold text-[#e8b830] flex items-center gap-2"><Compass size={18}/> 운명 리포트</h3>
        <button type="button" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-[#e8b830]"><Menu size={24}/></button>
      </div>

      {/* 사이드바 네비게이션 */}
      <aside className={`no-print fixed inset-y-0 left-0 z-50 w-72 bg-[#0f1744] border-r border-[#c8951a]/20 flex flex-col h-screen transition-transform duration-300 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 border-b border-[#c8951a]/10 relative">
          <h3 className="text-xl font-bold text-[#e8b830] tracking-widest text-center italic">DESTINY HYBRID</h3>
          <p className="text-[10px] text-[#6070a0] font-bold mt-1 text-center tracking-[0.2em] uppercase">{userName} 명반 리포트</p>
          <p className="text-[10px] bg-[#c8951a]/20 text-[#e8b830] rounded-full px-2 py-0.5 mt-2 text-center inline-block mx-auto font-sans">
             {getModeLabel()}
          </p>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute top-6 right-6 text-[#6070a0] hover:text-[#e8b830]"><X size={20}/></button>
        </div>
        
        <nav className="p-4 space-y-1 flex-grow overflow-y-auto no-scrollbar">
          {SECTIONS_METADATA.map(section => {
            const isLoaded = sectionsData[section.id]?.data;
            const isLoading = sectionsData[section.id]?.loading;
            const isActive = expandedNav === section.id;
            
            return (
              <div key={section.id} className="mb-1">
                <button 
                  onClick={() => {
                      jumpTo(section.id);
                      setExpandedNav(isActive ? null : section.id);
                  }} 
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm flex items-center gap-3 ${activeTab === section.id ? 'bg-[#c8951a]/10 text-[#e8b830] font-bold border border-[#c8951a]/30' : 'text-[#6070a0] font-bold hover:bg-[#060d2e] hover:text-[#b8c4e0]'}`}
                >
                  <span className={`${isLoaded ? 'text-green-500' : 'opacity-80'}`}>{section.icon}</span>
                  <span>{section.title}</span>
                  {isLoading && <Loader2 size={12} className="animate-spin ml-auto"/>}
                  {!isLoading && (isActive ? <ChevronUp size={14} className="ml-auto opacity-50"/> : <ChevronDown size={14} className="ml-auto opacity-50"/>)}
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${isActive ? 'max-h-40 opacity-100 mt-1 mb-3' : 'max-h-0 opacity-0'}`}>
                   {section.sub.map((subTitle, idx) => (
                     <div key={idx} className="pl-12 py-2 text-[11.5px] text-[#8a9cc2] flex items-center gap-2 hover:text-[#c8951a] cursor-pointer" onClick={() => jumpTo(section.id)}>
                        <div className="w-1 h-1 bg-[#c8951a]/50 rounded-full"></div>
                        {subTitle}
                     </div>
                   ))}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="p-6 border-t border-[#c8951a]/10 space-y-3 bg-[#0f1744]">
            <button 
              onClick={handleDownloadPDF} 
              disabled={isPdfLoading}
              className="w-full bg-[#c8951a]/10 text-[#c8951a] py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-[#c8951a]/30 hover:bg-[#c8951a] hover:text-[#060d2e] transition-all disabled:opacity-50"
            >
              {isPdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16}/>}
              {isPdfLoading ? "PDF 화면 구성 중..." : "PDF 다이렉트 다운로드"}
            </button>
            <p className="text-[9px] text-[#8a9cc2] text-center mt-1 font-sans">* 이미지를 쪼개서 넣으므로 시간이 조금 걸립니다.</p>
            
            <button onClick={() => window.location.reload()} className="w-full bg-transparent text-[#6070a0] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:text-white transition-all mt-2"><RefreshCcw size={14}/> 다른 모드로 다시 분석</button>
        </div>
      </aside>

      {/* 메인 리포트 영역 */}
      <main id="main-scroll-area" className="flex-grow p-4 md:p-8 lg:p-16 overflow-y-auto relative z-10 lg:ml-72 min-h-screen">
        {analyzing ? (
          <div className="h-[80vh] flex flex-col items-center justify-center text-center">
             <Loader2 size={60} className="animate-spin text-[#c8951a] mb-6 drop-shadow-[0_0_15px_rgba(200,149,26,0.5)]" />
             <h2 className="text-2xl font-bold text-[#e8b830] serif tracking-widest mb-4">운명 데이터 연산 중...</h2>
             <p className="text-[#6070a0] text-sm leading-relaxed">
               자체 내장된 최상위 코어로 명반 데이터를 계산 중입니다.<br/>
               잠시만 기다려주세요... (약 5초 소요)
             </p>
          </div>
        ) : dashboardData && (
          <div id="report-export-area" className="max-w-4xl mx-auto space-y-20 pb-20 bg-[#060d2e]">
            
            <header className="space-y-8 pt-4 export-section bg-[#060d2e]">
                <div className="bg-[#0f1744]/70 backdrop-blur-sm p-6 md:p-8 rounded-3xl border border-[#c8951a]/30 grid grid-cols-2 md:grid-cols-5 gap-6 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#c8951a]/5 rounded-bl-full pointer-events-none"></div>
                    <div><p className="text-[10px] text-[#6070a0] font-bold uppercase mb-2">분석 대상</p><p className="font-bold text-lg text-[#e8b830]">{userName}</p></div>
                    <div><p className="text-[10px] text-[#6070a0] font-bold uppercase mb-2">현재 직업</p><p className="font-bold text-sm tracking-widest text-white truncate px-2">{occupation || '미입력'}</p></div>
                    <div><p className="text-[10px] text-[#6070a0] font-bold uppercase mb-2">사주 명식</p><p className="font-bold text-sm tracking-widest">{dashboardData.sajuRawStr}</p></div>
                    <div><p className="text-[10px] text-[#6070a0] font-bold uppercase mb-2">자미 명궁/국수</p><p className="font-bold text-[13px] text-[#e8b830]">{dashboardData.mingGongKor} / {dashboardData.bureau}</p></div>
                    <div><p className="text-[10px] text-[#6070a0] font-bold uppercase mb-2">서양 점성술</p><p className="font-bold text-xs text-[#e8b830]">{dashboardData.western.sun}<br/>ASC: {dashboardData.western.asc}</p></div>
                </div>
                
                <div className="bg-gradient-to-br from-[#0f1744] to-[#060d2e] p-8 md:p-10 rounded-[2.5rem] border border-[#c8951a]/30 shadow-inner relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 text-[#c8951a]/5"><Sparkles size={250}/></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-4 text-[#e8b830] flex items-center gap-3 italic underline decoration-[#c8951a]/30 underline-offset-8">
                           Report Summary 
                           {analysisMode === 'cold' && <span className="text-[11px] bg-red-900/50 text-red-300 px-3 py-1 rounded-full not-italic ml-2 border border-red-500/30">🔥 팩트폭행 모드</span>}
                           {analysisMode === 'balanced' && <span className="text-[11px] bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full not-italic ml-2 border border-blue-500/30">⚖️ 현실적 조언 모드</span>}
                        </h2>
                        <p className="text-[#b8c4e0] leading-relaxed text-[16.5px] italic font-serif mt-6">"{dashboardData.dashboard?.summary}"</p>
                        <div className="flex flex-wrap gap-2 mt-6">
                            {dashboardData.dashboard?.keywords?.map(k => (
                                <span key={k} className="px-4 py-1.5 bg-[#c8951a]/10 text-[#e8b830] text-[11px] font-bold rounded-full border border-[#c8951a]/20">#{k}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 export-section bg-[#060d2e]">
                {/* 🚀 사주 대운표 추가 */}
                <div className="bg-[#0f1744]/80 p-6 md:p-8 rounded-[2rem] border border-[#c8951a]/20 shadow-2xl relative">
                    <h3 className="text-[15px] font-bold mb-6 text-[#e8b830] flex items-center gap-2"><Compass size={18}/> 사주 명식 및 대운</h3>
                    <div className="grid grid-cols-4 gap-2 md:gap-3 mb-6">
                        {dashboardData.saju.map((pillar, i) => (
                             <div key={i} className="text-center group">
                                <p className="text-[11px] text-[#8a9cc2] font-bold mb-3 tracking-widest whitespace-nowrap">{pillar.col}</p>
                                <div className={`p-3 rounded-xl font-black text-2xl md:text-3xl border mb-2 flex flex-col items-center justify-center transition-transform group-hover:scale-105 ${ELEMENT_STYLES[pillar.ganEl]}`}>
                                  <span>{pillar.ganKor}</span>
                                  <span className="text-[10px] mt-1 opacity-80 font-sans">({pillar.gan})</span>
                                </div>
                                <div className={`p-3 rounded-xl font-black text-2xl md:text-3xl border flex flex-col items-center justify-center transition-transform group-hover:scale-105 ${ELEMENT_STYLES[pillar.zhiEl]}`}>
                                  <span>{pillar.zhiKor}</span>
                                  <span className="text-[10px] mt-1 opacity-80 font-sans">({pillar.zhi})</span>
                                </div>
                             </div>
                        ))}
                    </div>
                    {/* 대운 영역 가로 스크롤 */}
                    <div className="border-t border-[#c8951a]/20 pt-4">
                        <p className="text-[11px] text-[#c8951a] font-bold mb-3">10년 대운 (大運) 흐름</p>
                        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
                           {dashboardData.daewuns?.map((d, i) => (
                             <div key={i} className="flex-shrink-0 bg-[#060d2e]/50 border border-[#c8951a]/20 rounded-lg p-2 text-center w-14">
                                <div className="text-[10px] text-[#c8951a] font-bold mb-1">{d.age}세</div>
                                <div className="text-[13px] text-white font-black">{d.ganKor}</div>
                                <div className="text-[13px] text-[#8a9cc2] font-black">{d.zhiKor}</div>
                             </div>
                           ))}
                        </div>
                    </div>
                </div>

                <div className="bg-[#0f1744]/80 p-8 rounded-[2rem] border border-[#c8951a]/20 shadow-2xl flex flex-col items-center justify-center">
                  <div className="w-full flex justify-between items-center mb-6">
                     <h3 className="text-[15px] font-bold text-[#e8b830] flex items-center gap-2 italic">Destiny Balance</h3>
                  </div>
                  <div className="w-full h-56 relative"><canvas id="radarChart"></canvas></div>
                </div>
            </div>

            {/* 🚀 평생 운세 흐름도 그래프 추가 */}
            {dashboardData.dashboard?.lifeGraph && (
               <div className="bg-[#0f1744]/80 p-6 md:p-8 rounded-[2rem] border border-[#c8951a]/20 shadow-2xl relative export-section bg-[#060d2e]">
                   <h3 className="text-[15px] font-bold mb-6 text-[#e8b830] flex items-center gap-2"><TrendingUp size={18}/> 평생 운세 흐름도 (Life Energy Graph)</h3>
                   <div className="w-full h-48 relative"><LifeGraphChart data={dashboardData.dashboard.lifeGraph} /></div>
                   <div className="flex justify-between px-2 mt-2 text-[11px] text-[#8a9cc2] font-bold">
                       <span>20대</span><span>30대</span><span>40대</span><span>50대</span><span>60대</span><span>70대</span>
                   </div>
               </div>
            )}

            {/* 🚀 사화(四化)가 포함된 전문가용 자미두수 12궁도 */}
            <div className="bg-[#0f1744]/80 p-3 md:p-10 rounded-[2.5rem] border border-[#c8951a]/30 shadow-2xl relative export-section bg-[#060d2e]">
                <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="text-[15px] font-bold text-[#e8b830] flex items-center gap-2"><Compass size={18}/> 정밀 자미두수 12궁도</h3>
                  <span className="text-[11px] bg-[#c8951a]/20 text-[#e8b830] px-4 py-1.5 rounded-full font-bold border border-[#c8951a]/40 shadow-sm">{dashboardData.bureau}</span>
                </div>
                
                <div className="grid grid-cols-4 grid-rows-4 gap-1 md:gap-1.5 aspect-square bg-[#060d2e] p-1.5 md:p-2.5 rounded-2xl border border-[#c8951a]/30 w-full">
                  {[5, 6, 7, 8, 4, null, null, 9, 3, null, null, 10, 2, 1, 0, 11].map((idx, i) => {
                    if (idx === null) return i === 5 ? <div key={i} className="col-span-2 row-span-2 bg-gradient-to-br from-[#0f1744] to-[#060d2e] flex flex-col items-center justify-center text-center p-4 rounded-2xl border border-[#c8951a]/40 shadow-inner">
                      <p className="text-xl md:text-3xl font-black text-[#e8b830] tracking-widest drop-shadow-lg">{userName}</p>
                      <p className="text-[9px] md:text-[11px] text-[#6070a0] mt-3 font-serif tracking-[0.2em] uppercase">Astrology Chart</p>
                    </div> : null;
                    
                    const p = dashboardData.zwChart[idx];
                    
                    return (
                      <div key={i} className={`relative flex flex-col justify-between rounded-lg border border-[#c8951a]/20 p-1 md:p-2 bg-[#0f1744]/60 ${p?.isMing ? 'ring-1 ring-[#e8b830] bg-[#c8951a]/20 shadow-[inset_0_0_10px_rgba(200,149,26,0.3)]' : ''}`}>
                         <div className="flex justify-between items-start h-[60%] overflow-hidden">
                           <div className="flex flex-col gap-[2px] w-1/2 overflow-hidden pr-0.5">
                             {/* 🚀 주성과 사화(록,권,과,기) 표시 */}
                             {p?.stars?.map((s, si) => {
                                const starBase = s.name.split('(')[0];
                                let shBadge = null;
                                if(s.siHua === '록') shBadge = <span className="text-green-400 ml-0.5">[록]</span>;
                                if(s.siHua === '권') shBadge = <span className="text-purple-400 ml-0.5">[권]</span>;
                                if(s.siHua === '과') shBadge = <span className="text-blue-400 ml-0.5">[과]</span>;
                                if(s.siHua === '기') shBadge = <span className="text-red-500 ml-0.5">[기]</span>;
                                return (
                                   <span key={`m-${si}`} className="text-[9px] md:text-[12px] font-black text-red-400 drop-shadow-sm leading-tight break-keep">
                                      {starBase}{shBadge}
                                   </span>
                                );
                             })}
                           </div>
                           <div className="flex flex-col gap-[2px] w-1/2 items-end overflow-hidden pl-0.5">
                             {p?.minors?.map((m, mi) => <span key={`mn-${mi}`} className="text-[7.5px] md:text-[10px] font-bold text-[#b8c4e0] bg-[#c8951a]/10 px-1 rounded-sm leading-none whitespace-nowrap">{m.split('(')[0]}</span>)}
                           </div>
                         </div>

                         <div className="mt-auto pt-1 border-t border-[#c8951a]/20 flex justify-between items-end">
                           <span className="text-[8px] md:text-[10px] text-[#c8951a] font-bold bg-[#060d2e] px-1 py-0.5 rounded shadow-inner shrink-0 leading-none">{p?.daHan.replace('세','')}</span>
                           <div className="text-right flex flex-col items-end shrink-0">
                              <span className={`text-[9px] md:text-[12px] font-black leading-tight mb-[2px] whitespace-nowrap ${p?.isMing ? 'text-white' : 'text-[#b8c4e0]'}`}>{p?.name.split('(')[0] || '---'}</span>
                              <span className="text-[8px] md:text-[11px] font-bold text-[#e8b830] leading-none whitespace-nowrap">
                                 {p?.ganKor}{p?.branchKor}
                              </span>
                           </div>
                         </div>
                      </div>
                    );
                  })}
                </div>
            </div>

            {SECTIONS_METADATA.map(meta => {
              const secState = sectionsData[meta.id];
              const isLoading = secState?.loading;
              const sec = secState?.data;
              const isMonthly = meta.id === 'sec-2026';
              const isOrig = meta.id === 'sec-orig'; 

              return (
                <section key={meta.id} id={meta.id} className="space-y-8 scroll-mt-24 export-section bg-[#060d2e]">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#c8951a] text-[#060d2e] rounded-full shadow-lg">{meta.icon}</div>
                      <h2 className="text-xl md:text-2xl font-bold text-[#e8b830] serif italic tracking-wide">{meta.title}</h2>
                      <div className="flex-grow h-px bg-gradient-to-r from-[#c8951a]/50 to-transparent"></div>
                  </div>

                  {isLoading ? (
                    <div className="p-16 border border-dashed border-[#c8951a]/30 rounded-3xl text-center bg-[#0f1744]/40 animate-pulse">
                        <Loader2 className="animate-spin text-[#c8951a] mx-auto mb-4" size={32}/>
                        <p className="text-[#e8b830] font-bold tracking-widest text-sm mb-2">실시간 맞춤형 분석 중...</p>
                        <p className="text-[#6070a0] text-xs">현재 직업({occupation || '미입력'})과 연애 상태({relationship})를 12궁도와 결합 중입니다.</p>
                    </div>
                  ) : !sec ? (
                    <div className="p-12 border border-dashed border-[#6070a0]/30 rounded-3xl text-center bg-[#0f1744]/20">
                        <p className="text-[#6070a0] font-bold text-sm">분석 대기 중입니다...</p>
                    </div>
                  ) : isOrig ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {sec.subs?.map((sub, i) => (
                        <div key={i} className="bg-[#0f1744]/80 p-6 md:p-8 rounded-[1.5rem] border border-[#c8951a]/30 shadow-xl flex flex-col hover:border-[#e8b830]/50 transition-all">
                          <h3 className="text-lg md:text-xl font-bold text-[#e8b830] flex items-center gap-2 mb-4 border-b border-[#c8951a]/20 pb-3">
                            <Sparkles size={18} className="text-[#c8951a]"/> {sub.title}
                          </h3>
                          <p className="text-[#b8c4e0] text-[14px] md:text-[15px] leading-[1.8] font-serif mb-6 flex-grow text-justify">
                            {sub.easySummary || sub.content || (sub.details ? sub.details.join(' ') : '')}
                          </p>
                          {sub.keywords && sub.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-[#c8951a]/10">
                              {sub.keywords.map((kw, idx) => (
                                <span key={idx} className="bg-[#c8951a]/10 text-[#e8b830] text-[11px] px-3 py-1 rounded-full font-bold shadow-sm">#{kw}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : isMonthly ? (
                    <div className="bg-[#0f1744]/80 p-6 md:p-10 rounded-[2rem] border border-[#c8951a]/20 shadow-xl group">
                       <div className="mb-8 border-b border-[#c8951a]/10 pb-6">
                          <h3 className="text-lg md:text-xl font-bold text-[#e8b830] flex items-center gap-3 mb-4">
                             <Sparkles size={20} className="text-[#c8951a]"/>
                             2026년 전체 흐름 요약
                          </h3>
                          <div className="flex items-start gap-3 bg-[#c8951a]/5 border-l-4 border-[#e8b830] p-4 md:p-5 rounded-r-xl shadow-inner">
                             <Quote className="text-[#c8951a] shrink-0 rotate-180" size={18}/>
                             <p className="text-[#b8c4e0] font-serif text-[15px] md:text-[16px] leading-relaxed text-justify italic">{sec.yearlySummary}</p>
                          </div>
                       </div>

                       <div className="w-full h-56 md:h-64 mb-10 relative">
                          <MonthlyChart data={sec} />
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sec.monthly?.map((m) => (
                             <div key={m.month} className="bg-[#060d2e]/50 p-5 rounded-2xl border border-[#c8951a]/10 hover:border-[#c8951a]/30 transition-all">
                                <div className="flex justify-between items-center mb-3">
                                   <h4 className="text-[#e8b830] font-black text-[16px]">{m.month}월</h4>
                                   <span className="text-[11px] bg-[#c8951a]/10 text-[#c8951a] px-2 py-1 rounded border border-[#c8951a]/20 font-bold tracking-widest shadow-sm">#{m.keyword}</span>
                                </div>
                                <div className="w-full bg-[#0f1744] rounded-full h-1.5 mb-4 overflow-hidden border border-white/5">
                                   <div className="h-full bg-gradient-to-r from-[#c8951a] to-[#e8b830]" style={{ width: `${m.score}%` }}></div>
                                </div>
                                <p className="text-[#8a9cc2] text-[13.5px] leading-relaxed font-serif text-justify">{m.content}</p>
                             </div>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {sec.subs?.map((sub, i) => (
                        <div key={i} className="bg-[#0f1744]/80 p-6 md:p-10 rounded-[2rem] border border-[#c8951a]/20 shadow-xl group hover:border-[#c8951a]/40 transition-all">
                          
                          <div className="flex flex-col mb-5 border-b border-[#c8951a]/10 pb-4">
                             <h3 className="text-lg md:text-xl font-bold text-[#e8b830] flex items-center gap-3">
                                <Sparkles size={20} className="text-[#c8951a]"/>
                                {sub.title}
                             </h3>
                             
                             {sub.keywords && sub.keywords.length > 0 && (
                                <div className="flex gap-2 mt-4 flex-wrap">
                                  {sub.keywords.map((kw, idx) => (
                                    <span key={idx} className="bg-[#c8951a]/10 border border-[#c8951a]/30 text-[#e8b830] text-[10px] md:text-xs px-3 py-1 rounded-full font-bold shadow-sm">#{kw}</span>
                                  ))}
                                </div>
                             )}
                          </div>

                          {sub.easySummary && (
                            <div className="flex items-start gap-3 bg-[#c8951a]/5 border-l-4 border-[#e8b830] p-4 md:p-5 rounded-r-xl mb-6 shadow-inner">
                               <Quote className="text-[#c8951a] shrink-0 rotate-180" size={18}/>
                               <p className="text-[#e8b830] font-bold text-[14px] md:text-[15px] italic leading-relaxed text-justify">{sub.easySummary}</p>
                            </div>
                          )}
                          
                          {sub.details && sub.details.length > 0 && (
                            <ul className="space-y-4 mb-6">
                               {sub.details.map((desc, idx) => (
                                  <li key={idx} className="flex gap-3 items-start">
                                     <CheckCircle2 size={16} className="text-[#c8951a] mt-1 shrink-0" />
                                     <span className="text-[#b8c4e0] text-[14px] md:text-[15px] leading-[1.8] font-serif text-justify">{desc}</span>
                                  </li>
                               ))}
                            </ul>
                          )}
                          
                          {(sub.good || sub.bad) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mt-8 pt-6 border-t border-[#c8951a]/10">
                               {sub.good && (
                                 <div className="p-5 md:p-6 bg-emerald-900/10 rounded-2xl border border-emerald-500/30">
                                    <p className="text-[12px] font-black text-emerald-400 uppercase mb-3 flex items-center gap-2 tracking-widest"><Sun size={16}/> {analysisMode === 'warm' ? '긍정 & 조언' : '해결책 및 장점'}</p>
                                    <p className="text-[13px] md:text-[14px] text-slate-300 leading-relaxed font-serif text-justify">{sub.good}</p>
                                 </div>
                               )}
                               {sub.bad && (
                                 <div className="p-5 md:p-6 bg-red-900/10 rounded-2xl border border-red-500/30">
                                    <p className="text-[12px] font-black text-red-400 uppercase mb-3 flex items-center gap-2 tracking-widest"><ZapOff size={16}/> {analysisMode === 'warm' ? '주의 & 경고' : '뼈아픈 팩트폭행'}</p>
                                    <p className="text-[13px] md:text-[14px] text-slate-300 leading-relaxed font-serif text-justify">{sub.bad}</p>
                                 </div>
                               )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
            
            <footer className="text-center pt-20 pb-10 text-[#6070a0] text-[10px] tracking-[0.3em] uppercase font-sans export-section bg-[#060d2e]">
                <p>© Powered by Advanced Destiny Engine</p>
            </footer>
          </div>
        )}
      </main>   
    </div>
  );
} 

// 'root'라는 id를 가진 div에 App 컴포넌트를 그리라는 명령입니다.
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
