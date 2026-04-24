import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Star, X, Upload, Video, PenLine, Zap, Heart, Check, RefreshCw, Camera, Film, RotateCcw, Square } from 'lucide-react';
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
        className={`transition-transform hover:scale-110 ${s <= value ? 'text-amber-400' : 'text-gray-700'}`}>
        <Star size={24} fill={s <= value ? 'currentColor' : 'none'} />
      </button>
    ))}
  </div>
);

// ─── Text testimonial modal ───────────────────────────────────────────────────
const TextModal = ({ spaceinfo, spacename, onClose, onSuccess }) => {
  const [form, setForm] = useState({ username: '', email: '', content: '', imageURL: '', UserImageURL: '' });
  const [rating, setRating] = useState(5);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(true);
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

  const handleSubmit = async () => {
    if (!form.username.trim()) { toast.error('Name is required'); return; }
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    if (!form.content.trim()) { toast.error('Please write your testimonial'); return; }
    if (!agreed) { toast.error('Please accept the permission checkbox'); return; }
    setSubmitting(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/v1/sendtestimonials`,
        { testimonial: { ...form, isTextContent: true }, rating },
        { params: { spacename }, headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }
      );
      toast.success('Testimonial submitted — thank you!');
      setTimeout(() => { onSuccess(); onClose(); }, 800);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Submission failed, please try again');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
              <PenLine size={15} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Write a testimonial</h2>
              <p className="text-gray-600 text-xs">for {spaceinfo?.space_name || spaceinfo?.header}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/4 hover:bg-white/8 text-gray-500 hover:text-white transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Questions reminder */}
          {spaceinfo?.questions?.length > 0 && (
            <div className="bg-white/3 border border-white/8 rounded-xl p-3.5">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 font-semibold">Answer these questions</p>
              <ul className="space-y-1.5">
                {spaceinfo.questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-cyan-400 mt-0.5 shrink-0">◆</span>
                    {q.question || q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rating */}
          <div>
            <p className="text-gray-500 text-xs mb-2 font-medium">Your rating</p>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          {/* Content */}
          <div className="bg-[#111318] border border-white/8 rounded-xl p-3.5 focus-within:border-cyan-400/30 transition-all">
            <textarea
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={4} placeholder="Share your honest experience…"
              className="w-full bg-transparent text-white text-sm placeholder-gray-700 focus:outline-none resize-none leading-relaxed"
            />
            <p className="text-gray-700 text-xs text-right mt-1">{form.content.length} chars</p>
          </div>

          {/* Attach image */}
          <div>
            <p className="text-gray-500 text-xs mb-2 font-medium">Attach an image (optional)</p>
            {form.imageURL
              ? <div className="relative w-24">
                  <img src={form.imageURL} alt="" className="w-24 h-24 object-cover rounded-xl border border-white/10" />
                  <button onClick={() => setForm(f => ({ ...f, imageURL: '' }))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <X size={10} className="text-white" />
                  </button>
                </div>
              : <label className="flex items-center gap-2 px-3 py-2 bg-white/4 border border-white/8 hover:bg-white/8 rounded-xl text-gray-400 text-xs cursor-pointer w-fit transition-all">
                  {uploading ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />} Upload image
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'imageURL')} className="hidden" ref={imageRef} />
                </label>
            }
          </div>

          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#111318] border border-white/8 rounded-xl px-3 py-2.5 focus-within:border-cyan-400/30 transition-all">
              <label className="block text-[10px] text-gray-600 uppercase tracking-widest mb-1">Your name *</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Alex Johnson" className="w-full bg-transparent text-white text-sm placeholder-gray-700 focus:outline-none" />
            </div>
            <div className="bg-[#111318] border border-white/8 rounded-xl px-3 py-2.5 focus-within:border-cyan-400/30 transition-all">
              <label className="block text-[10px] text-gray-600 uppercase tracking-widest mb-1">Email *</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@email.com" type="email" className="w-full bg-transparent text-white text-sm placeholder-gray-700 focus:outline-none" />
            </div>
          </div>

          {/* Avatar upload */}
          <div>
            <p className="text-gray-500 text-xs mb-2 font-medium">Your photo (optional)</p>
            {form.UserImageURL
              ? <div className="relative w-12">
                  <img src={form.UserImageURL} alt="" className="w-12 h-12 object-cover rounded-full border-2 border-cyan-400/30" />
                  <button onClick={() => setForm(f => ({ ...f, UserImageURL: '' }))}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <X size={8} className="text-white" />
                  </button>
                </div>
              : <label className="flex items-center gap-2 px-3 py-2 bg-white/4 border border-white/8 hover:bg-white/8 rounded-xl text-gray-400 text-xs cursor-pointer w-fit transition-all">
                  <Upload size={13} /> Upload photo
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'UserImageURL')} className="hidden" ref={avatarRef} />
                </label>
            }
          </div>

          {/* Consent */}
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-cyan-400" />
            <span className="text-gray-600 text-xs leading-relaxed">
              I give permission to use this testimonial for marketing purposes
            </span>
          </label>
        </div>

        <div className="p-5 border-t border-white/8 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white/4 border border-white/8 hover:bg-white/8 text-gray-400 rounded-xl text-sm transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting || uploading}
            className={`flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${submitting || uploading ? 'bg-cyan-400/30 text-cyan-400/50 cursor-not-allowed' : 'bg-cyan-400 hover:bg-cyan-300 text-black'}`}>
            {submitting
              ? <><RefreshCw size={14} className="animate-spin" /> Submitting…</>
              : <><Check size={14} /> Submit Testimonial</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Video testimonial modal ──────────────────────────────────────────────────
const VideoModal = ({ spaceinfo, spacename, onClose, onSuccess }) => {
  // stage: 'options' | 'countdown' | 'recording' | 'preview' | 'submit'
  const [stage, setStage] = useState('options');
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [form, setForm] = useState({ username: '', email: '', rating: 5 });
  const [uploading, setUploading] = useState(false);
  const [agreed, setAgreed] = useState(true);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const liveVideoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const uploadFileRef = useRef(null);

  // Max duration in seconds from space config, default 120s
  const maxDuration = spaceinfo?.videoMaxDuration || 120;

  // Cleanup on unmount
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

  // ── Start camera → countdown → recording ──
  const initRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setStage('countdown');
      setCountdown(3);

      // Attach stream to live video as soon as element exists
      // We use a small delay so the DOM renders first
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
        } else {
          setCountdown(c);
        }
      }, 1000);
    } catch {
      toast.error('Camera / microphone access denied');
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
      const url = URL.createObjectURL(blob);
      setVideoPreviewUrl(url);
      stopStream();
      setStage('preview');
    };

    mr.start(1000);
    setStage('recording');
    setElapsed(0);

    elapsedTimerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= maxDuration) {
          clearInterval(elapsedTimerRef.current);
          mr.stop();
        }
        return next;
      });
    }, 1000);
  };

  const stopRecording = () => {
    clearInterval(elapsedTimerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const retake = () => {
    setVideoBlob(null);
    setVideoPreviewUrl('');
    setElapsed(0);
    setStage('options');
  };

  // ── Upload from file ──
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error('File must be under 200 MB'); return; }
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'video');
      setVideoPreviewUrl(url);
      setVideoBlob(null);
      setStage('preview');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!form.username.trim()) { toast.error('Name is required'); return; }
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    if (!agreed) { toast.error('Please accept the permission checkbox'); return; }
    setUploading(true);
    try {
      let cloudUrl = videoPreviewUrl;
      if (videoBlob) {
        const file = new File([videoBlob], 'testimonial.webm', { type: 'video/webm' });
        cloudUrl = await uploadToCloudinary(file, 'video');
      }
      await axios.post(
        `${BACKEND_URL}/api/v1/sendtestimonials`,
        {
          testimonial: {
            username: form.username,
            email: form.email,
            isTextContent: false,
            content: '[Video Testimonial]',
            imageURL: '',
            UserImageURL: '',
          },
          rating: form.rating,
          videoUrl: cloudUrl,
        },
        { params: { spacename }, headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }
      );
      toast.success('Video testimonial submitted!');
      setTimeout(() => { onSuccess(); onClose(); }, 800);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Submission failed');
    } finally { setUploading(false); }
  };

  // ── Helpers ──
  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const progressPct = (elapsed / maxDuration) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <Video size={15} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Video testimonial</h2>
              <p className="text-gray-600 text-xs">for {spaceinfo?.space_name || spaceinfo?.header}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/4 hover:bg-white/8 text-gray-500 hover:text-white transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* ── OPTIONS ── */}
          {stage === 'options' && (
            <div className="space-y-3">
              {spaceinfo?.questions?.length > 0 && (
                <div className="bg-white/3 border border-white/8 rounded-xl p-3.5">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 font-semibold">Answer these questions</p>
                  <ul className="space-y-1.5">
                    {spaceinfo.questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-cyan-400 mt-0.5 shrink-0">◆</span>
                        {q.question || q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-gray-500 text-xs text-center">
                Max duration: <span className="text-white font-medium">{formatTime(maxDuration)}</span>
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* Record */}
                <button onClick={initRecording}
                  className="flex flex-col items-center gap-2.5 py-7 bg-red-500/10 border border-red-500/20 hover:bg-red-500/18 hover:border-red-500/40 text-red-400 rounded-xl transition-all group">
                  <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                    <Camera size={20} className="text-red-400" />
                  </div>
                  <span className="text-sm font-medium">Record video</span>
                  <span className="text-red-500/70 text-xs">Use camera & mic</span>
                </button>

                {/* Upload */}
                <label className="flex flex-col items-center gap-2.5 py-7 bg-white/4 border border-white/8 hover:bg-white/7 hover:border-white/15 text-gray-400 hover:text-white rounded-xl transition-all group cursor-pointer">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                    {uploading
                      ? <RefreshCw size={20} className="text-amber-400 animate-spin" />
                      : <Film size={20} className="text-amber-400" />
                    }
                  </div>
                  <span className="text-sm font-medium">Upload video</span>
                  <span className="text-gray-600 text-xs">MP4, MOV, WebM · 200MB</span>
                  <input ref={uploadFileRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* ── COUNTDOWN + LIVE RECORDING ── */}
          {(stage === 'countdown' || stage === 'recording') && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/8">
                {/* Live camera feed */}
                <video
                  ref={liveVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />

                {/* Countdown overlay */}
                {stage === 'countdown' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
                    <span className="text-white text-8xl font-black tabular-nums" style={{ fontFamily: 'monospace' }}>
                      {countdown}
                    </span>
                    <span className="text-gray-400 text-sm">Get ready…</span>
                  </div>
                )}

                {/* Recording indicator + timer */}
                {stage === 'recording' && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-xs font-mono font-semibold">{formatTime(elapsed)}</span>
                    <span className="text-gray-500 text-xs font-mono">/ {formatTime(maxDuration)}</span>
                  </div>
                )}

                {/* Duration progress bar */}
                {stage === 'recording' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                    <div
                      className={`h-full transition-all duration-1000 ${progressPct > 85 ? 'bg-red-500' : 'bg-cyan-400'}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>

              {stage === 'recording' && (
                <button onClick={stopRecording}
                  className="w-full py-3 bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400 rounded-xl transition-all text-sm font-semibold flex items-center justify-center gap-2">
                  <Square size={14} className="fill-red-400" /> Stop Recording
                </button>
              )}
            </div>
          )}

          {/* ── PREVIEW (after record or upload) ── */}
          {stage === 'preview' && (
            <div className="space-y-3">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/8">
                <video
                  ref={previewVideoRef}
                  src={videoPreviewUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={retake}
                  className="flex items-center justify-center gap-2 py-2.5 bg-white/4 border border-white/8 hover:bg-white/8 text-gray-400 hover:text-white rounded-xl text-sm transition-all">
                  <RotateCcw size={14} /> {videoBlob ? 'Retake' : 'Choose different'}
                </button>
                <button onClick={() => setStage('submit')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-cyan-400/15 border border-cyan-400/25 hover:bg-cyan-400/25 text-cyan-400 rounded-xl text-sm font-semibold transition-all">
                  <Check size={14} /> Use this video
                </button>
              </div>
            </div>
          )}

          {/* ── SUBMIT FORM ── */}
          {stage === 'submit' && (
            <div className="space-y-4">
              {/* Compact video preview */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/8">
                <video src={videoPreviewUrl} controls className="w-full h-full object-contain" />
              </div>

              {/* Rating */}
              <div>
                <p className="text-gray-500 text-xs mb-2 font-medium">Your rating</p>
                <StarPicker value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
              </div>

              {/* Name + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#111318] border border-white/8 rounded-xl px-3 py-2.5 focus-within:border-cyan-400/30 transition-all">
                  <label className="block text-[10px] text-gray-600 uppercase tracking-widest mb-1">Name *</label>
                  <input
                    value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="Your name"
                    className="w-full bg-transparent text-white text-sm placeholder-gray-700 focus:outline-none"
                  />
                </div>
                <div className="bg-[#111318] border border-white/8 rounded-xl px-3 py-2.5 focus-within:border-cyan-400/30 transition-all">
                  <label className="block text-[10px] text-gray-600 uppercase tracking-widest mb-1">Email *</label>
                  <input
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@email.com" type="email"
                    className="w-full bg-transparent text-white text-sm placeholder-gray-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Consent */}
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-cyan-400" />
                <span className="text-gray-600 text-xs leading-relaxed">
                  I give permission to use this testimonial for marketing purposes
                </span>
              </label>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setStage('preview')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-white/4 border border-white/8 hover:bg-white/8 text-gray-400 rounded-xl text-sm transition-all">
                  <RotateCcw size={14} /> Back
                </button>
                <button onClick={handleSubmit} disabled={uploading}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
                    ${uploading ? 'bg-cyan-400/30 text-cyan-400/50 cursor-not-allowed' : 'bg-cyan-400 hover:bg-cyan-300 text-black'}`}>
                  {uploading
                    ? <><RefreshCw size={14} className="animate-spin" /> Uploading…</>
                    : <><Check size={14} /> Submit Video</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TestimonialsCollection() {
  const { spacename } = useParams();
  const navigate = useNavigate();
  const [spaceinfo, setSpaceinfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
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

  const onSuccess = () => setSubmitted(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
        <RefreshCw size={24} className="text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');`}</style>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#111318', color: '#fff', border: '1px solid rgba(255,255,255,.1)', borderRadius: '14px' }
      }} />

      {showTextModal && (
        <TextModal spaceinfo={spaceinfo} spacename={spacename} onClose={() => setShowTextModal(false)} onSuccess={onSuccess} />
      )}
      {showVideoModal && (
        <VideoModal spaceinfo={spaceinfo} spacename={spacename} onClose={() => setShowVideoModal(false)} onSuccess={onSuccess} />
      )}

      {submitted ? (
        // ── Thank you screen ──
        <div className="text-center space-y-5 max-w-sm mx-auto">
          {spaceinfo?.thankyou_image && (
            <img src={spaceinfo.thankyou_image} alt="" className="w-28 h-28 rounded-2xl object-cover mx-auto shadow-xl" />
          )}
          <div className="w-16 h-16 rounded-2xl bg-emerald-400/15 border border-emerald-400/25 flex items-center justify-center mx-auto">
            <Heart size={30} className="text-emerald-400" fill="currentColor" />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}
              className="text-white text-3xl mb-2">
              {spaceinfo?.thankyou_title || spaceinfo?.thankyouTitle || 'Thank you! 🎉'}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {spaceinfo?.thankyou_msg || spaceinfo?.thankyouMessage || 'Your testimonial means the world to us 🙏'}
            </p>
          </div>
          {(spaceinfo?.redirectPageUrl || spaceinfo?.redirect_url) && (
            <a
              href={spaceinfo.redirectPageUrl || spaceinfo.redirect_url}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl font-semibold text-sm transition-all"
            >
              Continue →
            </a>
          )}
        </div>
      ) : (
        // ── Collection card ──
        <div className="w-full max-w-md bg-[#0d1117] border border-white/8 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-7 text-center border-b border-white/6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#111318] border border-white/10 mx-auto mb-4 flex items-center justify-center">
              {spaceinfo?.logo || spaceinfo?.imageUrl
                ? <img src={spaceinfo.logo || spaceinfo.imageUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-8 h-8 rounded-lg bg-cyan-400 flex items-center justify-center">
                    <Zap size={15} fill="black" className="text-black" />
                  </div>
              }
            </div>
            <h2
              style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}
              className="text-white text-2xl mb-2"
            >
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
                    <span className="text-cyan-400 mt-0.5 shrink-0 text-xs">◆</span>
                    {q.question || q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA buttons */}
          <div className="p-7 space-y-3">
            {/* Show video button only if space allows it */}
            {(spaceinfo?.allowVideo !== false) && (
              <button
                onClick={() => setShowVideoModal(true)}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-red-500/12 border border-red-500/25 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-2xl transition-all text-sm font-semibold"
              >
                <Video size={17} /> Record a video testimonial
              </button>
            )}
            <button
              onClick={() => setShowTextModal(true)}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-cyan-400/12 border border-cyan-400/25 hover:bg-cyan-400/20 text-cyan-400 hover:text-cyan-300 rounded-2xl transition-all text-sm font-semibold"
            >
              <PenLine size={17} /> Write a text testimonial
            </button>
          </div>

          {/* Footer */}
          <div className="px-7 pb-5 text-center">
            <p className="text-gray-700 text-xs flex items-center justify-center gap-1.5">
              Powered by
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-cyan-400 inline-flex items-center justify-center">
                  <Zap size={9} fill="black" className="text-black" />
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