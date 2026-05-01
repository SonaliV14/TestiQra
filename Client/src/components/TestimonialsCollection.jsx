import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
  Star, X, Upload, Video, PenLine, Zap, Heart, Check,
  RefreshCw, Camera, Film, RotateCcw, Square, Circle,
  ChevronRight, Play, Trash2
} from 'lucide-react';
import { BACKEND_URL } from '../utils/DB';

// ─── Cloudinary upload helper ────────────────────────────────────────────────
const uploadToCloudinary = async (file, type = 'image') => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', 'testi_gatherer');
  fd.append('cloud_name', 'dmxnc8pbu');
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/dmxnc8pbu/${type}/upload`,
    { method: 'POST', body: fd }
  );
  const json = await res.json();
  return json.url || json.secure_url;
};

// ─── Star picker ─────────────────────────────────────────────────────────────
const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1.5">
    {[1, 2, 3, 4, 5].map(s => (
      <button key={s} type="button" onClick={() => onChange(s)}
        className={`transition-all hover:scale-110 ${s <= value ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'}`}>
        <Star size={24} fill={s <= value ? 'currentColor' : 'none'} />
      </button>
    ))}
  </div>
);

// ─── Video Recorder Component ─────────────────────────────────────────────────
const VideoRecorder = ({ onVideoReady, onRemove, existingVideoUrl, maxDuration = 120 }) => {
  const [mode, setMode] = useState('idle'); // idle | options | countdown | recording | preview
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(existingVideoUrl || '');
  const [uploading, setUploading] = useState(false);

  const liveVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const countdownTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const uploadFileRef = useRef(null);

  useEffect(() => {
    return () => {
      stopStream();
      clearInterval(countdownTimerRef.current);
      clearInterval(elapsedTimerRef.current);
    };
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setMode('countdown');
      setCountdown(3);
      setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play();
        }
      }, 50);
      let c = 3;
      countdownTimerRef.current = setInterval(() => {
        c--;
        if (c <= 0) {
          clearInterval(countdownTimerRef.current);
          setCountdown(0);
          beginRecording(stream);
        } else setCountdown(c);
      }, 1000);
    } catch {
      toast.error('Camera access denied');
    }
  };

  const beginRecording = (stream) => {
    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      stopStream();
      setMode('preview');
    };
    mr.start(1000);
    setMode('recording');
    setElapsed(0);
    elapsedTimerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 1 >= maxDuration) { clearInterval(elapsedTimerRef.current); mr.stop(); }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    clearInterval(elapsedTimerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const retake = () => {
    setVideoBlob(null);
    setPreviewUrl('');
    setElapsed(0);
    setMode('options');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error('File must be under 200MB'); return; }
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'video');
      setPreviewUrl(url);
      setVideoBlob(null);
      onVideoReady(url);
      setMode('preview');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const confirmVideo = async () => {
    if (!videoBlob) { onVideoReady(previewUrl); return; }
    setUploading(true);
    try {
      const file = new File([videoBlob], 'testimonial.webm', { type: 'video/webm' });
      const url = await uploadToCloudinary(file, 'video');
      onVideoReady(url);
      setPreviewUrl(url);
      toast.success('Video ready!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const removeVideo = () => {
    setVideoBlob(null);
    setPreviewUrl('');
    setMode('idle');
    onRemove();
  };

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const progress = (elapsed / maxDuration) * 100;

  if (mode === 'idle') {
    return (
      <button type="button" onClick={() => setMode('options')}
        className="w-full flex items-center gap-3 p-3 bg-gray-800/40 border border-dashed border-gray-600 hover:border-violet-500/60 hover:bg-gray-800/60 rounded-xl text-gray-400 hover:text-gray-200 transition-all group">
        <div className="w-8 h-8 rounded-lg bg-gray-700 group-hover:bg-violet-600/20 flex items-center justify-center transition-colors">
          <Video size={15} className="text-gray-500 group-hover:text-violet-400" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">Add a video (optional)</p>
          <p className="text-xs text-gray-600">Record or upload a video testimonial</p>
        </div>
      </button>
    );
  }

  if (mode === 'options') {
    return (
      <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-gray-300 text-sm font-medium">Add Video</p>
          <button type="button" onClick={() => setMode('idle')} className="text-gray-600 hover:text-gray-400"><X size={14} /></button>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={initCamera}
            className="flex flex-col items-center gap-2 p-4 bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600/20 rounded-xl transition-all group">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center group-hover:bg-violet-600/30 transition-colors">
              <Camera size={18} className="text-violet-400" />
            </div>
            <div className="text-center">
              <p className="text-white text-xs font-medium">Record</p>
              <p className="text-gray-500 text-xs">Use camera</p>
            </div>
          </button>
          <label className="flex flex-col items-center gap-2 p-4 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-xl transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              {uploading ? <RefreshCw size={18} className="text-amber-400 animate-spin" /> : <Film size={18} className="text-amber-400" />}
            </div>
            <div className="text-center">
              <p className="text-white text-xs font-medium">Upload</p>
              <p className="text-gray-500 text-xs">From device</p>
            </div>
            <input ref={uploadFileRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>
    );
  }

  if (mode === 'countdown' || mode === 'recording') {
    return (
      <div className="space-y-3">
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/8">
          <video ref={liveVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          {mode === 'countdown' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
              <span className="text-white text-7xl font-black">{countdown}</span>
              <span className="text-gray-400 text-sm mt-2">Get ready…</span>
            </div>
          )}
          {mode === 'recording' && (
            <>
              <div className="absolute top-2.5 left-2.5 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-xs font-mono">{fmt(elapsed)} / {fmt(maxDuration)}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div className={`h-full transition-all duration-1000 ${progress > 85 ? 'bg-red-500' : 'bg-violet-500'}`} style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
        </div>
        {mode === 'recording' && (
          <button type="button" onClick={stopRecording}
            className="w-full py-2.5 bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400 rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
            <Square size={13} className="fill-red-400" /> Stop Recording
          </button>
        )}
      </div>
    );
  }

  if (mode === 'preview') {
    return (
      <div className="space-y-3">
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/8">
          <video src={previewUrl} controls className="w-full h-full object-contain" />
          <button type="button" onClick={removeVideo}
            className="absolute top-2 right-2 p-1.5 bg-gray-900/80 backdrop-blur-sm rounded-lg text-gray-400 hover:text-red-400 border border-gray-700 transition-colors">
            <X size={13} />
          </button>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={retake}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-xs transition-all">
            <RotateCcw size={12} /> {videoBlob ? 'Retake' : 'Change'}
          </button>
          {videoBlob && (
            <button type="button" onClick={confirmVideo} disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600/30 text-violet-400 rounded-xl text-xs font-medium transition-all disabled:opacity-50">
              {uploading ? <><RefreshCw size={12} className="animate-spin" /> Uploading…</> : <><Check size={12} /> Confirm Video</>}
            </button>
          )}
          {!videoBlob && previewUrl && (
            <div className="flex-1 flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400 text-xs">Video ready</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

// ─── Unified Testimonial Form ─────────────────────────────────────────────────
const TestimonialForm = ({ spaceinfo, spacename, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    username: '', email: '', content: '', imageURL: '', UserImageURL: '', rating: 5, videoUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [activeSection, setActiveSection] = useState('text'); // text | video
  const imageRef = useRef(null);
  const avatarRef = useRef(null);

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm(f => ({ ...f, [field]: url }));
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) { toast.error('Name is required'); return; }
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    if (!form.content.trim() && !form.videoUrl) { toast.error('Please write your testimonial or add a video'); return; }
    if (!agreed) { toast.error('Please accept the permission checkbox'); return; }
    setSubmitting(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/v1/sendtestimonials`,
        {
          testimonial: {
            username: form.username,
            email: form.email,
            isTextContent: !form.videoUrl,
            content: form.content || '[Video Testimonial]',
            imageURL: form.imageURL || '',
            UserImageURL: form.UserImageURL || '',
          },
          rating: form.rating,
          videoUrl: form.videoUrl || null,
        },
        { params: { spacename }, headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }
      );
      toast.success('Testimonial submitted — thank you!');
      setTimeout(() => { onSuccess(); onClose(); }, 800);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Submission failed, please try again');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <PenLine size={15} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Share your experience</h2>
              <p className="text-gray-600 text-xs">for {spaceinfo?.space_name || spaceinfo?.header}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/4 hover:bg-white/8 text-gray-500 hover:text-white transition-all">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">

            {/* Questions reminder */}
            {spaceinfo?.questions?.length > 0 && (
              <div className="bg-white/3 border border-white/8 rounded-xl p-3.5">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 font-semibold">Answer these questions</p>
                <ul className="space-y-1.5">
                  {spaceinfo.questions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <span className="text-violet-400 mt-0.5 shrink-0">◆</span>
                      {q.question || q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rating */}
            <div>
              <p className="text-gray-400 text-xs mb-2 font-medium uppercase tracking-wider">Your rating</p>
              <StarPicker value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
            </div>

            {/* Written testimonial */}
            <div>
              <p className="text-gray-400 text-xs mb-2 font-medium uppercase tracking-wider">Your testimonial</p>
              <div className="bg-[#111318] border border-white/8 rounded-xl p-3.5 focus-within:border-violet-400/30 transition-all">
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={4}
                  placeholder="Share your honest experience…"
                  className="w-full bg-transparent text-white text-sm placeholder-gray-700 focus:outline-none resize-none leading-relaxed"
                />
                <p className="text-gray-700 text-xs text-right mt-1">{form.content.length} chars</p>
              </div>
            </div>

            {/* Attach image */}
            <div>
              <p className="text-gray-400 text-xs mb-2 font-medium uppercase tracking-wider">Attach an image (optional)</p>
              {form.imageURL
                ? <div className="relative w-20">
                    <img src={form.imageURL} alt="" className="w-20 h-20 object-cover rounded-xl border border-white/10" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, imageURL: '' }))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                : <label className="flex items-center gap-2 px-3 py-2 bg-white/4 border border-white/8 hover:bg-white/8 rounded-xl text-gray-400 text-xs cursor-pointer w-fit transition-all">
                    {uploading ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />} Upload image
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'imageURL')} className="hidden" ref={imageRef} />
                  </label>
              }
            </div>

            {/* Video section */}
            {spaceinfo?.allowVideo !== false && (
              <div>
                <p className="text-gray-400 text-xs mb-2 font-medium uppercase tracking-wider">Add a video (optional)</p>
                <VideoRecorder
                  onVideoReady={(url) => setForm(f => ({ ...f, videoUrl: url }))}
                  onRemove={() => setForm(f => ({ ...f, videoUrl: '' }))}
                  existingVideoUrl={form.videoUrl}
                  maxDuration={spaceinfo?.videoMaxDuration || 120}
                />
                {form.videoUrl && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-400 text-xs">Video attached and ready</span>
                  </div>
                )}
              </div>
            )}

            {/* Name + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#111318] border border-white/8 rounded-xl px-3 py-2.5 focus-within:border-violet-400/30 transition-all">
                <label className="block text-[10px] text-gray-600 uppercase tracking-widest mb-1">Your name *</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="Alex Johnson" className="w-full bg-transparent text-white text-sm placeholder-gray-700 focus:outline-none" />
              </div>
              <div className="bg-[#111318] border border-white/8 rounded-xl px-3 py-2.5 focus-within:border-violet-400/30 transition-all">
                <label className="block text-[10px] text-gray-600 uppercase tracking-widest mb-1">Email *</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@email.com" type="email" className="w-full bg-transparent text-white text-sm placeholder-gray-700 focus:outline-none" />
              </div>
            </div>

            {/* Avatar upload */}
            <div>
              <p className="text-gray-400 text-xs mb-2 font-medium uppercase tracking-wider">Your photo (optional)</p>
              {form.UserImageURL
                ? <div className="relative w-10">
                    <img src={form.UserImageURL} alt="" className="w-10 h-10 object-cover rounded-full border-2 border-violet-400/30" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, UserImageURL: '' }))}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <X size={8} className="text-white" />
                    </button>
                  </div>
                : <label className="flex items-center gap-2 px-3 py-2 bg-white/4 border border-white/8 hover:bg-white/8 rounded-xl text-gray-400 text-xs cursor-pointer w-fit transition-all">
                    <Upload size={12} /> Upload photo
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'UserImageURL')} className="hidden" ref={avatarRef} />
                  </label>
              }
            </div>

            {/* Consent */}
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-violet-500" />
              <span className="text-gray-600 text-xs leading-relaxed">
                I give permission to use this testimonial for marketing purposes
              </span>
            </label>
          </div>

          <div className="p-5 border-t border-white/8 flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-white/4 border border-white/8 hover:bg-white/8 text-gray-400 rounded-xl text-sm transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitting || uploading}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${submitting || uploading ? 'bg-violet-600/30 text-violet-400/50 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'}`}>
              {submitting
                ? <><RefreshCw size={14} className="animate-spin" /> Submitting…</>
                : <><Check size={14} /> Submit Testimonial</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TestimonialsCollection() {
  const { spacename } = useParams();
  const [spaceinfo, setSpaceinfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`${BACKEND_URL}/api/v1/spaceinfo`, {
      params: { spacename },
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    })
      .then(r => setSpaceinfo(r.data.spaceinfo || r.data))
      .catch(() => toast.error('Failed to load space info'))
      .finally(() => setLoading(false));
  }, [spacename]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading space…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center p-6"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');`}</style>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#111318', color: '#fff', border: '1px solid rgba(255,255,255,.1)', borderRadius: '14px' }
      }} />

      {showForm && (
        <TestimonialForm
          spaceinfo={spaceinfo}
          spacename={spacename}
          onClose={() => setShowForm(false)}
          onSuccess={() => setSubmitted(true)}
        />
      )}

      {submitted ? (
        <div className="text-center space-y-5 max-w-sm mx-auto">
          {spaceinfo?.thankyou_img_url && !spaceinfo?.hide_gif && (
            <img src={spaceinfo.thankyou_img_url} alt="" className="w-32 h-32 rounded-2xl object-cover mx-auto shadow-xl" />
          )}
          <div className="w-16 h-16 rounded-2xl bg-emerald-400/15 border border-emerald-400/25 flex items-center justify-center mx-auto">
            <Heart size={30} className="text-emerald-400" fill="currentColor" />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }} className="text-white text-3xl mb-2">
              {spaceinfo?.thankyou_title || 'Thank you! 🎉'}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {spaceinfo?.thankyou_msg || 'Your testimonial means the world to us 🙏'}
            </p>
          </div>
          {(spaceinfo?.redirectPageUrl || spaceinfo?.redirect_url) && (
            <a href={spaceinfo.redirectPageUrl || spaceinfo.redirect_url}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-sm transition-all">
              Continue →
            </a>
          )}
        </div>
      ) : (
        <div className="w-full max-w-md bg-[#0d1117] border border-white/8 rounded-3xl overflow-hidden shadow-2xl">
          {/* Subtle top accent */}
          <div className="h-0.5 w-full bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600" />

          {/* Header */}
          <div className="p-7 text-center border-b border-white/6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#111318] border border-white/10 mx-auto mb-4 flex items-center justify-center">
              {spaceinfo?.logo || spaceinfo?.imageUrl
                ? <img src={spaceinfo.logo || spaceinfo.imageUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                    <Zap size={15} fill="white" className="text-white" />
                  </div>
              }
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }} className="text-white text-2xl mb-2">
              {spaceinfo?.header || 'Share your experience'}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {spaceinfo?.customMessage || "We'd love to hear what you think!"}
            </p>
          </div>

          {/* Questions */}
          {spaceinfo?.questions?.length > 0 && (
            <div className="px-7 py-5 border-b border-white/6">
              <p className="text-gray-600 text-[10px] uppercase tracking-widest font-semibold mb-3">Answer these questions</p>
              <ul className="space-y-2">
                {spaceinfo.questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-violet-400 mt-0.5 shrink-0 text-xs">◆</span>
                    {q.question || q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="p-7">
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-3 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl transition-all text-sm font-semibold shadow-lg shadow-violet-500/20 group"
            >
              <PenLine size={17} />
              <span>Share your testimonial</span>
              <ChevronRight size={16} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {spaceinfo?.allowVideo !== false && (
              <p className="text-center text-gray-600 text-xs mt-3">
                ✦ Includes text & video options
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-7 pb-5 text-center">
            <p className="text-gray-700 text-xs flex items-center justify-center gap-1.5">
              Powered by
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-violet-600 inline-flex items-center justify-center">
                  <Zap size={9} fill="white" className="text-white" />
                </span>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }} className="text-gray-500">TestiQra</span>
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}