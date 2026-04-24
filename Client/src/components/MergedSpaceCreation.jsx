import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  Sparkles, Plus, Trash2, Upload, X, ChevronRight, Video,
  FileText, Heart, Settings, ArrowLeft, ArrowRight, Check,
  Building2, Users, MessageSquare, RefreshCw, Lightbulb, Eye, EyeOff,
  Circle, Square, RotateCcw, Play, StopCircle, Camera, Film
} from 'lucide-react';
import { BACKEND_URL } from '../utils/DB';

// ─── Cloudinary Upload Helper ─────────────────────────────────────────────────
const uploadToCloudinary = async (file, type = 'image') => {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', 'testi_gatherer');
  data.append('cloud_name', 'dmxnc8pbu');
  const res = await fetch(`https://api.cloudinary.com/v1_1/dmxnc8pbu/${type}/upload`, { method: 'POST', body: data });
  const json = await res.json();
  return json.url || json.secure_url;
};

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map(s => (
      <button key={s} type="button" onClick={() => onChange(s)}
        className={`transition-transform hover:scale-110 ${s <= value ? 'text-amber-400' : 'text-gray-600'}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill={s <= value ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      </button>
    ))}
  </div>
);

// ─── Video Recorder Modal ─────────────────────────────────────────────────────
const VideoRecorderModal = ({ onClose, onVideoReady }) => {
  const [mode, setMode] = useState(null); // 'record' | 'upload'
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);

  const videoRef = useRef(null);
  const previewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const uploadFileRef = useRef(null);

  const MAX_SECONDS = 300; // 5 minutes

  useEffect(() => {
    return () => {
      stopStream();
      clearInterval(timerRef.current);
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setMode('record');
    } catch (err) {
      toast.error('Camera access denied. Please allow camera permissions.');
    }
  };

  const startCountdown = () => {
    let c = 3;
    setCountdown(c);
    const interval = setInterval(() => {
      c--;
      if (c === 0) {
        clearInterval(interval);
        setCountdown(null);
        beginRecording();
      } else {
        setCountdown(c);
      }
    }, 1000);
  };

  const beginRecording = () => {
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp9,opus' });
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
      const url = URL.createObjectURL(blob);
      setVideoPreviewUrl(url);
      setRecorded(true);
      stopStream();
    };
    mr.start(1000);
    mediaRecorderRef.current = mr;
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 1 >= MAX_SECONDS) {
          stopRecording();
          return prev + 1;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const retake = () => {
    setRecorded(false);
    setVideoBlob(null);
    setVideoPreviewUrl(null);
    setElapsed(0);
    startCamera();
  };

  const handleUploadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error('File must be under 200MB'); return; }
    setVideoBlob(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setRecorded(true);
    setMode('upload');
  };

  const handleConfirm = async () => {
    if (!videoBlob) return;
    setUploading(true);
    try {
      const file = videoBlob instanceof Blob && !(videoBlob instanceof File)
        ? new File([videoBlob], 'testimonial.webm', { type: 'video/webm' })
        : videoBlob;
      const url = await uploadToCloudinary(file, 'video');
      onVideoReady(url);
      toast.success('Video uploaded successfully!');
      onClose();
    } catch {
      toast.error('Video upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const progress = (elapsed / MAX_SECONDS) * 100;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <Video size={17} className="text-rose-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Video Testimonial</h2>
              <p className="text-gray-400 text-xs">Record or upload your video (max 5 min)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {/* Mode selector — shown initially */}
          {!mode && (
            <div className="grid grid-cols-2 gap-3 mb-2">
              <button onClick={startCamera}
                className="flex flex-col items-center gap-3 p-6 bg-gray-800/60 border border-gray-700 hover:border-violet-500/50 hover:bg-gray-800 rounded-2xl transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center group-hover:bg-violet-600/30 transition-colors">
                  <Camera size={22} className="text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium text-sm">Record Video</p>
                  <p className="text-gray-500 text-xs mt-0.5">Use your camera & mic</p>
                </div>
              </button>
              <button onClick={() => { setMode('upload'); uploadFileRef.current?.click(); }}
                className="flex flex-col items-center gap-3 p-6 bg-gray-800/60 border border-gray-700 hover:border-amber-500/50 hover:bg-gray-800 rounded-2xl transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <Film size={22} className="text-amber-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium text-sm">Upload Video</p>
                  <p className="text-gray-500 text-xs mt-0.5">MP4, MOV, WebM · max 200MB</p>
                </div>
              </button>
              <input ref={uploadFileRef} type="file" accept="video/*" className="hidden" onChange={handleUploadFile} />
            </div>
          )}

          {/* Camera view — recording mode before stop */}
          {mode === 'record' && !recorded && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
                <video ref={videoRef} muted className="w-full h-full object-cover scale-x-[-1]" />

                {/* Countdown overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <span className="text-white text-8xl font-bold tabular-nums animate-pulse">{countdown}</span>
                  </div>
                )}

                {/* Recording indicator */}
                {recording && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-xs font-mono font-medium">{formatTime(elapsed)}</span>
                  </div>
                )}

                {/* Progress bar */}
                {recording && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {!recording && countdown === null && (
                  <button onClick={startCountdown}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium text-sm transition-all">
                    <Circle size={15} className="fill-white" /> Start Recording
                  </button>
                )}
                {recording && (
                  <button onClick={stopRecording}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium text-sm transition-all">
                    <Square size={15} className="fill-white" /> Stop Recording
                  </button>
                )}
                <button onClick={() => { stopStream(); setMode(null); }}
                  className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-sm transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Preview after recording or uploading */}
          {recorded && videoPreviewUrl && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
                <video ref={previewRef} src={videoPreviewUrl} controls className="w-full h-full object-contain" />
              </div>

              <div className="flex gap-3">
                {mode === 'record' && (
                  <button onClick={retake}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-all">
                    <RotateCcw size={15} /> Retake
                  </button>
                )}
                {mode === 'upload' && (
                  <button onClick={() => { setRecorded(false); setVideoBlob(null); setVideoPreviewUrl(null); setMode(null); }}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-all">
                    <RotateCcw size={15} /> Choose Different
                  </button>
                )}
                <button onClick={handleConfirm} disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-all">
                  {uploading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
                    : <><Check size={16} /> Use This Video</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Live Preview ─────────────────────────────────────────────────────────────
const LivePreview = ({ formData, activeTab, thankYouData }) => {
  if (activeTab === 'thankyou') {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
        <div className="p-1 bg-gray-100 flex items-center gap-1.5 px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-gray-400 text-xs ml-2">Thank You Page Preview</span>
        </div>
        <div className="p-8 text-center">
          {!thankYouData.hideImage && thankYouData.imagePreview && (
            <img src={thankYouData.imagePreview} alt="thankyou" className="w-32 h-32 mx-auto rounded-2xl object-cover mb-4 shadow-lg" />
          )}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{thankYouData.thankyouTitle || 'Thank you! 🎉'}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">{thankYouData.thankyouMessage || 'Thank you so much for your shoutout! It means a ton for us! 🙏'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
      <div className="p-1 bg-gray-100 flex items-center gap-1.5 px-3">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="text-gray-400 text-xs ml-2">testimonial.to/{formData.spacename || 'your-space'}</span>
      </div>
      <div className="p-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden border border-gray-200 shadow-md">
          <img src={formData.imageUrl || 'https://testimonial.to/static/media/just-logo.040f4fd2.svg'} alt="" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{formData.header || 'Your header goes here...'}</h2>
        <p className="text-gray-500 text-sm mb-4 leading-relaxed">{formData.customMessage || 'Your custom message...'}</p>
        {formData.questions.length > 0 && (
          <div className="text-left bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Questions</p>
            <ul className="space-y-1.5">
              {formData.questions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-violet-500 mt-0.5 shrink-0">•</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="space-y-2">
          {formData.allowVideo && (
            <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium">
              <Video size={16} /> Record a video
            </button>
          )}
          <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium">
            <MessageSquare size={16} /> Send a text
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── AI Space Creator ─────────────────────────────────────────────────────────
const AISpaceCreator = ({ onApply, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({ name: '', type: '', audience: '', product: '' });
  const [suggestions, setSuggestions] = useState(null);
  const [thankYouSuggestions, setThankYouSuggestions] = useState(null);
  const [loadingThankyou, setLoadingThankyou] = useState(false);

  const generateBasic = async () => {
    if (!companyInfo.name || !companyInfo.type) {
      toast.error('Please fill in company name and type');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a marketing expert. Generate testimonial collection content for this business:
Company: ${companyInfo.name}
Type: ${companyInfo.type}
Target Audience: ${companyInfo.audience || 'general customers'}
Product/Service: ${companyInfo.product || 'not specified'}

Return ONLY valid JSON (no markdown, no backticks):
{
  "header": "compelling header under 35 chars",
  "customMessage": "warm 2-3 sentence message encouraging customers to share experience",
  "questions": ["question1", "question2", "question3", "question4", "question5"]
}`
          }]
        })
      });
      const data = await response.json();
      const raw = data.content?.[0]?.text || '{}';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      setSuggestions(JSON.parse(cleaned));
      setStep(2);
    } catch (e) {
      toast.error('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const generateThankYou = async () => {
    setLoadingThankyou(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Generate thank you page content for ${companyInfo.name} (${companyInfo.type}).
Return ONLY valid JSON:
{
  "thankyouTitle": "short thank you title (max 40 chars)",
  "thankyouMessage": "warm 2-sentence thank you message"
}`
          }]
        })
      });
      const data = await response.json();
      const raw = data.content?.[0]?.text || '{}';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      setThankYouSuggestions(JSON.parse(cleaned));
      setStep(3);
    } catch (e) {
      toast.error('Failed to generate thank you content');
    } finally {
      setLoadingThankyou(false);
    }
  };

  const applyAll = () => {
    onApply({ ...suggestions, ...(thankYouSuggestions || {}) });
    onClose();
    toast.success('AI suggestions applied!');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Sparkles size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">AI Space Creator</h2>
              <p className="text-gray-400 text-xs">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white"><X size={16} /></button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {[1,2,3].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-amber-500' : 'bg-gray-700'}`} />
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <h3 className="text-white font-medium mb-1">Tell us about your business</h3>
                <p className="text-gray-400 text-sm mb-4">We'll craft the perfect testimonial space for you</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-wider block mb-1.5">Company Name *</label>
                  <input value={companyInfo.name} onChange={e => setCompanyInfo(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-wider block mb-1.5">Business Type *</label>
                  <input value={companyInfo.type} onChange={e => setCompanyInfo(p => ({ ...p, type: e.target.value }))}
                    placeholder="e.g. SaaS tool, E-commerce, Coaching"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-wider block mb-1.5">Target Audience</label>
                  <input value={companyInfo.audience} onChange={e => setCompanyInfo(p => ({ ...p, audience: e.target.value }))}
                    placeholder="e.g. Small business owners, developers"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-wider block mb-1.5">Main Product/Service</label>
                  <input value={companyInfo.product} onChange={e => setCompanyInfo(p => ({ ...p, product: e.target.value }))}
                    placeholder="e.g. Project management software"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50" />
                </div>
              </div>
              <button onClick={generateBasic} disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <><RefreshCw size={16} className="animate-spin" /> Generating…</> : <><Sparkles size={16} /> Generate Content</>}
              </button>
            </>
          )}

          {step === 2 && suggestions && (
            <>
              <div>
                <h3 className="text-white font-medium mb-1">Your AI-generated space content</h3>
                <p className="text-gray-400 text-sm mb-4">Review and customize before applying</p>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gray-800/60 border border-gray-700 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Header</p>
                  <p className="text-white text-sm font-medium">{suggestions.header}</p>
                </div>
                <div className="p-3 bg-gray-800/60 border border-gray-700 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Custom Message</p>
                  <p className="text-gray-300 text-sm">{suggestions.customMessage}</p>
                </div>
                <div className="p-3 bg-gray-800/60 border border-gray-700 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Questions ({suggestions.questions?.length})</p>
                  <ul className="space-y-1.5">
                    {suggestions.questions?.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-amber-500 mt-0.5 shrink-0">•</span> {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={generateBasic} disabled={loading}
                  className="py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm flex items-center justify-center gap-2">
                  <RefreshCw size={14} /> Regenerate
                </button>
                <button onClick={generateThankYou} disabled={loadingThankyou}
                  className="py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded-xl text-sm flex items-center justify-center gap-2">
                  {loadingThankyou ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />} Thank You Page
                </button>
              </div>
            </>
          )}

          {step === 3 && thankYouSuggestions && (
            <>
              <div>
                <h3 className="text-white font-medium mb-1">Thank You Page</h3>
                <p className="text-gray-400 text-sm mb-4">AI-crafted thank you message for your customers</p>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gray-800/60 border border-gray-700 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Title</p>
                  <p className="text-white font-medium">{thankYouSuggestions.thankyouTitle}</p>
                </div>
                <div className="p-3 bg-gray-800/60 border border-gray-700 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Message</p>
                  <p className="text-gray-300 text-sm">{thankYouSuggestions.thankyouMessage}</p>
                </div>
              </div>
              <button onClick={applyAll}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                <Check size={16} /> Apply All Suggestions
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
function MergedSpaceCreation() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [headerError, setHeaderError] = useState(false);
  const fileRef = useRef(null);
  const thankyouFileRef = useRef(null);

  const [basicFormData, setBasicFormData] = useState({
    spacename: '',
    imageUrl: '',
    header: '',
    customMessage: '',
    questions: [
      'Who are you / what are you working on?',
      'How has [our product / service] helped you?',
      'What is the best thing about [our product / service]?',
    ],
    allowVideo: true,
    videoUrl: '',           // stores uploaded/recorded video URL
    videoMaxDuration: 120,  // seconds; configurable per-space
  });

  const [thankYouFormData, setThankYouFormData] = useState({
    imagePreview: '',
    thankyouTitle: 'Thank you! 🎉',
    thankyouMessage: 'Thank you so much for your shoutout! It means a ton for us! 🙏',
    hideImage: false,
    redirect_url: '',
  });

  const handleHeaderChange = (e) => {
    if (e.target.value.length <= 35) {
      setBasicFormData(p => ({ ...p, header: e.target.value }));
      setHeaderError(false);
    } else {
      setHeaderError(true);
    }
  };

  const handleQuestionChange = (i, val) => {
    const q = [...basicFormData.questions];
    q[i] = val;
    setBasicFormData(p => ({ ...p, questions: q }));
  };

  const addQuestion = () => setBasicFormData(p => ({ ...p, questions: [...p.questions, ''] }));

  const removeQuestion = (i) => {
    setBasicFormData(p => ({ ...p, questions: p.questions.filter((_, qi) => qi !== i) }));
  };

  const handleFileUpload = async (e, setFn) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadToCloudinary(file, 'image');
      setFn(url);
    } catch { toast.error('Upload failed'); }
  };

  const applyAISuggestions = (data) => {
    if (data.header) setBasicFormData(p => ({ ...p, header: data.header, customMessage: data.customMessage || p.customMessage, questions: data.questions || p.questions }));
    if (data.thankyouTitle) setThankYouFormData(p => ({ ...p, thankyouTitle: data.thankyouTitle, thankyouMessage: data.thankyouMessage || p.thankyouMessage }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!basicFormData.spacename) { toast.error('Space name is required'); return; }
    if (!basicFormData.header) { toast.error('Header title is required'); return; }
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/v1/space-creation`,
        { ...basicFormData, ...thankYouFormData },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (res.data.message) {
        toast.success(res.data.message);
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error creating space');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Space Setup', icon: <Settings size={15} /> },
    { id: 'thankyou', label: 'Thank You', icon: <Heart size={15} /> },
  ];

  const durationOptions = [
    { label: '1 min', value: 60 },
    { label: '2 min', value: 120 },
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-950 py-8 px-4">
      {showAI && <AISpaceCreator onApply={applyAISuggestions} onClose={() => setShowAI(false)} />}
      {showVideoRecorder && (
        <VideoRecorderModal
          onClose={() => setShowVideoRecorder(false)}
          onVideoReady={(url) => setBasicFormData(p => ({ ...p, videoUrl: url }))}
        />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="text-white font-bold">TestiQra</span>
          </div>
        </div>

        <div className="flex gap-8">
          {/* ── Left: Live Preview ── */}
          <div className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-8">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Eye size={12} /> Live Preview
              </p>
              <LivePreview formData={basicFormData} activeTab={activeTab} thankYouData={thankYouFormData} />
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Create a New Space</h1>
              <p className="text-gray-400">Set up your testimonial collection page</p>
            </div>

            {/* Creation Mode Selector */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button onClick={() => setShowAI(false)}
                className="flex items-center gap-3 p-4 bg-gray-900/60 border-2 border-violet-500/60 rounded-2xl text-left hover:bg-gray-900 transition-all">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                  <FileText size={18} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">From Scratch</p>
                  <p className="text-gray-500 text-xs">Full customisation</p>
                </div>
              </button>
              <button onClick={() => setShowAI(true)}
                className="flex items-center gap-3 p-4 bg-gray-900/60 border border-gray-700 hover:border-amber-500/40 rounded-2xl text-left hover:bg-gray-900 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <Sparkles size={18} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Create with AI</p>
                  <p className="text-gray-500 text-xs">AI-powered setup</p>
                </div>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-900/60 border border-gray-800 rounded-xl mb-6">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ── BASIC TAB ── */}
              {activeTab === 'basic' && (
                <div className="space-y-5">
                  {/* Space Name */}
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                    <label className="text-white font-medium text-sm block mb-1">Space Name *</label>
                    <p className="text-gray-500 text-xs mb-3">This becomes your public URL</p>
                    <input
                      value={basicFormData.spacename}
                      onChange={e => setBasicFormData(p => ({ ...p, spacename: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                      placeholder="my-awesome-product"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/60 transition-colors"
                    />
                    <p className="text-gray-600 text-xs mt-2">testimonial.to/{basicFormData.spacename || 'your-space'}</p>
                  </div>

                  {/* Logo */}
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                    <label className="text-white font-medium text-sm block mb-3">Space Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl border border-gray-700 bg-gray-800 overflow-hidden">
                        <img src={basicFormData.imageUrl || 'https://testimonial.to/static/media/just-logo.040f4fd2.svg'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex gap-2">
                        <input ref={fileRef} type="file" accept="image/*" className="hidden"
                          onChange={e => handleFileUpload(e, url => setBasicFormData(p => ({ ...p, imageUrl: url })))} />
                        <button type="button" onClick={() => fileRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 border border-violet-500/30 text-violet-400 rounded-xl text-sm hover:bg-violet-600/30 transition-colors">
                          <Upload size={14} /> Upload
                        </button>
                        {basicFormData.imageUrl && (
                          <button type="button" onClick={() => setBasicFormData(p => ({ ...p, imageUrl: '' }))}
                            className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm hover:bg-red-500/20 transition-colors">
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                    <label className="text-white font-medium text-sm block mb-1">Header Title *</label>
                    <p className="text-gray-500 text-xs mb-3">Main heading customers see (max 35 chars)</p>
                    <input
                      value={basicFormData.header} onChange={handleHeaderChange} maxLength={36}
                      placeholder="Share your experience with us!"
                      className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none transition-colors ${headerError ? 'border-red-500/60' : 'border-gray-700 focus:border-violet-500/60'}`}
                    />
                    <div className="flex justify-between mt-1.5">
                      {headerError && <p className="text-red-400 text-xs">Max 35 characters</p>}
                      <p className={`text-xs ml-auto ${basicFormData.header.length > 30 ? 'text-amber-400' : 'text-gray-600'}`}>
                        {basicFormData.header.length}/35
                      </p>
                    </div>
                  </div>

                  {/* Custom Message */}
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                    <label className="text-white font-medium text-sm block mb-1">Custom Message</label>
                    <p className="text-gray-500 text-xs mb-3">Guide customers on how to write a great testimonial</p>
                    <textarea
                      rows={4} value={basicFormData.customMessage}
                      onChange={e => setBasicFormData(p => ({ ...p, customMessage: e.target.value }))}
                      placeholder="Write a warm message to your customers..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/60 transition-colors resize-none"
                    />
                  </div>

                  {/* ── Allow Video Toggle + Video Settings ── */}
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-4">
                    {/* Toggle row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-white font-medium text-sm">Allow Video Testimonials</label>
                        <p className="text-gray-500 text-xs mt-0.5">Let customers record or upload video reviews</p>
                      </div>
                      <button type="button" onClick={() => setBasicFormData(p => ({ ...p, allowVideo: !p.allowVideo }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${basicFormData.allowVideo ? 'bg-violet-600' : 'bg-gray-700'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${basicFormData.allowVideo ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* ── Expanded video settings when enabled ── */}
                    {basicFormData.allowVideo && (
                      <div className="space-y-4 pt-1">
                        {/* Info pill */}
                        <div className="flex items-center gap-2 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2">
                          <Video size={13} />
                          Customers will see options to record from camera or upload a video file
                        </div>

                        {/* Max duration picker */}
                        <div>
                          <p className="text-gray-300 text-xs font-medium mb-2">Max video duration</p>
                          <div className="flex gap-2 flex-wrap">
                            {durationOptions.map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setBasicFormData(p => ({ ...p, videoMaxDuration: opt.value }))}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                  basicFormData.videoMaxDuration === opt.value
                                    ? 'bg-violet-600 border-violet-500 text-white'
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Record / Upload action cards */}
                        <div>
                          <p className="text-gray-300 text-xs font-medium mb-2">
                            Sample video <span className="text-gray-500 font-normal">(optional — preview how it works)</span>
                          </p>
                          <div className="grid grid-cols-2 gap-2.5">
                            {/* Record card */}
                            <button
                              type="button"
                              onClick={() => setShowVideoRecorder(true)}
                              className="flex items-center gap-3 p-3.5 bg-gray-800/70 border border-gray-700 hover:border-violet-500/50 hover:bg-gray-800 rounded-xl transition-all group text-left"
                            >
                              <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 group-hover:bg-violet-600/30 transition-colors">
                                <Camera size={16} className="text-violet-400" />
                              </div>
                              <div>
                                <p className="text-white text-xs font-medium">Record</p>
                                <p className="text-gray-500 text-xs">Use camera</p>
                              </div>
                            </button>

                            {/* Upload card */}
                            <button
                              type="button"
                              onClick={() => setShowVideoRecorder(true)}
                              className="flex items-center gap-3 p-3.5 bg-gray-800/70 border border-gray-700 hover:border-amber-500/50 hover:bg-gray-800 rounded-xl transition-all group text-left"
                            >
                              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                                <Film size={16} className="text-amber-400" />
                              </div>
                              <div>
                                <p className="text-white text-xs font-medium">Upload</p>
                                <p className="text-gray-500 text-xs">From device</p>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Attached video preview */}
                        {basicFormData.videoUrl && (
                          <div className="rounded-xl overflow-hidden border border-gray-700 bg-black relative">
                            <video src={basicFormData.videoUrl} controls className="w-full max-h-48 object-contain" />
                            <button
                              type="button"
                              onClick={() => setBasicFormData(p => ({ ...p, videoUrl: '' }))}
                              className="absolute top-2 right-2 p-1.5 bg-gray-900/80 backdrop-blur-sm rounded-lg text-gray-400 hover:text-red-400 transition-colors border border-gray-700"
                            >
                              <X size={14} />
                            </button>
                            <div className="px-3 py-2 bg-gray-900/60 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              <span className="text-gray-400 text-xs">Sample video attached</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Questions */}
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="text-white font-medium text-sm">Questions</label>
                        <p className="text-gray-500 text-xs mt-0.5">Prompts shown to your customers</p>
                      </div>
                      <button type="button" onClick={addQuestion}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 border border-violet-500/30 text-violet-400 rounded-lg text-xs hover:bg-violet-600/30 transition-colors">
                        <Plus size={13} /> Add
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {basicFormData.questions.map((q, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs shrink-0">{i + 1}</span>
                          <input
                            value={q} onChange={e => handleQuestionChange(i, e.target.value)}
                            placeholder={`Question ${i + 1}`}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/60 transition-colors"
                          />
                          <button type="button" onClick={() => removeQuestion(i)}
                            className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── THANK YOU TAB ── */}
              {activeTab === 'thankyou' && (
                <div className="space-y-5">
                  {/* Image */}
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="text-white font-medium text-sm">Thank You Image</label>
                        <p className="text-gray-500 text-xs mt-0.5">Displayed above your thank you message</p>
                      </div>
                      <button type="button" onClick={() => setThankYouFormData(p => ({ ...p, hideImage: !p.hideImage }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${!thankYouFormData.hideImage ? 'bg-violet-600' : 'bg-gray-700'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${!thankYouFormData.hideImage ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    {!thankYouFormData.hideImage && (
                      <div className="flex items-center gap-4">
                        {thankYouFormData.imagePreview && (
                          <img src={thankYouFormData.imagePreview} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-700" />
                        )}
                        <div className="flex gap-2">
                          <input ref={thankyouFileRef} type="file" accept="image/*" className="hidden"
                            onChange={e => handleFileUpload(e, url => setThankYouFormData(p => ({ ...p, imagePreview: url })))} />
                          <button type="button" onClick={() => thankyouFileRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 border border-violet-500/30 text-violet-400 rounded-xl text-sm hover:bg-violet-600/30 transition-colors">
                            <Upload size={14} /> {thankYouFormData.imagePreview ? 'Change' : 'Upload'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                    <label className="text-white font-medium text-sm block mb-1">Thank You Title</label>
                    <input
                      value={thankYouFormData.thankyouTitle}
                      onChange={e => setThankYouFormData(p => ({ ...p, thankyouTitle: e.target.value }))}
                      placeholder="Thank you! 🎉"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/60 transition-colors"
                    />
                  </div>

                  {/* Message */}
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                    <label className="text-white font-medium text-sm block mb-1">Thank You Message</label>
                    <textarea
                      rows={4} value={thankYouFormData.thankyouMessage}
                      onChange={e => setThankYouFormData(p => ({ ...p, thankyouMessage: e.target.value }))}
                      placeholder="Thank you so much for your shoutout!"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/60 transition-colors resize-none"
                    />
                  </div>

                  {/* Redirect */}
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                    <label className="text-white font-medium text-sm block mb-1">Redirect URL (optional)</label>
                    <p className="text-gray-500 text-xs mb-3">Send customers to your website after submission</p>
                    <input
                      value={thankYouFormData.redirect_url}
                      onChange={e => setThankYouFormData(p => ({ ...p, redirect_url: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/60 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-base transition-all shadow-lg shadow-violet-500/20">
                {isLoading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Space…</>
                ) : (
                  <><Plus size={18} /> Create Space</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' } }} />
    </div>
  );
}

export default MergedSpaceCreation;